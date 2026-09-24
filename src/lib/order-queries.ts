import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const orderWithItems = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: { name: true, slug: true, _count: { select: { variants: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItems;
}>;

// Every query is scoped to the customer: someone else's order simply isn't there.
export function getUserOrder(userId: string, orderNumber: string) {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    include: orderWithItems,
  });
}

export function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { quantity: true } } },
  });
}

export type OrderListItem = Awaited<ReturnType<typeof getUserOrders>>[number];
