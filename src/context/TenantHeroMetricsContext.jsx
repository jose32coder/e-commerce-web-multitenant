"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

const TenantHeroMetricsContext = createContext({
  heroBottomScrollY: null,
  setHeroBottomScrollY: () => {},
});

export function TenantHeroMetricsProvider({ children }) {
  const [heroBottomScrollY, setHeroBottomScrollY] = useState(null);

  return (
    <TenantHeroMetricsContext.Provider
      value={{ heroBottomScrollY, setHeroBottomScrollY }}
    >
      {children}
    </TenantHeroMetricsContext.Provider>
  );
}

export function useTenantHeroMetrics() {
  return useContext(TenantHeroMetricsContext);
}

/**
 * Reporta el borde inferior del hero (coordenada Y en el documento).
 * Solo HeroCinematic en home; al desmontar limpia.
 */
export function useRegisterHeroBottom(sectionRef, enabled) {
  const { setHeroBottomScrollY } = useTenantHeroMetrics();

  useLayoutEffect(() => {
    if (!enabled) {
      setHeroBottomScrollY(null);
      return;
    }

    const el = sectionRef.current;
    if (!el) {
      setHeroBottomScrollY(null);
      return;
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setHeroBottomScrollY(rect.bottom + window.scrollY);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      setHeroBottomScrollY(null);
    };
  }, [enabled, setHeroBottomScrollY, sectionRef]);
}
