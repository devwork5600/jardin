import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// slug -> Cloudinary URLs, written by scripts/upload-images.ts (no secrets in it).
export const CLOUDINARY_MANIFEST = path.join(process.cwd(), "prisma", "product-images.cloudinary.json");

function readManifest(): Record<string, string[]> {
  return existsSync(CLOUDINARY_MANIFEST) ? JSON.parse(readFileSync(CLOUDINARY_MANIFEST, "utf8")) : {};
}

// Local files (public/products/<slug>/1.jpg, 2.jpg…), numeric sort so 10 follows 2.
function localImages(slug: string) {
  const dir = path.join(process.cwd(), "public", "products", slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => `/products/${slug}/${file}`);
}

// Where a product's photos come from, best first: already on Cloudinary (works
// once deployed), then local files (development), else none (the seed then
// falls back to a placeholder).
export function productImageUrls(slug: string, manifest = readManifest()) {
  const hosted = manifest[slug];
  return hosted && hosted.length > 0 ? hosted : localImages(slug);
}

export const loadManifest = readManifest;
