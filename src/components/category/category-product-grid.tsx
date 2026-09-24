"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ListingPage } from "@/lib/category-listing";
import { PAGE_SIZE } from "@/lib/category-filters";
import { ProductCard, ProductCardSkeleton } from "./product-card";

type Props = {
  categorySlug: string;
  // Filters as a query string (no page): identifies the list in the cache.
  queryString: string;
  // Page 1, rendered on the server so the list is there before any JS runs.
  initialPage: ListingPage;
};

async function fetchPage(
  categorySlug: string,
  queryString: string,
  page: number,
): Promise<ListingPage> {
  const params = new URLSearchParams(queryString);
  params.set("page", String(page));

  const response = await fetch(
    `/api/categories/${categorySlug}/products?${params}`,
  );
  if (!response.ok) throw new Error(`Chargement impossible (${response.status})`);
  return response.json();
}

export function CategoryProductGrid({
  categorySlug,
  queryString,
  initialPage,
}: Props) {
  const { data, hasNextPage, isFetchingNextPage, isError, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["category-products", categorySlug, queryString],
      queryFn: ({ pageParam }) =>
        fetchPage(categorySlug, queryString, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialData: { pages: [initialPage], pageParams: [1] },
    });

  // Load the next batch as soon as the sentinel gets within 600px of the
  // viewport. The effect re-arms after every fetch, so a tall screen keeps
  // loading until the sentinel is pushed out of range. Stops on error (the
  // retry button takes over) instead of hammering a failing endpoint.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage || isError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const products = [
    ...new Map(
      data.pages.flatMap((page) => page.items).map((item) => [item.id, item]),
    ).values(),
  ];

  // A full batch of skeletons, or just what's left on the last page: exactly
  // as many placeholders as cards about to arrive, so the height never jumps.
  const total = data.pages[0]?.total ?? 0;
  const skeletonCount = Math.min(PAGE_SIZE, Math.max(0, total - products.length));

  if (products.length === 0) {
    return (
      <p className="mt-10 text-[15px] text-text-tertiary">
        Aucun produit ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <>
      <div
        aria-busy={isFetchingNextPage}
        className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-x-[22px] gap-y-8"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: skeletonCount }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
      </div>

      {isError && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-[14.5px] text-text-tertiary">
            Impossible de charger la suite des produits.
          </p>
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            className="cursor-pointer rounded-[10px] border border-ink px-[18px] py-2.5 text-[11.5px] font-bold tracking-[0.12em] text-ink uppercase"
          >
            Réessayer
          </button>
        </div>
      )}

      {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-px" />}
    </>
  );
}
