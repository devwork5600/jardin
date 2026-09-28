import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/order-actions";
import { PaymentBadge } from "@/components/admin/payment-badge";
import { OrderInfo } from "@/components/orders/order-info";
import { OrderRecap } from "@/components/orders/order-recap";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { requireAdmin } from "@/lib/admin";
import { getAdminOrder } from "@/lib/admin-queries";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { allowedTransitions } from "@/lib/order-admin";

const CARD = "rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]";

export default async function AdminOrderPage(props: PageProps<"/admin/commandes/[orderNumber]">) {
  const { orderNumber } = await props.params;
  await requireAdmin(`/admin/commandes/${orderNumber}`);

  const order = await getAdminOrder(orderNumber);
  if (!order) notFound();

  const paidByCard = order.paymentMethod === "CARD" && order.paidAt !== null;
  const refundOwed = order.status === "ANNULEE" && paidByCard && order.refundedAt === null;
  const allowed = allowedTransitions(order.status).filter(
    (t): t is "PRETE_AU_RETRAIT" | "RETIREE" | "ANNULEE" => t !== "EN_ATTENTE_PAIEMENT" && t !== "EN_PREPARATION",
  );

  return (
    <>
      <Link href="/admin/commandes" className="mt-8 inline-block text-[13px] font-semibold text-text-tertiary underline-offset-4 hover:underline">
        ← Toutes les commandes
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        <h1 className="font-serif text-[clamp(30px,4vw,44px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
          {order.orderNumber}
        </h1>
        <OrderStatusPill status={order.status} />
        <PaymentBadge {...order} />
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[22px]">
          <div className={CARD}>
            <h2 className="font-serif text-[22px] font-medium text-ink">Actions</h2>
            <div className="mt-4">
              <OrderActions
                orderId={order.id}
                allowed={allowed}
                refundAmount={paidByCard && order.status !== "ANNULEE" ? formatPrice(order.totalCents) : null}
                refundOwed={refundOwed}
              />
            </div>
          </div>

          <div className={CARD}>
            <h2 className="font-serif text-[22px] font-medium text-ink">Commande</h2>
            <OrderInfo order={order} />
          </div>

          <div className={CARD}>
            <h2 className="font-serif text-[22px] font-medium text-ink">Compte client</h2>
            <dl className="mt-4 flex flex-col gap-3 text-[14.5px]">
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">Compte</dt>
                <dd className="mt-1 text-ink">{order.user.name} · {order.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">Dépenses créditées à la fidélité</dt>
                <dd className="mt-1 text-ink">{formatPrice(order.user.totalSpentCents ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">Historique</dt>
                <dd className="mt-1 text-ink">
                  Créée le {formatOrderDate(order.createdAt)}
                  {order.paidAt && <> · payée le {formatOrderDate(order.paidAt)}</>}
                  {order.refundedAt && <> · remboursée le {formatOrderDate(order.refundedAt)}</>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <OrderRecap order={order} className="min-w-0 flex-[1_1_340px]" />
      </div>
    </>
  );
}
