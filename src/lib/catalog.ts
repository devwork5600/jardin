import type { Prisma, ProductBadge } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CardBadge = "PROMO" | ProductBadge;

export type CategoryProduct = {
  id: string;
  slug: string;
  name: string;
  brand: { name: string; slug: string } | null;
  categorySlug: string;
  badge: CardBadge | null;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  imageUrl: string | null;
  createdAt: Date;
};

// What a card needs on the wire (JSON-safe: no Date).
export type ProductCardData = Omit<CategoryProduct, "createdAt">;

export function toCardData(product: CategoryProduct): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categorySlug: product.categorySlug,
    badge: product.badge,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    inStock: product.inStock,
    imageUrl: product.imageUrl,
  };
}

const cardInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { orderBy: { priceCents: "asc" as const } },
} satisfies Prisma.ProductInclude;

type CardProductRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

// A card shows the cheapest variant's price; "Promo" is derived from its
// compareAtCents, otherwise the product's own badge applies.
function toCategoryProduct(product: CardProductRow): CategoryProduct {
  const cheapest = product.variants[0];
  const onSale =
    cheapest.compareAtCents !== null &&
    cheapest.compareAtCents > cheapest.priceCents;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categorySlug: product.category.slug,
    badge: onSale ? "PROMO" : product.badge,
    priceCents: cheapest.priceCents,
    compareAtCents: onSale ? cheapest.compareAtCents : null,
    inStock: product.variants.some((variant) => variant.stock > 0),
    imageUrl: product.images[0]?.url ?? null,
    createdAt: product.createdAt,
  };
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
      children: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

// Loads every published product of a category and its subcategories.
// Filtering/sorting/pagination happen in memory afterwards: the price shown
// on a card is the cheapest variant's, which Prisma can't order or filter on
// directly, and a single category holds at most a few hundred products.
export async function getCategoryProducts(category: {
  id: string;
  children: { id: string }[];
}): Promise<CategoryProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: { in: [category.id, ...category.children.map((c) => c.id)] },
    },
    include: cardInclude,
  });

  return products
    .filter((product) => product.variants.length > 0)
    .map(toCategoryProduct);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: { select: { name: true, slug: true } },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      images: { orderBy: { position: "asc" } },
      characteristics: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  });

  if (!product || product.status !== "PUBLISHED" || product.variants.length === 0) {
    return null;
  }
  return product;
}

// "Souvent associés": complementary products, so other subcategories of the
// same family come first, then products from the same subcategory.
export async function getRelatedProducts(product: {
  id: string;
  category: { id: string; parent: { id: string } | null };
}): Promise<CategoryProduct[]> {
  const familyId = product.category.parent?.id ?? product.category.id;

  const candidates = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: product.id },
      category: { OR: [{ id: familyId }, { parentId: familyId }] },
    },
    include: cardInclude,
  });

  return candidates
    .filter((candidate) => candidate.variants.length > 0)
    .sort(
      (a, b) =>
        Number(a.categoryId === product.category.id) -
          Number(b.categoryId === product.category.id) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, 4)
    .map(toCategoryProduct);
}
