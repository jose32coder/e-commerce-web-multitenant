"use client";

import * as React from "react";

const DEFAULT_MS = 5000;

export function useHeroAutoplay(count, reduceMotion, ms = DEFAULT_MS) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (count <= 1 || reduceMotion) return undefined;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, ms);
    return () => window.clearInterval(id);
  }, [count, reduceMotion, activeIndex, ms]);

  return [activeIndex, setActiveIndex];
}

export const HERO_AUTOPLAY_MS = DEFAULT_MS;
