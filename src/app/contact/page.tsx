import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContactForm } from "@/components/contact/contact-form";
import { ShopStatus } from "@/components/home/shop-status";
import { DemoNotice } from "@/components/legal/legal-page";
import { auth } from "@/lib/auth";
import { SHOP_HOURS } from "@/lib/shop-hours";
import { TOPIC_BY_QUERY } from "@/lib/validators/contact-schema";

export const metadata: Metadata = {
  title: "Contact — Jardin Indoor",
  description:
    "Une question, un projet d'installation ? Écrivez-nous ou passez à la boutique, à Vannes.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const { sujet } = await props.searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
        Nous <em>contacter</em>
      </h1>
      <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.7] text-text-secondary">
        Une question sur un produit, un projet d&apos;installation ? Écrivez-nous
        ou passez à la boutique : on vous conseille de vive voix.
      </p>

      <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-8">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <div className="rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory">
            <span className="eyebrow text-lime">La boutique</span>
            <h2 className="mt-3 font-serif text-[clamp(26px,3vw,32px)] leading-[1.15] font-normal">
              36 avenue Gontran Bienvenu, 56000 Vannes
            </h2>
            <ShopStatus />
            <ul className="mt-5 list-none p-0">
              {SHOP_HOURS.map((hours) => (
                <li
                  key={hours.day}
                  className="flex justify-between gap-4 border-b border-ivory/15 py-3 text-sm"
                >
                  <span className="font-serif">{hours.day}</span>
                  <span className="text-on-dark-secondary">{hours.time}</span>
                </li>
              ))}
            </ul>
            <a
              href="tel:0297499509"
              className="mt-6 inline-block rounded-[10px] bg-copper px-6 py-[15px] text-sm font-semibold text-white"
            >
              02 97 49 95 09
            </a>
          </div>

          <DemoNotice>
            Les messages envoyés depuis ce formulaire sont enregistrés mais ne
            sont pas transmis à la boutique. Pour la joindre réellement,
            appelez-la ou passez la voir.
          </DemoNotice>
        </div>

        <ContactForm
          defaultValues={{
            name: session?.user.name ?? "",
            email: session?.user.email ?? "",
            phone: "",
            topic: TOPIC_BY_QUERY[typeof sujet === "string" ? sujet : ""] ?? "QUESTION",
            message: "",
            consent: false,
            website: "",
          }}
        />
      </div>
    </section>
  );
}
