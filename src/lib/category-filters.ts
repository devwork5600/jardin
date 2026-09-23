import { z } from "zod";
import type { CategoryProduct } from "@/lib/catalog";

// Pure module (no Prisma): imported by both the server page and the client
// filter form, so the same zod schema validates the URL and the form.

export const PAGE_SIZE = 9;

const PRICE_VALUES = ["lt25", "25-100", "100-250", "gt250"] as const;
const SORT_VALUES = ["pop", "asc", "desc"] as const;

export const PRICE_BANDS: {
  value: (typeof PRICE_VALUES)[number];
  label: string;
  min: number;
  max: number;
}[] = [
  { value: "lt25", label: "Moins de 25 €", min: 0, max: 2_500 },
  { value: "25-100", label: "25 € – 100 €", min: 2_500, max: 10_000 },
  { value: "100-250", label: "100 € – 250 €", min: 10_000, max: 25_000 },
  { value: "gt250", label: "Plus de 250 €", min: 25_000, max: Infinity },
];

export const SORT_OPTIONS: {
  value: (typeof SORT_VALUES)[number];
  label: string;
}[] = [
  { value: "pop", label: "Popularité" },
  { value: "asc", label: "Prix croissant" },
  { value: "desc", label: "Prix décroissant" },
];

export const CategoryFiltersSchema = z.object({
  brands: z.array(z.string()),
  prices: z.array(z.enum(PRICE_VALUES)),
  inStock: z.boolean(),
  sort: z.enum(SORT_VALUES),
});

export type CategoryFiltersValues = z.infer<typeof CategoryFiltersSchema>;

export const DEFAULT_FILTERS: CategoryFiltersValues = {
  brands: [],
  prices: [],
  inStock: true,
  sort: "pop",
};

type SearchParams = Record<string, string | string[] | undefined>;

function csv(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value.split(",") : [];
}

export function parseFilters(params: SearchParams): CategoryFiltersValues {
  const parsed = CategoryFiltersSchema.safeParse({
    brands: csv(params.marque),
    prices: csv(params.prix),
    // "En stock" is on by default (as in the mockup): only stock=0 disables it.
    inStock: params.stock !== "0",
    sort: typeof params.tri === "string" ? params.tri : "pop",
  });

  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}

export function parsePage(params: SearchParams) {
  const page = Number(typeof params.page === "string" ? params.page : 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// Default values are omitted so clean URLs stay clean.
export function serializeFilters(
  filters: CategoryFiltersValues,
  extra: { sub?: string; page?: number } = {},
) {
  const query = new URLSearchParams();
  if (extra.sub) query.set("sub", extra.sub);
  if (filters.brands.length) query.set("marque", filters.brands.join(","));
  if (filters.prices.length) query.set("prix", filters.prices.join(","));
  if (!filters.inStock) query.set("stock", "0");
  if (filters.sort !== "pop") query.set("tri", filters.sort);
  if (extra.page && extra.page > 1) query.set("page", String(extra.page));
  return query.toString();
}

export function comparePopularity(a: CategoryProduct, b: CategoryProduct) {
  const aBest = a.badge === "BEST_SELLER" ? 0 : 1;
  const bBest = b.badge === "BEST_SELLER" ? 0 : 1;
  return aBest - bBest || b.createdAt.getTime() - a.createdAt.getTime();
}

export function applyFilters(
  products: CategoryProduct[],
  filters: CategoryFiltersValues,
) {
  const bands = PRICE_BANDS.filter((band) => filters.prices.includes(band.value));

  return products.filter(
    (product) =>
      (filters.brands.length === 0 ||
        (product.brand !== null && filters.brands.includes(product.brand.slug))) &&
      (bands.length === 0 ||
        bands.some(
          (band) => product.priceCents >= band.min && product.priceCents < band.max,
        )) &&
      (!filters.inStock || product.inStock),
  );
}

export function sortProducts(
  products: CategoryProduct[],
  sort: CategoryFiltersValues["sort"],
) {
  return [...products].sort((a, b) =>
    sort === "asc"
      ? a.priceCents - b.priceCents
      : sort === "desc"
        ? b.priceCents - a.priceCents
        : comparePopularity(a, b),
  );
}

export function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);

  return {
    items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    totalPages,
  };
}
