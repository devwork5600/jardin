import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryFiltersForm } from "@/components/category/category-filters-form";
import { Pagination } from "@/components/category/pagination";
import { ProductCard } from "@/components/category/product-card";
import { getCategoryBySlug, getCategoryProducts } from "@/lib/catalog";
import {
  applyFilters,
  paginate,
  parseFilters,
  parsePage,
  serializeFilters,
  sortProducts,
} from "@/lib/category-filters";

export async function generateMetadata(
  props: PageProps<"/categorie/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Jardin Indoor`,
    description: category.description ?? undefined,
  };
}

function CategoryTitle({ name }: { name: string }) {
  const words = name.split(" ");
  const last = words.pop();

  return (
    <>
      {words.join(" ")}
      {words.length > 0 && " "}
      <em>{last}</em>
    </>
  );
}

export default async function CategoryPage(
  props: PageProps<"/categorie/[slug]">,
) {
  const { slug } = await props.params;
  const query = await props.searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseFilters(query);
  const activeSub = category.children.find((child) => child.slug === query.sub);

  const allProducts = await getCategoryProducts(category);
  const inScope = allProducts.filter(
    (product) => !activeSub || product.categorySlug === activeSub.slug,
  );
  const brands = [
    ...new Map(
      inScope.flatMap((p) => (p.brand ? [[p.brand.slug, p.brand] as const] : [])),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const filtered = sortProducts(applyFilters(inScope, filters), filters.sort);
  const { items, page, totalPages } = paginate(filtered, parsePage(query));

  const basePath = `/categorie/${category.slug}`;
  const hrefFor = (extra: { sub?: string; page?: number }) => {
    const search = serializeFilters(filters, extra);
    return search ? `${basePath}?${search}` : basePath;
  };

  return (
    <>
      <section className="container-page pt-[clamp(32px,5vw,64px)] pb-8">
        <nav
          aria-label="Fil d'Ariane"
          className="flex gap-2 text-xs text-text-muted"
        >
          <Link href="/">Accueil</Link>
          <span>/</span>
          {category.parent && (
            <>
              <Link href={`/categorie/${category.parent.slug}`}>
                {category.parent.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{category.name}</span>
        </nav>

        <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-16 gap-y-6">
          <h1 className="font-serif text-[clamp(42px,6vw,76px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
            <CategoryTitle name={category.name} />
          </h1>
          {category.description && (
            <p className="max-w-[48ch] text-[15px] leading-[1.7] text-pretty text-text-secondary">
              {category.description}
            </p>
          )}
        </div>

        {category.children.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { name: "Tout", slug: null, count: allProducts.length },
              ...category.children.map((child) => ({
                ...child,
                count: allProducts.filter((p) => p.categorySlug === child.slug)
                  .length,
              })),
            ].map((chip) => {
              const active = (chip.slug ?? undefined) === activeSub?.slug;
              return (
                <Link
                  key={chip.slug ?? "all"}
                  href={hrefFor({ sub: chip.slug ?? undefined })}
                  className={`rounded-pill border px-[18px] py-2.5 text-[13px] font-semibold ${
                    active
                      ? "border-ink bg-ink text-ivory"
                      : "border-border-strong text-ink"
                  }`}
                >
                  {chip.name}{" "}
                  <span className="font-medium opacity-60">{chip.count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <CategoryFiltersForm
        key={`${category.slug}/${activeSub?.slug ?? ""}`}
        brands={brands}
        defaultValues={filters}
        basePath={basePath}
        sub={activeSub?.slug}
        countLabel={`${filtered.length} produit${filtered.length > 1 ? "s" : ""}`}
      >
        {items.length > 0 ? (
          <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-x-[22px] gap-y-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-[15px] text-text-tertiary">
            Aucun produit ne correspond à ces filtres.
          </p>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(n) => hrefFor({ sub: activeSub?.slug, page: n })}
        />
      </CategoryFiltersForm>
    </>
  );
}
