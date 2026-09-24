import type { OrderStatus } from "@/generated/prisma/client";
import { ORDER_STATUS } from "@/lib/order-status";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const { label, className } = ORDER_STATUS[status];
  return (
    <span
      className={`inline-block rounded-pill px-2.5 py-[5px] text-[11.5px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
