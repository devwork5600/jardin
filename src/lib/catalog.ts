import type { ProductBadge } from "@/generated/prisma/client";
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
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { orderBy: { priceCents: "asc" } },
    },
  });

  return products
    .filter((product) => product.variants.length > 0)
    .map((product) => {
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
    });
}
