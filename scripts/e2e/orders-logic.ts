// Server logic: pricing, loyalty, order creation, stock rollback, last-unit race.
// Needs `npm run dev` on :3000. Creates throwaway users/orders in the DB and
// removes them (and restores stock) when done. Run: npx tsx scripts/e2e/orders-logic.ts
import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import { priceCart } from "../../src/lib/cart-pricing";
import { createPickupOrder, OrderError } from "../../src/lib/orders";
import { getPickupDays } from "../../src/lib/shop-hours";

const results: string[] = [];
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const USER_ID = "e2e-test-user";
const contact = { name: "Test E2E", email: "e2e@example.invalid", phone: "0612345678" };

async function variantOf(namePrefix: string) {
  const v = await prisma.productVariant.findFirstOrThrow({
    where: { product: { name: { startsWith: namePrefix } } },
    include: { product: { select: { name: true } } },
  });
  return v;
}

async function main() {
  const day = getPickupDays()[0];
  const eche = await variantOf("Echeveria mix");
  const terr = await variantOf("Terreau végétal");
  const arro = await variantOf("Arrosoir 18 cm");
  const original = new Map([eche, terr, arro].map((v) => [v.id, v.stock]));

  await prisma.user.create({
    data: { id: USER_ID, name: "Test E2E", email: "e2e@example.invalid", emailVerified: true },
  });

  try {
    // A. pricing + loyalty (tier Sève 5 %, nothing on sale)
    const items = [{ variantId: eche.id, quantity: 2 }, { variantId: terr.id, quantity: 1 }];
    const cart = await priceCart(items, USER_ID);
    const sub = eche.priceCents * 2 + terr.priceCents;
    const disc = Math.round((sub * 5) / 100);
    check("panier: sous-total", cart.subtotalCents === sub, `${cart.subtotalCents}`);
    check("panier: remise fidélité 5 %", cart.loyalty?.discountCents === disc && cart.loyalty?.tierName === "Sève", `${cart.loyalty?.tierName} -${cart.loyalty?.discountCents}`);
    check("panier: total", cart.totalCents === sub - disc && cart.canOrder, `${cart.totalCents}`);
    const guest = await priceCart(items, null);
    check("panier invité: pas de remise", guest.loyalty === null && guest.totalCents === sub);

    // B. happy path
    const order = await createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items });
    const full = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    check("commande: numéro FE-XXXXXXXX", /^FE-[A-Z2-9]{8}$/.test(full.orderNumber), full.orderNumber);
    check("commande: statut / paiement", full.status === "EN_PREPARATION" && full.paymentMethod === "ON_PICKUP");
    check("commande: total recalculé serveur", full.totalCents === sub - disc && full.loyaltyDiscountCents === disc && full.subtotalCents === sub);
    check("commande: retrait", full.pickupDate.toISOString().slice(0, 10) === day.iso && full.pickupSlot === day.hours, `${day.iso} ${day.hours}`);
    check("commande: lignes figées", full.items.length === 2 && full.items.every((i) => i.unitPriceCents === (i.variantId === eche.id ? eche.priceCents : terr.priceCents)));
    const ecAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: eche.id } });
    const teAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: terr.id } });
    check("stock décrémenté", ecAfter.stock === original.get(eche.id)! - 2 && teAfter.stock === original.get(terr.id)! - 1, `${ecAfter.stock}/${teAfter.stock}`);

    // C. snapshot survives a later price change
    await prisma.productVariant.update({ where: { id: eche.id }, data: { priceCents: eche.priceCents + 500 } });
    const again = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id, variantId: eche.id } });
    check("prix figé après changement de prix", again.unitPriceCents === eche.priceCents);
    await prisma.productVariant.update({ where: { id: eche.id }, data: { priceCents: eche.priceCents } });

    // D. rejections leave stock untouched
    const stockBefore = (await prisma.productVariant.findUniqueOrThrow({ where: { id: terr.id } })).stock;
    const expectError = async (name: string, fn: () => Promise<unknown>) => {
      try { await fn(); check(name, false, "aucune erreur levée"); }
      catch (e) { check(name, e instanceof OrderError, e instanceof Error ? e.message : String(e)); }
    };
    await expectError("jour de retrait invalide", () => createPickupOrder({ userId: USER_ID, contact, pickupDate: "2000-01-01", items }));
    await expectError("panier vide", () => createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items: [] }));
    await expectError("stock insuffisant", () => createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items: [{ variantId: terr.id, quantity: 99 }] }));
    await expectError("article inconnu", () => createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items: [{ variantId: "nope", quantity: 1 }] }));
    // two-line cart where the 2nd line fails: the 1st line's stock must roll back
    await prisma.productVariant.update({ where: { id: arro.id }, data: { stock: 1 } });
    const tBefore = (await prisma.productVariant.findUniqueOrThrow({ where: { id: terr.id } })).stock;
    await expectError("rollback si une ligne échoue", () => createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items: [{ variantId: terr.id, quantity: 1 }, { variantId: arro.id, quantity: 5 }] }));
    const tAfter = (await prisma.productVariant.findUniqueOrThrow({ where: { id: terr.id } })).stock;
    check("stock intact après rejet", tAfter === tBefore && tBefore === stockBefore, `${tBefore}->${tAfter}`);

    // E. race for the last unit
    await prisma.productVariant.update({ where: { id: arro.id }, data: { stock: 1 } });
    const attempt = () => createPickupOrder({ userId: USER_ID, contact, pickupDate: day.iso, items: [{ variantId: arro.id, quantity: 1 }] });
    const outcomes = await Promise.allSettled([attempt(), attempt(), attempt()]);
    const won = outcomes.filter((o) => o.status === "fulfilled").length;
    const arroEnd = await prisma.productVariant.findUniqueOrThrow({ where: { id: arro.id } });
    check("course dernier article: 1 seul gagnant", won === 1 && arroEnd.stock === 0, `${won} gagnant(s), stock=${arroEnd.stock}`);

    // F. loyalty is credited at pickup (admin marks the order collected), not when
    // it is placed: covered by admin-orders.ts. Here: placing an order credits nothing.
    const u = await prisma.user.findUniqueOrThrow({ where: { id: USER_ID }, select: { totalSpentCents: true } });
    check("fidélité: rien n'est crédité à la commande (crédité au retrait)", (u.totalSpentCents ?? 0) === 0, `totalSpentCents=${u.totalSpentCents}`);
  } finally {
    await prisma.order.deleteMany({ where: { userId: USER_ID } });
    for (const [id, stock] of original) await prisma.productVariant.update({ where: { id }, data: { stock } });
    await prisma.user.delete({ where: { id: USER_ID } });
    const leftovers = await prisma.order.count({ where: { userId: USER_ID } });
    results.push(`cleanup: orders=${leftovers}, stocks restored`);
  }
}

main()
  .catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => {
    console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
    await prisma.$disconnect();
  });
