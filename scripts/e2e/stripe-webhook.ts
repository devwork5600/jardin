// The webhook route and the confirmation page, against a running server.
//   E2E_BASE (default http://localhost:3000) and STRIPE_WEBHOOK_SECRET must be the
//   same for the script and the server (events are signed with a genuine
//   Stripe signature). Real Stripe API is used only for the confirmation-page checks.
// Creates throwaway users/orders and removes them. Run: npx tsx scripts/e2e/stripe-webhook.ts
import "dotenv/config";
import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { createCardOrder } from "../../src/lib/orders";
import { createCheckoutSession } from "../../src/lib/payments";
import { getStripe } from "../../src/lib/stripe";
import { getPickupDays } from "../../src/lib/shop-hours";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const stripe = getStripe();
let n = 0;
function post(body: string, signature: string | null) {
  return fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(signature ? { "stripe-signature": signature } : {}) },
    body,
  });
}
function signedEvent(type: string, sessionId: string, extra: Record<string, unknown> = {}) {
  const payload = JSON.stringify({
    id: `evt_e2e_${++n}_${randomBytes(4).toString("hex")}`,
    object: "event",
    api_version: "2026-08-26.dahlia",
    type,
    data: { object: { id: sessionId, object: "checkout.session", payment_status: "unpaid", status: "open", payment_intent: null, ...extra } },
  });
  return { payload, signature: stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) };
}
const send = (type: string, sessionId: string, extra?: Record<string, unknown>) => {
  const { payload, signature } = signedEvent(type, sessionId, extra);
  return post(payload, signature);
};

