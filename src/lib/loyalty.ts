import { prisma } from "@/lib/prisma";

// Where a customer stands in the loyalty programme: their tier is the highest
// one their past spending reaches, and progress runs towards the next one.
export async function getLoyaltyStatus(totalSpentCents: number) {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: { minSpentCents: "asc" },
  });
  const current =
    [...tiers].reverse().find((tier) => tier.minSpentCents <= totalSpentCents) ??
    null;
  const next = tiers.find((tier) => tier.minSpentCents > totalSpentCents) ?? null;

  const from = current?.minSpentCents ?? 0;
  const progress = next
    ? (totalSpentCents - from) / (next.minSpentCents - from)
    : 1;

  return {
    current,
    next,
    progressPct: Math.min(100, Math.max(0, Math.round(progress * 100))),
    remainingCents: next ? next.minSpentCents - totalSpentCents : 0,
  };
}
