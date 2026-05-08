import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";
import TenantList from "@/components/TenantList";

const HERO_COPY =
  "Explora acá las mejores tiendas y compra productos de calidad.";

async function getTenantCards() {
  const supabase = await createClient("sb-platform-auth");

  // Asegúrate de que tu tabla 'tenants' tenga la columna 'category'
  const { data: tenantsData, error: tenantsError } = await supabase
    .from("tenants")
    .select("tenant_id, name, slug, status, store_type, logo_url")
    .eq("status", "Active")
    .order("created_at", { ascending: true });

  if (tenantsError) {
    console.error("Error loading active tenants:", tenantsError.message);
    return [];
  }

  const tenants = tenantsData || [];
  if (tenants.length === 0) return [];

  const tenantIds = tenants.map((tenant) => tenant.tenant_id);

  const { data: settingsRows } = await supabase
    .from("site_settings")
    .select("tenant_id, products_intro, home_intro, footer_commerce")
    .in("tenant_id", tenantIds);

  const settingsByTenant = new Map(
    (settingsRows || []).map((row) => [row.tenant_id, row]),
  );

  return tenants.map((tenant, index) => {
    const settings = settingsByTenant.get(tenant.tenant_id);
    const title =
      settings?.products_intro?.title ||
      settings?.home_intro?.title ||
      "Curated Goods";
    const description =
      settings?.products_intro?.description ||
      settings?.home_intro?.description ||
      "Experiencia premium personalizada.";
    const logoUrl =
      settings?.commerce_settings?.logo_url ||
      settings?.footer_commerce?.commerce_settings?.logo_url ||
      settings?.footer_commerce?.logo_url ||
      tenant.logo_url ||
      null;

    return {
      ...tenant,
      logo_url: logoUrl,
      eyebrow: String(title).toUpperCase().slice(0, 32),
      description,
      delay: `${index * 40}ms`, // Carga fluida para muchas tiendas
    };
  });
}

export default async function TenantSelectorPage() {
  const tenantCards = await getTenantCards();
  const platformBrand = PLATFORM_BRAND_NAME;

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white text-zinc-700">
      <header className="border-b border-zinc-200/80 bg-slate-50/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-16 px-5 flex items-center justify-between">
          <p className="font-serif text-2xl tracking-tight text-zinc-700">
            {platformBrand}
          </p>
          <Link
            href="/access"
            className="h-9 w-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <UserRound size={15} />
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-12 pb-10">
        <div className="max-w-5xl mx-auto text-center space-y-4 mb-10">
          <h1 className="font-serif uppercase text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Encuentra tu tienda ideal
          </h1>
          <p className="text-sm md:text-lg text-slate-900 italic">
            {HERO_COPY}
          </p>
        </div>

        {/* LISTADO CON BUSCADOR Y CATEGORÍAS */}
        <TenantList initialTenants={tenantCards} />
      </section>

      {/* BANNER INFERIOR */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="relative rounded-3xl overflow-hidden min-h-75 border border-zinc-200 shadow-xl">
          <Image
            src="/banner-image2.jpg"
            alt="Atelier"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-zinc-900/40" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 text-center max-w-md shadow-2xl">
              <p className="font-serif italic text-xl md:text-2xl text-zinc-800">
                "El futuro del comercio independiente comienza aquí."
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-10 bg-white">
        <div className="max-w-6xl flex flex-col lg:flex-row lg:justify-between lg:items-center mx-auto px-5 text-center">
          <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400">
            © {new Date().getFullYear()} {platformBrand} · Todos los derechos
            reservados
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 mt-2">
            Desarrollado por Deploy
          </span>
        </div>
      </footer>
    </main>
  );
}
