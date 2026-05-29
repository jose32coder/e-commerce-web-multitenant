"use client";

import * as React from "react";
import { Image as ImageIcon, LayoutGrid, Plus, Sparkles } from "lucide-react";
import HeroSlideCard from "./HeroSlideCard";
import SettingsSectionHeader from "./SettingsSectionHeader";
import { sectionClassName } from "./siteSettingsStyles";
import {
  HERO_NAV_NUMBERS,
  HERO_NAV_PROGRESS_ONLY,
  HERO_OVERLAY_ALIGN_CENTER,
  HERO_OVERLAY_ALIGN_LEFT,
  HERO_OVERLAY_ALIGN_RIGHT,
  HERO_OVERLAY_VALIGN_BOTTOM,
  HERO_OVERLAY_VALIGN_MIDDLE,
  HERO_OVERLAY_VALIGN_TOP,
  HERO_VARIANT_CLASSIC,
  HERO_VARIANT_CINEMATIC,
  HERO_WIDTH_CONTAINED,
  HERO_WIDTH_IMMERSIVE,
} from "@/lib/siteConfig";

const OVERLAY_POSITION_ROWS = [
  { valign: HERO_OVERLAY_VALIGN_TOP, label: "Arriba" },
  { valign: HERO_OVERLAY_VALIGN_MIDDLE, label: "Medio" },
  { valign: HERO_OVERLAY_VALIGN_BOTTOM, label: "Abajo" },
];

const OVERLAY_POSITION_COLS = [
  { align: HERO_OVERLAY_ALIGN_LEFT, label: "Izq." },
  { align: HERO_OVERLAY_ALIGN_CENTER, label: "Centro" },
  { align: HERO_OVERLAY_ALIGN_RIGHT, label: "Der." },
];

const HERO_SLIDE_LIMIT = 5;

const reusableImage = (url) =>
  typeof url === "string" &&
  url.trim() &&
  !url.startsWith("blob:") &&
  !url.startsWith("/");

