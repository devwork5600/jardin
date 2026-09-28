"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  cancelUnpaidOrder,
  createCardOrder,
  createPickupOrder,
  OrderError,
} from "@/lib/orders";
import { afterResponse } from "@/lib/email";
import { sendOrderConfirmation } from "@/lib/order-emails";
import { createCheckoutSession, releaseStaleCardOrders } from "@/lib/payments";
import { isStripeConfigured } from "@/lib/stripe";
import { PlaceOrderInputSchema } from "@/lib/validators/checkout-schema";

// Pay at pickup: the order exists, go to its confirmation. Card: the order
// exists but is waiting for its payment, go to Stripe.
type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "Connectez-vous pour passer commande." };
  }

  const parsed = PlaceOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide, vérifiez vos informations." };
  }

  const { items, paymentMethod, pickupDate, firstName, lastName, email, phone } =
    parsed.data;
  const order = {
    userId: session.user.id,
    contact: { name: `${firstName} ${lastName}`, email, phone },
    pickupDate,
    items,
  };

  try {
    if (paymentMethod === "ON_PICKUP") {
      const created = await createPickupOrder(order);
      // Card orders get theirs when the payment is confirmed (see settleSession).
      afterResponse(() => sendOrderConfirmation(created.id));
      return { ok: true, orderNumber: created.orderNumber };
    }

    if (!isStripeConfigured()) {
      return { ok: false, error: "Le paiement par carte n'est pas disponible pour le moment." };
    }

    // Abandoned checkouts must not keep stock reserved: sweep them first.
    await releaseStaleCardOrders();
    const created = await createCardOrder(order);
    try {
      const { url } = await createCheckoutSession(created.id);
      return { ok: true, redirectUrl: url };
    } catch (error) {
      // Stripe refused or was unreachable: nobody will pay this order.
      await cancelUnpaidOrder(created.id);
      console.error("createCheckoutSession failed", error);
      return { ok: false, error: "Impossible d'ouvrir le paiement, réessayez dans un instant." };
    }
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("placeOrder failed", error);
    return { ok: false, error: "Une erreur est survenue, réessayez dans un instant." };
  }
}
