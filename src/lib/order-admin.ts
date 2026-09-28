import type { OrderStatus } from "@/generated/prisma/client";
import { afterResponse } from "@/lib/email";
import { sendOrderReady } from "@/lib/order-emails";
import { prisma } from "@/lib/prisma";
import { abandonCardOrder } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

// An error whose message is safe to show to the person running the shop.
export class AdminOrderError extends Error {}

// What the shop can do next. RETIREE and ANNULEE are final: a collected order
// can't be cancelled (the sale is done and the loyalty spend credited), and a
// cancelled one can't come back (its stock was already released).
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  EN_ATTENTE_PAIEMENT: ["ANNULEE"],
  EN_PREPARATION: ["PRETE_AU_RETRAIT", "RETIREE", "ANNULEE"],
  PRETE_AU_RETRAIT: ["RETIREE", "ANNULEE"],
  RETIREE: [],
  ANNULEE: [],
};

export const allowedTransitions = (status: OrderStatus) => TRANSITIONS[status];

const CHANGED = "La commande a changé entre-temps : rechargez la page.";

// Sends the money of a cancelled, card-paid order back. Idempotent on both
// sides: `refundedAt` stops a second run here, and the idempotency key stops
// Stripe from refunding twice if we crash between its answer and our update.
export async function refundOrder(orderId: string): Promise<"REFUNDED" | "ALREADY_REFUNDED"> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      paidAt: true,
      refundedAt: true,
      stripeSessionId: true,
      stripePaymentIntentId: true,
    },
  });
  if (order.refundedAt) return "ALREADY_REFUNDED";
  if (order.status !== "ANNULEE" || order.paymentMethod !== "CARD" || !order.paidAt) {
    throw new AdminOrderError("Cette commande n'a rien à rembourser.");
  }

  const stripe = getStripe();
  let intentId = order.stripePaymentIntentId;
  if (!intentId && order.stripeSessionId) {
    // Paid before we started keeping the PaymentIntent: ask Stripe for it.
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    intentId = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  }
  if (!intentId) throw new AdminOrderError("Paiement Stripe introuvable : à rembourser depuis le tableau de bord Stripe.");

  await stripe.refunds.create(
    { payment_intent: intentId, metadata: { orderNumber: order.orderNumber, reason: "order_cancelled_by_shop" } },
    { idempotencyKey: `order-refund-${order.id}` },
  );
  await prisma.order.update({
    where: { id: order.id },
    data: { refundedAt: new Date(), stripePaymentIntentId: intentId },
  });
  return "REFUNDED";
}

export type StatusChange = { refundOwed: boolean };

// Moves an order to `target`. Each change is a guarded update on the status we
// just read, so a double click or two people on the same order can't apply it
// twice (stock returned twice, loyalty credited twice).
export async function changeOrderStatus(orderId: string, target: OrderStatus): Promise<StatusChange> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true, totalCents: true, paymentMethod: true, paidAt: true, stripeSessionId: true },
  });
  if (!order) throw new AdminOrderError("Commande introuvable.");
  if (!TRANSITIONS[order.status].includes(target)) {
    throw new AdminOrderError("Ce changement de statut n'est pas possible pour cette commande.");
  }

  // Never paid: same path as the customer giving up (session closed, stock back).
  if (order.status === "EN_ATTENTE_PAIEMENT") {
    await abandonCardOrder(order);
    return { refundOwed: false };
  }

  if (target === "PRETE_AU_RETRAIT") {
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "PRETE_AU_RETRAIT" },
    });
    if (count === 0) throw new AdminOrderError(CHANGED);
    afterResponse(() => sendOrderReady(order.id));
    return { refundOwed: false };
  }

  if (target === "RETIREE") {
    // The sale is done: this is when the customer's spend counts for loyalty.
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: "RETIREE" },
      });
      if (count === 0) throw new AdminOrderError(CHANGED);
      await tx.user.updateMany({ where: { id: order.userId, totalSpentCents: null }, data: { totalSpentCents: 0 } });
      await tx.user.update({ where: { id: order.userId }, data: { totalSpentCents: { increment: order.totalCents } } });
    });
    return { refundOwed: false };
  }

  // ANNULEE from a paid state: stock back on the shelf, then the refund.
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "ANNULEE" },
    });
    if (count === 0) throw new AdminOrderError(CHANGED);
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    }
  });

  if (order.paymentMethod === "CARD" && order.paidAt) {
    try {
      await refundOrder(order.id);
    } catch (error) {
      // The cancellation stands; the refund can be retried from the order page.
      console.error("refundOrder failed", order.id, error);
      return { refundOwed: true };
    }
  }
  return { refundOwed: false };
}
