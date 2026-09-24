"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendContactMessage } from "@/app/contact/actions";
import { Field, INPUT_CLASS } from "@/components/form-field";
import {
  CONTACT_TOPICS,
  ContactFormSchema,
  type ContactFormValues,
} from "@/lib/validators/contact-schema";

const MESSAGE_MAX = 2000;

export function ContactForm({
  defaultValues,
}: {
  defaultValues: ContactFormValues;
}) {
  const [sent, setSent] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues,
  });
  const message = useWatch({ control, name: "message" });

  const onSubmit = async (values: ContactFormValues) => {
    const result = await sendContactMessage(values);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    setSent(true);
  };

  return (
    <section className="rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
      <h2 className="font-serif text-[22px] font-medium text-ink">
        Envoyer un message
      </h2>

      {sent ? (
        <div role="status" className="mt-5">
          <p className="font-serif text-2xl leading-[1.3] text-ink">
            Merci, votre message est enregistré.
          </p>
          <p className="mt-3 text-[14.5px] leading-[1.7] text-text-secondary">
            Rappel : ce site est une démonstration, votre message n&apos;est pas
            transmis à la boutique.
          </p>
          <button
            type="button"
            onClick={() => {
              reset(defaultValues);
              setSent(false);
            }}
            className="mt-6 cursor-pointer rounded-[10px] border border-ink px-[18px] py-2.5 text-[11.5px] font-bold tracking-[0.12em] text-ink uppercase"
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative mt-5"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-4">
            <Field label="Nom" error={errors.name?.message}>
              <input
                {...register("name")}
                autoComplete="name"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Téléphone (facultatif)" error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Sujet" error={errors.topic?.message}>
              <select {...register("topic")} className={INPUT_CLASS}>
                {CONTACT_TOPICS.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Message"
            error={errors.message?.message}
            hint={`${message.length} / ${MESSAGE_MAX}`}
          >
            <textarea
              {...register("message")}
              rows={6}
              className="rounded-input border border-border bg-surface-soft px-3.5 py-3 text-[14.5px] leading-[1.6] font-normal text-ink outline-brand-green"
            />
          </Field>

          {/* Honeypot: invisible and unreachable for people, tempting for bots. */}
          <div
            aria-hidden
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Ne pas remplir
              <input
                {...register("website")}
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-text-secondary">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-green"
                />
                <span>
                  J&apos;accepte que ces informations soient utilisées pour
                  répondre à ma demande, comme décrit dans la{" "}
                  <Link
                    href="/confidentialite"
                    className="font-medium text-brand-green underline underline-offset-2"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>
            )}
          />
          <span className="mt-1.5 block h-4 text-[12px] leading-4 text-copper">
            {errors.consent?.message}
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="mt-3 h-[54px] w-full cursor-pointer rounded-input bg-ink text-[12.5px] font-bold tracking-[0.12em] text-ivory uppercase shadow-cta disabled:cursor-default disabled:opacity-40"
          >
            Envoyer le message
          </button>
          <p role="alert" className="mt-2 h-5 text-[13px] leading-5 text-copper">
            {errors.root?.message}
          </p>
        </form>
      )}
    </section>
  );
}
