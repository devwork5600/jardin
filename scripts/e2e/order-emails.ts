// Order e-mails, in memory (nothing is sent): content, HTML escaping, exactly
// one message per event even when two paths race, and a mail failure never
// breaking an order. Run: npx tsx scripts/e2e/order-emails.ts
import "dotenv/config";
import type Stripe from "stripe";
import { outbox } from "../../src/lib/email";
import { prisma } from "../../src/lib/prisma";
import { createCardOrder, createPickupOrder } from "../../src/lib/orders";
import { changeOrderStatus } from "../../src/lib/order-admin";
import { sendOrderConfirmation } from "../../src/lib/order-emails";
import { settleSession } from "../../src/lib/payments";
import { getPickupDays } from "../../src/lib/shop-hours";

const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const USER = "e2e-mail";

async function main() {
  process.env.EMAIL_TRANSPORT = "memory";
  const day = getPickupDays()[0];
  const variant = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Echeveria mix" } } }, include: { product: { select: { name: true } } } });
  const stock0 = variant.stock;
  await prisma.user.create({ data: { id: USER, name: "Mail Test", email: "e2e-mail@example.invalid", emailVerified: true } });
  const contact = { name: '<i>Léa & Co Test', email: "e2e-mail@example.invalid", phone: "0612345678" };
  const items = [{ variantId: variant.id, quantity: 2 }];

  try {
    // ---- confirmation (pay at pickup)
    const pickup = await createPickupOrder({ userId: USER, contact, pickupDate: day.iso, items });
    outbox.length = 0;
    await sendOrderConfirmation(pickup.id);
    const m = outbox[0];
    const plain = (html: string) => html.replace(/<!-- -->/g, ""); // React splits adjacent text nodes with comments
    const mhtml = plain(m.html);
    check("confirmation: 1 message au bon destinataire", outbox.length === 1 && m.to === "e2e-mail@example.invalid");
    check("confirmation: sujet avec le numéro", m.subject.includes(pickup.orderNumber) && /confirmée/.test(m.subject), m.subject);
    check("confirmation: produit, quantité, total, retrait", mhtml.includes(variant.product.name) && mhtml.includes("× 2") && mhtml.includes(String(pickup.totalCents / 100).replace(".", ",")) && /Retrait/.test(mhtml) && mhtml.includes("12 rue du Cactus"));
    check("confirmation (au retrait): dit qu'on règle sur place", /Vous réglerez au retrait/.test(mhtml) && /réglerez au retrait/.test(m.text));
    check("HTML échappé (prénom '<i>Léa' devient du texte)", mhtml.includes("&lt;i&gt;Léa") && !mhtml.includes("<i>Léa"));
    check("version texte présente (sans mise en page HTML)", m.text.length > 50 && !/<(html|body|table|div|p)\b/i.test(m.text));

    // ---- card: paid confirmation sent exactly once even when two paths race
    const card = await createCardOrder({ userId: USER, contact: { ...contact, name: "Camille Test" }, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: 1 }] });
    const sessionId = `cs_test_e2e_mail_${Date.now()}`;
    await prisma.order.update({ where: { id: card.id }, data: { stripeSessionId: sessionId } });
    outbox.length = 0;
    const paid = { id: sessionId, payment_status: "paid", status: "complete", payment_intent: null } as unknown as Stripe.Checkout.Session;
    const [a, b] = await Promise.all([settleSession(paid), settleSession(paid)]);
    await sleep(1500);
    check("webhook + page simultanés: un seul PAID", [a, b].filter((x) => x === "PAID").length === 1, `${a}/${b}`);
    check("… donc un seul e-mail de confirmation", outbox.length === 1 && /confirmé/.test(outbox[0].text), `${outbox.length} message(s)`);
    await settleSession(paid);
    await sleep(800);
    check("événement rejoué: pas de second e-mail", outbox.length === 1);

    // ---- ready
    outbox.length = 0;
    await changeOrderStatus(pickup.id, "PRETE_AU_RETRAIT");
    await sleep(1200);
    check("prête au retrait: 1 e-mail « prête »", outbox.length === 1 && /est prête/.test(outbox[0].subject), outbox[0]?.subject ?? "aucun");
    check("prête (au retrait): montant à régler sur place", /À régler sur place/.test(plain(outbox[0].html)), "");
    outbox.length = 0;
    await changeOrderStatus(pickup.id, "PRETE_AU_RETRAIT").catch(() => undefined);
    await sleep(600);
    check("changement refusé: aucun e-mail", outbox.length === 0);
    await changeOrderStatus(card.id, "PRETE_AU_RETRAIT");
    await sleep(1200);
    check("prête (carte): dit que c'est déjà réglé", outbox.length === 1 && /Déjà réglée en ligne/.test(outbox[0].text), "");

    // ---- demo redirect
    process.env.EMAIL_REDIRECT_TO = "demo-inbox@example.invalid";
    outbox.length = 0;
    await sendOrderConfirmation(pickup.id);
    delete process.env.EMAIL_REDIRECT_TO;
    check("EMAIL_REDIRECT_TO: tout part vers l'adresse de démo, l'origine est dans le sujet", outbox.length === 1 && outbox[0].to === "demo-inbox@example.invalid" && outbox[0].subject.startsWith("[pour e2e-mail@example.invalid]"), outbox[0]?.subject ?? "");

    // ---- a mail that can't leave never breaks the order
    const other = await createPickupOrder({ userId: USER, contact, pickupDate: day.iso, items: [{ variantId: variant.id, quantity: 1 }] });
    delete process.env.EMAIL_TRANSPORT;
    const key = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_invalid_key_for_test";
    outbox.length = 0;
    let threw = false;
    try { await changeOrderStatus(other.id, "PRETE_AU_RETRAIT"); } catch { threw = true; }
    await sleep(2500);
    process.env.RESEND_API_KEY = key;
    process.env.EMAIL_TRANSPORT = "memory";
    const after = await prisma.order.findUniqueOrThrow({ where: { id: other.id } });
    check("envoi impossible (clé invalide): la commande avance quand même", !threw && after.status === "PRETE_AU_RETRAIT");
  } finally {
    await prisma.order.deleteMany({ where: { userId: USER } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stock0 } });
    await prisma.user.deleteMany({ where: { id: USER } });
    results.push(`cleanup: orders=${await prisma.order.count({ where: { userId: USER } })}, stock ${stock0} restauré`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); });
