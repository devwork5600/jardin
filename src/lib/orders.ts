import { randomInt } from "node:crypto";
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
  return `JI-${random}`;
}

type PickupOrderInput = {
  userId: string;
  contact: { name: string; email: string; phone: string };
  pickupDate: string; // YYYY-MM-DD, must be one of getPickupDays()
  items: CartItem[];
};

// Pay-at-pickup order. There is no payment to wait for, so stock is taken
// right here, in the same transaction that creates the order. Everything
// that matters (prices, stock, loyalty, allowed pickup days) is recomputed
// on the server: the client's numbers are never trusted.
export async function createPickupOrder(input: PickupOrderInput) {
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
        status: "EN_PREPARATION",
        paymentMethod: "ON_PICKUP",
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
