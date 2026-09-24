"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createPickupOrder, OrderError } from "@/lib/orders";
import { PlaceOrderInputSchema } from "@/lib/validators/checkout-schema";

type PlaceOrderResult =
  | { ok: true; orderNumber: string }
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

  if (paymentMethod !== "ON_PICKUP") {
    return { ok: false, error: "Le paiement en ligne n'est pas encore disponible." };
  }

  try {
    const order = await createPickupOrder({
      userId: session.user.id,
      contact: { name: `${firstName} ${lastName}`, email, phone },
      pickupDate,
      items,
    });
    return { ok: true, orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("placeOrder failed", error);
    return { ok: false, error: "Une erreur est survenue, réessayez dans un instant." };
  }
}
