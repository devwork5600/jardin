import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { loadManifest, productImageUrls } from "./product-images";
import {
  BRAND_NAMES,
  OWN_BRAND,
  PRODUCT_SLUGS,
  PRODUCTS,
  SUBCATEGORIES,
  SUB_CHARS,
  SUB_CONSEIL,
  TOP_CATEGORIES,
  slugify,
} from "./catalog-data";

// `npm run db:seed -- --reset` also removes the previous catalog (products
// that were ordered are archived instead of deleted). Without it the seed
// only adds/updates.
const RESET = process.argv.includes("--reset");

async function resetCatalog() {
  const keepProducts = new Set(PRODUCT_SLUGS);
  const keepCategories = new Set([
    ...TOP_CATEGORIES.map((c) => c.slug),
    ...SUBCATEGORIES.map((c) => c.slug),
  ]);
  const keepBrands = new Set(BRAND_NAMES.map(slugify));

  const oldProducts = await prisma.product.findMany({
    where: { slug: { notIn: [...keepProducts] } },
    select: { id: true, slug: true },
  });
  for (const product of oldProducts) {
    try {
      await prisma.product.delete({ where: { id: product.id } });
    } catch {
      // A variant is referenced by an order: keep the row, hide it.
      await prisma.product.update({
        where: { id: product.id },
        data: { status: "ARCHIVED" },
      });
      console.log(`archived (has orders): ${product.slug}`);
    }
  }

  const oldCategories = await prisma.category.findMany({
    where: { slug: { notIn: [...keepCategories] } },
    select: { id: true, slug: true, parentId: true },
  });
  // Children before parents so the self-relation never blocks a delete.
  oldCategories.sort((a, b) => Number(b.parentId !== null) - Number(a.parentId !== null));
  for (const category of oldCategories) {
    try {
      await prisma.category.delete({ where: { id: category.id } });
    } catch {
      console.log(`kept category (still has archived products): ${category.slug}`);
    }
  }

  await prisma.brand.deleteMany({
    where: { slug: { notIn: [...keepBrands] }, products: { none: {} } },
  });
}

async function main() {
  if (RESET) await resetCatalog();

  const topBySlug = new Map<string, string>();
  for (const [position, category] of TOP_CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, position, parentId: null },
      create: { ...category, position },
    });
    topBySlug.set(category.slug, row.id);
  }

  const subBySlug = new Map<string, string>();
  const subPosition = new Map<string, number>();
  for (const sub of SUBCATEGORIES) {
    const position = subPosition.get(sub.parent) ?? 0;
    subPosition.set(sub.parent, position + 1);
    const parentId = topBySlug.get(sub.parent)!;
    const row = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId, position },
      create: { name: sub.name, slug: sub.slug, parentId, position },
    });
    subBySlug.set(sub.slug, row.id);
  }

  const brandIds = new Map<string, string>();
  for (const name of BRAND_NAMES) {
    const slug = slugify(name);
    const row = await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    brandIds.set(name, row.id);
  }

  const introBySub = new Map(SUBCATEGORIES.map((sub) => [sub.slug, sub.intro]));

  for (const { sub: subSlug, name, price, badge, description } of PRODUCTS) {
    const slug = slugify(name);
    const brand = OWN_BRAND;
    // One variant: the pot size is part of the product name (like the source).
    const variant = {
      label: "Standard",
      position: 0,
      priceCents: Math.round(price * 100),
      compareAtCents: null,
    };

    const fields = {
      name,
      description: description || `${name}. ${introBySub.get(subSlug)} Disponible en boutique à Vannes, conseil sur place.`,
      conseil: SUB_CONSEIL[subSlug] ?? null,
      optionName: null,
      badge,
      status: "PUBLISHED" as const,
      categoryId: subBySlug.get(subSlug)!,
      brandId: brandIds.get(brand)!,
    };

    const product = await prisma.product.upsert({
      where: { slug },
      update: fields,
      create: { ...fields, slug },
    });

    const sku = `${slug}-1`.toUpperCase();
    await prisma.productVariant.upsert({
      where: { sku },
      update: { ...variant },
      create: { ...variant, sku, productId: product.id, stock: 8 },
    });
    // Drop variants left over from an earlier catalog (e.g. -2 pot sizes).
    await prisma.productVariant.deleteMany({
      where: { productId: product.id, sku: { not: sku }, orderItems: { none: {} } },
    });

    const characteristics = SUB_CHARS[subSlug];
    if (characteristics) {
      await prisma.productCharacteristic.deleteMany({ where: { productId: product.id } });
      await prisma.productCharacteristic.createMany({
        data: characteristics.map(([label, value], position) => ({
          productId: product.id,
          label,
          value,
          position,
        })),
      });
    }
  }

  // Photos: Cloudinary URLs (prisma/product-images.cloudinary.json) or local files win; otherwise placeholders, only for products
  // that have no image at all (so a re-seed never wipes a manual upload).
  const TONES = ["DCE8E0", "E1EBDD", "EFE3DA", "D8DDD3", "E3E0D9"];
  const SIZES = [[800, 1000], [1000, 1000], [1200, 900], [800, 1000], [900, 1200]];
  const products = await prisma.product.findMany({
    where: { slug: { in: PRODUCT_SLUGS } },
    select: { id: true, name: true, slug: true, images: { select: { url: true } } },
    orderBy: { createdAt: "asc" },
  });
  const manifest = loadManifest();
  let withRealImages = 0;
  for (const [index, product] of products.entries()) {
    const local = productImageUrls(product.slug, manifest);
    if (local.length > 0) {
      withRealImages++;
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.createMany({
        data: local.map((url, position) => ({ productId: product.id, position, url })),
      });
      continue;
    }
    if (product.images.length > 0) continue;

    const [width, height] = SIZES[index % SIZES.length];
    const tone = TONES[index % TONES.length];
    const count = index % 5 === 0 ? 3 : 1;
    await prisma.productImage.createMany({
      data: Array.from({ length: count }, (_, position) => {
        const label = encodeURIComponent(`${product.name}\nVue ${position + 1}`).replace(/%20/g, "+");
        return {
          productId: product.id,
          position,
          url: `https://placehold.co/${width}x${height}/${tone}/16261D/png?text=${label}`,
        };
      }),
    });
  }
  console.log(`${products.length} products, ${withRealImages} with real photos.`);

  await prisma.loyaltyTier.upsert({
    where: { name: "Sève" },
    update: {},
    create: { name: "Sève", minSpentCents: 0, discountPct: 5 },
  });

  await prisma.loyaltyTier.upsert({
    where: { name: "Racine" },
    update: {},
    create: { name: "Racine", minSpentCents: 60000, discountPct: 8 },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
