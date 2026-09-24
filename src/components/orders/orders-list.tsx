import Link from "next/link";
import { formatOrderDate, formatPrice } from "@/lib/format";
import type { OrderListItem } from "@/lib/order-queries";
import { OrderStatusPill } from "./order-status-pill";

export function OrdersList({
  title,
  orders,
  seeAllHref,
}: {
  title: string;
  orders: OrderListItem[];
  seeAllHref?: string;
}) {
  return (
    <section className="rounded-[20px] border border-border-soft bg-surface p-[clamp(20px,3vw,28px)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[22px] font-medium text-ink">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="border-b border-ink pb-0.5 text-[13px] font-semibold text-ink"
          >
            Tout voir
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="mt-4 text-[14.5px] text-text-tertiary">
          Vous n&apos;avez pas encore passé de commande.{" "}
          <Link
            href="/categorie/culture-indoor"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Parcourir la boutique
          </Link>
        </p>
      ) : (
        <ul className="mt-3.5 list-none p-0">
          {orders.map((order) => {
            const count = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <li key={order.id} className="border-t border-ivory-alt first:border-t-0">
                <Link
                  href={`/compte/commandes/${order.orderNumber}`}
                  className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] items-center gap-x-4 gap-y-2 py-4 text-sm"
                >
                  <span className="font-bold text-ink">N° {order.orderNumber}</span>
                  <span className="text-text-tertiary">
                    {formatOrderDate(order.createdAt)}
                  </span>
                  <span className="text-text-tertiary">
                    {count} article{count > 1 ? "s" : ""}
                  </span>
                  <span>
                    <OrderStatusPill status={order.status} />
                  </span>
                  <span className="text-right font-bold text-ink">
                    {formatPrice(order.totalCents)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
