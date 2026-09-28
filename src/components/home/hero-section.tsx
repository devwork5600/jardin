import { heroBoutiqueDataUri } from "@/assets/images/home/hero-boutique.base64";
import { IMG_ZOOM } from "@/lib/image-zoom";

export function HeroSection() {
  return (
    <section className="container-page pt-[clamp(40px,7vw,96px)] pb-[clamp(64px,8vw,112px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-center gap-[clamp(40px,6vw,80px)]">
        <div className="min-w-0">
          <span className="eyebrow">Jardinerie urbaine · Vannes</span>
          <h1 className="mt-[22px] font-serif text-[clamp(48px,7vw,92px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
            Des plantes
            <br />
            <em>qui ont du</em>
            <br />
            caractère.
          </h1>
          <p className="mt-[26px] max-w-[46ch] text-base leading-[1.7] text-pretty text-text-secondary">
            Cactus, bonsaï, plantes d&apos;intérieur, pots et outils. Des
            plantes choisies une à une et conseillées en boutique
            indépendante à Vannes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-[22px]">
            <a
              href="#univers"
              className="rounded-[10px] bg-ink px-[26px] py-[15px] text-sm font-semibold text-ivory shadow-[0_8px_20px_rgba(22,38,29,0.18)]"
            >
              Explorer le catalogue
            </a>
            <a
              href="#edrive"
              className="flex items-center gap-2 text-sm font-semibold text-ink"
            >
              Commander en E-drive <span>→</span>
            </a>
          </div>
        </div>

        <div className="relative min-w-0 pb-10">
          <div className="group relative aspect-square w-full overflow-hidden rounded-block shadow-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroBoutiqueDataUri}
              alt="Intérieur de la boutique Feuilles et épines à Vannes : murs vert profond, étagères blanches de bonsaï et de cactus"
              className={`absolute inset-0 h-full w-full ${IMG_ZOOM}`}
            />
          </div>
          <blockquote className="absolute bottom-0 -left-2 max-w-[270px] rounded-2xl bg-surface px-6 py-[22px] shadow-card">
            <p className="font-serif text-base leading-[1.45] text-ink italic">
              « Chaque plante est choisie, arrosée et vérifiée avant
              d&apos;arriver sur l&apos;étagère. »
            </p>
            <div className="mt-3.5 flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.18em] text-text-muted uppercase">
              <span className="h-px w-6 bg-text-muted" />
              Le gérant
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
