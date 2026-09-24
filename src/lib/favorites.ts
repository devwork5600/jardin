import { prisma } from "@/lib/prisma";

// Idempotent on purpose: the caller says which state it wants, not "toggle".
// Repeating a call (double click, retry, optimistic UI catching up) can't
// flip the result the other way.
export async function setFavorite(
  userId: string,
  productId: string,
  favorited: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!favorited) {
    await prisma.favorite.deleteMany({ where: { userId, productId } });
    return { ok: true };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Produit introuvable." };

  await prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  return { ok: true };
}

export async function getFavoriteIds(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}
