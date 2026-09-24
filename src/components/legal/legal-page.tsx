import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="container-page pt-[clamp(32px,5vw,64px)] pb-[clamp(64px,8vw,112px)]">
      <div className="mx-auto max-w-[760px]">
        <span className="eyebrow">Informations légales</span>
        <h1 className="mt-3 font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
          {title}
        </h1>
        <p className="mt-4 text-[13px] text-text-muted">
          Dernière mise à jour : {LEGAL.updated}
        </p>
        <div className="mt-10 flex flex-col gap-10">{children}</div>
      </div>
    </article>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="border-l-2 border-copper pl-4 font-serif text-[22px] font-medium text-ink">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3 text-[15px] leading-[1.75] text-text-secondary">
        {children}
      </div>
    </section>
  );
}

// The site is a portfolio demo of a real shop's redesign: every legal page
// says so up front, so nobody mistakes it for the shop's official terms.
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-copper/30 bg-copper/5 p-5 text-[14.5px] leading-[1.7] text-ink">
      <strong className="font-semibold text-copper">Site de démonstration. </strong>
      {children}
    </aside>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  return (
    <a
      href={href}
      {...(external && href.startsWith("http")
        ? { target: "_blank", rel: "noreferrer" }
        : {})}
      className="font-medium text-brand-green underline underline-offset-2 hover:text-copper"
    >
      {children}
    </a>
  );
}
