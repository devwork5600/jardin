import Stripe from "stripe";

let client: Stripe | null = null;

// Card payments only exist when the secret key is configured.
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// `sk_test_…` keys only ever move fake money: the checkout page says so.
export function isStripeTestMode() {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}

export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}
