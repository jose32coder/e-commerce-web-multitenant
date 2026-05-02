"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_MENU,
  DEFAULT_HOME_INTRO,
  DEFAULT_PROMO_DIVIDER,
  DEFAULT_PRODUCTS_INTRO,
  DEFAULT_SITE_NAME,
  getSiteConfig,
  normalizeCommerceSettings,
  normalizeFooterSettings,
  normalizeHeaderMenu,
  normalizeHeroSlides,
  normalizeHomeIntro,
  normalizePromoDivider,
} from "@/lib/siteConfig";
import { createClient } from "@/lib/supabase/client";

import { getExchangeRates } from "@/services/exchangeRates";

const SiteConfigContext = createContext();

const resolveLegacyFooterSettings = (row = {}) => {
  const legacy = row?.footer_commerce;
  if (!legacy || typeof legacy !== "object") return null;
  return legacy.footer_settings || legacy.footer || legacy;
};

const resolveLegacyCommerceSettings = (row = {}) => {
  const legacy = row?.footer_commerce;
  if (!legacy || typeof legacy !== "object") return null;
  return legacy.commerce_settings || legacy.commerce || legacy;
};

export function SiteConfigProvider({
  children,
  tenantId = null,
  tenantSlug = null,
  initialData = null,
}) {
  const [config, setConfig] = useState(() => {
    const base = {
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      site_name: DEFAULT_SITE_NAME,
      hero_slides: [],
      home_intro: DEFAULT_HOME_INTRO,
      products_intro: DEFAULT_PRODUCTS_INTRO,
      header_menu: DEFAULT_HEADER_MENU,
      promo_divider: DEFAULT_PROMO_DIVIDER,
      footer_settings: DEFAULT_FOOTER_SETTINGS,
      commerce_settings: DEFAULT_COMMERCE_SETTINGS,
      exchange_rates: null,
      loading: true,
    };

    if (!initialData || typeof initialData !== "object") return base;

    return {
      ...base,
      ...initialData,
      tenant_id: initialData.tenant_id ?? tenantId,
      tenant_slug: tenantSlug || initialData.tenant_slug || null,
      hero_slides: normalizeHeroSlides(initialData.hero_slides),
      home_intro: normalizeHomeIntro(initialData.home_intro),
      products_intro: {
        ...DEFAULT_PRODUCTS_INTRO,
        ...(initialData.products_intro || {}),
      },
      header_menu: normalizeHeaderMenu(initialData.header_menu),
      promo_divider: normalizePromoDivider(initialData.promo_divider),
      footer_settings: normalizeFooterSettings(
        initialData.footer_settings || resolveLegacyFooterSettings(initialData),
      ),
      commerce_settings: normalizeCommerceSettings(
        initialData.commerce_settings ||
          resolveLegacyCommerceSettings(initialData),
      ),
      loading: false,
    };
  });

  const fetchConfig = useCallback(async () => {
    try {
      const supabase = createClient();

      // Cargar config en paralelo
      const data = await getSiteConfig({
        tenantId,
        tenantSlug: tenantSlug || undefined,
      });

      // Cargar tasas de cambio sin bloquear el render
      // Si ya hay tasas en localStorage/DB, esto será muy rápido
      const rates = await getExchangeRates(supabase);

      setConfig((prev) => ({
        ...prev,
        ...data,
        tenant_id: data?.tenant_id ?? prev.tenant_id ?? tenantId ?? null,
        tenant_slug: prev.tenant_slug || tenantSlug || null,
        hero_slides: normalizeHeroSlides(data.hero_slides),
        home_intro: normalizeHomeIntro(data.home_intro),
        products_intro: {
          ...DEFAULT_PRODUCTS_INTRO,
          ...(data.products_intro || {}),
        },
        header_menu: normalizeHeaderMenu(data.header_menu),
        promo_divider: normalizePromoDivider(data.promo_divider),
        footer_settings: normalizeFooterSettings(
          data.footer_settings || resolveLegacyFooterSettings(data),
        ),
        commerce_settings: normalizeCommerceSettings(
          data.commerce_settings || resolveLegacyCommerceSettings(data),
        ),
        exchange_rates: rates || prev.exchange_rates, // Mantener tasas anteriores si falla
        loading: false,
      }));
    } catch (error) {
      console.error("Context fetch error:", error);
      setConfig((prev) => ({ ...prev, loading: false }));
    }
  }, [tenantId, tenantSlug]);

  const patchConfig = useCallback((partial = {}) => {
    if (!partial || typeof partial !== "object") return;

    const hasKey = (key) => Object.prototype.hasOwnProperty.call(partial, key);

    setConfig((prev) => {
      const footerSource =
        (hasKey("footer_settings") ? partial.footer_settings : undefined) ??
        resolveLegacyFooterSettings(partial) ??
        prev.footer_settings;

      const commerceSource =
        (hasKey("commerce_settings") ? partial.commerce_settings : undefined) ??
        resolveLegacyCommerceSettings(partial) ??
        prev.commerce_settings;

      return {
        ...prev,
        ...partial,
        tenant_id: hasKey("tenant_id") ? partial.tenant_id : prev.tenant_id,
        tenant_slug: hasKey("tenant_slug")
          ? partial.tenant_slug
          : prev.tenant_slug,
        hero_slides: normalizeHeroSlides(
          hasKey("hero_slides") ? partial.hero_slides : prev.hero_slides,
        ),
        home_intro: normalizeHomeIntro(
          hasKey("home_intro") ? partial.home_intro : prev.home_intro,
        ),
        products_intro: {
          ...DEFAULT_PRODUCTS_INTRO,
          ...(hasKey("products_intro")
            ? partial.products_intro || {}
            : prev.products_intro || {}),
        },
        header_menu: normalizeHeaderMenu(
          hasKey("header_menu") ? partial.header_menu : prev.header_menu,
        ),
        promo_divider: normalizePromoDivider(
          hasKey("promo_divider")
            ? partial.promo_divider
            : prev.promo_divider,
        ),
        footer_settings: normalizeFooterSettings(footerSource),
        commerce_settings: normalizeCommerceSettings(commerceSource),
        exchange_rates: hasKey("exchange_rates")
          ? partial.exchange_rates
          : prev.exchange_rates,
        loading: false,
      };
    });
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      await fetchConfig();
    };
    loadConfig();

    // Real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel(`site_settings_changes_${tenantId || "default"}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
          filter: tenantId ? `tenant_id=eq.${tenantId}` : "tenant_id=eq.1",
        },
        (payload) => {
          const nextRow = payload?.new || {};
          const hasKey = (key) =>
            Object.prototype.hasOwnProperty.call(nextRow, key);

          setConfig((prev) => {
            const footerSource =
              nextRow.footer_settings ??
              resolveLegacyFooterSettings(nextRow) ??
              prev.footer_settings;

            const commerceSource =
              nextRow.commerce_settings ??
              resolveLegacyCommerceSettings(nextRow) ??
              prev.commerce_settings;

            return {
              ...prev,
              ...payload.new,
              tenant_slug: prev.tenant_slug,
              hero_slides: normalizeHeroSlides(
                hasKey("hero_slides") ? nextRow.hero_slides : prev.hero_slides,
              ),
              home_intro: normalizeHomeIntro(
                hasKey("home_intro") ? nextRow.home_intro : prev.home_intro,
              ),
              products_intro: {
                ...DEFAULT_PRODUCTS_INTRO,
                ...(hasKey("products_intro")
                  ? nextRow.products_intro || {}
                  : prev.products_intro || {}),
              },
              header_menu: normalizeHeaderMenu(
                hasKey("header_menu") ? nextRow.header_menu : prev.header_menu,
              ),
              promo_divider: normalizePromoDivider(
                hasKey("promo_divider")
                  ? nextRow.promo_divider
                  : prev.promo_divider,
              ),
              footer_settings: normalizeFooterSettings(footerSource),
              commerce_settings: normalizeCommerceSettings(commerceSource),
              loading: false,
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchConfig]);

  return (
    <SiteConfigContext.Provider
      value={{ ...config, refresh: fetchConfig, patchConfig }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error("useSiteConfig must be used within a SiteConfigProvider");
  }
  return context;
};
