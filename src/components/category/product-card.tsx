import Link from "next/link";
import type { CardBadge, CategoryProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

const BADGES: Record<CardBadge, { label: string; className: string }> = {
  PROMO: { label: "Promo", className: "bg-copper" },
  BEST_SELLER: { label: "Best-seller", className: "bg-brand-green" },
  NEW: { label: "Nouveau", className: "bg-ink" },
  ADVICE: { label: "Conseil", className: "bg-nav-inactive" },
};

export function ProductCard({ product }: { product: CategoryProduct }) {
  const href = `/produit/${product.slug}`;
  const badge = product.badge ? BADGES[product.badge] : null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Link
        href={href}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-alt"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-text-faint">
            Photo à venir
          </span>
        )}
        {badge && (
          <span
            className={`pointer-events-none absolute top-3 left-3 rounded-pill px-2.5 py-[5px] text-[10px] font-bold tracking-[0.12em] text-white uppercase ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1">
        {product.brand && (
          <span className="text-[10.5px] font-bold tracking-[0.16em] text-text-muted uppercase">
            {product.brand.name}
          </span>
        )}
        <Link
          href={href}
          className="font-serif text-[17px] leading-[1.3] text-ink"
        >
          {product.name}
        </Link>
      </div>

      <div className="mt-auto flex items-baseline gap-2">
        <span className="text-base font-bold text-ink">
          {formatPrice(product.priceCents)}
        </span>
        {product.compareAtCents && (
          <span className="text-[12.5px] text-text-faint line-through">
            {formatPrice(product.compareAtCents)}
          </span>
        )}
      </div>
    </div>
  );
}
