"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBag,
  Search,
  X,
  UtensilsCrossed,
  Shirt,
  Wrench,
  Flower2,
} from "lucide-react";
import { getStoreTypeMeta, getStoreTypeOptions } from "@/lib/storeType";
import AdaptiveImage from "@/components/ui/AdaptiveImage";

export default function TenantList({ initialTenants }) {
  const [search, setSearch] = useState("");
  const [activeStoreType, setActiveStoreType] = useState("all");

  const storeTypeOptions = useMemo(() => {
    return [
      { key: "all", label: "Todas" },
      ...getStoreTypeOptions(initialTenants),
    ];
  }, [initialTenants]);

  const filteredTenants = initialTenants.filter((tenant) => {
    const nombre = (tenant?.name || "").toLowerCase();
    const slug = (tenant?.slug || "").toLowerCase();
    const matchesSearch =
      nombre.includes(search.toLowerCase()) ||
      slug.includes(search.toLowerCase());
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
      {/* BARRA DE BÚSQUEDA Y FILTROS - Ajuste de sticky para no tapar todo en móvil */}
      <div className="sticky top-[56px] md:top-16 z-20 bg-slate-50/95 backdrop-blur-md py-4 space-y-4 px-1">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar tienda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-11 py-3 rounded-xl border border-zinc-200 bg-white shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* CATEGORÍAS - Más compactas en móvil */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {storeTypeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveStoreType(opt.key)}
              className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                activeStoreType === opt.key
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                  : "bg-white text-zinc-500 border-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTenants.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest px-1">
            Resultados:{" "}
            <span className="font-bold text-zinc-800">
              {filteredTenants.length}
            </span>
          </p>

          {/* GRID: 1 COLUMNA EN MÓVIL es la clave para que el estilo Editorial no colapse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-12">
            {filteredTenants.map((tenant) => {
              const storeTypeMeta = getStoreTypeMeta(tenant.store_type);
              const StoreIcon =
                iconByStoreType[storeTypeMeta.key] || ShoppingBag;
              const isModern = tenant.card_style === "modern";
              const isEditorial =
                !isModern && tenant.card_variant !== "minimal";

              return (
                <Link
                  key={tenant.tenant_id}
                  href={`/${tenant.slug}`}
                  className={
                    isModern
                      ? "group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-900 shadow-xl transition-transform duration-300 hover:-translate-y-1 min-h-[260px] md:min-h-[340px]"
                      : isEditorial
                        ? "group relative overflow-hidden rounded-[1.5rem] border border-slate-900 bg-slate-900 p-4 md:p-6 flex flex-col justify-between min-h-[260px] md:min-h-[340px] shadow-lg transition-transform duration-300 hover:-translate-y-1"
                        : "group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm transition-transform duration-300 hover:-translate-y-1"
                  }
                  style={{
                    animationDelay: tenant.delay,
                    backgroundImage:
                      isModern && tenant.background_image_url
                        ? `linear-gradient(to bottom, rgba(15,23,42,0.35), rgba(15,23,42,0.9)), url(${tenant.background_image_url})`
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {isModern || isEditorial ? (
                    <div className="relative z-10 flex h-full flex-col justify-between w-full text-white">
                      <div className="flex items-start justify-between gap-2">
                        {!tenant.hide_deploy_label && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-white/90 border border-white/10">
                            DEPLOY
                          </span>
                        )}
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-zinc-900">
                          <ArrowUpRight size={15} />
                        </span>
                      </div>

                      <div className="pt-5 space-y-3 text-center sm:text-left">
                        {isEditorial && (
                          <div className="flex justify-center sm:justify-start">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                              {tenant.logo_url ? (
                                <AdaptiveImage
                                  src={tenant.logo_url}
                                  alt="Logo"
                                  className="w-full h-full object-cover"
                                  width={56}
                                  height={56}
                                />
                              ) : (
                                <StoreIcon className="w-7 h-7 text-white" />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 border border-white/10">
                            <StoreIcon size={12} />
                            {storeTypeMeta.label}
                          </span>

                          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl uppercase tracking-tight leading-tight line-clamp-2">
                            {tenant.card_title || tenant.name}
                          </h2>

                          <p className="text-[10px] sm:text-xs font-mono text-white/60 tracking-[0.25em] uppercase">
                            /{tenant.slug}
                          </p>

                          <p className="hidden md:block text-[12px] md:text-sm text-white/70 line-clamp-3 leading-relaxed italic">
                            {tenant.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                        {tenant.logo_url ? (
                          <AdaptiveImage
                            src={tenant.logo_url}
                            alt="Logo"
                            width={36}
                            height={36}
                          />
                        ) : (
                          <StoreIcon size={20} />
                        )}
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl uppercase text-zinc-900 leading-tight">
                        {tenant.card_title || tenant.name}
                      </h2>
                      <p className="text-[10px] sm:text-xs font-mono text-zinc-500 mt-2">
                        /{tenant.slug}
                      </p>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
          <p className="text-zinc-400 text-sm italic">
            No encontramos lo que buscas...
          </p>
        </div>
      )}
    </div>
  );
}
