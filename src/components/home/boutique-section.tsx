import Image from "next/image";
import Link from "next/link";
import facadeImg from "@/assets/images/home/facade.jpeg";
import { SHOP_HOURS } from "@/lib/shop-hours";
import { ShopStatus } from "./shop-status";

export function BoutiqueSection() {
  return (
    <section className="container-page pb-[clamp(64px,8vw,112px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-[clamp(36px,5vw,72px)]">
        <div className="min-w-0">
          <span className="eyebrow">La boutique</span>
          <h2 className="mt-3 font-serif text-[clamp(32px,4vw,48px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            36 avenue Gontran Bienvenu, <em>Vannes</em>
          </h2>
          <ShopStatus />
          <ul className="mt-7">
            {SHOP_HOURS.map((hours) => (
              <li
                key={hours.day}
                className="flex justify-between gap-4 border-b border-border py-[15px] text-[14.5px]"
              >
                <span className="font-serif text-ink">{hours.day}</span>
                <span className="font-medium text-text-tertiary">
                  {hours.time}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-[22px]">
            <a
              href="tel:0297499509"
              className="rounded-[10px] bg-ink px-6 py-[15px] text-sm font-semibold text-ivory"
            >
              02 97 49 95 09
            </a>
            <Link href="/contact" className="text-sm font-semibold text-ink">
              Nous écrire →
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/3.4] min-w-0 overflow-hidden rounded-[20px]">
          <Image
            src={facadeImg}
            alt="Façade verte de la boutique Jardin Indoor, rue pavée de Vannes"
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
