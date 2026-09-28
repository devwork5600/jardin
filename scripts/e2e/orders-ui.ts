// Real browser (headless Chrome over CDP): add to cart, checkout validation, order, confirmation.
// Needs `npm run dev` on :3000. Creates throwaway users/orders in the DB and
// removes them (and restores stock) when done. Run: npx tsx scripts/e2e/orders-ui.ts
import "dotenv/config";
import { createHmac, randomBytes } from "node:crypto";
import { spawn, execSync } from "node:child_process";
import { prisma } from "../../src/lib/prisma";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const PORT = 9333;
const PROFILE = "/tmp/claude-1000/-home-b166er-Desktop-02/583b21dc-599e-4f06-aee7-afedf6785c7e/scratchpad/chrome-e2e";
const results: string[] = [];
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { product: { name: { startsWith: "Echeveria mix" } } },
    include: { product: { select: { slug: true } } },
  });
  const stock0 = variant.stock;
  const token = randomBytes(24).toString("hex");
  await prisma.user.create({ data: { id: "e2e-ui", name: "Camille Test", email: "e2e-ui@example.invalid", emailVerified: true } });
  await prisma.session.create({ data: { id: "s-e2e-ui", token, userId: "e2e-ui", expiresAt: new Date(Date.now() + 3600_000) } });
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
  const cookieValue = encodeURIComponent(`${token}.${sig}`);

  execSync(`rm -rf ${PROFILE}`);
  const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--window-size=1280,1000", "about:blank"], { stdio: "ignore" });
  try {
    let targets: { webSocketDebuggerUrl: string; type: string }[] = [];
    for (let i = 0; i < 40; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.some((t) => t.type === "page")) break; } catch {}
      await sleep(250);
    }
    const ws = new WebSocket(targets.find((t) => t.type === "page")!.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pending = new Map<number, (v: any) => void>();
    ws.onmessage = (m) => { const d = JSON.parse(String(m.data)); if (d.id && pending.has(d.id)) { pending.get(d.id)!(d); pending.delete(d.id); } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const send = (method: string, params: object = {}) => new Promise<any>((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
    const evaluate = async (expression: string) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
    const waitFor = async (expression: string, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await evaluate(expression)) return true; await sleep(250); } return false; };
    const goto = async (path: string) => { await send("Page.navigate", { url: BASE + path }); await sleep(500); await waitFor("document.readyState === 'complete'"); };
    const setInput = (name: string, value: string) => evaluate(`(() => { const el = document.querySelector('input[name="${name}"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);

    await send("Page.enable"); await send("Network.enable");
    await send("Network.setCookie", { name: "better-auth.session_token", value: cookieValue, url: BASE });

    // 1. product page -> add to cart
    await goto(`/produit/${variant.product.slug}`);
    check("fiche produit affiche le bouton", await waitFor(`[...document.querySelectorAll('button')].some(b => /Ajouter au panier/i.test(b.textContent))`));
    await evaluate(`[...document.querySelectorAll('button')].find(b => /Ajouter au panier/i.test(b.textContent)).click()`);
    await sleep(800);
    const cart = await evaluate(`localStorage.getItem('jardin-cart-store')`);
    results.push("info panier après ajout: " + String(cart));
    check("panier (localStorage) contient la variante", typeof cart === "string" && cart.includes(variant.id), String(cart).slice(0, 90));

    // 2. checkout page, empty submit -> validation errors
    await goto("/paiement");
    check("formulaire de paiement affiché", await waitFor(`!!document.querySelector('input[name="phone"]')`));
    check("nom/e-mail préremplis depuis le compte", (await evaluate(`document.querySelector('input[name="email"]').value`)) === "e2e-ui@example.invalid");
    check("option carte active (Stripe configuré) + mention du mode test", await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Carte bancaire/i.test(b.textContent)); return !!b && !b.disabled && /4242/.test(b.textContent); })()`));
    const submitReady = `(() => { const b = document.querySelector('button[type="submit"]'); return !!b && !b.disabled; })()`;
    check("bouton d'envoi actif une fois le panier tarifé", await waitFor(submitReady, 10000));
    await setInput("phone", "12345");
    await evaluate(`document.querySelector('button[type="submit"]').click()`);
    check("téléphone invalide -> erreur affichée", await waitFor(`/Numéro de téléphone invalide/.test(document.body.innerText)`, 5000));
    check("jour de retrait et paiement au retrait présélectionnés", await evaluate(`!/Choisissez un jour de retrait/.test(document.body.innerText)`));
    check("pas de redirection tant que invalide", (await evaluate(`location.pathname`)) === "/paiement");
    check("aucune commande créée par un envoi invalide", (await prisma.order.count({ where: { userId: "e2e-ui" } })) === 0);

    // 3. valid submit
    await setInput("phone", "0612345678");
    await evaluate(`(() => { const btns = [...document.querySelectorAll('button[type="button"]')].filter(b => /Demain|lundi|mardi|mercredi|jeudi|vendredi|samedi/i.test(b.textContent)); btns[0].click(); return btns.length; })()`);
    await evaluate(`[...document.querySelectorAll('button')].find(b => /Paiement au retrait/i.test(b.textContent)).click()`);
    await sleep(300);
    await evaluate(`document.querySelector('button[type="submit"]').click()`);
    check("redirigé vers la confirmation", await waitFor(`location.pathname.startsWith('/paiement/confirmation/')`, 20000), String(await evaluate(`location.pathname`)));
    const number = String(await evaluate(`location.pathname.split('/').pop()`));
    check("numéro au format FE-XXXXXXXX", /^FE-[A-Z2-9]{8}$/.test(number), number);
    await waitFor(`document.body.innerText.includes(${JSON.stringify(number)})`, 8000);
    check("confirmation affiche le numéro et le produit", await evaluate(`document.body.innerText.includes(${JSON.stringify(number)}) && /Echeveria/i.test(document.body.innerText)`));
    await sleep(800);
    const cartAfter = String(await evaluate(`localStorage.getItem('jardin-cart-store')`));
    check("panier vidé après commande", !cartAfter.includes(variant.id), cartAfter.slice(0, 80));

    // 4. database side
    const order = await prisma.order.findUnique({ where: { orderNumber: number }, include: { items: true } });
    check("commande en base", !!order && order.items.length === 1 && order.items[0].quantity === 1 && order.contactPhone === "0612345678" && order.status === "EN_PREPARATION", order ? `${order.totalCents} c, ${order.pickupSlot}` : "absente");
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    check("stock décrémenté de 1", after.stock === stock0 - 1, `${stock0} -> ${after.stock}`);
    ws.close();
  } finally {
    chrome.kill("SIGTERM");
    await prisma.order.deleteMany({ where: { userId: "e2e-ui" } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stock0 } });
    await prisma.user.deleteMany({ where: { id: "e2e-ui" } });
    results.push(`cleanup: users=${await prisma.user.count({ where: { id: "e2e-ui" } })} orders=${await prisma.order.count({ where: { userId: "e2e-ui" } })}`);
  }
}
main().catch((e) => { failures++; results.push("CRASH " + (e instanceof Error ? e.stack : e)); })
  .finally(async () => { console.log("\n" + results.join("\n") + `\n\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`); await prisma.$disconnect(); process.exit(0); });
