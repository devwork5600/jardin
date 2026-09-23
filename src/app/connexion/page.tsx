"use client";

import { useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
  ConnexionFormSchema,
  type ConnexionFormSchemaType,
} from "@/lib/validators/email-schemas";
import connexionHero from "@/assets/images/connexion-comptoir.jpeg";

export default function ConnexionPage() {
  const [socialLoading, setSocialLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ConnexionFormSchemaType>({
    resolver: zodResolver(ConnexionFormSchema),
    defaultValues: { email: "", ageCertified: false },
  });

  const {
    handleSubmit,
    control,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const authLoading = isSubmitting || socialLoading;

  const onSubmit = async (values: ConnexionFormSchemaType) => {
    setSent(false);
    const { error } = await authClient.signIn.magicLink({
      email: values.email,
      callbackURL: "/",
    });
    if (error) {
      setError("email", {
        message: error.message ?? "Échec de l'envoi du lien.",
      });
      return;
    }
    setSent(true);
  };

  const handleSocial = async (provider: "github" | "google") => {
    const ageValid = await trigger("ageCertified");
    if (!ageValid) return;

    setSocialLoading(true);
    try {
      await authClient.signIn.social({ provider, callbackURL: "/" });
      // rien après cette ligne : redirection gérée par better-auth
    } catch {
      setSocialLoading(false);
      setError("root", { message: "Connexion impossible, réessayez." });
    }
  };

  return (
    <section className="container-page grid min-h-screen content-center grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-stretch gap-[clamp(32px,5vw,72px)] py-[clamp(32px,5vw,64px)] pb-[clamp(64px,8vw,112px)]">
      <div className="relative min-h-[520px] min-w-0 overflow-hidden rounded-block bg-green-deep">
        <Image
          src={connexionHero}
          alt="Comptoir Jardin Indoor : sac de commande e-drive, plant de basilic, produit en retrait"
          fill
          sizes="(min-width: 900px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-green-deep/0 to-green-deep/90" />
        <div className="absolute right-8 bottom-8 left-8 text-on-dark">
          <span className="eyebrow text-lime">E-drive fidélité</span>
          <p className="mt-3 font-serif text-[clamp(24px,2.6vw,32px)] leading-tight">
            Vos prix e-drive, vos remises fidélité et vos commandes, au même
            endroit.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 w-full max-w-[460px] flex-col justify-center justify-self-center">
        <h1 className="font-serif text-[clamp(34px,4vw,48px)] leading-[1.05] tracking-tight text-ink">
          Se connecter.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-text-tertiary">
          Un e-mail suffit — pas de mot de passe. Vous recevez un lien de
          connexion valable quelques minutes.
        </p>

        <div className="mt-4 min-h-5">
          {errors.root && (
            <p className="rounded-input border border-copper/30 bg-copper/10 p-3 text-[13px] text-copper">
              {errors.root.message}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className={`mt-7 flex flex-col gap-4 ${authLoading ? "pointer-events-none opacity-60" : ""}`}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-tertiary">
                E-mail
                <input
                  {...field}
                  type="email"
                  placeholder="vous@exemple.fr"
                  disabled={authLoading}
                  aria-invalid={!!errors.email}
                  className="h-[50px] rounded-input border border-border bg-surface px-3.5 text-[14.5px]"
                />
                <span className="block h-4 text-[12px] leading-4 text-copper">
                  {errors.email?.message}
                </span>
              </label>
            )}
          />

          <button
            type="submit"
            disabled={authLoading}
            className="mt-2 h-[54px] rounded-input bg-ink text-[12.5px] font-bold tracking-[0.12em] text-ivory uppercase shadow-cta disabled:opacity-40"
          >
            {isSubmitting ? "Envoi..." : "Envoyer le lien de connexion"}
          </button>

          <p className="h-4 text-[13px] leading-4 text-brand-green">
            {sent && "Lien envoyé — vérifiez votre boîte mail."}
          </p>
        </form>

        <div className="mt-6 flex items-center gap-3 text-[12px] text-text-faint">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleSocial("github")}
            disabled={authLoading}
            className="flex h-[50px] items-center justify-center gap-2.5 rounded-input border border-border bg-surface text-[13.5px] font-semibold text-ink disabled:opacity-40"
          >
            <Image src="/icons/github.svg" alt="" width={18} height={18} />
            Continuer avec GitHub
          </button>
          <button
            type="button"
            onClick={() => handleSocial("google")}
            disabled={authLoading}
            className="flex h-[50px] items-center justify-center gap-2.5 rounded-input border border-border bg-surface text-[13.5px] font-semibold text-ink disabled:opacity-40"
          >
            <Image src="/icons/google.svg" alt="" width={18} height={18} />
            Continuer avec Google
          </button>
        </div>

        <Controller
          name="ageCertified"
          control={control}
          render={({ field }) => (
            <label className="mt-6 flex items-start gap-2.5 text-[13px] leading-relaxed text-text-secondary">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-green"
              />
              Je certifie avoir plus de 18 ans et accepte les CGV — requis
              pour se connecter, par e-mail ou via GitHub/Google.
            </label>
          )}
        />
        <span className="mt-1.5 block h-4 text-[12px] leading-4 text-copper">
          {errors.ageCertified?.message}
        </span>

        <p className="mt-6 text-[12.5px] leading-relaxed text-text-muted">
          Un souci de connexion ? Appelez la boutique au{" "}
          <a href="tel:0297499509" className="font-semibold text-ink">
            02 97 49 95 09
          </a>
          .
        </p>
      </div>
    </section>
  );
}
