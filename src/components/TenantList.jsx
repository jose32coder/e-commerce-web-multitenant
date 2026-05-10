"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
  MessageCircle,
  RotateCcw,
  ShoppingBag,
  Search,
  Store,
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
  const [flippedTenantId, setFlippedTenantId] = useState(null);

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
      <div className="sticky top-14 md:top-16 z-20 bg-slate-50/95 backdrop-blur-md py-4 space-y-4 px-1">
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
              const hasMediaCard = isModern || isEditorial;
              const isFlipped = flippedTenantId === tenant.tenant_id;
              
              // Estilo del fondo
              const cardBackgroundStyle = hasMediaCard
                ? {
                    backgroundColor: "#0f172a",
                    backgroundImage: tenant.background_image_url
                      ? `linear-gradient(rgba(15,23,42,0.2), rgba(15,23,42,0.85)), url('${tenant.background_image_url}')`
                      : `linear-gradient(to bottom, rgba(15,23,42,0.4), rgba(15,23,42,0.95))`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : {};

              const cardShellClass = hasMediaCard
                ? "group relative min-h-[16.25rem] md:min-h-[21.25rem] [perspective:1200px] transition-transform duration-300 hover:-translate-y-1"
                : "group relative min-h-[14.5rem] [perspective:1200px] transition-transform duration-300 hover:-translate-y-1";

              const frontFaceClass = hasMediaCard
                ? "absolute inset-0 overflow-hidden rounded-3xl border border-slate-900 bg-slate-900 p-4 md:p-6 text-white shadow-lg [backface-visibility:hidden]"
                : "absolute inset-0 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 text-center shadow-sm [backface-visibility:hidden]";

              const actionLinks = [
                {
                  key: "whatsapp",
                  label: "WhatsApp",
                  href: tenant.whatsapp_url,
                  icon: MessageCircle,
                  external: true,
                },
                {
                  key: "instagram",
                  label: "Instagram",
                  href: tenant.instagram_url,
                  icon: Instagram,
                  external: true,
                },
                {
                  key: "store",
                  label: "Tienda",
                  href: tenant.store_url || `/${tenant.slug}`,
                  icon: Store,
                  external: false,
                },
              ];

              return (
                <div
                  key={tenant.tenant_id}
                  className={cardShellClass}
                  style={{ animationDelay: tenant.delay }}
                >
                  <div
                    className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
                      isFlipped
                        ? "[transform:rotateY(180deg)]"
                        : "md:group-hover:[transform:rotateY(180deg)]"
                    }`}
                  >
                    {/* CARA FRONTAL */}
                    <button
                      type="button"
                      onClick={() => setFlippedTenantId(tenant.tenant_id)}
                      className={`${frontFaceClass} flex h-full w-full cursor-pointer flex-col ${
                        hasMediaCard
                          ? "justify-between text-left"
                          : "items-center justify-center"
                      } ${isFlipped ? "pointer-events-none" : "pointer-events-auto"}`}
                      style={{ ...cardBackgroundStyle, transform: "translateZ(1px)" }}
                      aria-label={`Ver enlaces de ${tenant.name}`}
                    >
                      {hasMediaCard ? (
                        <>
                          <div className="relative z-10 flex items-start justify-between gap-2">
                            {!tenant.hide_deploy_label && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-white/90 border border-white/10">
                                DEPLOY
                              </span>
                            )}
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-zinc-900">
                              <ArrowUpRight size={15} />
                            </span>
                          </div>

                          <div className="relative z-10 pt-5 space-y-3 text-center sm:text-left">
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
                        </>
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
                    </button>

                    {/* CARA TRASERA (ENLACES) */}
                    <div
                      className={`absolute inset-0 flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border p-4 md:p-6 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(1px)] ${
                        hasMediaCard
                          ? "border-slate-900 bg-slate-950 text-white"
                          : "border-zinc-200 bg-zinc-950 text-white"
                      }`}
                      style={cardBackgroundStyle}
                    >
                      <div className="absolute inset-0 bg-slate-950/75" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                            Enlaces
                          </span>
                          <h3 className="mt-1 font-serif text-xl sm:text-2xl uppercase leading-tight line-clamp-2">
                            {tenant.card_title || tenant.name}
                          </h3>
                          <p className="text-[10px] sm:text-xs font-mono text-white/60 tracking-[0.25em] uppercase">
                            /{tenant.slug}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFlippedTenantId(null)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white hover:text-zinc-900"
                          aria-label="Volver a la tarjeta"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>

                      <div className="relative z-10 grid gap-2">
                        {actionLinks.map((action) => {
                          const ActionIcon = action.icon;
                          const content = (
                            <>
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950">
                                <ActionIcon size={16} />
                              </span>
                              <span>{action.label}</span>
                              <ArrowUpRight className="ml-auto" size={15} />
                            </>
                          );

                          if (!action.href) {
                            return (
                              <span
                                key={action.key}
                                className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35"
                              >
                                {content}
                              </span>
                            );
                          }

                          if (action.external) {
                            return (
                              <a
                                key={action.key}
                                href={action.href}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-zinc-950"
                              >
                                {content}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={action.key}
                              href={action.href}
                              className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-zinc-950"
                            >
                              {content}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
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
