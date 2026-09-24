"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { placeOrder } from "@/app/paiement/actions";
import { useCartHydrated, useCartStore } from "@/lib/cart";
import type { PickupDay } from "@/lib/shop-hours";
import {
  CheckoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/validators/checkout-schema";
import { CheckoutRecap } from "./checkout-recap";
import { EmptyCart } from "./empty-cart";
import { usePricedCart } from "./use-priced-cart";

type Props = {
  signedIn: boolean;
  defaultValues: CheckoutFormValues;
  pickupDays: PickupDay[];
};

const CARD =
  "rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]";
const CARD_TITLE = "font-serif text-[22px] font-medium text-ink";
const INPUT =
  "h-12 rounded-input border border-border bg-surface-soft px-3.5 text-[14.5px] font-normal text-ink outline-brand-green";

const PAYMENT_METHODS = [
  {
    value: "CARD",
    title: "Carte bancaire en ligne",
    text: "Paiement sécurisé, votre commande est prête à votre arrivée.",
    available: false,
  },
  {
    value: "ON_PICKUP",
    title: "Paiement au retrait",
    text: "CB ou espèces en boutique, au moment de récupérer la commande.",
    available: true,
  },
] as const;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  // Fixed-height error slot: validation messages never shift the layout.
  return (
    <label className="flex flex-col gap-[7px] text-xs font-semibold text-text-tertiary">
      {label}
      {children}
      <span className="block h-4 text-[12px] leading-4 font-normal text-copper">
        {error}
      </span>
    </label>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mt-10 flex flex-wrap items-start gap-8" aria-hidden>
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[22px]">
        {[300, 200, 250].map((height) => (
          <div
            key={height}
            style={{ height }}
            className="animate-pulse rounded-[20px] bg-ivory-alt"
          />
        ))}
      </div>
      <div className="h-[460px] min-w-0 flex-[1_1_340px] animate-pulse rounded-[20px] bg-ivory-alt" />
    </div>
  );
}

export function CheckoutForm({ signedIn, defaultValues, pickupDays }: Props) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const pricing = usePricedCart();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues,
  });

  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  const onSubmit = async (values: CheckoutFormValues) => {
    const result = await placeOrder({ ...values, items });
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.push(`/paiement/confirmation/${result.orderNumber}`);
  };

  // Before the persisted cart is read the store is merely empty: don't
  // announce "empty cart" for something that just hasn't loaded yet.
  if (!hydrated) return <CheckoutSkeleton />;

  if (items.length === 0) return <EmptyCart />;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-10 flex flex-wrap items-start gap-8"
    >
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[22px]">
        <section className={CARD}>
          <h2 className={CARD_TITLE}>Coordonnées</h2>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-4">
            <Field label="Prénom" error={errors.firstName?.message}>
              <input
                {...register("firstName")}
                autoComplete="given-name"
                className={INPUT}
              />
            </Field>
            <Field label="Nom" error={errors.lastName?.message}>
              <input
                {...register("lastName")}
                autoComplete="family-name"
                className={INPUT}
              />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className={INPUT}
              />
            </Field>
            <Field label="Téléphone" error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                className={INPUT}
              />
            </Field>
          </div>
        </section>

        <section className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={CARD_TITLE}>Retrait en boutique</h2>
            <span className="text-[12.5px] text-text-tertiary">
              36 av. Gontran Bienvenu, Vannes
            </span>
          </div>
          <Controller
            name="pickupDate"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Jour de retrait"
                className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,140px),1fr))] gap-2.5"
              >
                {pickupDays.map((day) => {
                  const active = field.value === day.iso;
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(day.iso)}
                      className={`cursor-pointer rounded-[12px] border p-3.5 text-left ${
                        active
                          ? "border-ink bg-ink text-ivory"
                          : "border-border bg-surface-soft text-ink"
                      }`}
                    >
                      <span className="block font-serif text-base">{day.label}</span>
                      <span className="mt-1 block text-xs opacity-75">
                        {day.hours}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          <span className="mt-1.5 block h-4 text-[12px] leading-4 text-copper">
            {errors.pickupDate?.message}
          </span>
        </section>

        <section className={CARD}>
          <h2 className={CARD_TITLE}>Paiement</h2>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Mode de paiement"
                className="mt-5 flex flex-col gap-2.5"
              >
                {PAYMENT_METHODS.map((method) => {
                  const active = field.value === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={!method.available}
                      onClick={() => field.onChange(method.value)}
                      className={`flex items-start gap-3.5 rounded-[14px] border p-[18px] text-left ${
                        active
                          ? "border-brand-green bg-[#f1f5ee]"
                          : "border-border bg-surface"
                      } ${method.available ? "cursor-pointer" : "cursor-default opacity-60"}`}
                    >
                      <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-ink">
                        <span
                          className={`size-2 rounded-full ${active ? "bg-ink" : "bg-transparent"}`}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-ink">
                          {method.title}
                          {!method.available && (
                            <span className="ml-2 rounded-pill bg-ivory-alt px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] text-text-tertiary uppercase">
                              Bientôt disponible
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-[13px] leading-[1.5] text-text-tertiary">
                          {method.text}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          <p className="mt-4 text-xs text-text-muted">
            Les chèques ne sont pas acceptés.
          </p>
        </section>
      </div>

      <CheckoutRecap
        pricing={pricing}
        signedIn={signedIn}
        method={paymentMethod}
        submitting={isSubmitting}
        error={errors.root?.message}
      />
    </form>
  );
}
