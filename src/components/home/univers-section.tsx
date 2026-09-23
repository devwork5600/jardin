import Image from "next/image";
import Link from "next/link";
import indoorImg from "@/assets/images/home/indoor.jpeg";
import cbdImg from "@/assets/images/home/cbd.jpeg";
import outdoorImg from "@/assets/images/home/outdoor.jpeg";
import vinylesImg from "@/assets/images/home/vinyles.jpeg";

export function UniversSection() {
  return (
    <section id="univers" className="container-page py-[clamp(64px,8vw,112px)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Nos univers</span>
          <h2 className="mt-3 font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
            La sélection <em>Jardin Indoor</em>
          </h2>
        </div>
        <Link
          href="/categorie/culture-indoor"
          className="border-b border-ink pb-[3px] text-[13px] font-semibold text-ink"
        >
          Voir toute la boutique
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-[22px]">
        <div className="relative min-h-[440px] min-w-0 flex-[2_1_520px] overflow-hidden rounded-[20px] bg-[#2A3B31]">
          <Image
            src={indoorImg}
            alt="Tente de culture indoor équipée, entourée d'étagères de matériel"
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,28,21,0)_35%,rgba(15,28,21,0.82)_100%)]" />
          <div className="absolute inset-x-[clamp(24px,3vw,36px)] bottom-[clamp(24px,3vw,36px)] text-ivory">
            <h3 className="font-serif text-[clamp(30px,3.4vw,42px)] font-medium tracking-[-0.02em]">
              Culture indoor
            </h3>
            <p className="mt-2.5 max-w-[42ch] text-[14.5px] leading-[1.6] text-[#DCE3DD]">
              Éclairage, ventilation, chambres de culture, mesure et contrôle —
              de la première tente à l&apos;installation complète.
            </p>
            <Link
              href="/categorie/culture-indoor"
              className="mt-[22px] inline-flex items-center gap-2.5 rounded-[10px] bg-copper px-5 py-[13px] text-xs font-bold tracking-[0.12em] text-white uppercase"
            >
              Découvrir <span>→</span>
            </Link>
          </div>
        </div>

        <div className="relative min-h-[440px] min-w-0 flex-[1_1_280px] overflow-hidden rounded-[20px] bg-ink">
          <Image
            src={cbdImg}
            alt="Bocal ambré de fleurs CBD et flacon d'huile sur un comptoir en bois"
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,28,21,0.1)_30%,rgba(15,28,21,0.88)_100%)]" />
          <span className="absolute top-6 left-6 rounded-pill bg-ivory/16 px-3 py-[7px] text-[10.5px] font-semibold tracking-[0.14em] text-ivory uppercase backdrop-blur-sm">
            Leaf District
          </span>
          <div className="absolute inset-x-7 bottom-7 text-ivory">
            <h3 className="font-serif text-[32px] leading-[1.05] font-medium tracking-[-0.02em]">
              CBD &amp; CBG
            </h3>
            <p className="mt-2.5 text-sm leading-[1.55] text-[#DCE3DD]">
              Sélection bretonne, fleurs, huiles et résines, conseillées en
              boutique.
            </p>
            <Link
              href="/categorie/cbd-cbg"
              className="mt-[18px] inline-flex gap-2 text-xs font-bold tracking-[0.12em] text-white uppercase"
            >
              Voir la gamme →
            </Link>
          </div>
        </div>

        <div className="grid min-h-[300px] min-w-0 flex-[2_1_520px] grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] overflow-hidden rounded-[20px] bg-[#E3E0D9]">
          <div className="relative min-h-[260px]">
            <Image
              src={outdoorImg}
              alt="Comptoir garni de substrats et d'engrais, étagères de produits en arrière-plan"
              fill
              sizes="(min-width: 1024px) 400px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 p-[clamp(26px,3vw,40px)]">
            <span className="text-[10.5px] font-semibold tracking-[0.18em] text-text-muted uppercase">
              Au fil des saisons
            </span>
            <h3 className="font-serif text-[28px] leading-[1.1] font-medium tracking-[-0.02em] text-ink">
              Outdoor &amp; hors-sol
            </h3>
            <p className="text-sm leading-[1.65] text-text-secondary">
              Substrats, engrais, pots et additifs pour chaque méthode de
              culture.
            </p>
            <Link
              href="/categorie/outdoor"
              className="mt-2 self-start rounded-[10px] border border-ink px-[18px] py-2.5 text-[11.5px] font-bold tracking-[0.12em] text-ink uppercase"
            >
              Parcourir
            </Link>
          </div>
        </div>

        <div className="relative min-h-[300px] min-w-0 flex-[1_1_280px] overflow-hidden rounded-[20px] bg-[#0F1A14]">
          <Image
            src={vinylesImg}
            alt="Bacs de vinyles colorés et étagère de figurines de collection"
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,12,0.78)_0%,rgba(10,14,12,0.1)_60%)]" />
          <div className="absolute inset-x-7 top-7 text-ivory">
            <h3 className="font-serif text-[28px] font-medium tracking-[-0.02em]">
              Vinyles &amp; pop culture
            </h3>
            <p className="mt-2 text-sm leading-[1.55] text-[#DCE3DD]">
              Arrivages réguliers, neuf et occasion. Figurines et objets de
              collection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
