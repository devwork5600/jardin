"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "@/app/compte/actions";
import { Field, INPUT_CLASS } from "@/components/form-field";
import {
  ProfileFormSchema,
  type ProfileFormValues,
} from "@/lib/validators/profile-schema";

export function ProfileForm({
  email,
  defaultValues,
}: {
  email: string;
  defaultValues: ProfileFormValues;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSaved(false);
    const result = await updateProfile(values);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    // Saved values become the new baseline, so "dirty" means "edited since".
    reset(values);
    setSaved(true);
  };

  return (
    <section className="rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
      <h2 className="font-serif text-[22px] font-medium text-ink">
        Mes informations
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-4">
          <Field label="Prénom" error={errors.firstName?.message}>
            <input
              {...register("firstName")}
              autoComplete="given-name"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Nom" error={errors.lastName?.message}>
            <input
              {...register("lastName")}
              autoComplete="family-name"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="E-mail">
            <input
              value={email}
              readOnly
              aria-readonly
              className={`${INPUT_CLASS} cursor-not-allowed text-text-tertiary`}
            />
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            <input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <p className="text-[12.5px] text-text-muted">
          L&apos;e-mail sert à vous connecter : il ne peut pas être modifié ici.
          Nom et téléphone pré-remplissent vos prochaines commandes.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-[50px] cursor-pointer rounded-[12px] bg-ink px-[26px] text-xs font-bold tracking-[0.12em] text-ivory uppercase disabled:cursor-default disabled:opacity-40"
          >
            Enregistrer
          </button>
          <p
            role="status"
            className={`h-5 text-[13px] leading-5 ${errors.root ? "text-copper" : "text-brand-green"}`}
          >
            {errors.root?.message ?? (saved && !isDirty ? "Informations enregistrées ✓" : "")}
          </p>
        </div>
      </form>
    </section>
  );
}
