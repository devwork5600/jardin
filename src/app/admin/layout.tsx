import type { Metadata } from "next";
import Link from "next/link";

// The back office is not for search engines.
export const metadata: Metadata = {
  title: "Espace admin — Feuilles et épines",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-4">
        <span className="eyebrow">Espace admin</span>
        <div className="flex gap-5 text-[13px] font-semibold text-ink">
          <Link href="/admin/commandes" className="underline-offset-4 hover:underline">Commandes</Link>
          <Link href="/" className="text-text-tertiary underline-offset-4 hover:underline">Retour au site</Link>
        </div>
      </div>
      {children}
    </section>
  );
}
