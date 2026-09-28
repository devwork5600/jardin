"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFavorites, useSetFavorite } from "./use-favorites";

export function FavoriteButton({
  productId,
  productName,
  initialActive,
  className = "",
}: {
  productId: string;
  productName: string;
  // What the server already knows, used until the shared favourites query has
  // answered (the favourites page: everything on it is a favourite).
  initialActive?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useFavorites();
  const { mutate } = useSetFavorite();
  const active = data ? data.productIds.includes(productId) : (initialActive ?? false);

  const onClick = () => {
    // Not known yet: nothing sensible to do for a moment.
    if (!data && initialActive === undefined) return;
    if (data && !data.signedIn) {
      const next = window.location.pathname + window.location.search;
      router.push(`/connexion?next=${encodeURIComponent(next)}`);
      return;
    }
    mutate(
      { productId, favorited: !active },
      // On the favourites page the list is server-rendered: refresh it so an
      // un-hearted product leaves it.
      { onSettled: () => pathname.startsWith("/compte/favoris") && router.refresh() },
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={
        active
          ? `Retirer ${productName} des favoris`
          : `Ajouter ${productName} aux favoris`
      }
      className={`flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 shadow-[0_2px_8px_rgba(22,38,29,0.15)] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className={active ? "text-copper" : "text-ink"}
      >
        <path d="M12 20.5s-7.5-4.6-9.4-9.2C1.3 8 3.2 4.8 6.4 4.8c2 0 3.5 1.1 4.3 2.4l1.3 1.8 1.3-1.8c.8-1.3 2.3-2.4 4.3-2.4 3.2 0 5.1 3.2 3.8 6.5-1.9 4.6-9.4 9.2-9.4 9.2Z" />
      </svg>
    </button>
  );
}
