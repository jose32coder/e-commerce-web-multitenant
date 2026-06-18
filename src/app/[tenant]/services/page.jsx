import { getServices } from "@/services/products";
import { getPublicCategoriesFlat } from "@/services/categories";
import { getTenantIdBySlugCached } from "@/lib/siteConfig.server";
import ServiceCard from "@/components/public/products/ServiceCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { tenant } = await params;
  return {
    title: `Servicios — ${tenant}`,
    description: `Explora todos los servicios disponibles en nuestra tienda.`,
  };
}

export default async function ServicesPage({ params }) {
  const { tenant } = await params;
  const tenantId = await getTenantIdBySlugCached(tenant);

  const [servicesRaw, categories] = await Promise.all([
    getServices(tenantId),
    getPublicCategoriesFlat(tenantId),
  ]);

  const services = servicesRaw.map((service) => ({
    ...service,
    category: categories.find((cat) => cat.id === service.category_id) || null,
  }));

  const baseUrl = `/${tenant}`;

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href={baseUrl}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-zinc-900">
          Nuestros Servicios
        </h1>
        <p className="mt-3 text-zinc-500 text-base">
          Soluciones profesionales a tu medida.{" "}
          <span className="font-semibold text-zinc-700">{services.length}</span>{" "}
          {services.length === 1 ? "servicio disponible" : "servicios disponibles"}.
        </p>
      </div>

      {/* Grid de servicios */}
      {services.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {services.map((service, idx) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={idx}
              allCategories={categories}
            />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center">
          <p className="text-zinc-400 font-medium text-lg">
            No hay servicios disponibles por el momento.
          </p>
          <Link
            href={baseUrl}
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 border-b border-zinc-300 hover:border-zinc-900 transition-all pb-0.5"
          >
            Explorar productos
          </Link>
        </div>
      )}
    </main>
  );
}
