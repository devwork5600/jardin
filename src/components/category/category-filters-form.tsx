"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CategoryFiltersSchema,
  PRICE_BANDS,
  SORT_OPTIONS,
  serializeFilters,
  type CategoryFiltersValues,
} from "@/lib/category-filters";

type Props = {
  brands: { name: string; slug: string }[];
  defaultValues: CategoryFiltersValues;
  basePath: string;
  sub?: string;
  countLabel: string;
  children: ReactNode;
};

const CHECKBOX_LABEL =
  "flex cursor-pointer items-center gap-2.5 text-sm text-ink";
const CHECKBOX = "size-4 accent-brand-green";
const FACET_TITLE =
  "text-[10.5px] font-bold tracking-[0.2em] text-text-muted uppercase";

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

// Owns the whole two-column layout so the sidebar facets and the sort select
// (which sits above the product grid) share one react-hook-form instance.
// The server-rendered grid + pagination come in as children.
export function CategoryFiltersForm({
  brands,
  defaultValues,
  basePath,
  sub,
  countLabel,
  children,
}: Props) {
  const router = useRouter();
  const { control, register, handleSubmit } = useForm<CategoryFiltersValues>({
    resolver: zodResolver(CategoryFiltersSchema),
    defaultValues,
  });
  const values = useWatch({ control });
  const currentQuery = serializeFilters(defaultValues, { sub });

  // Every change is validated by the zod schema, then pushed to the URL: the
  // server page re-renders from the query string (shareable, no client state).
  useEffect(() => {
    void handleSubmit((valid) => {
      const query = serializeFilters(valid, { sub });
      if (query === currentQuery) return;
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    })();
  }, [values, handleSubmit, router, basePath, sub, currentQuery]);

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="container-page flex flex-wrap items-start gap-10 pb-[clamp(64px,8vw,112px)]"
    >
      <aside className="flex min-[900px]:sticky min-[900px]:top-24 min-w-[200px] flex-[0_1_230px] flex-col gap-7">
        {brands.length > 0 && (
          <fieldset>
            <legend className={FACET_TITLE}>Marque</legend>
            <ul className="mt-3.5 flex flex-col gap-[11px]">
              {brands.map((brand) => (
                <li key={brand.slug}>
                  <Controller
                    name="brands"
                    control={control}
                    render={({ field }) => (
                      <label className={CHECKBOX_LABEL}>
                        <input
                          type="checkbox"
                          className={CHECKBOX}
                          checked={field.value.includes(brand.slug)}
                          onChange={() =>
                            field.onChange(toggle(field.value, brand.slug))
                          }
                        />
                        {brand.name}
                      </label>
                    )}
                  />
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <fieldset>
          <legend className={FACET_TITLE}>Prix</legend>
          <ul className="mt-3.5 flex flex-col gap-[11px]">
            {PRICE_BANDS.map((band) => (
              <li key={band.value}>
                <Controller
                  name="prices"
                  control={control}
                  render={({ field }) => (
                    <label className={CHECKBOX_LABEL}>
                      <input
                        type="checkbox"
                        className={CHECKBOX}
                        checked={field.value.includes(band.value)}
                        onChange={() =>
                          field.onChange(toggle(field.value, band.value))
                        }
                      />
                      {band.label}
                    </label>
                  )}
                />
              </li>
            ))}
          </ul>
        </fieldset>

        <Controller
          name="inStock"
          control={control}
          render={({ field }) => (
            <label className={CHECKBOX_LABEL}>
              <input
                type="checkbox"
                className={CHECKBOX}
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
              />
              En stock à Vannes
            </label>
          )}
        />

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
          <span className="text-[13.5px] text-text-tertiary">{countLabel}</span>
          <label className="flex items-center gap-2.5 text-[13px] text-text-tertiary">
            Trier par
            <select
              {...register("sort")}
              className="rounded-[10px] border border-border bg-surface px-3 py-[9px] text-[13px] text-ink"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {children}
      </div>
    </form>
  );
}
