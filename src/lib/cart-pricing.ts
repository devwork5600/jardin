import { prisma } from "@/lib/prisma";
import {
  MAX_LINE_QUANTITY,
  type CartItem,
} from "@/lib/validators/cart-schema";

export type LineProblem = "UNAVAILABLE" | "INSUFFICIENT_STOCK";

export type PricedLine = {
  variantId: string;
  productSlug: string | null;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  compareAtCents: number | null;
  quantity: number;
  stock: number;
  lineTotalCents: number;
  problem: LineProblem | null;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotalCents: number;
  loyalty: {
    tierName: string;
    discountPct: number;
    discountCents: number;
  } | null;
  totalCents: number;
  canOrder: boolean;
};

export type PricedCartResponse = PricedCart & { signedIn: boolean };

// The single source of truth for what a cart costs. The client only sends
// {variantId, quantity}; names, prices, stock and the loyalty discount are all
// read here, both to display the cart and again when the order is created.
export async function priceCart(
  items: CartItem[],
  userId: string | null,
): Promise<PricedCart> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(
      item.variantId,
      Math.min((quantities.get(item.variantId) ?? 0) + item.quantity, MAX_LINE_QUANTITY),
    );
  }

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      product: { status: "PUBLISHED" },
    },
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          images: { orderBy: { position: "asc" }, take: 1 },
          _count: { select: { variants: true } },
        },
      },
    },
  });
  const byId = new Map(variants.map((variant) => [variant.id, variant]));

  const lines: PricedLine[] = [...quantities].map(([variantId, quantity]) => {
    const variant = byId.get(variantId);
    if (!variant) {
      return {
        variantId,
        productSlug: null,
        name: "Article indisponible",
        variantLabel: null,
        imageUrl: null,
        unitPriceCents: 0,
        compareAtCents: null,
        quantity,
        stock: 0,
        lineTotalCents: 0,
        problem: "UNAVAILABLE",
      };
    }

    const onSale =
      variant.compareAtCents !== null &&
      variant.compareAtCents > variant.priceCents;

    return {
      variantId,
      productSlug: variant.product.slug,
      name: variant.product.name,
      variantLabel: variant.product._count.variants > 1 ? variant.label : null,
      imageUrl: variant.product.images[0]?.url ?? null,
      unitPriceCents: variant.priceCents,
      compareAtCents: onSale ? variant.compareAtCents : null,
      quantity,
      stock: variant.stock,
      lineTotalCents: variant.priceCents * quantity,
      problem: variant.stock < quantity ? "INSUFFICIENT_STOCK" : null,
    };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  // Loyalty: the customer's tier is the highest one whose threshold their past
  // spending reaches. Not cumulable with promotions, so lines already on sale
  // don't count towards the discountable base. Guests get no loyalty discount.
  let loyalty: PricedCart["loyalty"] = null;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalSpentCents: true },
    });
    const tier = await prisma.loyaltyTier.findFirst({
      where: { minSpentCents: { lte: user?.totalSpentCents ?? 0 } },
      orderBy: { minSpentCents: "desc" },
    });
    if (tier) {
      const discountableCents = lines
        .filter((line) => line.problem !== "UNAVAILABLE" && line.compareAtCents === null)
        .reduce((sum, line) => sum + line.lineTotalCents, 0);
      loyalty = {
        tierName: tier.name,
        discountPct: tier.discountPct,
        discountCents: Math.round((discountableCents * tier.discountPct) / 100),
      };
    }
  }

  return {
    lines,
    subtotalCents,
    loyalty,
    totalCents: subtotalCents - (loyalty?.discountCents ?? 0),
    canOrder: lines.length > 0 && lines.every((line) => line.problem === null),
  };
}
