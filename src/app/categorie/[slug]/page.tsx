import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/category/product-card";
import {
  comparePopularity,
  getCategoryBySlug,
  getCategoryProducts,
} from "@/lib/catalog";

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
  const { sub } = await props.searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const allProducts = await getCategoryProducts(category);
  const activeSub = category.children.find((child) => child.slug === sub);
  const products = allProducts
    .filter((product) => !activeSub || product.categorySlug === activeSub.slug)
    .sort(comparePopularity);

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
                  href={
                    chip.slug
                      ? `/categorie/${category.slug}?sub=${chip.slug}`
                      : `/categorie/${category.slug}`
                  }
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

      <section className="container-page flex flex-wrap items-start gap-10 pb-[clamp(64px,8vw,112px)]">
        <aside className="sticky top-24 flex min-w-[200px] flex-[0_1_230px] flex-col gap-7">
          <div className="rounded-2xl bg-green-deep p-5 text-ivory">
            <div className="font-serif text-lg">Besoin d&apos;aide ?</div>
            <p className="mt-2 text-[13px] leading-[1.55] text-on-dark-secondary">
              On vous aide à dimensionner votre installation.
            </p>
            <a
              href="tel:0297499509"
              className="mt-3.5 inline-block text-[13px] font-bold text-lime"
            >
              02 97 49 95 09 →
            </a>
          </div>
        </aside>

        <div className="min-w-0 flex-[1_1_560px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-[18px]">
            <span className="text-[13.5px] text-text-tertiary">
              {products.length} produit{products.length > 1 ? "s" : ""}
            </span>
          </div>

          {products.length > 0 ? (
            <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-x-[22px] gap-y-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-[15px] text-text-tertiary">
              Aucun produit dans cette catégorie pour le moment.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
