// src/components/PromoDivider.js
"use client";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { DEFAULT_SITE_NAME, normalizePromoDivider } from "@/lib/siteConfig";

function PromoTextBlock({ brand, settings, baseUrl, style, className }) {
  return (
    <motion.div style={style} className={className}>
      <h3 className="text-zinc-400 text-[9px] md:text-[8px] font-bold uppercase tracking-[0.35em] md:tracking-[0.4em] mb-3 md:mb-4">
        {brand} {settings.eyebrow && `/ ${settings.eyebrow}`}
      </h3>

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white uppercase leading-tight tracking-tighter mb-4 md:mb-6">
        {settings.title_primary} <br />
        <span className="font-serif italic font-normal text-zinc-300">
          {settings.title_secondary}
        </span>
      </h2>

      <p className="text-zinc-300 md:text-zinc-400 text-xs md:text-[10px] leading-relaxed mb-6 md:mb-8 tracking-wide md:uppercase md:tracking-[0.15em] md:opacity-90">
        {settings.description}
      </p>

      <Button
        asChild
        className="group relative w-full bg-white text-black px-8 h-12 text-[9px] font-bold uppercase tracking-[0.2em] overflow-hidden"
      >
        <Link href={`${baseUrl}/products`}>
          <span className="relative z-10">{settings.cta_label}</span>
          <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Link>
      </Button>
    </motion.div>
  );
}

/** Solo se monta cuando el promo está habilitado: useScroll necesita ref en el DOM. */
function PromoDividerContent({ settings, brand, baseUrl }) {
  const containerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const allowMotion = reduceMotion !== true;
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothYProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const width = useTransform(
    smoothYProgress,
    [0, 0.4],
    allowMotion ? ["94%", "100%"] : ["100%", "100%"],
  );

  const imageScale = useTransform(
    smoothYProgress,
    [0, 1],
    allowMotion ? [1.18, 1] : [1, 1],
  );
  const imageY = useTransform(
    smoothYProgress,
    [0, 1],
    allowMotion ? ["-7%", "7%"] : ["0%", "0%"],
  );

  const textY = useTransform(
    smoothYProgress,
    [0, 1],
    allowMotion ? [36, -36] : [0, 0],
  );

  const imageFill = (
    <>
      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
      <AdaptiveImage
        src={settings.image || "/banner-image2.jpg"}
        alt={`${brand} Collection`}
        fill
        className="object-cover object-center brightness-[0.7]"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, min(1152px, 85vw)"
        priority
      />
    </>
  );

  return (
    <section
      ref={containerRef}
      className="w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2
        md:static md:left-auto md:translate-x-0 md:w-full md:max-w-none
        my-16 md:my-24 lg:my-40 flex flex-col items-stretch"
    >
      <motion.div
        style={isMd ? { width } : { width: "100%" }}
        className="relative overflow-hidden bg-zinc-950 shadow-2xl mx-auto w-full
          rounded-none md:rounded-xl
          h-auto md:h-[37.5rem]"
      >
        <div className="md:hidden flex flex-col w-full">
          <div className="relative w-full aspect-[4/3] max-h-[min(52vh,420px)] overflow-hidden">
            <motion.div
              style={{ scale: imageScale, y: imageY }}
              className="absolute inset-0 z-0"
            >
              {imageFill}
            </motion.div>
          </div>
          <div className="relative z-20 bg-zinc-950 px-5 py-8 border-t border-white/10">
            <PromoTextBlock
              brand={brand}
              settings={settings}
              baseUrl={baseUrl}
              style={allowMotion ? { y: textY } : undefined}
              className="max-w-lg mx-auto"
            />
          </div>
        </div>

        <div className="hidden md:block absolute inset-0 z-20">
          <div className="max-w-7xl mx-auto w-full h-full px-6 md:px-10 lg:px-20 grid grid-cols-1 md:grid-cols-2 items-center">
            <PromoTextBlock
              brand={brand}
              settings={settings}
              baseUrl={baseUrl}
              style={{ y: textY }}
              className="bg-black/60 md:bg-black/40 backdrop-blur-md p-6 md:p-10 border border-white/10 rounded-lg max-w-85"
            />
            <div className="hidden md:block" />
          </div>
        </div>

        <motion.div
          style={{ scale: imageScale, y: imageY }}
          className="hidden md:block absolute inset-0 z-0"
        >
          {imageFill}
        </motion.div>
      </motion.div>

      <div className="max-w-7xl w-full px-6 lg:px-12 mx-auto mt-6 flex justify-between items-center text-zinc-500">
        <div className="h-px flex-1 bg-zinc-800 mr-8 hidden md:block" />
        <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.5em] whitespace-nowrap text-center md:text-left w-full md:w-auto">
          {settings.footer_text}
        </p>
      </div>
    </section>
  );
}

export default function PromoDivider() {
  const { site_name, tenant_slug, promo_divider } = useSiteConfig();
  const settings = normalizePromoDivider(promo_divider);

  if (!settings.enabled) {
    return null;
  }

  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;

  return (
    <PromoDividerContent
      settings={settings}
      brand={brand}
      baseUrl={baseUrl}
    />
  );
}
