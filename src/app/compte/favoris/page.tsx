import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/category/product-card";
import { SeedFavorites } from "@/components/favorites/seed-favorites";
import { getFavoriteProducts, toCardData } from "@/lib/catalog";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mes favoris — Jardin Indoor" };

export default async function FavorisPage() {
  const { user } = await requireSession("/compte/favoris");
  const favorites = (await getFavoriteProducts(user.id)).map(toCardData);

  if (favorites.length === 0) {
    return (
      <div className="rounded-[20px] bg-ivory-alt p-[clamp(28px,4vw,48px)] text-center">
        <h2 className="font-serif text-[26px] font-normal text-ink">
          Aucun favori <em>pour l&apos;instant</em>
        </h2>
        <p className="mt-2.5 text-sm text-text-tertiary">
          Ajoutez des produits depuis la boutique pour les retrouver ici.
        </p>
        <Link
          href="/categorie/culture-indoor"
          className="mt-5 inline-block rounded-[10px] bg-copper px-[22px] py-3.5 text-xs font-bold tracking-[0.12em] text-white uppercase"
        >
          Parcourir la boutique
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-[20px] border border-border-soft bg-surface p-[clamp(20px,3vw,28px)]">
      <SeedFavorites productIds={favorites.map((product) => product.id)} />
      <h2 className="font-serif text-[22px] font-medium text-ink">
        Mes favoris{" "}
        <span className="text-base font-normal text-text-muted">
          ({favorites.length})
        </span>
      </h2>
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-x-[22px] gap-y-8">
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} favorited />
        ))}
      </div>
    </section>
  );
}
