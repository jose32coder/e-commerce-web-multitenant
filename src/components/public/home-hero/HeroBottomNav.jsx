"use client";

import { motion } from "framer-motion";
import { HERO_NAV_PROGRESS_ONLY } from "@/lib/siteConfig";

export default function HeroBottomNav({
  slides,
  activeIndex,
  onSelect,
  navMode,
  reduceMotion,
  slideMs,
}) {
  const showNumbers = navMode !== HERO_NAV_PROGRESS_ONLY;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[3] px-4 sm:px-8 pb-6 sm:pb-8">
      <div
        className="flex w-full gap-1 sm:gap-2"
        role="tablist"
        aria-label="Slides del hero"
      >
        {slides.map((s, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(i)}
              className={`relative flex-1 min-h-[44px] text-left transition-opacity ${
                active ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
            >
              {showNumbers && (
                <span
                  className={`block text-[11px] sm:text-xs font-black tracking-widest mb-2 ${
                    active ? "text-white" : "text-white/50"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <div className="relative h-px w-full bg-white/20 overflow-hidden rounded-full">
                {active && !reduceMotion && (
                  <motion.div
                    key={`progress-${activeIndex}-${i}`}
                    className="absolute inset-y-0 left-0 bg-white rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: slideMs / 1000,
                      ease: "linear",
                    }}
                  />
                )}
                {active && reduceMotion && (
                  <div className="absolute inset-y-0 left-0 w-full bg-white rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
