"use client";

import Link from "next/link";
import { useCartHydrated, useCartStore } from "@/lib/cart";
import { CartLine } from "./cart-line";
import { CartTotals } from "./cart-totals";
import { EmptyCart } from "./empty-cart";
import { usePricedCart } from "./use-priced-cart";

const CTA =
  "mt-[22px] flex h-[54px] w-full items-center justify-center rounded-[12px] bg-copper text-[12.5px] font-bold tracking-[0.12em] text-white uppercase shadow-[0_10px_24px_rgba(0,0,0,0.25)]";

function SkeletonLine() {
  return (
    <li
      className="grid animate-pulse grid-cols-[80px_minmax(0,1fr)_auto] gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0"
      aria-hidden
    >
      <div className="size-20 rounded-[14px] bg-ivory-alt" />
      <div className="flex flex-col gap-2">
        <div className="h-[22px] w-4/5 rounded bg-ivory-alt" />
        <div className="h-4 w-1/4 rounded bg-ivory-alt" />
        <div className="mt-2 h-8 w-32 rounded bg-ivory-alt" />
      </div>
      <div className="h-6 w-16 rounded bg-ivory-alt" />
    </li>
  );
}

export function CartView() {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const pricing = usePricedCart();
  const cart = pricing.data;

  // Until the persisted cart is read the store is merely empty: a skeleton,
  // not "panier vide".
  if (!hydrated) {
    return (
      <div className="mt-10 flex flex-wrap items-start gap-8" aria-hidden>
        <div className="h-[360px] min-w-0 flex-[1_1_560px] animate-pulse rounded-[20px] bg-ivory-alt" />
        <div className="h-[380px] min-w-0 flex-[1_1_340px] animate-pulse rounded-[20px] bg-ivory-alt" />
      </div>
    );
  }
  if (items.length === 0) return <EmptyCart />;

  const blocked = cart !== undefined && !cart.canOrder;

  return (
    <div className="mt-10 flex flex-wrap items-start gap-8">
      <div className="min-w-0 flex-[1_1_560px]">
        <ul className="m-0 flex list-none flex-col rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
          {cart
            ? cart.lines.map((line) => (
                <CartLine key={line.variantId} line={line} />
              ))
            : items.map((item) => <SkeletonLine key={item.variantId} />)}
        </ul>
        <Link
          href="/categorie/culture-indoor"
          className="mt-5 inline-block text-sm font-semibold text-ink"
        >
          ← Continuer mes achats
        </Link>
      </div>

      <aside className="min-w-0 flex-[1_1_340px] rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory min-[900px]:sticky min-[900px]:top-24">
        <h2 className="font-serif text-[22px] font-medium">Récapitulatif</h2>

        {pricing.isError && (
          <p className="mt-4 text-[13px] text-[#f2b88e]">
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

        <CartTotals cart={cart} signedIn={cart?.signedIn} />

        {cart?.signedIn === false ? (
          <Link href="/connexion?next=/paiement" className={CTA}>
            Se connecter pour commander
          </Link>
        ) : cart?.canOrder ? (
          <Link href="/paiement" className={CTA}>
            Passer commande
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`${CTA} cursor-default opacity-50`}
          >
            Passer commande
          </button>
        )}

        <p className="mt-3 min-h-5 text-[13px] leading-[1.4] text-[#f2b88e]">
          {blocked && "Corrigez les articles signalés pour continuer."}
        </p>

        <p className="mt-2 text-[11.5px] leading-[1.6] text-on-dark-muted">
          Retrait gratuit en boutique à Vannes, sans frais de port. Remise
          fidélité non cumulable avec les promotions en cours.
        </p>
      </aside>
    </div>
  );
}
