"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { PricedLine } from "@/lib/cart-pricing";

const STEP_BUTTON =
  "flex size-8 cursor-pointer items-center justify-center rounded-[8px] border border-border-strong text-base leading-none text-ink disabled:cursor-default disabled:opacity-30";

export function CartLine({ line }: { line: PricedLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const unavailable = line.problem === "UNAVAILABLE";
  const href = line.productSlug ? `/produit/${line.productSlug}` : null;

  const thumb = (
    <span className="relative block size-20 overflow-hidden rounded-[14px] bg-ivory-alt">
      {line.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={line.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );

  return (
    <li className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      {href ? (
        <Link href={href} aria-label={line.name}>
          {thumb}
        </Link>
      ) : (
        thumb
      )}

      <div className="min-w-0">
        {href ? (
          <Link
            href={href}
            className="font-serif text-[17px] leading-[1.3] text-ink"
          >
            {line.name}
          </Link>
        ) : (
          <span className="font-serif text-[17px] leading-[1.3] text-ink">
            {line.name}
          </span>
        )}
        {line.variantLabel && (
          <div className="mt-0.5 text-[13px] text-text-tertiary">
            {line.variantLabel}
          </div>
        )}
        {!unavailable && (
          <div className="mt-1 flex items-baseline gap-2 text-[13px] text-text-secondary">
            {formatPrice(line.unitPriceCents)}
            {line.compareAtCents && (
              <span className="text-text-faint line-through">
                {formatPrice(line.compareAtCents)}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {!unavailable && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={STEP_BUTTON}
                aria-label={`Diminuer la quantité de ${line.name}`}
                disabled={line.quantity <= 1}
                onClick={() => setQuantity(line.variantId, line.quantity - 1)}
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm font-bold text-ink">
                {line.quantity}
              </span>
              <button
                type="button"
                className={STEP_BUTTON}
                aria-label={`Augmenter la quantité de ${line.name}`}
                disabled={line.quantity >= line.stock}
                onClick={() => setQuantity(line.variantId, line.quantity + 1)}
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            className="cursor-pointer text-[13px] text-text-secondary underline underline-offset-2"
            onClick={() => removeItem(line.variantId)}
          >
            Retirer
          </button>
        </div>

        {line.problem === "UNAVAILABLE" && (
          <p className="mt-2 text-[13px] text-copper">
            Cet article n&apos;est plus disponible.
          </p>
        )}
        {line.problem === "INSUFFICIENT_STOCK" && (
          <p className="mt-2 text-[13px] text-copper">
            Stock disponible : {line.stock}.{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold underline underline-offset-2"
              onClick={() =>
                line.stock > 0
                  ? setQuantity(line.variantId, line.stock)
                  : removeItem(line.variantId)
              }
            >
              {line.stock > 0 ? `Ajuster à ${line.stock}` : "Retirer l'article"}
            </button>
          </p>
        )}
      </div>

      <span className="text-base font-bold text-ink">
        {unavailable ? "—" : formatPrice(line.lineTotalCents)}
      </span>
    </li>
  );
}