export default function HeroSliderSettings({
  slides,
  homeIntro,
  onHomeIntroPatch,
  onAddSlide,
  onRemoveSlide,
  onUpdateSlide,
  onImageUpload,
  onImageRestore,
  onAddSlideFromLibrary,
  imageLibrary = [],
}) {
  const safeSlides = Array.isArray(slides) ? slides : [];
  const heroVariant = homeIntro?.hero_variant ?? HERO_VARIANT_CLASSIC;
  const heroNavMode = homeIntro?.hero_nav_mode ?? HERO_NAV_NUMBERS;
  const heroWidthMode = homeIntro?.hero_width_mode ?? HERO_WIDTH_CONTAINED;
  const heroOverlayAlign =
    homeIntro?.hero_overlay_align ?? HERO_OVERLAY_ALIGN_LEFT;
  const heroOverlayValign =
    homeIntro?.hero_overlay_valign ?? HERO_OVERLAY_VALIGN_MIDDLE;

  const isOverlay = heroVariant === HERO_VARIANT_CINEMATIC;
  const availableImages = [
    ...new Set([
      ...safeSlides.map((slide) => slide.image).filter(reusableImage),
      ...imageLibrary.filter(reusableImage),
    ]),
  ];

  const typeBtn = (active) =>
    active
      ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-2 ring-slate-900/10 dark:ring-white/20"
      : "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600";

  const positionCellClass = (valign, halign) =>
    heroOverlayValign === valign && heroOverlayAlign === halign;

  return (
    <section className={sectionClassName}>
      <div className="mb-10 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Tipo de hero
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              onHomeIntroPatch({ hero_variant: HERO_VARIANT_CLASSIC })
            }
            className={`text-left rounded-2xl border p-4 transition-all ${typeBtn(heroVariant === HERO_VARIANT_CLASSIC)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={18} />
              <span className="text-xs font-black uppercase tracking-tight">
                Tarjeta / split
              </span>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-widest opacity-80 leading-relaxed">
              Imagen y texto lado a lado, ancho del contenido
            </p>
          </button>
          <button
            type="button"
            onClick={() =>
              onHomeIntroPatch({ hero_variant: HERO_VARIANT_CINEMATIC })
            }
            className={`text-left rounded-2xl border p-4 transition-all ${typeBtn(isOverlay)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} />
              <span className="text-xs font-black uppercase tracking-tight">
                Pantalla / overlay
              </span>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-widest opacity-80 leading-relaxed">
              Imagen de fondo con texto encima; elige alineación y ancho abajo
            </p>
          </button>
        </div>

        {isOverlay && (
          <>
            <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pt-3">
                Posición del texto (9 puntos)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed -mt-1">
                Elige fila (vertical) y columna (horizontal) sobre la imagen.
              </p>
              <div
                className="grid gap-2 max-w-md"
                style={{
                  gridTemplateColumns: "auto repeat(3, minmax(0, 1fr))",
                }}
              >
                <div />
                {OVERLAY_POSITION_COLS.map((col) => (
                  <div
                    key={col.align}
                    className="text-center text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 py-1"
                  >
                    {col.label}
                  </div>
                ))}
                {OVERLAY_POSITION_ROWS.map((row) => (
                  <React.Fragment key={row.valign}>
                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pr-1">
                      {row.label}
                    </div>
                    {OVERLAY_POSITION_COLS.map((col) => {
                      const active = positionCellClass(row.valign, col.align);
                      return (
                        <button
                          key={`${row.valign}-${col.align}`}
                          type="button"
                          onClick={() =>
                            onHomeIntroPatch({
                              hero_overlay_valign: row.valign,
                              hero_overlay_align: col.align,
                            })
                          }
                          className={`min-h-11 rounded-lg border text-[10px] font-black transition-all ${
                            active
                              ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                          aria-label={`${row.label} ${col.label}`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pt-3">
                Ancho del hero
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed -mt-1">
                Alineado al sitio: mismo ancho que el contenido (tarjeta con
                márgenes). Inmersivo: ancho completo, el hero sube detrás de un
                menú semitransparente (sin franja blanca).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onHomeIntroPatch({ hero_width_mode: HERO_WIDTH_CONTAINED })
                  }
                  className={`flex-1 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroWidthMode === HERO_WIDTH_CONTAINED
                      ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Alineado al sitio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onHomeIntroPatch({ hero_width_mode: HERO_WIDTH_IMMERSIVE })
                  }
                  className={`flex-1 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroWidthMode === HERO_WIDTH_IMMERSIVE
                      ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Inmersivo (bajo el menú)
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pt-3">
                Navegación inferior
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onHomeIntroPatch({ hero_nav_mode: HERO_NAV_NUMBERS })
                  }
                  className={`flex-1 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroNavMode === HERO_NAV_NUMBERS
                      ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Solo números (01-05)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onHomeIntroPatch({ hero_nav_mode: HERO_NAV_PROGRESS_ONLY })
                  }
                  className={`flex-1 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroNavMode === HERO_NAV_PROGRESS_ONLY
                      ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Solo barra de progreso
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <SettingsSectionHeader
        icon={<ImageIcon size={22} />}
        title="Hero Slider"
        description="Gestiona los slides de la página de inicio"
        action={
          <button
            onClick={onAddSlide}
            disabled={safeSlides.length >= HERO_SLIDE_LIMIT}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 h-12 rounded-xl hover:bg-black dark:hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
          >
            <Plus size={16} /> AGREGAR SLIDE
          </button>
        }
      />

      <div className="mb-8 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Biblioteca de imágenes
            </p>
            <p className="text-[10px] text-slate-400">
              Reutiliza imágenes existentes sin subirlas otra vez.
            </p>
          </div>
        </div>

        {availableImages.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {availableImages.map((imageUrl) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => onAddSlideFromLibrary?.(imageUrl)}
                disabled={safeSlides.length >= HERO_SLIDE_LIMIT}
                className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white disabled:opacity-40 dark:border-slate-700"
                title="Crear slide con esta imagen"
              >
                <img
                  src={imageUrl}
                  alt="Imagen guardada"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
                  Usar en slide
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Todavía no hay imágenes reutilizables.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Al subir o eliminar slides, sus imágenes aparecerán aquí.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {safeSlides.map((slide, index) => (
          <HeroSlideCard
            key={slide.id}
            slide={slide}
            index={index}
            totalSlides={safeSlides.length}
            onRemove={onRemoveSlide}
            onUpdate={onUpdateSlide}
            onImageUpload={onImageUpload}
            onImageRestore={onImageRestore}
            imageLibrary={imageLibrary}
          />
        ))}
      </div>
    </section>
  );
}
