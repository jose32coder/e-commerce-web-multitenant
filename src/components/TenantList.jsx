"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  X,
  UtensilsCrossed,
  Shirt,
  Wrench,
  Flower2,
} from "lucide-react";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { getStoreTypeMeta, getStoreTypeOptions } from "@/lib/storeType";

export default function TenantList({ initialTenants }) {
  const [search, setSearch] = useState("");
  const [activeStoreType, setActiveStoreType] = useState("all");

  const storeTypeOptions = useMemo(() => {
    return [
      { key: "all", label: "Todas" },
      ...getStoreTypeOptions(initialTenants),
    ];
  }, [initialTenants]);

  // Lógica de filtrado dinámico
  const filteredTenants = initialTenants.filter((tenant) => {
    const nombre = (tenant?.name || "").toLowerCase();
    const slug = (tenant?.slug || "").toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch =
      nombre.includes(searchLower) || slug.includes(searchLower);

    const matchesStoreType =
      activeStoreType === "all" || tenant.store_type === activeStoreType;

    return matchesSearch && matchesStoreType;
  });

  const iconByStoreType = {
    clothing: Shirt,
    restaurant: UtensilsCrossed,
    hardware_store: Wrench,
    florist: Flower2,
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE BÚSQUEDA Y FILTROS STICKY */}
      <div className="sticky top-16 z-20 bg-slate-50/90 backdrop-blur-md py-4 space-y-4">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar tienda por nombre o URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-zinc-200 bg-white shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* FILTROS DE CATEGORÍAS */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          {storeTypeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveStoreType(opt.key)}
              className={`px-5 py-2 rounded-full cursor-pointer text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                activeStoreType === opt.key
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE TIENDAS: 2 columnas en mobile, 3 en desktop */}
      {filteredTenants.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <p className="">
              Mostrando{" "}
              <span className="font-semibold text-zinc-700">
                {filteredTenants.length}
              </span>{" "}
              tienda{filteredTenants.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-12">
            {filteredTenants.map((tenant) => {
              const storeTypeMeta = getStoreTypeMeta(tenant.store_type);
              const StoreIcon =
                iconByStoreType[storeTypeMeta.key] || ShoppingBag;

              return (
                <Link
                  key={tenant.tenant_id}
                  href={`/${tenant.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 hover:bg-white p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: tenant.delay }}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-zinc-900/0 via-zinc-900/15 to-zinc-900/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-3 md:mb-5 overflow-hidden group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    {tenant.logo_url ? (
                      <AdaptiveImage
                        src={tenant.logo_url}
                        alt={`${tenant.name} logo`}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    ) : (
                      <StoreIcon size={18} className="md:w-5 md:h-5" />
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${storeTypeMeta.badgeClass}`}
                  >
                    {storeTypeMeta.label}
                  </span>

                  <p className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-zinc-400 font-bold mt-3 mb-2">
                    {tenant.eyebrow}
                  </p>

                  <h2 className="font-serif text-lg md:text-2xl uppercase leading-tight tracking-tight text-zinc-800 mb-1 line-clamp-1">
                    {tenant.name}
                  </h2>

                  <p className="text-[10px] md:text-sm font-mono text-zinc-400 mb-2">
                    /{tenant.slug}
                  </p>

                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 hidden sm:block">
                    {tenant.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-zinc-500 text-sm">
            No se encontraron tiendas para tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
