import Link from "next/link";

export function EmptyCart() {
  return (
    <div className="mt-10 rounded-[20px] border border-border-soft bg-surface p-[clamp(28px,5vw,56px)] text-center">
      <h2 className="font-serif text-[28px] font-normal text-ink">
        Votre panier est vide
      </h2>
      <p className="mx-auto mt-3 max-w-[44ch] text-[15px] leading-[1.7] text-text-secondary">
        Ajoutez des produits pour préparer votre commande, à retirer en
        boutique à Vannes.
      </p>
      <Link
        href="/categorie/culture-indoor"
        className="mt-7 inline-block rounded-[10px] bg-ink px-6 py-[15px] text-sm font-semibold text-ivory"
      >
        Découvrir la boutique
      </Link>
    </div>
  );
}
