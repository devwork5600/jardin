import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { requireSession } from "@/lib/session";

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession("/compte");
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <span className="eyebrow">Mon compte</span>
      <h1 className="mt-3 font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
        {firstName ? (
          <>
            Bonjour, <em>{firstName}.</em>
          </>
        ) : (
          "Bonjour."
        )}
      </h1>

      <div className="mt-10 flex flex-wrap items-start gap-9">
        <AccountNav />
        <div className="flex min-w-0 flex-[1_1_600px] flex-col gap-[22px]">
          {children}
        </div>
      </div>
    </section>
  );
}
