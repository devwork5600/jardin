// Real Stripe API (test key from .env): opens a Checkout Session for a card
// order, checks amounts/discount/expiry against Stripe, then abandons it and
// checks the stock comes back. Nothing is paid. Needs STRIPE_SECRET_KEY (sk_test_).
// Creates throwaway users/orders and removes them. Run: npx tsx scripts/e2e/stripe-session.ts
import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import { createCardOrder } from "../../src/lib/orders";
import { abandonCardOrder, createCheckoutSession } from "../../src/lib/payments";
import { getStripe, isStripeConfigured, isStripeTestMode } from "../../src/lib/stripe";
import { getPickupDays } from "../../src/lib/shop-hours";

const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function main() {
  if (!isStripeConfigured() || !isStripeTestMode()) throw new Error("Needs STRIPE_SECRET_KEY=sk_test_… in .env");
  const stripe = getStripe();
  const day = getPickupDays()[0];
  const eche = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Echeveria mix" } } } });
  const terr = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Terreau végétal" } } } });
  const stock0 = new Map([[eche.id, eche.stock], [terr.id, terr.stock]]);
  await prisma.user.create({ data: { id: "e2e-stripe", name: "Test Stripe", email: "e2e-stripe@example.invalid", emailVerified: true } });

  try {
    const order = await createCardOrder({
      userId: "e2e-stripe",
      contact: { name: "Test Stripe", email: "e2e-stripe@example.invalid", phone: "0612345678" },
      pickupDate: day.iso,
      items: [{ variantId: eche.id, quantity: 2 }, { variantId: terr.id, quantity: 1 }],
    });
    check("commande carte: en attente de paiement", order.status === "EN_ATTENTE_PAIEMENT" && order.paymentMethod === "CARD");
    const afterOrder = await prisma.productVariant.findUniqueOrThrow({ where: { id: eche.id } });
    check("stock réservé dès la commande", afterOrder.stock === stock0.get(eche.id)! - 2, `${stock0.get(eche.id)} -> ${afterOrder.stock}`);

    const { sessionId, url } = await createCheckoutSession(order.id);
    check("session Stripe créée", sessionId.startsWith("cs_test_") && url.startsWith("https://checkout.stripe.com/"), sessionId.slice(0, 16) + "…");
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    check("identifiant de session enregistré", saved.stripeSessionId === sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    check("montant Stripe = total de la commande", session.amount_total === order.totalCents, `${session.amount_total} vs ${order.totalCents}`);
    check("remise fidélité passée à Stripe", session.total_details?.amount_discount === order.loyaltyDiscountCents && order.loyaltyDiscountCents > 0, `${session.total_details?.amount_discount} c`);
    check("2 lignes, bonnes quantités", session.line_items?.data.length === 2 && session.line_items.data.some((l) => l.quantity === 2), `${session.line_items?.data.length} lignes`);
    check("statut ouvert, non payé", session.status === "open" && session.payment_status === "unpaid");
    check("référence + e-mail", session.client_reference_id === order.orderNumber && session.customer_email === "e2e-stripe@example.invalid");
    const ttl = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000);
    check("expire dans ~31 minutes", ttl > 30 * 60 && ttl <= 31 * 60 + 5, `${Math.round(ttl / 60)} min`);
    check("retour: succès / annulation", (session.success_url ?? "").endsWith(`/paiement/confirmation/${order.orderNumber}`) && (session.cancel_url ?? "").endsWith(`/paiement/annule/${order.orderNumber}`));

    // abandon = the "back" link
    await abandonCardOrder({ id: order.id, stripeSessionId: sessionId });
    const cancelled = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    check("abandon: commande annulée", cancelled.status === "ANNULEE");
    const restored = await prisma.productVariant.findUniqueOrThrow({ where: { id: eche.id } });
    check("abandon: stock remis", restored.stock === stock0.get(eche.id), `${restored.stock}`);
    const closed = await stripe.checkout.sessions.retrieve(sessionId);
    check("abandon: session Stripe expirée (plus payable)", closed.status === "expired", closed.status ?? "");

    // running it twice must not double the restock
    await abandonCardOrder({ id: order.id, stripeSessionId: sessionId });
    const again = await prisma.productVariant.findUniqueOrThrow({ where: { id: eche.id } });
    check("abandon répété: stock inchangé (pas de double remise)", again.stock === stock0.get(eche.id), `${again.stock}`);
  } finally {
    await prisma.order.deleteMany({ where: { userId: "e2e-stripe" } });
    for (const [id, stock] of stock0) await prisma.productVariant.update({ where: { id }, data: { stock } });
    await prisma.user.deleteMany({ where: { id: "e2e-stripe" } });
    results.push(`cleanup: orders=${await prisma.order.count({ where: { userId: "e2e-stripe" } })} (stocks restaurés)`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.message : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); });
