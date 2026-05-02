"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import {
  HERO_OVERLAY_ALIGN_CENTER,
  HERO_OVERLAY_ALIGN_RIGHT,
  HERO_OVERLAY_VALIGN_BOTTOM,
  HERO_OVERLAY_VALIGN_TOP,
  HERO_WIDTH_IMMERSIVE,
} from "@/lib/siteConfig";
import HeroBottomNav from "./HeroBottomNav";
import { HERO_AUTOPLAY_MS, useHeroAutoplay } from "./useHeroAutoplay";
import { useRegisterHeroBottom } from "@/context/TenantHeroMetricsContext";

function baseScrimClass(align) {
  if (align === HERO_OVERLAY_ALIGN_CENTER) {
    return "bg-black/50 sm:bg-black/45";
  }
  if (align === HERO_OVERLAY_ALIGN_RIGHT) {
    return "bg-gradient-to-l from-black/92 via-black/55 to-black/20";
  }
  return "bg-gradient-to-r from-black/92 via-black/55 to-black/25";
}

function valignBoostClass(valign) {
  if (valign === HERO_OVERLAY_VALIGN_TOP) {
    return "bg-gradient-to-b from-black/35 via-transparent to-transparent";
  }
  if (valign === HERO_OVERLAY_VALIGN_BOTTOM) {
    return "bg-gradient-to-t from-black/40 via-transparent to-transparent";
  }
  return "";
}

