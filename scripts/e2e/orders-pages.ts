// Order pages over HTTP with real sessions: owner, other user, visitor, unknown number.
// Needs `npm run dev` on :3000. Creates throwaway users/orders in the DB and
// removes them (and restores stock) when done. Run: npx tsx scripts/e2e/orders-pages.ts
import "dotenv/config";
import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { createPickupOrder } from "../../src/lib/orders";
import { getPickupDays } from "../../src/lib/shop-hours";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function makeUser(id: string) {
  await prisma.user.create({ data: { id, name: `Test ${id}`, email: `${id}@example.invalid`, emailVerified: true } });
  const token = randomBytes(24).toString("hex");
  await prisma.session.create({ data: { id: `s-${id}`, token, userId: id, expiresAt: new Date(Date.now() + 3600_000) } });
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
  return `better-auth.session_token=${encodeURIComponent(`${token}.${sig}`)}`;
}
const get = (path: string, cookie?: string) =>
  fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });

async function main() {
  const day = getPickupDays()[0];
  const variant = await prisma.productVariant.findFirstOrThrow({ where: { product: { name: { startsWith: "Echeveria mix" } } } });
  const stock0 = variant.stock;
  const cookieA = await makeUser("e2e-a");
  const cookieB = await makeUser("e2e-b");
  try {
    const order = await createPickupOrder({
      userId: "e2e-a",
      contact: { name: "Alice Test", email: "e2e-a@example.invalid", phone: "0612345678" },
      pickupDate: day.iso,
      items: [{ variantId: variant.id, quantity: 3 }],
    });
    const n = order.orderNumber;
    const euros = (order.totalCents / 100).toFixed(2).replace(".", ",");

    let r = await get(`/paiement/confirmation/${n}`, cookieA);
    let html = await r.text();
    check("confirmation (propriétaire): 200", r.status === 200, `${r.status}`);
    check("confirmation: numéro + total + nom produit", html.includes(n) && html.includes(euros) && html.includes("Echeveria"), `total ${euros}`);
    check("confirmation: pas de préfixe JI-", !html.includes("JI-"));

    r = await get(`/compte/commandes`, cookieA); html = await r.text();
    check("historique: liste la commande", r.status === 200 && html.includes(n), `${r.status}`);
    r = await get(`/compte/commandes/${n}`, cookieA); html = await r.text();
    check("détail commande: 200 + statut", r.status === 200 && html.includes(n) && /préparation/i.test(html), `${r.status}`);
    r = await get(`/compte`, cookieA); html = await r.text();
    check("tableau de bord: commande en cours", r.status === 200 && html.includes(n), `${r.status}`);

    r = await get(`/paiement/confirmation/${n}`, cookieB);
    check("confirmation: autre utilisateur refusé", r.status === 404 || (r.status >= 300 && r.status < 400), `${r.status}`);
    r = await get(`/compte/commandes/${n}`, cookieB);
    check("détail: autre utilisateur refusé", r.status === 404 || (r.status >= 300 && r.status < 400), `${r.status}`);
    r = await get(`/compte/commandes/${n}`);
    check("détail: visiteur redirigé vers /connexion", r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/connexion"), `${r.status} ${r.headers.get("location")}`);
    r = await get(`/paiement/confirmation/${n}`);
    check("confirmation: visiteur redirigé vers /connexion", r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/connexion"), `${r.status} ${r.headers.get("location")}`);
    r = await get(`/paiement/confirmation/FE-ZZZZZZZZ`, cookieA);
    check("numéro inconnu: 404", r.status === 404, `${r.status}`);
  } finally {
    await prisma.order.deleteMany({ where: { userId: { in: ["e2e-a", "e2e-b"] } } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stock0 } });
    await prisma.user.deleteMany({ where: { id: { in: ["e2e-a", "e2e-b"] } } });
    results.push(`cleanup: users=${await prisma.user.count({ where: { id: { startsWith: "e2e-" } } })} orders=${await prisma.order.count({ where: { userId: { startsWith: "e2e-" } } })}`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); });
