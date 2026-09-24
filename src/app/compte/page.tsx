import type { Metadata } from "next";
import Link from "next/link";
import { ShopStatus } from "@/components/home/shop-status";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { OrdersList } from "@/components/orders/orders-list";
import { formatPickupDay, formatPrice } from "@/lib/format";
import { getLoyaltyStatus } from "@/lib/loyalty";
import { getUserOrders } from "@/lib/order-queries";
import { ORDER_STATUS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte — Jardin Indoor" };

const LABEL = "text-[10.5px] font-bold tracking-[0.2em] text-text-muted uppercase";
const CARD = "rounded-[20px] border border-border-soft bg-surface p-6";

export default async function CompteDashboardPage() {
  const { user } = await requireSession("/compte");

  const [account, orders] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { totalSpentCents: true },
    }),
    getUserOrders(user.id),
  ]);
  const spent = account.totalSpentCents ?? 0;
  const loyalty = await getLoyaltyStatus(spent);
  const active = orders.find((order) => ORDER_STATUS[order.status].active);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[22px]">
        {loyalty.current && (
          <section className="col-span-full grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] items-end gap-7 rounded-block bg-green-deep p-[clamp(24px,4vw,40px)] text-ivory">
            <div>
              <span className="text-[10.5px] font-bold tracking-[0.2em] text-lime uppercase">
                Carte fidélité · Palier {loyalty.current.name}
              </span>
              <div className="mt-3.5 font-serif text-[clamp(44px,6vw,64px)] leading-none">
                {loyalty.current.discountPct} %
              </div>
              <p className="mt-2 text-sm text-on-dark-secondary">
                de remise appliquée automatiquement sur vos commandes e-drive.
              </p>
            </div>
            <div>
              <div className="flex justify-between gap-3 text-[12.5px] text-on-dark-secondary">
                <span>{formatPrice(spent)} dépensés</span>
                {loyalty.next && (
                  <span>
                    Palier {loyalty.next.name} à{" "}
                    {formatPrice(loyalty.next.minSpentCents)}
                  </span>
                )}
              </div>
              <div
                role="progressbar"
                aria-valuenow={loyalty.progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression vers le palier suivant"
                className="mt-2.5 h-2 overflow-hidden rounded-pill bg-ivory/12"
              >
                <div
                  className="h-full rounded-pill bg-lime"
                  style={{ width: `${loyalty.progressPct}%` }}
                />
              </div>
              <p className="mt-2.5 text-[12.5px] text-on-dark-secondary">
                {loyalty.next
                  ? `Plus que ${formatPrice(loyalty.remainingCents)} pour passer à ${loyalty.next.discountPct} % de remise.`
                  : "Vous avez atteint le palier le plus élevé."}
              </p>
            </div>
          </section>
        )}

        <section className={CARD}>
          <span className={LABEL}>Commande en cours</span>
          {active ? (
            <>
              <div className="mt-3 font-serif text-[22px] text-ink">
                N° {active.orderNumber}
              </div>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-text-tertiary">
                {active.status === "PRETE_AU_RETRAIT"
                  ? `À retirer en boutique jusqu’au ${formatPickupDay(active.pickupDate).toLowerCase()}, ${active.pickupSlot.split("–")[1]?.trim() ?? ""}.`
                  : `Retrait prévu le ${formatPickupDay(active.pickupDate).toLowerCase()}, ${active.pickupSlot}.`}
              </p>
              <div className="mt-3.5">
                <OrderStatusPill status={active.status} />
              </div>
              <Link
                href={`/compte/commandes/${active.orderNumber}`}
                className="mt-3.5 inline-block text-[13px] font-bold text-copper"
              >
                Voir la commande →
              </Link>
            </>
          ) : (
            <>
              <div className="mt-3 font-serif text-[22px] text-ink">
                Aucune commande en cours
              </div>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-text-tertiary">
                Vos prochaines commandes à retirer apparaîtront ici.
              </p>
              <Link
                href="/categorie/culture-indoor"
                className="mt-3.5 inline-block text-[13px] font-bold text-copper"
              >
                Parcourir la boutique →
              </Link>
            </>
          )}
        </section>

        <section className={CARD}>
          <span className={LABEL}>Retrait</span>
          <div className="mt-3 font-serif text-[22px] text-ink">
            Jardin Indoor Vannes
          </div>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-text-tertiary">
            36 av. Gontran Bienvenu
          </p>
          <ShopStatus />
          <div>
            <a
              href="tel:0297499509"
              className="mt-3.5 inline-block text-[13px] font-bold text-copper"
            >
              02 97 49 95 09 →
            </a>
          </div>
        </section>
      </div>

      <OrdersList
        title="Dernières commandes"
        orders={orders.slice(0, 3)}
        seeAllHref={orders.length > 3 ? "/compte/commandes" : undefined}
      />
    </>
  );
}
