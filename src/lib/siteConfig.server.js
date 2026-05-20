import { unstable_cache } from "next/cache";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_MENU,
  DEFAULT_PRODUCTS_INTRO,
  normalizeCommerceSettings,
  normalizeFooterSettings,
  normalizeHeaderMenu,
  normalizeHeroSlides,
  normalizeHomeIntro,
  normalizePromoDivider,
  resolveLegacyCommerceSettings,
  resolveLegacyFooterSettings,
  returnDefaults,
} from "./siteConfig";
import { getPublicSupabaseClient } from "./supabase/public";

const hasObjectValues = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0;

export const getTenantIdBySlugCached = unstable_cache(
  async (tenantSlug) => {
    if (!tenantSlug) return null;
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("slug", tenantSlug)
      .eq("status", "Active")
      .maybeSingle();

    if (data?.tenant_id) return data.tenant_id;

    // Fallback por si el status en la base de datos no es exactamente "Active"
    const { data: fallback } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("slug", tenantSlug)
      .maybeSingle();
    return fallback?.tenant_id || null;
  },
  ["tenant-id-by-slug"],
  { revalidate: 900, tags: ["tenants"] },
);

const getFirstActiveTenantIdCached = unstable_cache(
  async () => {
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("status", "Active")
      .limit(1)
      .maybeSingle();
    return data?.tenant_id || null;
  },
  ["first-active-tenant-id"],
  { revalidate: 900, tags: ["tenants"] },
);

const getTenantSlugByIdCached = unstable_cache(
  async (tenantId) => {
    if (!tenantId) return null;
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("tenants")
      .select("slug")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    return data?.slug || null;
  },
  ["tenant-slug-by-id"],
  { revalidate: 900, tags: ["tenants"] },
);

const getSiteSettingsByTenantIdCached = unstable_cache(
  async (tenantId) => {
    if (!tenantId) return null;
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    return data || null;
  },
  ["site-settings-by-tenant-id"],
  { revalidate: 900, tags: ["site-settings"] },
);

export async function getSiteConfigServerCached({ tenantId, tenantSlug } = {}) {
  let activeTenantId = tenantId || null;
  let activeTenantSlug = tenantSlug || null;

  if (!activeTenantId && tenantSlug) {
    activeTenantId = await getTenantIdBySlugCached(tenantSlug);
    activeTenantSlug = tenantSlug;
  }

  if (!activeTenantId) {
    activeTenantId = await getFirstActiveTenantIdCached();
  }

  if (activeTenantId && !activeTenantSlug) {
    activeTenantSlug = await getTenantSlugByIdCached(activeTenantId);
  }

  if (!activeTenantId) {
    return {
      ...returnDefaults(tenantId || null),
      tenant_slug: activeTenantSlug,
    };
  }

  const data = await getSiteSettingsByTenantIdCached(activeTenantId);
  if (!data) {
    return {
      ...returnDefaults(activeTenantId),
      tenant_slug: activeTenantSlug,
    };
  }

  return {
    tenant_id: activeTenantId,
    ...data,
    tenant_slug: activeTenantSlug,
    hero_slides: normalizeHeroSlides(data.hero_slides),
    home_intro: normalizeHomeIntro(data.home_intro),
    products_intro: {
      ...DEFAULT_PRODUCTS_INTRO,
      ...(data.products_intro || {}),
    },
    header_menu: normalizeHeaderMenu(data.header_menu),
    promo_divider: normalizePromoDivider(data.promo_divider),
    footer_settings: normalizeFooterSettings(
      (hasObjectValues(data.footer_settings)
        ? data.footer_settings
        : resolveLegacyFooterSettings(data)) || DEFAULT_FOOTER_SETTINGS,
    ),
    commerce_settings: normalizeCommerceSettings(
      (hasObjectValues(data.commerce_settings)
        ? data.commerce_settings
        : resolveLegacyCommerceSettings(data)) || DEFAULT_COMMERCE_SETTINGS,
    ),
  };
}