async function main() {
  if (!SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is required (same value as the server's)");
  const day = getPickupDays()[0];
  const variant = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Echeveria mix" } } } });
  const stock0 = variant.stock;
  const USER = "e2e-hook";
  await prisma.user.create({ data: { id: USER, name: "Hook Test", email: "e2e-hook@example.invalid", emailVerified: true } });
  const token = randomBytes(24).toString("hex");
  await prisma.session.create({ data: { id: "s-e2e-hook", token, userId: USER, expiresAt: new Date(Date.now() + 3600_000) } });
  const cookie = `better-auth.session_token=${encodeURIComponent(`${token}.${createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64")}`)}`;

  // a pending card order with a fake (but unique) session id: no Stripe call needed
  const pending = async (qty = 1) => {
    const order = await createCardOrder({ userId: USER, contact: { name: "Hook Test", email: "e2e-hook@example.invalid", phone: "0612345678" }, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: qty }] });
    const sessionId = `cs_test_e2e_${randomBytes(6).toString("hex")}`;
    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: sessionId } });
    return { order, sessionId };
  };
  const stockNow = async () => (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
  const statusOf = async (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });

  try {
    // --- authenticity
    let r = await post("{}", null);
    check("sans signature: 400", r.status === 400, `${r.status}`);
    const bad = signedEvent("checkout.session.completed", "cs_x");
    r = await post(bad.payload, bad.signature.replace(/v1=[0-9a-f]+/, "v1=" + "0".repeat(64)));
    check("mauvaise signature: 400", r.status === 400, `${r.status}`);
    const tampered = signedEvent("checkout.session.completed", "cs_x");
    r = await post(tampered.payload.replace("cs_x", "cs_y"), tampered.signature);
    check("corps modifié après signature: 400", r.status === 400, `${r.status}`);
    r = await send("customer.created", "cs_ignored");
    check("événement non suivi: 200 ignoré", r.status === 200, `${r.status}`);

    // --- payment succeeds
    const a = await pending(1);
    r = await send("checkout.session.completed", a.sessionId, { payment_status: "paid", status: "complete" });
    let o = await statusOf(a.order.id);
    check("paiement confirmé -> En préparation", r.status === 200 && o.status === "EN_PREPARATION" && o.paidAt !== null, `${r.status} ${o.status}`);
    const paidAt = o.paidAt!.getTime();
    r = await send("checkout.session.completed", a.sessionId, { payment_status: "paid", status: "complete" });
    o = await statusOf(a.order.id);
    check("même événement rejoué: rien ne change", r.status === 200 && o.status === "EN_PREPARATION" && o.paidAt!.getTime() === paidAt);
    r = await send("checkout.session.expired", a.sessionId, { status: "expired" });
    o = await statusOf(a.order.id);
    check("'expiré' tardif n'annule pas une commande payée", o.status === "EN_PREPARATION", o.status);

    // --- unpaid completed stays pending
    const b = await pending(1);
    r = await send("checkout.session.completed", b.sessionId, { payment_status: "unpaid", status: "complete" });
    o = await statusOf(b.order.id);
    check("complété mais non payé: reste en attente", o.status === "EN_ATTENTE_PAIEMENT", o.status);

    // --- expiry gives stock back, once
    const before = await stockNow();
    r = await send("checkout.session.expired", b.sessionId, { status: "expired" });
    o = await statusOf(b.order.id);
    const afterExpire = await stockNow();
    check("session expirée -> annulée + stock remis", r.status === 200 && o.status === "ANNULEE" && afterExpire === before + 1, `${before} -> ${afterExpire}`);
    await send("checkout.session.expired", b.sessionId, { status: "expired" });
    check("expiration rejouée: pas de double remise", (await stockNow()) === afterExpire);

    // --- delayed payment failure
    const c = await pending(1);
    const beforeC = await stockNow();
    r = await send("checkout.session.async_payment_failed", c.sessionId, { status: "complete" });
    o = await statusOf(c.order.id);
    check("paiement différé échoué -> annulée + stock remis", o.status === "ANNULEE" && (await stockNow()) === beforeC + 1);

    // --- expired and completed arriving together: one consistent outcome
    const d = await pending(2);
    const beforeD = await stockNow();
    await Promise.all([
      send("checkout.session.completed", d.sessionId, { payment_status: "paid", status: "complete" }),
      send("checkout.session.expired", d.sessionId, { status: "expired" }),
    ]);
    o = await statusOf(d.order.id);
    const afterD = await stockNow();
    const consistent = (o.status === "EN_PREPARATION" && afterD === beforeD) || (o.status === "ANNULEE" && afterD === beforeD + 2);
    check("payé + expiré en même temps: état cohérent", consistent, `${o.status}, stock ${beforeD} -> ${afterD}`);

    // --- confirmation page with the real Stripe API
    const real = await createCardOrder({ userId: USER, contact: { name: "Hook Test", email: "e2e-hook@example.invalid", phone: "0612345678" }, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: 1 }] });
    const { sessionId } = await createCheckoutSession(real.id);
    let res = await fetch(`${BASE}/paiement/confirmation/${real.orderNumber}`, { headers: { cookie }, redirect: "manual" });
    let html = await res.text();
    check("confirmation, session ouverte: 'Paiement en cours'", res.status === 200 && /Paiement[\s\S]*en cours/.test(html) && html.includes("nous confirmons votre paiement"), `${res.status}`);
    check("confirmation en attente: le panier n'est pas vidé", !html.includes("Commande <em>confirmée"));
    const beforeReal = await stockNow();
    await stripe.checkout.sessions.expire(sessionId);
    res = await fetch(`${BASE}/paiement/confirmation/${real.orderNumber}`, { headers: { cookie }, redirect: "manual" });
    html = await res.text();
    o = await statusOf(real.id);
    check("confirmation après expiration: annulée + stock remis (sans webhook)", o.status === "ANNULEE" && (await stockNow()) === beforeReal + 1 && html.includes("a été annulée"), `${o.status}`);

    // --- the back link
    const back = await createCardOrder({ userId: USER, contact: { name: "Hook Test", email: "e2e-hook@example.invalid", phone: "0612345678" }, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: 1 }] });
    await createCheckoutSession(back.id);
    const beforeBack = await stockNow();
    res = await fetch(`${BASE}/paiement/annule/${back.orderNumber}`, { headers: { cookie }, redirect: "manual" });
    o = await statusOf(back.id);
    check("lien 'retour': redirige vers /paiement?annule=1", res.status >= 300 && res.status < 400 && (res.headers.get("location") ?? "").includes("/paiement?annule=1"), `${res.status} ${res.headers.get("location")}`);
    check("lien 'retour': commande annulée + stock remis", o.status === "ANNULEE" && (await stockNow()) === beforeBack + 1);
    res = await fetch(`${BASE}/paiement/annule/${back.orderNumber}`, { redirect: "manual" });
    check("lien 'retour' sans connexion: redirigé vers /connexion", (res.headers.get("location") ?? "").includes("/connexion"), `${res.status}`);
  } finally {
    await prisma.order.deleteMany({ where: { userId: USER } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stock0 } });
    await prisma.user.deleteMany({ where: { id: USER } });
    results.push(`cleanup: orders=${await prisma.order.count({ where: { userId: USER } })}, stock ${stock0} restauré`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); });
