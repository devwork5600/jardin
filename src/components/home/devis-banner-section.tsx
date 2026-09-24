import Image from "next/image";
import Link from "next/link";
import bannerImg from "@/assets/images/home/banner.jpeg";

export function DevisBannerSection() {
  return (
    <section className="relative flex min-h-[420px] items-center bg-ink">
      <Image
        src={bannerImg}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[rgba(15,28,21,0.62)]" />
      <div className="relative mx-auto max-w-[760px] px-6 py-[clamp(64px,8vw,112px)] text-center text-ivory">
        <h2 className="font-serif text-[clamp(34px,4.6vw,58px)] leading-[1.08] font-normal tracking-[-0.02em] text-balance italic">
          Un projet d&apos;installation ?
        </h2>
        <p className="mt-[18px] text-base leading-[1.65] text-[#DCE3DD]">
          Dites-nous votre espace et vos envies : on vous prépare un devis sur
          mesure, matériel choisi et prix juste.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact?sujet=devis"
            className="rounded-[10px] bg-copper px-[26px] py-[15px] text-xs font-bold tracking-[0.12em] text-white uppercase"
          >
            Demander un devis
          </Link>
          <a
            href="tel:0297499509"
            className="rounded-[10px] border border-ivory/30 bg-ivory/10 px-[26px] py-[15px] text-xs font-bold tracking-[0.12em] text-ivory uppercase"
          >
            Appeler la boutique
          </a>
        </div>
      </div>
    </section>
  );
}
