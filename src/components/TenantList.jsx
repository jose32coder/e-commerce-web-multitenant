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
              const isModern = tenant.card_style === "modern";
              const isEditorial =
                !isModern && tenant.card_variant !== "minimal";

              return (
                <Link
                  key={tenant.tenant_id}
                  href={`/${tenant.slug}`}
                  className={
                    isModern
                      ? "group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950/10 shadow-[0_22px_60px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_68px_rgba(15,23,42,0.32)] min-h-[380px]"
                      : isEditorial
                        ? "group relative overflow-hidden rounded-[1.8rem] border border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-5 flex flex-col justify-between min-h-[340px] shadow-[0_18px_40px_rgba(7,18,54,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(7,18,54,0.42)]"
                        : "group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  }
                  style={{
                    animationDelay: tenant.delay,
                    backgroundImage: isModern
                      ? tenant.background_image_url
                        ? `linear-gradient(180deg, rgba(15,23,42,0.16), rgba(15,23,42,0.72)), url(${tenant.background_image_url})`
                        : undefined
                      : undefined,
                    backgroundSize: isModern ? "cover" : undefined,
                    backgroundPosition: isModern ? "center" : undefined,
                    backgroundColor: isModern ? "#0f172a" : undefined,
                  }}
                >
                  {isModern ? (
                    <>
                      <div className="absolute inset-0 bg-slate-950/55" />
                      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                        <div className="flex items-start justify-between gap-4">
                          {!tenant.hide_deploy_label && (
                            <p className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-100/90">
                              DEPLOY
                            </p>
                          )}
                          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90">
                            <ArrowUpRight size={16} />
                          </span>
                        </div>

                        <div className="space-y-5">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85">
                            <StoreIcon size={12} />
                            {storeTypeMeta.label}
                          </div>

                          <div className="space-y-3">
                            <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tight text-white leading-tight line-clamp-2">
                              {tenant.card_title || tenant.name}
                            </h2>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 font-semibold">
                              /{tenant.slug}
                            </p>
                            <p className="text-sm md:text-base leading-relaxed text-white/80 max-w-xl line-clamp-4">
                              {tenant.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : isEditorial ? (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%)]" />

                      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black uppercase tracking-[0.2em] text-white/90">
                            DEPLOY
                          </p>
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80">
                            <ArrowUpRight size={16} />
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white overflow-hidden">
                            {tenant.logo_url ? (
                              <AdaptiveImage
                                src={tenant.logo_url}
                                alt={`${tenant.name} logo`}
                                width={64}
                                height={64}
                                className="object-contain"
                              />
                            ) : (
                              <StoreIcon size={26} />
                            )}
                          </div>

                          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm">
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                              {storeTypeMeta.label}
                            </span>

                            <p className="mt-4 text-[10px] uppercase tracking-[0.23em] text-white/65 font-semibold">
                              {tenant.eyebrow}
                            </p>

                            <h2 className="mt-3 font-serif text-3xl uppercase tracking-tight leading-tight text-white">
                              {tenant.card_title || tenant.name}
                            </h2>

                            <p className="mt-1 text-xs text-white/70 font-mono">
                              /{tenant.slug}
                            </p>

                            <p className="mt-4 text-sm text-white/75 leading-relaxed line-clamp-3">
                              {tenant.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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

                      <h2 className="font-serif text-lg md:text-2xl uppercase leading-tight tracking-tight text-zinc-800 mb-1 line-clamp-1">
                        {tenant.card_title || tenant.name}
                      </h2>

                      <p className="text-[10px] md:text-sm font-mono text-zinc-400 mb-2">
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
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-zinc-500 text-sm">
            No se encontraron tiendas para tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
