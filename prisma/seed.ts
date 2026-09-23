import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const cultureIndoor = await prisma.category.upsert({
    where: { slug: "culture-indoor" },
    update: {},
    create: { name: "Culture indoor", slug: "culture-indoor" },
  });

  const eclairage = await prisma.category.upsert({
    where: { slug: "eclairage" },
    update: {},
    create: {
      name: "Éclairage",
      slug: "eclairage",
      parentId: cultureIndoor.id,
    },
  });

  const chambres = await prisma.category.upsert({
    where: { slug: "chambres" },
    update: {},
    create: { name: "Chambres", slug: "chambres", parentId: cultureIndoor.id },
  });

  await prisma.category.upsert({
    where: { slug: "cbd-cbg" },
    update: {},
    create: { name: "CBD & CBG", slug: "cbd-cbg" },
  });

  await prisma.category.upsert({
    where: { slug: "outdoor" },
    update: {},
    create: { name: "Outdoor & hors-sol", slug: "outdoor" },
  });

  const sunSystem = await prisma.brand.upsert({
    where: { slug: "sun-system" },
    update: {},
    create: { name: "SunSystem", slug: "sun-system" },
  });

  const secretJardin = await prisma.brand.upsert({
    where: { slug: "secret-jardin" },
    update: {},
    create: { name: "Secret Jardin", slug: "secret-jardin" },
  });

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
      categoryId: eclairage.id,
      brandId: sunSystem.id,
      images: {
        create: [{ url: "https://placehold.co/800x800", position: 0 }],
      },
      characteristics: {
        create: [
          { label: "Puissance", value: "600W", position: 0 },
          { label: "Spectre", value: "Full spectrum", position: 1 },
        ],
      },
      variants: {
        create: [
          {
            sku: "LED-600W",
            label: "600W",
            priceCents: 24900,
            compareAtCents: 29900,
            stock: 12,
            position: 0,
          },
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
      categoryId: chambres.id,
      brandId: secretJardin.id,
      images: {
        create: [{ url: "https://placehold.co/800x800", position: 0 }],
      },
      variants: {
        create: [
          {
            sku: "TENTE-60",
            label: "60x60x140cm",
            priceCents: 8900,
            stock: 5,
            position: 0,
          },
          {
            sku: "TENTE-80",
            label: "80x80x160cm",
            priceCents: 11900,
            stock: 3,
            position: 1,
          },
        ],
      },
    },
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
