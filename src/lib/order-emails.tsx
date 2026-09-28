import { sendEmail } from "@/lib/email";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrderReadyEmail } from "@/emails/order-ready";
import type { OrderEmailProps } from "@/emails/components/order-summary";
import { formatPickupDay } from "@/lib/format";
import { orderWithItems } from "@/lib/order-queries";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

const SHOP = "Feuilles et épines";
const ADDRESS = "12 rue du Cactus, 56000 Vannes";
const PHONE = "01 99 00 56 56";

type Order = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

const loadOrder = (where: { id: string } | { stripeSessionId: string }) =>
  prisma.order.findUnique({ where, include: orderWithItems });

// Database order -> what the templates need. All the wording that depends on
// the data is decided here, the templates only lay it out.
function toEmailProps(order: Order): OrderEmailProps {
  const baseUrl = siteUrl();
  return {
    baseUrl,
    firstName: order.contactName.split(" ")[0],
    orderNumber: order.orderNumber,
    items: order.items.map((item) => {
      const { product } = item.variant;
      return {
        label: product._count.variants > 1 ? `${product.name} — ${item.variant.label}` : product.name,
        quantity: item.quantity,
        totalCents: item.unitPriceCents * item.quantity,
      };
    }),
    loyaltyDiscountCents: order.loyaltyDiscountCents,
    totalCents: order.totalCents,
    pickup: `${formatPickupDay(order.pickupDate)}, ${order.pickupSlot}`,
    address: ADDRESS,
    phone: PHONE,
    orderUrl: `${baseUrl}/compte/commandes/${order.orderNumber}`,
    paidOnline: order.paymentMethod === "CARD" && order.paidAt !== null,
  };
}

async function sendConfirmation(order: Order | null) {
  if (!order) return false;
  return sendEmail({
    to: order.contactEmail,
    subject: `Commande ${order.orderNumber} confirmée — ${SHOP}`,
    react: <OrderConfirmationEmail {...toEmailProps(order)} />,
  });
}

export async function sendOrderConfirmation(orderId: string) {
  return sendConfirmation(await loadOrder({ id: orderId }));
}

// The webhook and the confirmation page know the Stripe session, not the order id.
export async function sendOrderConfirmationBySession(stripeSessionId: string) {
  return sendConfirmation(await loadOrder({ stripeSessionId }));
}

export async function sendOrderReady(orderId: string) {
  const order = await loadOrder({ id: orderId });
  if (!order) return false;
  return sendEmail({
    to: order.contactEmail,
    subject: `Votre commande ${order.orderNumber} est prête — ${SHOP}`,
    react: <OrderReadyEmail {...toEmailProps(order)} />,
  });
}
