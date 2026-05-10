import { createClient } from "./supabase/client";

const SITE_CONFIG_CACHE_TTL_MS = 15 * 60 * 1000;
const siteConfigClientCache = new Map();

export const DEFAULT_SITE_NAME = "Deploy Shop";
export const DEFAULT_SITE_HOSTNAME = "deploy-shop.com";
export const DEFAULT_SITE_HANDLE = "deploy_shop";

const envPlatformBrandName = process.env.NEXT_PUBLIC_PLATFORM_BRAND_NAME;
const envPlatformBrandHost = process.env.NEXT_PUBLIC_PLATFORM_BRAND_HOST;

export const PLATFORM_BRAND_NAME =
  String(envPlatformBrandName || "").trim() || DEFAULT_SITE_NAME;
export const PLATFORM_BRAND_HOSTNAME =
  String(envPlatformBrandHost || "").trim() || DEFAULT_SITE_HOSTNAME;

const normalizeToSlug = (value, fallback) =>
  value
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "") || fallback;

const normalizeToHostname = (value) =>
  value
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") ||
  DEFAULT_SITE_HOSTNAME.replace(/^https?:\/\//, "");

export const formatSiteHandle = (value) =>
  normalizeToSlug(value, DEFAULT_SITE_HANDLE);
export const formatSiteHostname = (value) => normalizeToHostname(value);

export const HERO_VARIANT_CLASSIC = "classic";
export const HERO_VARIANT_CINEMATIC = "cinematic";

export const HERO_NAV_NUMBERS = "numbers";
export const HERO_NAV_PROGRESS_ONLY = "progress_only";

export const HERO_WIDTH_CONTAINED = "contained";
export const HERO_WIDTH_IMMERSIVE = "immersive";

export const HERO_OVERLAY_ALIGN_LEFT = "left";
export const HERO_OVERLAY_ALIGN_CENTER = "center";
export const HERO_OVERLAY_ALIGN_RIGHT = "right";

export const HERO_OVERLAY_VALIGN_TOP = "top";
export const HERO_OVERLAY_VALIGN_MIDDLE = "middle";
export const HERO_OVERLAY_VALIGN_BOTTOM = "bottom";

const HERO_VARIANTS = new Set([HERO_VARIANT_CLASSIC, HERO_VARIANT_CINEMATIC]);

const HERO_OVERLAY_ALIGNS = new Set([
  HERO_OVERLAY_ALIGN_LEFT,
  HERO_OVERLAY_ALIGN_CENTER,
  HERO_OVERLAY_ALIGN_RIGHT,
]);

const HERO_OVERLAY_VALIGNS = new Set([
  HERO_OVERLAY_VALIGN_TOP,
  HERO_OVERLAY_VALIGN_MIDDLE,
  HERO_OVERLAY_VALIGN_BOTTOM,
]);

export const DEFAULT_HOME_INTRO = {
  title: "Elevando tu Estilo Diario",
  description:
    "Descubre una selección exclusiva donde la calidad superior se encuentra con el diseño atemporal. Nuestras piezas aseguran que inviertas en prendas que te acompañarán por años.",
  hero_variant: HERO_VARIANT_CLASSIC,
  hero_nav_mode: HERO_NAV_NUMBERS,
  hero_width_mode: HERO_WIDTH_CONTAINED,
  hero_overlay_align: HERO_OVERLAY_ALIGN_LEFT,
  hero_overlay_valign: HERO_OVERLAY_VALIGN_MIDDLE,
};

export const normalizeHomeIntro = (homeIntro) => {
  const merged = { ...DEFAULT_HOME_INTRO, ...(homeIntro || {}) };
  const rawVariant = merged.hero_variant;

  let hero_variant =
    rawVariant === "centered" ? HERO_VARIANT_CINEMATIC : rawVariant;
  if (!HERO_VARIANTS.has(hero_variant)) {
    hero_variant = HERO_VARIANT_CLASSIC;
  }

  let hero_overlay_align = merged.hero_overlay_align;
  if (
    rawVariant === "centered" &&
    !HERO_OVERLAY_ALIGNS.has(hero_overlay_align)
  ) {
    hero_overlay_align = HERO_OVERLAY_ALIGN_CENTER;
  }
  if (!HERO_OVERLAY_ALIGNS.has(hero_overlay_align)) {
    hero_overlay_align = HERO_OVERLAY_ALIGN_LEFT;
  }

  let hero_overlay_valign = merged.hero_overlay_valign;
  if (!HERO_OVERLAY_VALIGNS.has(hero_overlay_valign)) {
    hero_overlay_valign = HERO_OVERLAY_VALIGN_MIDDLE;
  }

  const hero_nav_mode =
    merged.hero_nav_mode === HERO_NAV_PROGRESS_ONLY
      ? HERO_NAV_PROGRESS_ONLY
      : HERO_NAV_NUMBERS;
  const hero_width_mode =
    merged.hero_width_mode === HERO_WIDTH_IMMERSIVE
      ? HERO_WIDTH_IMMERSIVE
      : HERO_WIDTH_CONTAINED;

  return {
    ...merged,
    hero_variant,
    hero_nav_mode,
    hero_width_mode,
    hero_overlay_align,
    hero_overlay_valign,
  };
};

export const DEFAULT_PRODUCTS_INTRO = {
  title: "Tu tienda de ecommerce",
  description: "Compra todo lo que necesitas en un solo lugar.",
};

export const TENANT_SELECTOR_CARD_VARIANT_EDITORIAL = "editorial";
export const TENANT_SELECTOR_CARD_VARIANT_MINIMAL = "minimal";

export const TENANT_SELECTOR_CARD_TEXT_MODE_AUTO = "auto";
export const TENANT_SELECTOR_CARD_TEXT_MODE_CUSTOM = "custom";

export const TENANT_SELECTOR_CARD_STYLE_LEGACY = "legacy";
export const TENANT_SELECTOR_CARD_STYLE_MODERN = "modern";

export const DEFAULT_TENANT_SELECTOR_CARD = {
  variant: TENANT_SELECTOR_CARD_VARIANT_EDITORIAL,
  card_style: TENANT_SELECTOR_CARD_STYLE_LEGACY,
  text_mode: TENANT_SELECTOR_CARD_TEXT_MODE_AUTO,
  hide_deploy_label: false,
  background_image_url: "",
  custom_eyebrow: "Todo lo que necesitas aca lo encuentras",
  custom_title: "Tu tienda ideal",
  custom_description: "Compra todo lo que necesitas en un solo lugar.",
};

export const DEFAULT_HEADER_MENU = [
  {
    id: "slot-1",
    label: "Productos",
    target_type: "category",
    target_id: null,
  },
];

export const DEFAULT_PROMO_DIVIDER = {
  enabled: true,
  eyebrow: "Archive 2026",
  title_primary: "The New",
  title_secondary: "Standard",
  description:
    "Piezas diseñadas para resistir el paso del tiempo y las tendencias globales.",
  cta_label: "Explorar Selección",
  footer_text: "Minimal Aesthetics — Edition 001",
  image: "/banner-image2.jpg",
};

export const DEFAULT_FOOTER_SETTINGS = {
  description:
    "Curamos piezas esenciales para el guardarropa contemporaneo. Estetica minimalista con un enfoque en la durabilidad y el diseno.",
  instagram_url: "",
  facebook_url: "",
  twitter_url: "",
};

export const DEFAULT_COMMERCE_SETTINGS = {
  whatsapp_number: "58412555555",
  customer_phone_country_code: "58",
  bank_name: "Bancamiga (0172)",
  bank_phone: "0424-5883315",
  bank_document: "V-12345678",
  payment_methods: ["Pago Movil"],
  payment_method_configs: {
    "Pago Movil": {
      owner: "",
      identifier: "",
      contact: "",
      extra: "",
      instructions: "",
    },
    Zelle: {
      owner: "",
      identifier: "",
      contact: "",
      extra: "",
      instructions: "",
    },
    PayPal: {
      owner: "",
      identifier: "",
      contact: "",
      extra: "",
      instructions: "",
    },
    Binance: {
      owner: "",
      identifier: "",
      contact: "",
      extra: "",
      instructions: "",
    },
    Transferencia: {
      owner: "",
      identifier: "",
      contact: "",
      extra: "",
      instructions: "",
    },
  },
  product_notices: [
    "Los envios se realizan de lunes a viernes por MRW y/o Zoom, con un tiempo estimado de entrega de 1 a 3 dias habiles dependiendo de tu ubicacion.",
    "No se hacen devoluciones ni cambios, asegurate de elegir la talla correcta. Si tienes dudas, contactanos antes de comprar.",
  ],
  privacy_title: "Politica de Privacidad",
  privacy_content:
    "Aqui puedes explicar como recolectas, usas y proteges los datos de tus clientes. Incluye contacto para dudas y el periodo de retencion de informacion.",
  terms_title: "Terminos y Condiciones",
  terms_content:
    "Aqui puedes definir condiciones de compra, envios, devoluciones, garantias, limitaciones de responsabilidad y uso general de la tienda.",
  delivery_enabled: true,
  delivery_fee: 5.0,
  free_shipping_threshold: 50.0,
  shipping_local_enabled: true,
  shipping_national_enabled: true,
  shipping_national_type: "cod", // 'cod' (cobro destino), 'fixed' (precio fijo), 'free' (gratis)
  shipping_national_fee: 0.0,
  shipping_pickup_enabled: true,
  currency_code: "USD",
  currency_symbol: "$",
  logo_url: "",
  whatsapp_stock_check: false,
  tenant_selector_card: DEFAULT_TENANT_SELECTOR_CARD,
  shipping_providers: [
    { id: "mrw", name: "MRW", enabled: true },
    { id: "zoom", name: "Zoom", enabled: true },
    { id: "tealca", name: "Tealca", enabled: true },
  ],
};

export const normalizeTenantSelectorCard = (value) => {
  const merged = {
    ...DEFAULT_TENANT_SELECTOR_CARD,
    ...(value || {}),
  };

  const variant =
    merged.variant === TENANT_SELECTOR_CARD_VARIANT_MINIMAL
      ? TENANT_SELECTOR_CARD_VARIANT_MINIMAL
      : TENANT_SELECTOR_CARD_VARIANT_EDITORIAL;

  const card_style =
    merged.card_style === TENANT_SELECTOR_CARD_STYLE_MODERN
      ? TENANT_SELECTOR_CARD_STYLE_MODERN
      : TENANT_SELECTOR_CARD_STYLE_LEGACY;

  return {
    variant,
    card_style,
    text_mode:
      merged.text_mode === TENANT_SELECTOR_CARD_TEXT_MODE_CUSTOM
        ? TENANT_SELECTOR_CARD_TEXT_MODE_CUSTOM
        : TENANT_SELECTOR_CARD_TEXT_MODE_AUTO,
    hide_deploy_label: merged.hide_deploy_label === true,
    background_image_url: String(merged.background_image_url || "").trim(),
    custom_eyebrow:
      String(merged.custom_eyebrow || "").trim() ||
      DEFAULT_TENANT_SELECTOR_CARD.custom_eyebrow,
    custom_title:
      String(merged.custom_title || "").trim() ||
      DEFAULT_TENANT_SELECTOR_CARD.custom_title,
    custom_description:
      String(merged.custom_description || "").trim() ||
      DEFAULT_TENANT_SELECTOR_CARD.custom_description,
  };
};

export const normalizeHeaderMenu = (menu) => {
  // Si el menú es estrictamente null o undefined (primer inicio), usamos el DEFAULT
  if (menu === null || menu === undefined) return DEFAULT_HEADER_MENU;

  // Si el usuario guardó un array (incluso vacío []), respetamos su decisión
  if (Array.isArray(menu)) {
    return menu.map((item, index) => ({
      id: item.id || `slot-${index + 1}`,
      label: item.label || "Nuevo Enlace",
      target_type:
        item.target_type === "subcategory" ? "subcategory" : "category",
      target_id: item.target_id || null,
    }));
  }

  return DEFAULT_HEADER_MENU;
};

export const normalizePromoDivider = (promoDivider) => {
  const merged = { ...DEFAULT_PROMO_DIVIDER, ...(promoDivider || {}) };
  return {
    ...merged,
    enabled: merged.enabled !== false,
  };
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasObjectValues = (value) =>
  isPlainObject(value) && Object.keys(value).length > 0;

const pickKnownFields = (source, defaults) => {
  if (!isPlainObject(source)) return {};

  return Object.fromEntries(
    Object.keys(defaults)
      .filter((key) => Object.prototype.hasOwnProperty.call(source, key))
      .map((key) => [key, source[key]]),
  );
};

export const pickFooterSettingsFields = (source) => {
  const picked = pickKnownFields(source, DEFAULT_FOOTER_SETTINGS);

  if (source?.instagram && !picked.instagram_url) {
    picked.instagram_url = source.instagram;
  }
  if (source?.facebook && !picked.facebook_url) {
    picked.facebook_url = source.facebook;
  }
  if (source?.twitter && !picked.twitter_url) {
    picked.twitter_url = source.twitter;
  }

  return picked;
};

export const pickCommerceSettingsFields = (source) =>
  pickKnownFields(source, DEFAULT_COMMERCE_SETTINGS);

export const normalizeFooterSettings = (footerSettings) => ({
  ...DEFAULT_FOOTER_SETTINGS,
  ...pickFooterSettingsFields(footerSettings),
});

export const normalizeHeroSlides = (heroSlides) => {
  if (!Array.isArray(heroSlides) || heroSlides.length === 0) {
    return returnDefaults().hero_slides;
  }
  return heroSlides.map((slide) => ({
    ...slide,
    image: slide.image || "/banner-clothes.jpg",
  }));
};

export const normalizeCommerceSettings = (commerceSettings) => {
  const normalized = {
    ...DEFAULT_COMMERCE_SETTINGS,
    ...pickCommerceSettingsFields(commerceSettings),
  };

  return {
    ...normalized,
    customer_phone_country_code:
      String(normalized.customer_phone_country_code || "58")
        .replace(/\D/g, "")
        .trim() || "58",
    payment_methods: Array.isArray(normalized.payment_methods)
      ? normalized.payment_methods.filter((method) =>
          [
            "Pago Movil",
            "Nequi",
            "Zelle",
            "PayPal",
            "Binance",
            "Transferencia",
          ].includes(method),
        )
      : DEFAULT_COMMERCE_SETTINGS.payment_methods,
    payment_method_configs: (() => {
      const defaults = DEFAULT_COMMERCE_SETTINGS.payment_method_configs;
      const fromPayload = normalized.payment_method_configs || {};
      const legacyDetails = commerceSettings?.payment_method_details || {};

      return Object.fromEntries(
        Object.entries(defaults).map(([method, defaultConfig]) => {
          const nextConfig = {
            ...defaultConfig,
            ...(fromPayload[method] || {}),
          };

          if (!nextConfig.instructions && legacyDetails[method]) {
            nextConfig.instructions = String(legacyDetails[method]);
          }

          return [method, nextConfig];
        }),
      );
    })(),
    product_notices: Array.isArray(normalized.product_notices)
      ? normalized.product_notices
          .map((notice) => String(notice || "").trim())
          .filter(Boolean)
          .slice(0, 3)
      : DEFAULT_COMMERCE_SETTINGS.product_notices,
    delivery_enabled: normalized.delivery_enabled !== false,
    delivery_fee: Number(normalized.delivery_fee ?? 0),
    free_shipping_threshold: Number(normalized.free_shipping_threshold ?? 0),
    shipping_local_enabled: normalized.shipping_local_enabled !== false,
    shipping_national_enabled: normalized.shipping_national_enabled !== false,
    shipping_national_type: normalized.shipping_national_type || "cod",
    shipping_national_fee: Number(normalized.shipping_national_fee ?? 0),
    shipping_pickup_enabled: normalized.shipping_pickup_enabled !== false,
    tenant_selector_card: normalizeTenantSelectorCard(
      normalized.tenant_selector_card,
    ),
  };
};

export const resolveLegacyCommerceSettings = (row = {}) => {
  const legacy = row?.footer_commerce;
  if (!isPlainObject(legacy)) return null;
  // Root legacy values win because older rows can have stale nested defaults.
  const nested = isPlainObject(legacy.commerce_settings)
    ? legacy.commerce_settings
    : isPlainObject(legacy.commerce)
      ? legacy.commerce
      : {};
  const merged = {
    ...pickCommerceSettingsFields(nested),
    ...pickCommerceSettingsFields(legacy),
  };

  return Object.keys(merged).length ? merged : null;
};

export const resolveLegacyFooterSettings = (row = {}) => {
  const legacy = row?.footer_commerce;
  if (!isPlainObject(legacy)) return null;

  const nested = isPlainObject(legacy.footer_settings)
    ? legacy.footer_settings
    : isPlainObject(legacy.footer)
      ? legacy.footer
      : {};
  const merged = {
    ...pickFooterSettingsFields(nested),
    ...pickFooterSettingsFields(legacy),
  };

  return Object.keys(merged).length ? merged : null;
};

const getClientCacheKey = ({ tenantId, tenantSlug } = {}) =>
  tenantId
    ? `tenant:${tenantId}`
    : tenantSlug
      ? `slug:${tenantSlug}`
      : "default";

const readClientCachedSiteConfig = (key) => {
  const cached = siteConfigClientCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    siteConfigClientCache.delete(key);
    return null;
  }
  return cached.data;
};

const writeClientCachedSiteConfig = (key, data) => {
  siteConfigClientCache.set(key, {
    data,
    expiresAt: Date.now() + SITE_CONFIG_CACHE_TTL_MS,
  });
};

export const clearClientCachedSiteConfig = (key = null) => {
  if (key) {
    siteConfigClientCache.delete(key);
  } else {
    siteConfigClientCache.clear();
  }
};

export const normalizeWhatsappNumber = (value) =>
  String(value || "").replace(/\D/g, "");

export const formatWhatsappContactNumber = (
  value,
  defaultCountryCode = "58",
) => {
  const digits = normalizeWhatsappNumber(value);
  const countryCode = normalizeWhatsappNumber(defaultCountryCode) || "58";

  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
  if (digits.length <= 10) return `${countryCode}${digits}`;
  return digits;
};

export const getSiteConfig = async ({ tenantId, tenantSlug } = {}) => {
  if (typeof window === "undefined") {
    const { getSiteConfigServerCached } = await import("./siteConfig.server");
    return getSiteConfigServerCached({ tenantId, tenantSlug });
  }

  const cacheKey = getClientCacheKey({ tenantId, tenantSlug });
  const cached = readClientCachedSiteConfig(cacheKey);
  if (cached) return cached;

  const supabase = createClient();

  let activeTenantId = tenantId;

  // 1. Si no tenemos ID pero tenemos SLUG, lo buscamos
  if (!activeTenantId && tenantSlug) {
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("slug", tenantSlug)
      .eq("status", "Active")
      .maybeSingle();
    activeTenantId = tenantRow?.tenant_id;
  }

  // 1.1. Si seguimos sin ID, tomamos el primer tenant activo para admin
  if (!activeTenantId) {
    const { data: firstTenant } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("status", "Active")
      .limit(1)
      .maybeSingle();
    activeTenantId = firstTenant?.tenant_id;
  }

  // 2. Si finalmente no hay ID, devolvemos los defaults
  if (!activeTenantId) {
    const defaults = returnDefaults(tenantId);
    writeClientCachedSiteConfig(cacheKey, defaults);
    return defaults;
  }

  // 3. Usamos maybeSingle() para que si no hay datos, data sea null en lugar de lanzar error
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tenant_id", activeTenantId)
    .maybeSingle();

  // 3. Si hay un error real de conexión o la tabla no existe
  if (error) {
    console.error("Error crítico de base de datos:", error.message);
    const defaults = returnDefaults();
    writeClientCachedSiteConfig(cacheKey, defaults);
    return defaults;
  }

  // 4. Si la consulta fue exitosa pero no hay datos (tabla vacía)
  if (!data) {
    const defaults = returnDefaults(activeTenantId);
    writeClientCachedSiteConfig(cacheKey, defaults);
    return defaults;
  }

  // 5. Si hay datos, normalizamos
  const normalized = {
    tenant_id: activeTenantId,
    ...data,
    hero_slides: normalizeHeroSlides(data.hero_slides),
    home_intro: normalizeHomeIntro(data.home_intro),
    products_intro: {
      ...DEFAULT_PRODUCTS_INTRO,
      ...(data.products_intro || {}),
    },
    header_menu: normalizeHeaderMenu(data.header_menu),
    promo_divider: normalizePromoDivider(data.promo_divider),
    footer_settings: normalizeFooterSettings(
      hasObjectValues(data.footer_settings)
        ? data.footer_settings
        : resolveLegacyFooterSettings(data),
    ),
    commerce_settings: normalizeCommerceSettings(
      hasObjectValues(data.commerce_settings)
        ? data.commerce_settings
        : resolveLegacyCommerceSettings(data),
    ),
  };

  writeClientCachedSiteConfig(cacheKey, normalized);
  return normalized;
};

// Función auxiliar para no repetir código
export const returnDefaults = (tenantId = null) => ({
  tenant_id: tenantId,
  site_name: DEFAULT_SITE_NAME,
  hero_slides: [
    {
      id: 1,
      subtitle: "- Colecciones",
      title: "Explora",
      description: "...",
      image: "/banner-clothes.jpg",
    },
  ],
  home_intro: DEFAULT_HOME_INTRO,
  products_intro: DEFAULT_PRODUCTS_INTRO,
  header_menu: DEFAULT_HEADER_MENU,
  promo_divider: DEFAULT_PROMO_DIVIDER,
  footer_settings: DEFAULT_FOOTER_SETTINGS,
  commerce_settings: DEFAULT_COMMERCE_SETTINGS,
});

export const updateSiteConfig = async (payload, { tenantId } = {}) => {
  const supabase = createClient();

  let finalTenantId = tenantId || payload?.tenant_id;
  if (finalTenantId && !isNaN(finalTenantId)) {
    finalTenantId = Number(finalTenantId);
  }

  // LOG PARA DEBUG:
  console.log("[updateSiteConfig] finalTenantId:", finalTenantId, "type:", typeof finalTenantId);

  if (!finalTenantId) {
    throw new Error("No se pudo identificar el Tenant ID para guardar la configuración.");
  }

  const { loading, refresh, tenant_slug, tenant_id, ...cleanPayload } = payload;

  // Invalidamos la caché local
  const cacheKey = getClientCacheKey({ tenantId: finalTenantId });
  clearClientCachedSiteConfig(cacheKey);
  clearClientCachedSiteConfig("default");

  // Incluimos tenantId para asegurar consistencia
  const rowPayload = {
    ...cleanPayload,
    tenant_id: finalTenantId,
    updated_at: new Date(),
  };

  const hasPayloadKey = (key) =>
    Object.prototype.hasOwnProperty.call(cleanPayload, key);
  const hasFooterSettingsPayload = hasPayloadKey("footer_settings");
  const hasCommerceSettingsPayload = hasPayloadKey("commerce_settings");

  // 1. Obtener datos actuales para evitar pisar footer_commerce si solo actualizamos una parte
  if (hasFooterSettingsPayload || hasCommerceSettingsPayload) {
    const { data: current } = await supabase
      .from("site_settings")
      .select("footer_commerce")
      .eq("tenant_id", finalTenantId)
      .maybeSingle();

    const existingLegacy = isPlainObject(current?.footer_commerce)
      ? current.footer_commerce
      : {};
    const nextFooterSettings = hasFooterSettingsPayload
      ? normalizeFooterSettings(cleanPayload.footer_settings)
      : resolveLegacyFooterSettings({ footer_commerce: existingLegacy });
    const nextCommerceSettings = hasCommerceSettingsPayload
      ? normalizeCommerceSettings(cleanPayload.commerce_settings)
      : resolveLegacyCommerceSettings({ footer_commerce: existingLegacy });
    const legacyFooterFields = pickFooterSettingsFields(nextFooterSettings);
    const legacyCommerceFields =
      pickCommerceSettingsFields(nextCommerceSettings);

    rowPayload.footer_commerce = {
      ...existingLegacy,
      ...legacyFooterFields,
      ...legacyCommerceFields,
      ...(hasFooterSettingsPayload
        ? { footer_settings: legacyFooterFields }
        : {}),
      ...(hasCommerceSettingsPayload
        ? { commerce_settings: legacyCommerceFields }
        : {}),
    };
  }

  const extractMissingColumn = (errorMessage = "") => {
    const match = errorMessage.match(/Could not find the '([^']+)' column/i);
    return match?.[1] || null;
  };

  // Fallback genérico para esquemas parcialmente migrados:
  // removemos columnas inexistentes y reintentamos.
  const workingPayload = { ...rowPayload };
  const maxAttempts = Object.keys(workingPayload).length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(workingPayload, {
        onConflict: "tenant_id", // Asegúrate que tenant_id sea PK o UNIQUE en la DB
      })
      .select()
      .maybeSingle();

    if (!error) return data;

    const missingColumn = extractMissingColumn(error.message || "");
    if (missingColumn && missingColumn in workingPayload) {
      console.warn(
        `site_settings no tiene la columna "${missingColumn}". Se omitirá en esta actualización.`,
      );
      delete workingPayload[missingColumn];
      continue;
    }

    throw error;
  }

  throw new Error(
    "No se pudo actualizar site_settings después de aplicar fallback por columnas faltantes.",
  );
};
