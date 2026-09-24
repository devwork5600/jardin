"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  makeAddToCartSchema,
  type AddToCartValues,
} from "@/lib/validators/add-to-cart-schema";

type Variant = {
  id: string;
  label: string;
  detail: string | null;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
};

type Props = {
  name: string;
  eyebrow: string;
  summary: string;
  optionName: string | null;
  images: { url: string }[];
  variants: Variant[];
};

// Gallery and purchase panel live in one client component: the promo badge on
// the main image depends on the variant picked in the panel.
export function ProductDetail({
  name,
  eyebrow,
  summary,
  optionName,
  images,
  variants,
}: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);

  const schema = useMemo(() => makeAddToCartSchema(variants), [variants]);
  const { control, handleSubmit, setValue } = useForm<AddToCartValues>({
    resolver: zodResolver(schema),
    defaultValues: { variantId: variants[0].id, quantity: 1 },
  });
  const variantId = useWatch({ control, name: "variantId" });
  const quantity = useWatch({ control, name: "quantity" });

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const inStock = variant.stock > 0;
  const promo =
    variant.compareAtCents && variant.compareAtCents > variant.priceCents
      ? Math.round((1 - variant.priceCents / variant.compareAtCents) * 100)
      : null;

  // Design: "Panneau LED TS 1000 *150 W*" — with several variants the italic
  // accent is the selected one; otherwise whatever follows a " — " in the name.
  const [title, ...titleRest] = name.split(" — ");
  const accent =
    variants.length > 1 ? variant.label : titleRest.join(" — ") || null;

  const selectVariant = (next: Variant) => {
    setValue("variantId", next.id);
    setValue("quantity", Math.min(quantity, Math.max(1, next.stock)));
  };

  const onSubmit = (values: AddToCartValues) => {
    addToCart(values.variantId, values.quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(32px,5vw,72px)]">
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="relative aspect-square overflow-hidden rounded-block bg-ivory-alt">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[activeImage]?.url}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm text-text-faint">
              Photo à venir
            </span>
          )}
          {promo && (
            <span className="pointer-events-none absolute top-[18px] left-[18px] rounded-pill bg-copper px-3 py-1.5 text-[10.5px] font-bold tracking-[0.12em] text-white uppercase">
              Promo −{promo} %
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Voir la photo ${index + 1}`}
                className={`relative aspect-square cursor-pointer overflow-hidden rounded-[14px] border-2 ${
                  index === activeImage ? "border-ink" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-w-0 flex-col gap-6 min-[900px]:sticky min-[900px]:top-24"
      >
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-copper uppercase">
            {eyebrow}
          </span>
          <h1 className="mt-3 font-serif text-[clamp(32px,4vw,48px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            {title}
            {accent && <em> {accent}</em>}
          </h1>
          <p className="mt-3.5 text-[15px] leading-[1.7] text-pretty text-text-secondary">
            {summary}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-serif text-[34px] text-ink">
            {formatPrice(variant.priceCents * quantity)}
          </span>
          {variant.compareAtCents && (
            <span className="text-[15px] text-text-faint line-through">
              {formatPrice(variant.compareAtCents * quantity)}
            </span>
          )}
          <span className="rounded-pill bg-status-open-bg px-2.5 py-[5px] text-xs font-semibold text-status-open-text">
            Prix e-drive
          </span>
        </div>

        {variants.length > 1 && (
          <fieldset>
            <legend className="text-[10.5px] font-bold tracking-[0.2em] text-text-muted uppercase">
              {optionName ?? "Option"}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {variants.map((option) => {
                const active = option.id === variant.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectVariant(option)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-[12px] border px-[18px] py-3 text-left text-[13.5px] font-semibold ${
                      active
                        ? "border-ink bg-ink text-ivory"
                        : "border-border-strong bg-surface text-ink"
                    }`}
                  >
                    {option.label}
                    {option.detail && (
                      <>
                        <br />
                        <span className="text-[11.5px] font-medium opacity-70">
                          {option.detail}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center overflow-hidden rounded-[12px] border border-border-strong">
            <button
              type="button"
              onClick={() => setValue("quantity", Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuer la quantité"
              className="h-[52px] w-11 cursor-pointer text-lg text-ink disabled:cursor-default disabled:opacity-30"
            >
              −
            </button>
            <span className="min-w-8 text-center font-bold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setValue("quantity", Math.min(variant.stock, quantity + 1))
              }
              disabled={quantity >= variant.stock}
              aria-label="Augmenter la quantité"
              className="h-[52px] w-11 cursor-pointer text-lg text-ink disabled:cursor-default disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="submit"
            disabled={!inStock}
            className="h-[52px] flex-[1_1_200px] cursor-pointer rounded-[12px] bg-copper text-[12.5px] font-bold tracking-[0.12em] text-white uppercase shadow-cta disabled:cursor-default disabled:opacity-40"
          >
            {!inStock
              ? "Indisponible"
              : added
                ? "Ajouté au panier ✓"
                : "Ajouter au panier"}
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-ivory-alt px-5 py-[18px]">
          <div className="flex items-center gap-3 text-sm text-ink">
            <span
              className={`size-2 shrink-0 rounded-full ${
                inStock ? "bg-brand-green" : "bg-copper"
              }`}
            />
            {inStock ? (
              <span>
                <strong className="font-semibold">En stock à Vannes</strong> —
                prêt en retrait dès demain
              </span>
            ) : (
              <span>
                <strong className="font-semibold">Actuellement indisponible</strong>{" "}
                — appelez la boutique au 02 97 49 95 09
              </span>
            )}
          </div>
          <div className="text-[13.5px] leading-[1.55] text-text-secondary">
            Retrait en boutique, aucun frais de port. Remise fidélité appliquée
            au panier.
          </div>
        </div>
      </form>
    </div>
  );
}
