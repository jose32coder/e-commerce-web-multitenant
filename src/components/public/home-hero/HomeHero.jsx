"use client";

import { useSiteConfig } from "@/context/SiteConfigContext";
import { HERO_VARIANT_CINEMATIC, normalizeHomeIntro } from "@/lib/siteConfig";
import HeroClassic from "./HeroClassic";
import HeroCinematic from "./HeroCinematic";

export default function HomeHero({ baseUrl }) {
  const { hero_slides, loading, home_intro } = useSiteConfig();
  const intro = normalizeHomeIntro(home_intro);
  const slides = hero_slides;

  if (loading) return null;
  if (!slides || slides.length === 0) return null;

  if (intro.hero_variant === HERO_VARIANT_CINEMATIC) {
    return (
      <HeroCinematic
        baseUrl={baseUrl}
        slides={slides}
        navMode={intro.hero_nav_mode}
        widthMode={intro.hero_width_mode}
        overlayAlign={intro.hero_overlay_align}
        overlayValign={intro.hero_overlay_valign}
      />
    );
  }

  return <HeroClassic slides={slides} baseUrl={baseUrl} />;
}
