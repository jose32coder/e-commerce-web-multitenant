import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  PLATFORM_BRAND_NAME,
  formatWhatsappContactNumber,
  normalizeCommerceSettings,
  normalizeFooterSettings,
  resolveLegacyCommerceSettings,
  resolveLegacyFooterSettings,
} from "@/lib/siteConfig";
import TenantList from "@/components/TenantList";

export const revalidate = 0;

const normalizeExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const normalizeInstagramUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("@")) {
    return `https://instagram.com/${url.slice(1)}`;
  }
  return normalizeExternalUrl(url);
};

const formatHour = (value) => {
  if (!value) return "";
  const [hour, minute] = String(value).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return String(value);
  return new Date(0, 0, 0, hour, minute).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HERO_COPY =
  "Explora acá las mejores tiendas y compra productos de calidad.";

async function getTenantCards() {
  const supabase = getAdminSupabaseClient();
  const { data: tenantsData, error: tenantsError } = await supabase
    .from("tenants")
    .select(
      "tenant_id, name, slug, status, store_type, logo_url, whatsapp_number",
    )
    .eq("status", "Active")
    .order("created_at", { ascending: true });

  if (tenantsError) {
    console.error("Error loading active tenants:", tenantsError.message);
    return [];
  }

  const tenants = tenantsData || [];
  if (tenants.length === 0) return [];
  const tenantIds = tenants.map((tenant) => tenant.tenant_id);

  // Seleccionamos todo (*) para evitar errores con columnas faltantes y asegurar que traemos footer_commerce
  const { data: settingsRows } = await supabase
    .from("site_settings")
    .select("*")
    .in("tenant_id", tenantIds);

  const settingsByTenant = new Map(
    (settingsRows || []).map((row) => [row.tenant_id, row]),
  );

  return tenants.map((tenant, index) => {
    const settings = settingsByTenant.get(tenant.tenant_id) || {};

    // Resolvemos las configuraciones priorizando las columnas modernas si existen
    const legacyCommerce = resolveLegacyCommerceSettings(settings) || {};
    const currentCommerce = settings?.commerce_settings || {};

    // Construimos la fuente de verdad para el comercio
    const commerceSource = {
      ...legacyCommerce,
      ...currentCommerce,
    };

    // Normalizamos para aplicar defaults y asegurar estructura
    const normalizedCommerce = normalizeCommerceSettings(commerceSource);
    const tenantCardConfig = normalizedCommerce.tenant_selector_card || {};

    const legacyFooter = resolveLegacyFooterSettings(settings) || {};
    const currentFooter = settings?.footer_settings || {};
    const footerSource = {
      ...legacyFooter,
      ...currentFooter,
    };
    const normalizedFooter = normalizeFooterSettings(footerSource);

    const autoTitle =
      settings?.products_intro?.title ||
      settings?.home_intro?.title ||
      "Curated Goods";
    const autoDescription =
      settings?.products_intro?.description ||
      settings?.home_intro?.description ||
      "Experiencia premium personalizada.";

    const useCustomText = tenantCardConfig.text_mode === "custom";
    const whatsappNumber = formatWhatsappContactNumber(
      normalizedCommerce.whatsapp_number,
      normalizedCommerce.customer_phone_country_code,
    );

    // Si no se encuentra en la configuración normalizada, intentamos buscarlo en footer_commerce
    let finalBg = tenantCardConfig.background_image_url;
    if (!finalBg && settings.footer_commerce) {
      finalBg =
        settings.footer_commerce.background_image_url ||
        settings.footer_commerce.commerce_settings?.tenant_selector_card
          ?.background_image_url ||
        settings.footer_commerce.commerce_settings?.background_image_url ||
        "";
    }

    return {
      ...tenant,
      eyebrow: String(
        useCustomText ? tenantCardConfig.custom_eyebrow : autoTitle,
      )
        .toUpperCase()
        .slice(0, 48),
      description: useCustomText
        ? tenantCardConfig.custom_description
        : autoDescription,
      card_title:
        (useCustomText ? tenantCardConfig.custom_title : tenant.name) ||
        tenant.name,
      card_variant: tenantCardConfig.variant || "editorial",
      card_style: tenantCardConfig.card_style || "legacy",
      hide_deploy_label: tenantCardConfig.hide_deploy_label === true,
      background_image_url: finalBg || "",
      whatsapp_url: whatsappNumber ? `https://wa.me/${whatsappNumber}` : "",
      instagram_url: normalizeInstagramUrl(normalizedFooter.instagram_url),
      store_url: tenant.store_url || `/${tenant.slug}`,
      business_hours: normalizedCommerce.business_hours || [],
      delay: `${index * 40}ms`,
    };
  });
}

export default async function TenantSelectorPage() {
  const tenantCards = await getTenantCards();
  const platformBrand = PLATFORM_BRAND_NAME;
  const footerBusinessHours =
    tenantCards.find(
      (tenant) =>
        Array.isArray(tenant.business_hours) &&
        tenant.business_hours.length > 0,
    )?.business_hours || [];

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-700 overflow-x-hidden">
      {/* HEADER: Ajustado para que el texto no choque en móviles pequeños */}
      <header className="border-b border-zinc-200/80 bg-slate-50/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-14 md:h-16 px-4 sm:px-6 flex items-center justify-between">
          <p className="font-serif text-xl md:text-2xl tracking-tight text-zinc-700 truncate mr-4">
            {platformBrand}
          </p>
          <Link
            href="/access"
            className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-all shrink-0"
          >
            <UserRound size={16} />
          </Link>
        </div>
      </header>

      {/* HERO SECTION: Tipografía fluida y márgenes adaptativos */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-16 pb-8 md:pb-12">
        <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-5 mb-8 md:mb-12">
          <h1 className="font-serif uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Encuentra tu <span className="block md:inline">tienda ideal</span>
          </h1>
          <p className="text-sm md:text-lg lg:text-xl text-slate-600 italic max-w-2xl mx-auto px-4">
            &ldquo;{HERO_COPY}&rdquo;
          </p>
        </div>

        {/* LISTADO: El componente TenantList debe manejar internamente su grid responsivo */}
        <div className="w-full">
          <TenantList initialTenants={tenantCards} />
        </div>
      </section>

      {/* BANNER INFERIOR: Altura adaptativa y reescalado de imagen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-75 md:min-h-100 border border-zinc-200 shadow-lg md:shadow-xl">
          <Image
            src="/banner-image2.jpg"
            alt="Atelier background"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          <div className="absolute inset-0 bg-zinc-900/40 md:bg-zinc-900/30" />
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
            <div className="bg-white/90 md:bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl p-6 md:p-10 text-center max-w-[90%] md:max-w-md shadow-2xl">
              <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-zinc-800 leading-relaxed">
                &ldquo;El futuro del comercio independiente comienza
                aquí.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER: De columna en móvil a fila en desktop */}
      <footer className="border-t border-zinc-200 py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <span className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-400 text-center md:text-left">
            © {new Date().getFullYear()} {platformBrand}{" "}
            <span className="hidden sm:inline">·</span>{" "}
            <br className="sm:hidden" /> Todos los derechos reservados
          </span>
          <span className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-500 font-medium">
            Desarrollado por <span className="text-zinc-800">Deploy</span>
          </span>
        </div>

      </footer>
    </main>
  );
}
