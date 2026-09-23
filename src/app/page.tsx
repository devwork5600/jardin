import { BoutiqueSection } from "@/components/home/boutique-section";
import { DevisBannerSection } from "@/components/home/devis-banner-section";
import { EdriveSection } from "@/components/home/edrive-section";
import { HeroSection } from "@/components/home/hero-section";
import { PillarsSection } from "@/components/home/pillars-section";
import { UniversSection } from "@/components/home/univers-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PillarsSection />
      <UniversSection />
      <EdriveSection />
      <BoutiqueSection />
      <DevisBannerSection />
    </>
  );
}
