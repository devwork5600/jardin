import { formatPrice } from "@/lib/format";
import type { OrderWithItems } from "@/lib/order-queries";

// Items and totals of an order, from its snapshotted prices (what was
// actually charged, not what the products cost today).
export function OrderRecap({
  order,
  className = "",
}: {
  order: OrderWithItems;
  className?: string;
}) {
  return (
    <aside
      className={`rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory ${className}`}
    >
      <h2 className="font-serif text-[22px] font-medium">Récapitulatif</h2>
      <ul className="mt-5 flex list-none flex-col gap-4 p-0">
        {order.items.map((item) => {
          const product = item.variant.product;
          return (
            <li
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3.5"
            >
              <div className="min-w-0">
                <div className="font-serif text-[14.5px] leading-[1.3]">
                  {product.name}
                  {product._count.variants > 1 && (
                    <span className="text-on-dark-secondary">
                      {" "}
                      — {item.variant.label}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-on-dark-secondary">
                  Qté {item.quantity}
                </div>
              </div>
              <span className="text-sm font-semibold">
                {formatPrice(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-[22px] flex flex-col gap-2.5 border-t border-ivory/15 pt-[18px] text-sm">
        <div className="flex justify-between text-on-dark-secondary">
          <span>Sous-total</span>
          <span>{formatPrice(order.subtotalCents)}</span>
        </div>
        {order.loyaltyDiscountCents > 0 && (
          <div className="flex justify-between text-lime">
            <span>Remise fidélité</span>
            <span>− {formatPrice(order.loyaltyDiscountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-on-dark-secondary">
          <span>Retrait en boutique</span>
          <span>Gratuit</span>
        </div>
      </div>

      <div className="mt-[18px] flex items-baseline justify-between border-t border-ivory/15 pt-[18px]">
        <span className="text-sm">Total TTC</span>
        <span className="font-serif text-[30px]">
          {formatPrice(order.totalCents)}
        </span>
      </div>
    </aside>
  );
}
