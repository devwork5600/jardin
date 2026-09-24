import { formatPickupDay } from "@/lib/format";
import type { OrderWithItems } from "@/lib/order-queries";

export function OrderInfo({ order }: { order: OrderWithItems }) {
  return (
    <dl className="mt-6 flex flex-col gap-4 text-[14.5px]">
      <div>
        <dt className="text-xs font-semibold text-text-tertiary">
          Retrait en boutique
        </dt>
        <dd className="mt-1 text-ink">
          {formatPickupDay(order.pickupDate)}, {order.pickupSlot}
          <br />
          <span className="text-text-secondary">
            36 av. Gontran Bienvenu, 56000 Vannes · 02 97 49 95 09
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-text-tertiary">Paiement</dt>
        <dd className="mt-1 text-ink">
          {order.paymentMethod === "ON_PICKUP"
            ? "Au retrait, par CB ou en espèces"
            : "Carte bancaire en ligne"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-text-tertiary">Coordonnées</dt>
        <dd className="mt-1 text-ink">
          {order.contactName}
          <br />
          {order.contactEmail} · {order.contactPhone}
        </dd>
      </div>
    </dl>
  );
}
