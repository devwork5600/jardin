// Uploads public/products/<slug>/N.ext to Cloudinary and records the URLs in
// prisma/product-images.cloudinary.json, which `npm run db:seed` then puts in
// the database (so the deployed site doesn't depend on local files).
//
//   npm run images:upload -- --dry-run     list what would be uploaded, send nothing
//   npm run images:upload                  upload everything not already there
//   npm run images:upload -- --only=<slug>
//
// Credentials, either way (Cloudinary Console > Settings > API Keys):
//   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
//   or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
// Safe to re-run: each photo has a fixed public id and an existing one is kept,
// not uploaded twice.
import "dotenv/config";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const FOLDER = process.env.CLOUDINARY_FOLDER ?? "plants";
const SOURCE = path.join(process.cwd(), "public", "products");
const MANIFEST = path.join(process.cwd(), "prisma", "product-images.cloudinary.json");
const CONCURRENCY = 3;

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const ONLY = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

type Job = { slug: string; index: number; file: string };

function collectJobs(): Job[] {
  if (!existsSync(SOURCE)) return [];
  const jobs: Job[] = [];
  for (const slug of readdirSync(SOURCE).sort()) {
    if (ONLY && slug !== ONLY) continue;
    const files = readdirSync(path.join(SOURCE, slug))
      .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    files.forEach((file, i) => jobs.push({ slug, index: i + 1, file: path.join(SOURCE, slug, file) }));
  }
  return jobs;
}

async function main() {
  const jobs = collectJobs();
  if (jobs.length === 0) {
    console.log("Nothing to upload: public/products/ is empty (or --only matched nothing).");
    return;
  }
  const slugs = new Set(jobs.map((job) => job.slug));
  console.log(`${jobs.length} photos, ${slugs.size} products -> folder "${FOLDER}"`);

  if (DRY) {
    for (const job of jobs.slice(0, 5)) console.log(`  ${FOLDER}/${job.slug}/${job.index}  <-  ${path.relative(process.cwd(), job.file)}`);
    if (jobs.length > 5) console.log(`  … and ${jobs.length - 5} more`);
    console.log("Dry run: nothing was sent.");
    return;
  }

  const { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  } else if (process.env.CLOUDINARY_URL?.startsWith("cloudinary://")) {
    cloudinary.config({ secure: true }); // the SDK reads CLOUDINARY_URL itself
  } else {
    console.error("Cloudinary credentials missing in .env: set CLOUDINARY_URL, or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.");
    process.exit(1);
  }
  try {
    await cloudinary.api.ping(); // wrong key/secret/cloud name: stop before 268 failed uploads
  } catch (error) {
    const message = (error as { error?: { message?: string } })?.error?.message ?? String(error);
    console.error(`Cloudinary rejected the credentials: ${message}`);
    process.exit(1);
  }
  console.log(`Cloud: ${cloudinary.config().cloud_name} (credentials OK)`);

  const manifest: Record<string, string[]> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  const found: Record<string, string[]> = {};
  const counts = { uploaded: 0, kept: 0, failed: 0 };
  const failures: string[] = [];
  let next = 0;

  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        const result = await cloudinary.uploader.upload(job.file, {
          public_id: `${FOLDER}/${job.slug}/${job.index}`,
          // Where the asset shows up in the Media Library. Accounts in "dynamic
          // folder mode" keep this apart from the public id, so set both.
          asset_folder: `${FOLDER}/${job.slug}`,
          resource_type: "image",
          overwrite: false, // an existing photo is returned as is, not re-uploaded
          unique_filename: false,
          use_filename: false,
        });
        (found[job.slug] ??= [])[job.index - 1] = result.secure_url;
        counts[result.existing ? "kept" : "uploaded"]++;
      } catch (error) {
        counts.failed++;
        failures.push(`${job.slug} #${job.index}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Merge, dropping holes left by failed photos so a slug never lists a gap.
  for (const [slug, urls] of Object.entries(found)) manifest[slug] = urls.filter(Boolean);
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");

  console.log(`${counts.uploaded} uploaded, ${counts.kept} already there, ${counts.failed} failed.`);
  if (failures.length > 0) console.log("\nFailures:\n  " + failures.join("\n  "));
  console.log(`\nManifest: ${path.relative(process.cwd(), MANIFEST)} (${Object.keys(sorted).length} products).`);
  console.log("Next: `npm run db:seed` to put these URLs in the database.");
}

main();