export default function HeroCinematic({
  slides,
  baseUrl,
  navMode,
  widthMode,
  overlayAlign,
  overlayValign,
}) {
  const sectionRef = React.useRef(null);
  useRegisterHeroBottom(sectionRef, true);

  const reduceMotion = useReducedMotion();
  const count = slides?.length ?? 0;
  const [activeIndex, setActiveIndex] = useHeroAutoplay(
    count,
    reduceMotion,
    HERO_AUTOPLAY_MS,
  );

  const swipeRef = React.useRef({
    tracking: false,
    startX: 0,
    startY: 0,
  });

  const SWIPE_MIN_PX = 56;
  const SWIPE_HORIZONTAL_RATIO = 1.15;

  const isInteractiveTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest("a[href]") ||
        target.closest("button") ||
        target.closest('[role="tab"]'),
    );
  };

  const handleSwipePointerDown = (e) => {
    if (count <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    swipeRef.current = {
      tracking: true,
      startX: e.clientX,
      startY: e.clientY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const finishSwipe = (e) => {
    const s = swipeRef.current;
    if (!s.tracking) return;
    swipeRef.current = { ...s, tracking: false };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return;

    if (dx > 0) {
      setActiveIndex((i) => (i - 1 + count) % count);
    } else {
      setActiveIndex((i) => (i + 1) % count);
    }
  };

  const handleSwipePointerUp = (e) => {
    finishSwipe(e);
  };

  const handleSwipePointerCancel = (e) => {
    swipeRef.current.tracking = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const handleLostPointerCapture = () => {
    swipeRef.current.tracking = false;
  };

  if (!slides || count === 0) return null;

  const slide = slides[activeIndex];
  const isContained = widthMode !== HERO_WIDTH_IMMERSIVE;
  const baseScrim = baseScrimClass(overlayAlign);
  const boostScrim = valignBoostClass(overlayValign);

  const contentRow =
    overlayAlign === HERO_OVERLAY_ALIGN_CENTER
      ? "items-center text-center"
      : overlayAlign === HERO_OVERLAY_ALIGN_RIGHT
        ? "items-end text-right"
        : "items-start text-left";

  const justifyValign =
    overlayValign === HERO_OVERLAY_VALIGN_TOP
      ? "justify-start"
      : overlayValign === HERO_OVERLAY_VALIGN_BOTTOM
        ? "justify-end"
        : "justify-center";

  const textBlock =
    overlayAlign === HERO_OVERLAY_ALIGN_CENTER
      ? "mx-auto max-w-2xl"
      : overlayAlign === HERO_OVERLAY_ALIGN_RIGHT
        ? "ml-auto mr-0 max-w-xl"
        : "max-w-xl";

  const descMax =
    overlayAlign === HERO_OVERLAY_ALIGN_CENTER
      ? "max-w-xl mx-auto"
      : overlayAlign === HERO_OVERLAY_ALIGN_RIGHT
        ? "max-w-md ml-auto"
        : "max-w-md";

  const sectionClass = isContained
    ? "w-full max-w-7xl mx-auto px-6 lg:px-12 py-6 sm:py-8"
    : "w-full -mt-16 relative z-0 px-0 pb-0";

  const minHClass = isContained
    ? "min-h-[min(72vh,720px)] max-h-[min(88vh,900px)]"
    : "min-h-[100dvh] supports-[height:100svh]:min-h-[100svh]";

  const cardClass = isContained
    ? `relative w-full ${minHClass} overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-black shadow-2xl`
    : `relative w-full ${minHClass} overflow-hidden bg-black shadow-none rounded-none border-0`;

  const imageSizes = isContained
    ? "(max-width: 1280px) 100vw, 1280px"
    : "100vw";

  let innerContentPad;
  if (isContained) {
    if (overlayValign === HERO_OVERLAY_VALIGN_TOP) {
      innerContentPad = "px-6 sm:px-10 lg:px-14 pt-12 pb-36 sm:pb-40";
    } else if (overlayValign === HERO_OVERLAY_VALIGN_BOTTOM) {
      innerContentPad = "px-6 sm:px-10 lg:px-14 pt-14 pb-40 sm:pb-44";
    } else {
      innerContentPad = "px-6 sm:px-10 lg:px-14 pt-14 pb-36 sm:pb-40";
    }
  } else if (overlayValign === HERO_OVERLAY_VALIGN_TOP) {
    innerContentPad = "px-5 sm:px-10 lg:px-14 pt-24 sm:pt-28 pb-32 sm:pb-36";
  } else if (overlayValign === HERO_OVERLAY_VALIGN_BOTTOM) {
    innerContentPad = "px-5 sm:px-10 lg:px-14 pt-20 sm:pt-24 pb-40 sm:pb-44";
  } else {
    innerContentPad = "px-5 sm:px-10 lg:px-14 pt-24 sm:pt-28 pb-36 sm:pb-40";
  }

  return (
    <section ref={sectionRef} className={sectionClass}>
      <div
        className={`${cardClass} ${count > 1 ? "cursor-grab active:cursor-grabbing touch-pan-y" : ""}`}
        onPointerDown={handleSwipePointerDown}
        onPointerUp={handleSwipePointerUp}
        onPointerCancel={handleSwipePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === activeIndex
                ? "opacity-100 z-[1]"
                : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={i !== activeIndex}
          >
            <AdaptiveImage
              containerClassName="h-full w-full"
              src={s.image}
              alt={s.title || ""}
              fill
              className="object-cover object-center"
              priority={i === 0}
              sizes={imageSizes}
            />
            <div className={`absolute inset-0 ${baseScrim}`} aria-hidden />
            {boostScrim ? (
              <div
                className={`pointer-events-none absolute inset-0 ${boostScrim}`}
                aria-hidden
              />
            ) : null}
          </div>
        ))}

        <div
          className={`pointer-events-none absolute inset-0 z-[2] flex flex-col ${justifyValign} ${innerContentPad} ${contentRow}`}
        >
          <motion.div
            key={slide.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
            className={`${textBlock} pointer-events-auto max-w-full`}
          >
            <p className="text-white/70 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.35em] mb-4 drop-shadow-sm">
              {slide.subtitle}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] text-white uppercase tracking-tight mb-5 drop-shadow-md">
              {slide.title}
            </h2>
            <p
              className={`text-white/75 text-sm sm:text-base leading-relaxed font-light mb-8 ${descMax}`}
            >
              {slide.description}
            </p>
            <Link
              href={`${baseUrl}/products`}
              prefetch={false}
              className={`inline-flex items-center gap-3 rounded-full bg-white pl-7 pr-2 py-2 text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-100 transition-colors ${
                overlayAlign === HERO_OVERLAY_ALIGN_CENTER ? "mx-auto" : ""
              }`}
            >
              <span>Comprar ahora</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </motion.div>
        </div>

        <HeroBottomNav
          slides={slides}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          navMode={navMode}
          reduceMotion={reduceMotion}
          slideMs={HERO_AUTOPLAY_MS}
        />
      </div>
    </section>
  );
}
