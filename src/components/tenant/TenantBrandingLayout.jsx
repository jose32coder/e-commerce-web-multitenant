import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { getSiteConfigServerCached } from "@/lib/siteConfig.server";
import { headers } from "next/headers";
import { getExchangeRates } from "@/services/exchangeRates";

/**
 * Server Component para layout multitenant.
 * Ajustado a la estructura real: tenant_id, nombre, status.
 */
export default async function TenantBrandingLayout({ tenant, children }) {
  const supabase = await createClient();

  // 1. Obtener datos básicos del tenant
  const { data: tenantRow, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "tenant_id, slug, name, logo_url, primary_color, secondary_color, status",
    )
    .eq("slug", tenant)
    .eq("status", "Active")
    .maybeSingle();

  if (tenantError) {
    console.error("Tenant lookup error:", tenantError.message);
  }

  if (!tenantRow) {
    notFound();
  }

  const siteConfig = await getSiteConfigServerCached({
    tenantId: tenantRow.tenant_id,
  });

  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || "VE";

  // Cargar tasas de cambio
  const rawRates = await getExchangeRates(supabase);
  
  // Filtrado por país
  let rates = rawRates;
  if (rawRates) {
    if (country === "VE") {
      rates = { USD: 1, VES: rawRates.VES };
    } else if (country === "CO") {
      rates = { USD: 1, COP: rawRates.COP };
    }
  }

  return (
    <SiteConfigProvider
      tenantId={tenantRow.tenant_id}
      tenantSlug={tenant}
      initialData={{ ...siteConfig, exchange_rates: rates }}
      userCountry={country}
    >
      <div
        style={{
          "--tenant-primary": tenantRow.primary_color || "#111111",
          "--tenant-secondary": tenantRow.secondary_color || "#f6f6f6",
        }}
      >
        {children}
      </div>
    </SiteConfigProvider>
  );
}
