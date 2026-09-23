import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/category/product-card";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductTabs } from "@/components/product/product-tabs";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";

function paragraphs(text: string) {
  return text.split("\n\n").filter(Boolean);
}

export async function generateMetadata(
  props: PageProps<"/produit/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} — Jardin Indoor`,
    description: paragraphs(product.description)[0],
  };
}

export default async function ProductPage(props: PageProps<"/produit/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  const { category, brand } = product;
  const parent = category.parent;
  const description = paragraphs(product.description);
  const [summary] = description;

  return (
    <>
      <section className="container-page pt-7 pb-[clamp(56px,7vw,96px)]">
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap gap-2 text-xs text-text-muted"
        >
          <Link href="/">Accueil</Link>
          <span>/</span>
          {parent && (
            <>
              <Link href={`/categorie/${parent.slug}`}>{parent.name}</Link>
              <span>/</span>
            </>
          )}
          <Link
            href={
              parent
                ? `/categorie/${parent.slug}?sub=${category.slug}`
                : `/categorie/${category.slug}`
            }
          >
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <ProductDetail
          name={product.name}
          eyebrow={[brand?.name, category.name].filter(Boolean).join(" · ")}
          summary={summary}
          optionName={product.optionName}
          images={product.images.map((image) => ({ url: image.url }))}
          variants={product.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            detail: variant.detail,
            priceCents: variant.priceCents,
            compareAtCents: variant.compareAtCents,
            stock: variant.stock,
          }))}
        />
      </section>

      <ProductTabs
        // The first paragraph already is the summary above.
        description={description.length > 1 ? description.slice(1) : description}
        specs={product.characteristics.map((c) => ({
          label: c.label,
          value: c.value,
        }))}
        conseil={product.conseil}
      />

      {related.length > 0 && (
        <section className="container-page pb-[clamp(64px,8vw,112px)]">
          <h2 className="font-serif text-[clamp(28px,3.4vw,40px)] font-normal tracking-[-0.02em] text-ink">
            Souvent <em>associés</em>
          </h2>
          <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-[22px]">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
