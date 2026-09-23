"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Culture indoor", href: "/categorie/culture-indoor" },
  { label: "Outdoor", href: "/categorie/outdoor" },
  { label: "CBD", href: "/categorie/cbd" },
  { label: "Vinyles", href: "/categorie/vinyles" },
];

type SiteHeaderProps = {
  cartCount?: number;
};

export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-ivory/92 backdrop-blur-md">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 py-[18px]">
        <Link
          href="/"
          className="whitespace-nowrap font-serif text-xl font-semibold italic text-ink-logo"
        >
          Jardin Indoor
        </Link>

        <nav className="flex flex-wrap gap-x-7 gap-y-1.5 font-serif text-sm">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b pb-1 ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-nav-inactive"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-[18px] text-[13px] font-semibold">
          <Link href="/compte" className="text-ink-logo">
            Mon compte
          </Link>
          <Link
            href="/paiement"
            className="flex items-center gap-1.5 text-ink-logo"
          >
            Panier
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-ink-logo px-1.5 text-[11px] text-ivory">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
