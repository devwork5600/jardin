import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderInfo } from "@/components/orders/order-info";
import { OrderRecap } from "@/components/orders/order-recap";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { formatOrderDate } from "@/lib/format";
import { getUserOrder } from "@/lib/order-queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Ma commande — Jardin Indoor" };

export default async function OrderDetailPage(
  props: PageProps<"/compte/commandes/[orderNumber]">,
) {
  const { orderNumber } = await props.params;
  const { user } = await requireSession(`/compte/commandes/${orderNumber}`);

  const order = await getUserOrder(user.id, orderNumber);
  if (!order) notFound();

  return (
    <>
      <Link
        href="/compte/commandes"
        className="text-[13px] font-semibold text-ink"
      >
        ← Toutes mes commandes
      </Link>

      <section className="rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow">Commande n° {order.orderNumber}</span>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="mt-3 text-[13.5px] text-text-tertiary">
          Passée le {formatOrderDate(order.createdAt)}
        </p>
        <OrderInfo order={order} />
      </section>

      <OrderRecap order={order} />
    </>
  );
}
