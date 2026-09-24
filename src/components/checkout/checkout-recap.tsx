"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { PricedLine } from "@/lib/cart-pricing";
import type { CheckoutFormValues } from "@/lib/validators/checkout-schema";
import type { usePricedCart } from "./use-priced-cart";

type Props = {
  pricing: ReturnType<typeof usePricedCart>;
  signedIn: boolean;
  method: CheckoutFormValues["paymentMethod"];
  submitting: boolean;
  error?: string;
};

const STEP_BUTTON =
  "flex size-6 cursor-pointer items-center justify-center rounded-md border border-ivory/25 text-sm leading-none text-ivory disabled:cursor-default disabled:opacity-30";
const WARNING = "text-[#f2b88e]";

function SkeletonLine() {
  return (
    <li
      className="grid animate-pulse grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5"
      aria-hidden
    >
      <div className="size-14 rounded-[12px] bg-ivory/10" />
      <div className="flex flex-col gap-2">
        <div className="h-[19px] w-4/5 rounded bg-ivory/10" />
        <div className="h-6 w-1/3 rounded bg-ivory/10" />
      </div>
      <div className="h-5 w-14 rounded bg-ivory/10" />
    </li>
  );
}

function RecapLine({ line }: { line: PricedLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const unavailable = line.problem === "UNAVAILABLE";

  return (
    <li className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3.5">
      <div className="relative size-14 overflow-hidden rounded-[12px] bg-[#2a4234]">
        {line.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={line.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="font-serif text-[14.5px] leading-[1.3]">
          {line.name}
          {line.variantLabel && (
            <span className="text-on-dark-secondary"> — {line.variantLabel}</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2.5 text-xs text-on-dark-secondary">
          {!unavailable && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className={STEP_BUTTON}
                aria-label={`Diminuer la quantité de ${line.name}`}
                disabled={line.quantity <= 1}
                onClick={() => setQuantity(line.variantId, line.quantity - 1)}
              >
                −
              </button>
              <span className="min-w-4 text-center font-semibold text-ivory">
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
            className="cursor-pointer underline underline-offset-2"
            onClick={() => removeItem(line.variantId)}
          >
            Retirer
          </button>
        </div>

        {line.problem === "UNAVAILABLE" && (
          <p className={`mt-1.5 text-xs ${WARNING}`}>
            Cet article n&apos;est plus disponible.
          </p>
        )}
        {line.problem === "INSUFFICIENT_STOCK" && (
          <p className={`mt-1.5 text-xs ${WARNING}`}>
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

      <span className="text-sm font-semibold">
        {unavailable ? "—" : formatPrice(line.lineTotalCents)}
      </span>
    </li>
  );
}

export function CheckoutRecap({
  pricing,
  signedIn,
  method,
  submitting,
  error,
}: Props) {
  const cart = pricing.data;
  const discount = cart?.loyalty && cart.loyalty.discountCents > 0 ? cart.loyalty : null;
  const cardSelected = method === "CARD";
  const disabled = !cart?.canOrder || submitting || cardSelected;

  return (
    <aside className="min-w-0 flex-[1_1_340px] rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory min-[900px]:sticky min-[900px]:top-24">
      <h2 className="font-serif text-[22px] font-medium">Récapitulatif</h2>

      <ul className="mt-5 flex flex-col gap-4">
        {cart
          ? cart.lines.map((line) => <RecapLine key={line.variantId} line={line} />)
          : Array.from({ length: 3 }, (_, i) => <SkeletonLine key={i} />)}
      </ul>

      {pricing.isError && (
        <p className={`mt-4 text-[13px] ${WARNING}`}>
          Impossible de calculer votre panier.{" "}
          <button
            type="button"
            className="cursor-pointer font-semibold underline underline-offset-2"
            onClick={() => void pricing.refetch()}
          >
            Réessayer
          </button>
        </p>
      )}

      <div className="mt-[22px] flex flex-col gap-2.5 border-t border-ivory/15 pt-[18px] text-sm">
        <div className="flex justify-between text-on-dark-secondary">
          <span>Sous-total</span>
          <span>{cart ? formatPrice(cart.subtotalCents) : "—"}</span>
        </div>
        {discount && (
          <div className="flex justify-between text-lime">
            <span>Remise fidélité ({discount.discountPct} %)</span>
            <span>− {formatPrice(discount.discountCents)}</span>
          </div>
        )}
        {!signedIn && (
          <div className="text-[12.5px] text-lime">
            Connectez-vous pour profiter de vos prix e-drive et de la remise
            fidélité.
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
          {cart ? formatPrice(cart.totalCents) : "—"}
        </span>
      </div>

      {signedIn ? (
        <button
          type="submit"
          disabled={disabled}
          aria-busy={submitting}
          className="mt-[22px] h-[54px] w-full cursor-pointer rounded-[12px] bg-copper text-[12.5px] font-bold tracking-[0.12em] text-white uppercase shadow-[0_10px_24px_rgba(0,0,0,0.25)] disabled:cursor-default disabled:opacity-50"
        >
          {cardSelected && cart
            ? `Payer ${formatPrice(cart.totalCents)}`
            : "Valider la commande"}
        </button>
      ) : (
        <Link
          href="/connexion?next=/paiement"
          className="mt-[22px] flex h-[54px] w-full items-center justify-center rounded-[12px] bg-copper text-[12.5px] font-bold tracking-[0.12em] text-white uppercase shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
        >
          Se connecter pour commander
        </Link>
      )}

      <p role="alert" className={`mt-3 min-h-9 text-[13px] leading-[1.4] ${WARNING}`}>
        {error}
      </p>

      <p className="mt-2 text-[11.5px] leading-[1.6] text-on-dark-muted">
        Remise fidélité non cumulable avec les promotions en cours. En
        validant, vous acceptez les CGV et certifiez être majeur.
      </p>
    </aside>
  );
}
