import Link from "next/link";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { PaymentBadge } from "@/components/admin/payment-badge";
import { ADMIN_FILTERS, getAdminOrderList, parseAdminFilter, type AdminFilter } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/admin";
import { formatOrderDate, formatPickupDay, formatPrice } from "@/lib/format";

export default async function AdminOrdersPage(props: PageProps<"/admin/commandes">) {
  await requireAdmin("/admin/commandes");
  const filter = parseAdminFilter((await props.searchParams).statut);
  const { orders, counts } = await getAdminOrderList(filter);

  return (
    <>
      <h1 className="mt-8 font-serif text-[clamp(32px,4vw,48px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
        Commandes
      </h1>

      <nav aria-label="Filtrer par statut" className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(ADMIN_FILTERS) as AdminFilter[]).map((key) => (
          <Link
            key={key}
            href={key === "a_traiter" ? "/admin/commandes" : `/admin/commandes?statut=${key}`}
            aria-current={key === filter ? "page" : undefined}
            className={`rounded-pill border px-4 py-2 text-[13px] font-semibold ${
              key === filter ? "border-ink bg-ink text-ivory" : "border-border text-ink"
            }`}
          >
            {ADMIN_FILTERS[key].label} <span className="opacity-60">{counts[key]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 rounded-[20px] border border-border-soft bg-surface p-[clamp(16px,3vw,24px)]">
        {orders.length === 0 ? (
          <p className="py-6 text-center text-[14.5px] text-text-tertiary">Aucune commande dans cette vue.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {orders.map((order) => {
              const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <li key={order.id} className="border-t border-ivory-alt first:border-t-0">
                  <Link
                    href={`/admin/commandes/${order.orderNumber}`}
                    className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] items-center gap-x-4 gap-y-2 py-4 text-sm"
                  >
                    <span>
                      <span className="block font-bold text-ink">{order.orderNumber}</span>
                      <span className="text-[12.5px] text-text-tertiary">{formatOrderDate(order.createdAt)}</span>
                    </span>
                    <span className="text-ink">
                      {order.contactName}
                      <span className="block text-[12.5px] text-text-tertiary">
                        {count} article{count > 1 ? "s" : ""}
                      </span>
                    </span>
                    <span className="text-text-secondary">
                      Retrait {formatPickupDay(order.pickupDate)}
                    </span>
                    <span><PaymentBadge {...order} /></span>
                    <span><OrderStatusPill status={order.status} /></span>
                    <span className="text-right font-bold text-ink">{formatPrice(order.totalCents)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
