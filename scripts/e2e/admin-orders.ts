// Back office: access by role, status transitions, loyalty credit (once),
// stock, concurrency, and refunds against the real Stripe test API.
// Needs the dev server (E2E_BASE, default :3000) and STRIPE_SECRET_KEY (sk_test_).
// Creates throwaway users/orders/PaymentIntents (test mode) and removes what it can.
// Run: npx tsx scripts/e2e/admin-orders.ts
import "dotenv/config";
import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { priceCart } from "../../src/lib/cart-pricing";
import { createCardOrder, createPickupOrder } from "../../src/lib/orders";
import { AdminOrderError, changeOrderStatus, refundOrder } from "../../src/lib/order-admin";
import { createCheckoutSession } from "../../src/lib/payments";
import { getPickupDays } from "../../src/lib/shop-hours";
import { getStripe } from "../../src/lib/stripe";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function makeUser(id: string, role: string) {
  await prisma.user.create({ data: { id, name: `Test ${id}`, email: `${id}@example.invalid`, emailVerified: true, role } });
  const token = randomBytes(24).toString("hex");
  await prisma.session.create({ data: { id: `s-${id}`, token, userId: id, expiresAt: new Date(Date.now() + 3600_000) } });
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
  return `better-auth.session_token=${encodeURIComponent(`${token}.${sig}`)}`;
}
const get = (path: string, cookie?: string) => fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
const expectError = async (name: string, fn: () => Promise<unknown>) => {
  try { await fn(); check(name, false, "aucune erreur levée"); }
  catch (e) { check(name, e instanceof AdminOrderError, e instanceof Error ? e.message : String(e)); }
};

