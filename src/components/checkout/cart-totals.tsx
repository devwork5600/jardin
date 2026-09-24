import { formatPrice } from "@/lib/format";
import type { PricedCartResponse } from "@/lib/cart-pricing";

type Props = {
  cart: PricedCartResponse | undefined;
  // undefined = not known yet: the guest hint must not flash for a signed-in
  // customer while the first pricing response is still on its way.
  signedIn: boolean | undefined;
};

// Sub-total / loyalty / pickup / total, for the dark summary cards on both
// /panier and /paiement so the two can never disagree on how they read.
export function CartTotals({ cart, signedIn }: Props) {
  const discount =
    cart?.loyalty && cart.loyalty.discountCents > 0 ? cart.loyalty : null;

  return (
    <>
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
        {signedIn === false && (
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
    </>
  );
}
