"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { PricedLine } from "@/lib/cart-pricing";
import type { CheckoutFormValues } from "@/lib/validators/checkout-schema";
import { CartTotals } from "./cart-totals";
import type { usePricedCart } from "./use-priced-cart";

type Props = {
  pricing: ReturnType<typeof usePricedCart>;
  signedIn: boolean;
  method: CheckoutFormValues["paymentMethod"];
  submitting: boolean;
  error?: string;
};

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

// Read-only: quantities are edited on /panier, this is the last look before
// ordering. A line with a problem says so and points back to the cart.
function RecapLine({ line }: { line: PricedLine }) {
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
        {!unavailable && (
          <div className="mt-1 text-xs text-on-dark-secondary">
            Qté {line.quantity}
          </div>
        )}
        {line.problem && (
          <p className={`mt-1.5 text-xs ${WARNING}`}>
            {unavailable
              ? "Cet article n'est plus disponible."
              : `Stock disponible : ${line.stock}.`}{" "}
            <Link
              href="/panier"
              className="font-semibold underline underline-offset-2"
            >
              Modifier le panier
            </Link>
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
  const cardSelected = method === "CARD";
  const disabled = !cart?.canOrder || submitting || cardSelected;

  return (
    <aside className="min-w-0 flex-[1_1_340px] rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory min-[900px]:sticky min-[900px]:top-24">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[22px] font-medium">Récapitulatif</h2>
        <Link
          href="/panier"
          className="text-[13px] text-on-dark-secondary underline underline-offset-2"
        >
          Modifier le panier
        </Link>
      </div>

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

      <CartTotals cart={cart} signedIn={signedIn} />

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