async function main() {
  const stripe = getStripe();
  const day = getPickupDays()[0];
  const variant = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Echeveria mix" } } } });
  const stock0 = variant.stock;
  const stock = async () => (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
  const order$ = (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });
  const spent = async () => (await prisma.user.findUniqueOrThrow({ where: { id: "e2e-cust" } })).totalSpentCents;

  const adminCookie = await makeUser("e2e-admin", "ADMIN");
  const custCookie = await makeUser("e2e-cust", "CUSTOMER");
  const contact = { name: "Client Test", email: "e2e-cust@example.invalid", phone: "0612345678" };
  const pickup = (qty = 1) => createPickupOrder({ userId: "e2e-cust", contact, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: qty }] });
  const paidCardOrder = async (qty = 1, intentId?: string) => {
    const o = await createCardOrder({ userId: "e2e-cust", contact, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: qty }] });
    let pi = intentId;
    if (!pi) {
      const intent = await stripe.paymentIntents.create({ amount: o.totalCents, currency: "eur", payment_method: "pm_card_visa", confirm: true, automatic_payment_methods: { enabled: true, allow_redirects: "never" } });
      pi = intent.id;
    }
    await prisma.order.update({ where: { id: o.id }, data: { status: "EN_PREPARATION", paidAt: new Date(), stripeSessionId: `cs_test_e2e_${randomBytes(6).toString("hex")}`, stripePaymentIntentId: pi } });
    return { order: await order$(o.id), pi };
  };

  try {
    // ---- access by role
    const first = await pickup(1);
    const n = first.orderNumber;
    let r = await get("/admin/commandes");
    check("visiteur: /admin/commandes -> connexion", r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/connexion"), `${r.status}`);
    r = await get("/admin/commandes", custCookie);
    check("client (non admin): 404", r.status === 404, `${r.status}`);
    r = await get(`/admin/commandes/${n}`, custCookie);
    check("client: détail d'une commande -> 404", r.status === 404, `${r.status}`);
    r = await get("/admin/commandes", adminCookie);
    let html = await r.text();
    check("admin: liste 200 + commande visible", r.status === 200 && html.includes(n), `${r.status}`);
    r = await get("/admin/commandes?statut=annulees", adminCookie);
    check("admin: onglet filtré 200", r.status === 200, `${r.status}`);
    r = await get(`/admin/commandes/${n}`, adminCookie);
    html = await r.text();
    check("admin: détail 200 + actions", r.status === 200 && html.includes(n) && html.includes("Marquer prête au retrait"), `${r.status}`);
    r = await get("/admin/commandes/FE-ZZZZZZZZ", adminCookie);
    check("admin: numéro inconnu -> 404", r.status === 404, `${r.status}`);
    r = await get("/compte", adminCookie); html = await r.text();
    check("admin: lien « Espace admin » dans le compte", html.includes("Espace admin"));
    r = await get("/compte", custCookie); html = await r.text();
    check("client: pas de lien admin dans le compte", !html.includes("Espace admin"));

    // ---- transitions (pay at pickup)
    await expectError("transition interdite (préparation -> attente de paiement)", () => changeOrderStatus(first.id, "EN_ATTENTE_PAIEMENT"));
    await changeOrderStatus(first.id, "PRETE_AU_RETRAIT");
    check("préparation -> prête au retrait", (await order$(first.id)).status === "PRETE_AU_RETRAIT");
    await expectError("prête -> préparation impossible", () => changeOrderStatus(first.id, "EN_PREPARATION"));

    // ---- loyalty credit, exactly once
    const spent0 = (await spent()) ?? 0;
    await changeOrderStatus(first.id, "RETIREE");
    check("retirée: dépense créditée à la fidélité", (await spent()) === spent0 + first.totalCents, `${spent0} -> ${await spent()}`);
    await expectError("retirée: ne peut plus changer", () => changeOrderStatus(first.id, "ANNULEE"));
    await expectError("retirée: pas de second crédit", () => changeOrderStatus(first.id, "RETIREE"));
    check("dépense pas créditée deux fois", (await spent()) === spent0 + first.totalCents);

    const second = await pickup(1);
    await Promise.allSettled([changeOrderStatus(second.id, "RETIREE"), changeOrderStatus(second.id, "RETIREE")]);
    check("deux « retirée » simultanés: crédité une seule fois", (await spent()) === spent0 + first.totalCents + second.totalCents, `${await spent()}`);

    // tier follows the credited spend
    await prisma.user.update({ where: { id: "e2e-cust" }, data: { totalSpentCents: 59_900 } });
    const third = await pickup(1);
    await changeOrderStatus(third.id, "RETIREE");
    const cart = await priceCart([{ variantId: variant.id, quantity: 1 }], "e2e-cust");
    check("le crédit fait passer au palier supérieur (Racine 8 %)", cart.loyalty?.tierName === "Racine" && cart.loyalty.discountPct === 8, `${cart.loyalty?.tierName}`);

    // ---- cancellation gives stock back, once
    const before = await stock();
    const cancelMe = await pickup(2);
    check("commande au retrait: stock pris", (await stock()) === before - 2);
    const res = await changeOrderStatus(cancelMe.id, "ANNULEE");
    check("annulation: stock remis, aucun remboursement dû", (await stock()) === before && res.refundOwed === false && (await order$(cancelMe.id)).refundedAt === null);
    await expectError("annulée: définitive", () => changeOrderStatus(cancelMe.id, "PRETE_AU_RETRAIT"));

    const racing = await pickup(2);
    const beforeRace = await stock();
    const outcomes = await Promise.allSettled([changeOrderStatus(racing.id, "ANNULEE"), changeOrderStatus(racing.id, "ANNULEE")]);
    check("deux annulations simultanées: 1 seule appliquée, stock remis une fois", outcomes.filter((o) => o.status === "fulfilled").length === 1 && (await stock()) === beforeRace + 2, `${outcomes.map((o) => o.status).join("/")} stock ${beforeRace}->${await stock()}`);

    // ---- card: refund through the real Stripe test API
    const { order: paid, pi } = await paidCardOrder(1);
    const cancelRes = await changeOrderStatus(paid.id, "ANNULEE");
    const afterCancel = await order$(paid.id);
    check("carte payée annulée: remboursée automatiquement", cancelRes.refundOwed === false && afterCancel.refundedAt !== null && afterCancel.status === "ANNULEE");
    const refunds = await stripe.refunds.list({ payment_intent: pi });
    check("Stripe: 1 remboursement du montant exact", refunds.data.length === 1 && refunds.data[0].amount === paid.totalCents, `${refunds.data.length} × ${refunds.data[0]?.amount} c (commande ${paid.totalCents} c)`);
    const again = await refundOrder(paid.id);
    const refunds2 = await stripe.refunds.list({ payment_intent: pi });
    check("remboursement rejoué: aucun second remboursement", again === "ALREADY_REFUNDED" && refunds2.data.length === 1);

    // refund fails at Stripe: the cancellation stands, the refund stays owed and retryable
    const broken = await paidCardOrder(1, "pi_does_not_exist_e2e");
    const beforeBroken = await stock();
    const failed = await changeOrderStatus(broken.order.id, "ANNULEE");
    const afterFail = await order$(broken.order.id);
    check("échec Stripe: annulée mais remboursement signalé à faire", failed.refundOwed === true && afterFail.status === "ANNULEE" && afterFail.refundedAt === null);
    check("échec Stripe: le stock est quand même remis", (await stock()) === beforeBroken + 1);
    const good = await stripe.paymentIntents.create({ amount: afterFail.totalCents, currency: "eur", payment_method: "pm_card_visa", confirm: true, automatic_payment_methods: { enabled: true, allow_redirects: "never" } });
    await prisma.order.update({ where: { id: afterFail.id }, data: { stripePaymentIntentId: good.id } });
    check("réessayer le remboursement: réussit", (await refundOrder(afterFail.id)) === "REFUNDED" && (await order$(afterFail.id)).refundedAt !== null);
    const orderNoPay = await pickup(1);
    await expectError("rembourser une commande sans paiement carte: refusé", async () => { await changeOrderStatus(orderNoPay.id, "ANNULEE"); await refundOrder(orderNoPay.id); });

    // pending card order: admin cancel closes the Stripe session and gives the stock back
    const pendingOrder = await createCardOrder({ userId: "e2e-cust", contact, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: 1 }] });
    const { sessionId } = await createCheckoutSession(pendingOrder.id);
    const beforePending = await stock();
    await changeOrderStatus(pendingOrder.id, "ANNULEE");
    const closed = await stripe.checkout.sessions.retrieve(sessionId);
    check("attente de paiement annulée: session Stripe expirée + stock remis", closed.status === "expired" && (await stock()) === beforePending + 1 && (await order$(pendingOrder.id)).status === "ANNULEE");
  } finally {
    await prisma.order.deleteMany({ where: { userId: { in: ["e2e-admin", "e2e-cust"] } } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stock0 } });
    await prisma.user.deleteMany({ where: { id: { in: ["e2e-admin", "e2e-cust"] } } });
    results.push(`cleanup: orders=${await prisma.order.count({ where: { userId: { startsWith: "e2e-" } } })}, users=${await prisma.user.count({ where: { id: { startsWith: "e2e-" } } })}, stock ${stock0} restauré`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); });
