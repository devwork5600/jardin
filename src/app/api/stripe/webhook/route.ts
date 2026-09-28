import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelOrderOfSession, settleSession } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

// Stripe calls this when a payment succeeds, fails or times out. It is the
// authoritative source for an order's payment state: the browser coming back
// from Stripe proves nothing. Anyone can POST here, so the signature is
// checked against the raw body before anything is trusted.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  // The raw text: parsing then re-serialising the JSON would break the signature.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      try {
        if (event.type === "checkout.session.async_payment_failed") {
          await cancelOrderOfSession(event.data.object.id);
        } else {
          // A completed session may still be "unpaid" (delayed methods): settle
          // decides from the session itself, so retries and re-orderings are harmless.
          await settleSession(event.data.object);
        }
      } catch (error) {
        // 5xx makes Stripe retry later, which is what we want for a DB hiccup.
        console.error("stripe webhook failed", event.id, error);
        return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
      }
      break;
    }
    default:
      break; // events we didn't subscribe to are acknowledged and ignored
  }

  return NextResponse.json({ received: true });
}
