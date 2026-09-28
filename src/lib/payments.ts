import type Stripe from "stripe";
import { afterResponse } from "@/lib/email";
import { sendOrderConfirmationBySession } from "@/lib/order-emails";
import { prisma } from "@/lib/prisma";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

// Stripe requires a session to live at least 30 minutes; the extra minute keeps
// clock drift from being rejected. Orders older than the TTL below are
// certainly expired on Stripe's side too, so they can be given up.
const SESSION_LIFETIME_S = 31 * 60;
const STALE_AFTER_MS = 35 * 60 * 1000;

// Opens the Stripe page that will collect the payment for an order already
// created (stock reserved). Amounts come from the order itself, never from the
// browser. The loyalty discount is a one-shot coupon, since a Checkout line
// item can't be negative.
export async function createCheckoutSession(orderId: string) {
  const stripe = getStripe();
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true, _count: { select: { variants: true } } } } },
          },
        },
      },
    },
  });

  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (order.loyaltyDiscountCents > 0) {
    const coupon = await stripe.coupons.create(
      {
        amount_off: order.loyaltyDiscountCents,
        currency: "eur",
        duration: "once",
        max_redemptions: 1,
        name: "Remise fidélité",
        metadata: { orderNumber: order.orderNumber },
      },
      { idempotencyKey: `coupon-${order.id}` },
    );
    discounts.push({ coupon: coupon.id });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      ui_mode: "hosted_page",
      locale: "fr",
      customer_email: order.contactEmail,
      client_reference_id: order.orderNumber,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_S,
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitPriceCents,
          product_data: {
            name:
              item.variant.product._count.variants > 1
                ? `${item.variant.product.name} — ${item.variant.label}`
                : item.variant.product.name,
          },
        },
      })),
      discounts,
      success_url: `${siteUrl()}/paiement/confirmation/${order.orderNumber}`,
      cancel_url: `${siteUrl()}/paiement/annule/${order.orderNumber}`,
    },
    { idempotencyKey: `session-${order.id}` },
  );

  if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL");
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });
  return { sessionId: session.id, url: session.url };
}

// Best effort: a session that can no longer be paid (already expired/complete)
// makes Stripe answer with an error, which is exactly the state we want.
export async function expireCheckoutSession(sessionId: string) {
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch {
    // already expired or completed
  }
}

async function refundSessionPayment(session: Stripe.Checkout.Session) {
  const intent = session.payment_intent;
  const paymentIntentId = typeof intent === "string" ? intent : intent?.id;
  if (!paymentIntentId) return;
  await getStripe().refunds.create(
    { payment_intent: paymentIntentId, metadata: { reason: "order_cancelled_before_payment" } },
    { idempotencyKey: `refund-${session.id}` },
  );
}

export type SettleResult =
  | "PAID"
  | "ALREADY_PAID"
  | "REFUNDED" // paid after the order was given up: money sent back
  | "CANCELLED"
  | "PENDING" // still waiting for the customer
  | "UNKNOWN_ORDER";

// One place decides what a Checkout Session means for its order. Used by the
// webhook (authoritative) and by the confirmation page (so it doesn't depend
// on the webhook being reachable). Every branch is safe to repeat.
export async function settleSession(session: Stripe.Checkout.Session): Promise<SettleResult> {
  if (session.payment_status === "paid") {
    const intent = session.payment_intent;
    const outcome = await markOrderPaid(
      session.id,
      typeof intent === "string" ? intent : intent?.id,
    );
    if (outcome === "CANCELLED_BEFORE_PAYMENT") {
      await refundSessionPayment(session);
      return "REFUNDED";
    }
    // Only the call that actually moved the order to "paid" gets PAID, so the
    // webhook and the confirmation page racing each other send one e-mail.
    if (outcome === "PAID") afterResponse(() => sendOrderConfirmationBySession(session.id));
    return outcome;
  }

  if (session.status === "expired") return cancelOrderOfSession(session.id);

  return "PENDING";
}

// The session will never be paid (expired, or a delayed payment failed): give
// the order up and put its stock back.
export async function cancelOrderOfSession(sessionId: string): Promise<SettleResult> {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true },
  });
  if (!order) return "UNKNOWN_ORDER";
  await cancelUnpaidOrder(order.id);
  return "CANCELLED";
}

// Asks Stripe directly what happened to an order's session.
export async function reconcileOrderPayment(order: {
  id: string;
  status: string;
  stripeSessionId: string | null;
}) {
  if (order.status !== "EN_ATTENTE_PAIEMENT" || !order.stripeSessionId) return;
  if (!isStripeConfigured()) return;
  const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
  await settleSession(session);
}

// The customer came back with the "back" link: free the stock now instead of
// waiting for the session to expire, and make sure it can't be paid any more.
export async function abandonCardOrder(order: { id: string; stripeSessionId: string | null }) {
  if (order.stripeSessionId && isStripeConfigured()) {
    await expireCheckoutSession(order.stripeSessionId);
    // If it was paid a moment ago, this settles it, and the cancel below
    // becomes a no-op instead of throwing away a paid order.
    await reconcileOrderPayment({ ...order, status: "EN_ATTENTE_PAIEMENT" });
  }
  await cancelUnpaidOrder(order.id);
}

// Housekeeping, called before each new card order: an abandoned checkout whose
// webhook never arrived (e.g. `stripe listen` not running) must not keep
// stock reserved forever.
export async function releaseStaleCardOrders() {
  const stale = await prisma.order.findMany({
    where: {
      status: "EN_ATTENTE_PAIEMENT",
      createdAt: { lt: new Date(Date.now() - STALE_AFTER_MS) },
    },
    select: { id: true, status: true, stripeSessionId: true },
  });
  for (const order of stale) {
    try {
      await reconcileOrderPayment(order); // paid after all?
    } catch {
      // Stripe unreachable: fall through and give the order up below.
    }
    await cancelUnpaidOrder(order.id); // no-op if it was just marked paid
  }
}
