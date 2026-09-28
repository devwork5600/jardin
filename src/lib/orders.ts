import { randomInt } from "node:crypto";
import type { PaymentMethod } from "@/generated/prisma/client";
import { priceCart } from "@/lib/cart-pricing";
import { prisma } from "@/lib/prisma";
import { getPickupDays } from "@/lib/shop-hours";
import type { CartItem } from "@/lib/validators/cart-schema";

// An error whose message is safe to show to the customer.
export class OrderError extends Error {}

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function generateOrderNumber() {
  const random = Array.from(
    { length: 8 },
    () => ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)],
  ).join("");
  return `FE-${random}`;
}

type OrderInput = {
  userId: string;
  contact: { name: string; email: string; phone: string };
  pickupDate: string; // YYYY-MM-DD, must be one of getPickupDays()
  items: CartItem[];
};

// Stock is taken right here, in the same transaction that creates the order,
// whatever the payment method: a card order waits for its payment with the
// stock already reserved (and gives it back if the payment never comes).
// Everything that matters (prices, stock, loyalty, allowed pickup days) is
// recomputed on the server: the client's numbers are never trusted.
async function createOrder(input: OrderInput, paymentMethod: PaymentMethod) {
  const pickup = getPickupDays().find((day) => day.iso === input.pickupDate);
  if (!pickup) throw new OrderError("Ce jour de retrait n'est plus disponible.");

  const cart = await priceCart(input.items, input.userId);
  if (cart.lines.length === 0) throw new OrderError("Votre panier est vide.");
  const problem = cart.lines.find((line) => line.problem !== null);
  if (problem?.problem === "UNAVAILABLE") {
    throw new OrderError("Un article de votre panier n'est plus disponible.");
  }
  if (problem) {
    throw new OrderError(
      `Stock insuffisant pour « ${problem.name} » (disponible : ${problem.stock}).`,
    );
  }

  return prisma.$transaction(async (tx) => {
    // Lock rows in a fixed order so two concurrent orders touching the same
    // variants can't deadlock each other.
    const lines = [...cart.lines].sort((a, b) => a.variantId.localeCompare(b.variantId));

    for (const line of lines) {
      // Atomic guard: the decrement only happens if enough stock is still
      // there at this very instant. Two customers racing for the last unit
      // can't both win, and stock can never go negative.
      const { count } = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (count === 0) {
        throw new OrderError(`Stock insuffisant pour « ${line.name} ».`);
      }
    }

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: input.userId,
        status: paymentMethod === "CARD" ? "EN_ATTENTE_PAIEMENT" : "EN_PREPARATION",
        paymentMethod,
        pickupDate: new Date(`${pickup.iso}T00:00:00.000Z`),
        pickupSlot: pickup.hours,
        subtotalCents: cart.subtotalCents,
        loyaltyDiscountCents: cart.loyalty?.discountCents ?? 0,
        totalCents: cart.totalCents,
        contactName: input.contact.name,
        contactEmail: input.contact.email,
        contactPhone: input.contact.phone,
        items: {
          create: cart.lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            // Snapshot: a later price change never rewrites this order.
            unitPriceCents: line.unitPriceCents,
          })),
        },
      },
    });
  });
}

// Pay at pickup: the order is in preparation right away.
export const createPickupOrder = (input: OrderInput) =>
  createOrder(input, "ON_PICKUP");

// Card: the order waits for Stripe (see markOrderPaid / cancelUnpaidOrder).
export const createCardOrder = (input: OrderInput) =>
  createOrder(input, "CARD");

// Gives an unpaid card order up: cancelled, stock back on the shelf. The status
// change is the guard, so it happens at most once and never on an order that
// got paid in the meantime; if it loses that race it does nothing.
export async function cancelUnpaidOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "EN_ATTENTE_PAIEMENT" },
      data: { status: "ANNULEE" },
    });
    if (count === 0) return false;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return true;
  });
}

export type PaymentOutcome =
  | "PAID" // this call moved the order to EN_PREPARATION
  | "ALREADY_PAID" // a retry, or the other path (webhook / confirmation page) got there first
  | "CANCELLED_BEFORE_PAYMENT" // the order was given up, but the customer paid: refund them
  | "UNKNOWN_ORDER";

// Stripe says the session is paid. Same guard as above, mirrored: only an order
// still waiting can become paid, so webhook retries and the page-load check
// can both call this safely.
export async function markOrderPaid(
  stripeSessionId: string,
  stripePaymentIntentId?: string,
): Promise<PaymentOutcome> {
  const { count } = await prisma.order.updateMany({
    where: { stripeSessionId, status: "EN_ATTENTE_PAIEMENT" },
    // Keep the PaymentIntent: it is what a later refund needs.
    data: { status: "EN_PREPARATION", paidAt: new Date(), stripePaymentIntentId },
  });
  if (count === 1) return "PAID";

  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    select: { paidAt: true },
  });
  if (!order) return "UNKNOWN_ORDER";
  return order.paidAt ? "ALREADY_PAID" : "CANCELLED_BEFORE_PAYMENT";
}

