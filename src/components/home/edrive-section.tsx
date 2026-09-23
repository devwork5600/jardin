import Link from "next/link";

const STEPS = [
  {
    num: "1",
    title: "Vous commandez",
    text: "Prix e-drive et promos en cours appliqués au panier.",
  },
  {
    num: "2",
    title: "On prépare",
    text: "Votre commande est rassemblée en boutique.",
  },
  {
    num: "3",
    title: "Vous retirez",
    text: "Aux horaires d'ouverture, remise fidélité incluse.",
  },
];

export function EdriveSection() {
  return (
    <section id="edrive" className="container-page pb-[clamp(64px,8vw,112px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-[clamp(36px,5vw,72px)] rounded-block bg-green-deep p-[clamp(36px,6vw,80px)] text-ivory">
        <div className="min-w-0">
          <span className="eyebrow text-lime">E-drive fidélité</span>
          <h2 className="mt-4 font-serif text-[clamp(32px,4vw,50px)] leading-[1.08] font-normal tracking-[-0.02em]">
            Commandez en ligne,
            <br />
            <em>retirez en boutique.</em>
          </h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.7] text-pretty text-on-dark-secondary">
            Les prix, promos et remises fidélité affichés sont réservés aux
            commandes passées en ligne avec votre compte. Aucun frais de port.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/connexion"
              className="rounded-[10px] bg-copper px-6 py-[15px] text-xs font-bold tracking-[0.12em] text-white uppercase shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
            >
              Créer mon compte
            </Link>
            <Link
              href="/connexion"
              className="rounded-[10px] border border-ivory/22 bg-ivory/8 px-6 py-[15px] text-xs font-bold tracking-[0.12em] text-ivory uppercase"
            >
              Me connecter
            </Link>
          </div>
        </div>

        <ol className="m-0 flex min-w-0 list-none flex-col gap-3.5 p-0">
          {STEPS.map((step) => (
            <li
              key={step.num}
              className="flex items-start gap-[18px] rounded-2xl border border-ivory/10 bg-ivory/5 px-[22px] py-5"
            >
              <span className="w-8 shrink-0 font-serif text-[26px] leading-none text-lime italic">
                {step.num}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-[19px] font-medium">
                  {step.title}
                </h3>
                <p className="mt-[5px] text-[13.5px] leading-[1.55] text-on-dark-secondary">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
          <li className="px-1 pt-1 text-[11.5px] leading-[1.6] text-on-dark-muted">
            Remises non cumulables avec les promos en cours. Chèques non
            acceptés.
          </li>
        </ol>
      </div>
    </section>
  );
}
