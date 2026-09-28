import Image from "next/image";
import Link from "next/link";
import cactusImg from "@/assets/images/home/cactus.jpeg";
import bonsaiImg from "@/assets/images/home/bonsai.jpeg";
import plantesImg from "@/assets/images/home/plantes.jpeg";
import potsImg from "@/assets/images/home/pots.jpeg";
import { IMG_ZOOM } from "@/lib/image-zoom";

export function UniversSection() {
  return (
    <section id="univers" className="container-page py-[clamp(64px,8vw,112px)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Nos univers</span>
          <h2 className="mt-3 font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
            La sélection <em>Feuilles et épines</em>
          </h2>
        </div>
        <Link
          href="/categorie/cactus-succulentes"
          className="border-b border-ink pb-[3px] text-[13px] font-semibold text-ink"
        >
          Voir toute la boutique
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-[22px]">
        <div className="group relative min-h-[440px] min-w-0 flex-[2_1_520px] overflow-hidden rounded-[20px] bg-[#2A3B31]">
          <Image
            src={cactusImg}
            alt="Étagère de cactus et de succulentes en pots de terre cuite"
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className={IMG_ZOOM}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,28,21,0)_35%,rgba(15,28,21,0.82)_100%)]" />
          <div className="absolute inset-x-[clamp(24px,3vw,36px)] bottom-[clamp(24px,3vw,36px)] text-ivory">
            <h3 className="font-serif text-[clamp(30px,3.4vw,42px)] font-medium tracking-[-0.02em]">
              Cactus &amp; succulentes
            </h3>
            <p className="mt-2.5 max-w-[42ch] text-[14.5px] leading-[1.6] text-[#DCE3DD]">
              Cactus, succulentes, euphorbes et agaves — des plantes
              graphiques qui pardonnent les oublis.
            </p>
            <Link
              href="/categorie/cactus-succulentes"
              className="mt-[22px] inline-flex items-center gap-2.5 rounded-[10px] bg-copper px-5 py-[13px] text-xs font-bold tracking-[0.12em] text-white uppercase"
            >
              Découvrir <span>→</span>
            </Link>
          </div>
        </div>

        <div className="group relative min-h-[440px] min-w-0 flex-[1_1_280px] overflow-hidden rounded-[20px] bg-ink">
          <Image
            src={bonsaiImg}
            alt="Bonsaï dans un pot en grès bleu-gris sur un comptoir en chêne clair"
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className={IMG_ZOOM}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,28,21,0.1)_30%,rgba(15,28,21,0.88)_100%)]" />
          <span className="absolute top-6 left-6 rounded-pill bg-ivory/16 px-3 py-[7px] text-[10.5px] font-semibold tracking-[0.14em] text-ivory uppercase backdrop-blur-sm">
            Feuilles et épines
          </span>
          <div className="absolute inset-x-7 bottom-7 text-ivory">
            <h3 className="font-serif text-[32px] leading-[1.05] font-medium tracking-[-0.02em]">
              Bonsaï
            </h3>
            <p className="mt-2.5 text-sm leading-[1.55] text-[#DCE3DD]">
              Arbres miniatures d&apos;intérieur et d&apos;extérieur, pots et
              substrats.
            </p>
            <Link
              href="/categorie/bonsai"
              className="mt-[18px] inline-flex gap-2 text-xs font-bold tracking-[0.12em] text-white uppercase"
            >
              Voir la gamme →
            </Link>
          </div>
        </div>

        <div className="group grid min-h-[340px] min-w-0 flex-[2_1_520px] grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] overflow-hidden rounded-[20px] bg-[#E3E0D9]">
          <div className="relative min-h-[300px] overflow-hidden">
            <Image
              src={plantesImg}
              alt="Monstera dans un pot crème devant une baie vitrée, étagère blanche de plantes"
              fill
              sizes="(min-width: 1024px) 400px, 100vw"
              className={IMG_ZOOM}
            />
          </div>
          <div className="flex flex-col justify-center gap-3 p-[clamp(26px,3vw,40px)]">
            <span className="text-[10.5px] font-semibold tracking-[0.18em] text-text-muted uppercase">
              Pour chaque pièce
            </span>
            <h3 className="font-serif text-[28px] leading-[1.1] font-medium tracking-[-0.02em] text-ink">
              Plantes d&apos;intérieur
            </h3>
            <p className="text-sm leading-[1.65] text-text-secondary">
              Feuillages, calathea, philodendron ou plantes increvables.
            </p>
            <Link
              href="/categorie/plantes-interieur"
              className="mt-2 self-start rounded-[10px] border border-ink px-[18px] py-2.5 text-[11.5px] font-bold tracking-[0.12em] text-ink uppercase"
            >
              Parcourir
            </Link>
          </div>
        </div>

        <div className="group relative min-h-[340px] min-w-0 flex-[1_1_280px] overflow-hidden rounded-[20px] bg-[#0F1A14]">
          <Image
            src={potsImg}
            alt="Pots en terre cuite empilés, arrosoir en cuivre et sécateur sur un comptoir en chêne"
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className={`${IMG_ZOOM} object-[50%_80%]`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,12,0.78)_0%,rgba(10,14,12,0.1)_60%)]" />
          <div className="absolute inset-x-7 top-7 text-ivory">
            <h3 className="font-serif text-[28px] font-medium tracking-[-0.02em]">
              Pots &amp; jardinage
            </h3>
            <p className="mt-2 text-sm leading-[1.55] text-[#DCE3DD]">
              Terre cuite, cache-pots, terreaux, sécateurs et arrosoirs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
