import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { orderWithItems } from "@/lib/order-queries";
import { prisma } from "@/lib/prisma";

// The tabs of the order list. "À traiter" is what the shop works from every day.
export const ADMIN_FILTERS = {
  a_traiter: { label: "À traiter", statuses: ["EN_PREPARATION", "PRETE_AU_RETRAIT"] },
  attente: { label: "En attente de paiement", statuses: ["EN_ATTENTE_PAIEMENT"] },
  retirees: { label: "Retirées", statuses: ["RETIREE"] },
  annulees: { label: "Annulées", statuses: ["ANNULEE"] },
  toutes: { label: "Toutes", statuses: null },
} as const satisfies Record<string, { label: string; statuses: readonly OrderStatus[] | null }>;

export type AdminFilter = keyof typeof ADMIN_FILTERS;

export const parseAdminFilter = (value: string | string[] | undefined): AdminFilter =>
  typeof value === "string" && value in ADMIN_FILTERS ? (value as AdminFilter) : "a_traiter";

export async function getAdminOrderList(filter: AdminFilter) {
  const statuses = ADMIN_FILTERS[filter].statuses;
  const where: Prisma.OrderWhereInput = statuses ? { status: { in: [...statuses] } } : {};
  // Work list: soonest pickup first. History tabs: newest first.
  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    filter === "a_traiter" ? [{ pickupDate: "asc" }, { createdAt: "asc" }] : [{ createdAt: "desc" }];

  const [orders, grouped] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      take: 200,
      include: { items: { select: { quantity: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(
    (Object.keys(ADMIN_FILTERS) as AdminFilter[]).map((key) => {
      const wanted = ADMIN_FILTERS[key].statuses;
      const n = grouped
        .filter((g) => !wanted || (wanted as readonly OrderStatus[]).includes(g.status))
        .reduce((sum, g) => sum + g._count, 0);
      return [key, n];
    }),
  ) as Record<AdminFilter, number>;

  return { orders, counts };
}

export function getAdminOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      ...orderWithItems,
      user: { select: { name: true, email: true, totalSpentCents: true } },
    },
  });
}
