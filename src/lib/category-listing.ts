import {
  getCategoryProducts,
  toCardData,
  type ProductCardData,
} from "@/lib/catalog";
import {
  applyFilters,
  pageSlice,
  sortProducts,
  type CategoryFiltersValues,
} from "@/lib/category-filters";

export type ListingPage = {
  items: ProductCardData[];
  total: number;
  nextPage: number | null;
};

// One place for the filter -> sort -> slice pipeline, so the server-rendered
// first page and the pages fetched later by the client can't drift apart.
export async function getListingPage(
  category: { id: string; children: { id: string; slug: string }[] },
  options: { sub?: string; filters: CategoryFiltersValues; page: number },
) {
  const allProducts = await getCategoryProducts(category);
  const activeSub = category.children.find((c) => c.slug === options.sub);
  const inScope = allProducts.filter(
    (product) => !activeSub || product.categorySlug === activeSub.slug,
  );
  const filtered = sortProducts(
    applyFilters(inScope, options.filters),
    options.filters.sort,
  );
  const { items, nextPage } = pageSlice(filtered, options.page);

  return {
    allProducts,
    inScope,
    activeSub,
    page: {
      items: items.map(toCardData),
      total: filtered.length,
      nextPage,
    } satisfies ListingPage,
  };
}
