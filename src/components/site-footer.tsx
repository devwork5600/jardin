import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Boutique",
    links: [
      { label: "Culture indoor", href: "/categorie/culture-indoor" },
      { label: "Outdoor & hors-sol", href: "/categorie/outdoor" },
      { label: "CBD / CBG", href: "/categorie/cbd" },
      { label: "Vinyles & pop culture", href: "/categorie/vinyles" },
    ],
  },
  {
    title: "E-drive",
    links: [
      { label: "Mon compte", href: "/compte" },
      { label: "Connexion", href: "/connexion" },
      { label: "Panier", href: "/paiement" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "CGV", href: "/cgv" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-footer-bg text-footer-text">
      <div className="container-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-7 pt-[clamp(40px,5vw,64px)]">
        <div>
          <div className="font-serif text-2xl text-ivory">Jardin Indoor</div>
          <p className="mt-2.5 max-w-[28ch] text-[13px] leading-relaxed text-footer-label">
            36 av. Gontran Bienvenu, 56000 Vannes · 02 97 49 95 09
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="m-0 text-[10.5px] font-semibold tracking-[0.2em] text-footer-label uppercase">
              {col.title}
            </h4>
            <ul className="mt-3.5 flex list-none flex-col gap-2.5 p-0">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-serif text-sm text-[#e7efea] italic underline decoration-[rgba(231,239,234,0.35)] underline-offset-[3px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[rgba(231,239,234,0.14)] pt-[18px] pb-7 font-serif text-[12.5px] text-footer-label italic">
        <span>© 2026 Jardin Indoor — Indépendant depuis 2011.</span>
        <span>Vente interdite aux mineurs</span>
      </div>
    </footer>
  );
}
