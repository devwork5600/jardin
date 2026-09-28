// Downloads product photos from a URL list into public/products/<slug>/N.ext.
//
//   npm run images:init                 create/complete scripts/product-images.json
//   npm run images:download             download every URL not already on disk
//   npm run images:download -- --only=monstera-deliciosa --force
//
// Then `npm run db:seed` links the files to the products.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PRODUCT_SLUGS } from "../prisma/catalog-data";

const LIST_PATH = path.join(process.cwd(), "scripts", "product-images.json");
const OUT_DIR = path.join(process.cwd(), "public", "products");
const CONCURRENCY = 2;
const PAUSE_MS = 250; // be gentle with the source server
const TIMEOUT_MS = 15_000;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const INIT = args.includes("--init");
const ONLY = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

type List = Record<string, string | string[]>;

function readList(): List {
  if (!existsSync(LIST_PATH)) return {};
  return JSON.parse(readFileSync(LIST_PATH, "utf8")) as List;
}

function init() {
  const list = readList();
  const next: List = {};
  for (const slug of PRODUCT_SLUGS) next[slug] = list[slug] ?? [];
  // Keep hand-added keys that are not in the catalog (typos are caught later).
  for (const key of Object.keys(list)) next[key] ??= list[key];
  writeFileSync(LIST_PATH, JSON.stringify(next, null, 2) + "\n");
  const empty = PRODUCT_SLUGS.filter((slug) => (next[slug] as string[]).length === 0).length;
  console.log(`${LIST_PATH}: ${PRODUCT_SLUGS.length} products, ${empty} still empty.`);
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function existingFile(dir: string, index: number) {
  return Object.values(EXTENSIONS).some((ext) => existsSync(path.join(dir, `${index}.${ext}`)));
}

async function download(slug: string, index: number, url: string) {
  const dir = path.join(OUT_DIR, slug);
  if (!FORCE && existingFile(dir, index)) return "skip";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Some shops refuse the default fetch UA or hotlinking without a referer.
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        Accept: "image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8",
        Referer: new URL(url).origin + "/",
      },
    });
    if (!response.ok) return `HTTP ${response.status}`;
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = EXTENSIONS[type];
    if (!ext) return `not an image (${type || "no content-type"})`;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 2_000) return "too small, probably a placeholder";
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${index}.${ext}`), bytes);
    return "ok";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  if (INIT) {
    init();
    return;
  }
  if (!existsSync(LIST_PATH)) {
    console.error("No scripts/product-images.json yet: run `npm run images:init` first.");
    process.exit(1);
  }

  const list = readList();
  const known = new Set(PRODUCT_SLUGS);
  const jobs: { slug: string; index: number; url: string }[] = [];
  for (const [slug, value] of Object.entries(list)) {
    if (ONLY && slug !== ONLY) continue;
    if (!known.has(slug)) {
      console.warn(`unknown slug in the list (typo?): ${slug}`);
      continue;
    }
    const urls = (Array.isArray(value) ? value : [value]).filter(Boolean);
    urls.forEach((url, i) => jobs.push({ slug, index: i + 1, url }));
  }
  if (jobs.length === 0) {
    console.log("Nothing to download: fill scripts/product-images.json first.");
    return;
  }

  const counts: Record<string, number> = { ok: 0, skip: 0, failed: 0 };
  const failures: string[] = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      const result = await download(job.slug, job.index, job.url);
      if (result === "ok") await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      if (result === "ok" || result === "skip") counts[result]++;
      else {
        counts.failed++;
        failures.push(`${job.slug} #${job.index}: ${result}\n    ${job.url}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`${counts.ok} downloaded, ${counts.skip} already there, ${counts.failed} failed.`);
  if (failures.length > 0) console.log("\nFailures:\n  " + failures.join("\n  "));
  const withImages = new Set(jobs.map((job) => job.slug)).size;
  console.log(`\n${withImages}/${PRODUCT_SLUGS.length} products have URLs. Run \`npm run db:seed\` to link them.`);
}

main();
