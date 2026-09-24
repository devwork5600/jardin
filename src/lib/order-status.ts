import type { OrderStatus } from "@/generated/prisma/client";

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; className: string; active: boolean }
> = {
  EN_PREPARATION: {
    label: "En préparation",
    className: "bg-[#f3e6dc] text-copper",
    active: true,
  },
  PRETE_AU_RETRAIT: {
    label: "Prête au retrait",
    className: "bg-status-open-bg text-status-open-text",
    active: true,
  },
  RETIREE: {
    label: "Retirée",
    className: "bg-ivory-alt text-text-tertiary",
    active: false,
  },
  ANNULEE: {
    label: "Annulée",
    className: "bg-ivory-alt text-text-muted",
    active: false,
  },
};
