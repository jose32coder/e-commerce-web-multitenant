<<<<<<< Updated upstream
<<<<<<< Updated upstream
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, UserRound } from "lucide-react";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";

const HERO_COPY =
  "Descubre nuestra colección curada de espacios independientes. Cada tienda ofrece una experiencia única y una selección exclusiva.";

async function getTenantCards() {
  const supabase = getPublicSupabaseClient();

  const { data: tenantsData, error: tenantsError } = await supabase
    .from("tenants")
    .select("tenant_id, nombre, slug, status")
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
    .select("tenant_id, products_intro, home_intro")
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
      "Experiencia premium con identidad propia para esta tienda.";

    return {
      ...tenant,
      eyebrow: String(title).toUpperCase().slice(0, 32),
      description,
      delay: `${index * 120}ms`,
    };
  });
}

export default async function TenantSelectorPage() {
  const tenantCards = await getTenantCards();
  const platformBrand = PLATFORM_BRAND_NAME;

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-700">
      <header className="border-b border-zinc-200/80 bg-slate-50/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-16 px-5 md:px-6 flex items-center justify-between">
          <p className="font-serif text-2xl md:text-3xl italic tracking-tight text-zinc-700">
            {platformBrand}
          </p>
          <Link
            href="/access"
            className="h-10 w-10 rounded-full border border-zinc-300/80 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors"
            aria-label="Ir a acceso"
          >
            <UserRound size={16} />
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 md:px-6 pt-14 md:pt-16 pb-10">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10 md:mb-12 anim-fade-up">
          <h1 className="font-serif uppercase text-4xl md:text-6xl leading-[0.95] font-black tracking-tight text-zinc-600">
            Elige Tu Tienda
          </h1>
          <div className="w-20 h-px bg-zinc-300 mx-auto" />
          <p className="text-sm md:text-lg leading-relaxed text-zinc-600 max-w-2xl mx-auto">
            {HERO_COPY}
          </p>
        </div>

        {tenantCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-12 md:mb-14">
            {tenantCards.map((tenant) => (
              <Link
                key={tenant.tenant_id}
                href={`/${tenant.slug}`}
                className="group rounded-2xl border border-zinc-200 bg-white/80 hover:bg-white p-6 min-h-55 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 anim-fade-up"
                style={{ animationDelay: tenant.delay }}
              >
                <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-5 group-hover:scale-105 transition-transform">
                  <ShoppingBag size={20} />
                </div>

                <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-400 font-bold mb-4">
                  {tenant.eyebrow}
                </p>

                <h2 className="font-serif text-2xl md:text-3xl uppercase leading-tight tracking-tight text-zinc-800 mb-1.5">
                  {tenant.nombre}
                </h2>

                <p className="text-sm font-mono text-zinc-500 mb-3">
                  /{tenant.slug}
                </p>

                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">
                  {tenant.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center anim-fade-up">
            <p className="text-sm md:text-base text-zinc-500">
              No hay tiendas activas por el momento.
            </p>
          </div>
        )}
      </section>

      <section
        className="max-w-6xl mx-auto px-5 md:px-6 pb-12 md:pb-14 anim-fade-up"
        style={{ animationDelay: "380ms" }}
      >
        <div className="relative rounded-2xl overflow-hidden min-h-55 md:min-h-80 border border-zinc-200">
          <Image
            src="/banner-image2.jpg"
            alt="Atelier digital"
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-zinc-900/35" />

          <div className="absolute inset-0 flex items-center justify-center px-4">
            <blockquote className="max-w-2xl bg-white/95 text-zinc-700 rounded-2xl px-5 md:px-7 py-4 md:py-5 text-center shadow-lg">
              <p className="font-serif italic text-xl md:text-3xl leading-relaxed">
                "El atelier digital es donde la artesanía se encuentra con la
                interfaz."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] md:text-xs tracking-[0.12em] uppercase text-zinc-500">
          <p>
            © {new Date().getFullYear()} {platformBrand}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/access"
              className="hover:text-zinc-800 transition-colors"
            >
              Access
            </Link>
            <span className="text-zinc-300">·</span>
            <Link
              href="/access"
              className="hover:text-zinc-800 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-zinc-300">·</span>
            <Link
              href="/access"
              className="hover:text-zinc-800 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
