"use client";
import SectionIntro from "@/components/public/SectionIntro";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { normalizeHomeIntro } from "@/lib/siteConfig";

export default function AnimatedHeader() {
  const { home_intro } = useSiteConfig();
  const intro = normalizeHomeIntro(home_intro);

  return (
    <SectionIntro
      title={intro.title}
      description={intro.description}
      className="mb-20"
      headingClassName="text-2xl md:text-3xl"
      lineClassName="w-12"
      descriptionClassName="max-w-3xl"
    />
  );
}
