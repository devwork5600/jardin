import "dotenv/config";
import type { ProductBadge } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const CULTURE_INDOOR_DESCRIPTION =
  "Éclairage, ventilation, chambres de culture et contrôle du climat. Plus de références encore en boutique — demandez-nous conseil.";

const TOP_CATEGORIES = [
  { name: "Culture indoor", slug: "culture-indoor", description: CULTURE_INDOOR_DESCRIPTION },
  {
    name: "CBD & CBG",
    slug: "cbd-cbg",
    description:
      "Sélection bretonne, fleurs, huiles et résines, conseillées en boutique.",
  },
  {
    name: "Outdoor & hors-sol",
    slug: "outdoor",
    description:
      "Substrats, engrais, pots et additifs pour chaque méthode de culture.",
  },
  {
    name: "Vinyles & pop culture",
    slug: "vinyles",
    description:
      "Arrivages réguliers, neuf et occasion. Figurines et objets de collection.",
  },
];

const SUBCATEGORIES = [
  { name: "Éclairage", slug: "eclairage" },
  { name: "Chambres", slug: "chambres" },
  { name: "Ventilation", slug: "ventilation" },
  { name: "Contrôle", slug: "controle" },
  { name: "Accessoires", slug: "accessoires" },
];

// [subcategory slug, brand, name, price €, compare-at €, badge]
const PRODUCTS: [string, string, string, number, number | null, ProductBadge | null][] = [
  ["eclairage", "Mars Hydro", "Panneau LED TS 1000 — 150 W", 149, 179, null],
  ["chambres", "Secret Jardin", "Chambre Hydro Shoot 80 × 80 × 160", 129, null, "BEST_SELLER"],
  ["ventilation", "Winflex", "Extracteur Revolution Stealth 125 mm", 159, null, null],
  ["ventilation", "Prima Klima", "Filtre à charbon 125 × 400", 69, null, null],
  ["controle", "GrowControl", "Thermo-hygromètre digital min/max", 19.9, null, null],
  ["eclairage", "Lumatek", "Ballast digital 600 W dimmable", 189, 219, null],
  ["chambres", "Secret Jardin", "Chambre Dark Room 120 × 120 × 200", 249, null, null],
  ["controle", "Bluelab", "Stylo pH Pen — mesure pH", 89, null, "ADVICE"],
  ["ventilation", "Ruck", "Ventilateur à clip Ø 15 cm", 24.9, null, null],
  ["accessoires", "Garden Highpro", "Kit poulies Easy Roll réglables", 12.5, null, null],
  ["accessoires", "Secret Jardin", "Filet de palissage 80 × 80", 14.9, null, null],
  ["eclairage", "Mars Hydro", "Panneau LED FC 3000 — 300 W", 399, null, "NEW"],
];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const topBySlug = new Map<string, string>();
  for (const [position, category] of TOP_CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, position },
      create: { ...category, position },
    });
    topBySlug.set(category.slug, row.id);
  }

  const cultureIndoorId = topBySlug.get("culture-indoor")!;
  const subBySlug = new Map<string, string>();
  for (const [position, sub] of SUBCATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId: cultureIndoorId, position },
      create: { ...sub, parentId: cultureIndoorId, position },
    });
    subBySlug.set(sub.slug, row.id);
  }

  const brandIds = new Map<string, string>();
  const brandNames = new Set(["SunSystem", "Secret Jardin", ...PRODUCTS.map((p) => p[1])]);
  for (const name of brandNames) {
    const slug = slugify(name);
    const row = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    brandIds.set(name, row.id);
  }

  // Products from the design mockup (no photos yet: cards render a placeholder).
  for (const [subSlug, brand, name, price, compareAt, badge] of PRODUCTS) {
    const slug = slugify(name);
    await prisma.product.upsert({
      where: { slug },
      update: { badge },
      create: {
        name,
        slug,
        description: `${name} — ${brand}. Disponible en boutique à Vannes, conseil sur place.`,
        status: "PUBLISHED",
        badge,
        categoryId: subBySlug.get(subSlug)!,
        brandId: brandIds.get(brand)!,
        variants: {
          create: [
            {
              sku: slug.toUpperCase().slice(0, 40),
              label: "Standard",
              priceCents: Math.round(price * 100),
              compareAtCents: compareAt ? Math.round(compareAt * 100) : null,
              stock: 8,
            },
          ],
        },
      },
    });
  }

  // Two products seeded earlier in Phase 3 (kept), re-homed under the tree.
  await prisma.product.upsert({
    where: { slug: "rampe-led-600w" },
    update: {},
    create: {
      name: "Rampe LED 600W",
      slug: "rampe-led-600w",
      description:
        "Rampe LED full spectrum pour la croissance et la floraison en culture indoor.",
      conseil:
        "Réglez la hauteur à 40cm du plant en croissance, 30cm en floraison.",
      status: "PUBLISHED",
      categoryId: subBySlug.get("eclairage")!,
      brandId: brandIds.get("SunSystem")!,
      characteristics: {
        create: [
          { label: "Puissance", value: "600W", position: 0 },
          { label: "Spectre", value: "Full spectrum", position: 1 },
        ],
      },
      variants: {
        create: [
          { sku: "LED-600W", label: "600W", priceCents: 24900, compareAtCents: 29900, stock: 12 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "tente-culture-secret-jardin" },
    update: {},
    create: {
      name: "Tente de culture",
      slug: "tente-culture-secret-jardin",
      description:
        "Tente de culture opaque, toile déperlante, intérieur mylar réfléchissant.",
      status: "PUBLISHED",
      categoryId: subBySlug.get("chambres")!,
      brandId: brandIds.get("Secret Jardin")!,
      variants: {
        create: [
          { sku: "TENTE-60", label: "60x60x140cm", priceCents: 8900, stock: 5, position: 0 },
          { sku: "TENTE-80", label: "80x80x160cm", priceCents: 11900, stock: 3, position: 1 },
        ],
      },
    },
  });

  // The placeholder photos seeded in Phase 3 were remote placehold.co URLs.
  await prisma.productImage.deleteMany({
    where: { url: { startsWith: "https://placehold.co" } },
  });

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
