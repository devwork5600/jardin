const PILLARS = [
  {
    num: "i",
    title: "Sélection",
    text: "Des produits choisis au fil des mois et des saisons, sans obligation de quota.",
  },
  {
    num: "ii",
    title: "Conseil",
    text: "Une écoute et des recommandations adaptées à votre espace et votre méthode.",
  },
  {
    num: "iii",
    title: "Proximité",
    text: "Retrait en boutique à Vannes, sans frais de port, six jours sur sept.",
  },
];

export function PillarsSection() {
  return (
    <section className="bg-ivory-alt">
      <div className="container-page py-[clamp(64px,8vw,112px)]">
        <div className="mx-auto max-w-[680px] text-center">
          <h2 className="font-serif text-[clamp(30px,3.6vw,44px)] font-normal tracking-[-0.02em] text-ink">
            L&apos;indépendance comme méthode
          </h2>
          <p className="mt-[18px] text-[15.5px] leading-[1.7] text-pretty text-text-secondary">
            Contrairement aux franchises et aux sites de vente en ligne, chaque
            produit est testé, choisi au fil des saisons, et vendu avec un vrai
            conseil.
          </p>
        </div>

        <div className="mt-[clamp(40px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-10">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="flex flex-col items-center gap-3.5 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-green font-serif text-[17px] text-on-dark italic">
                {pillar.num}
              </span>
              <h3 className="font-serif text-[21px] font-normal text-ink">
                {pillar.title}
              </h3>
              <p className="max-w-[32ch] text-sm leading-[1.65] text-pretty text-text-tertiary">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
