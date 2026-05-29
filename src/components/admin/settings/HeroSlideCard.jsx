"use client";

import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { AlignLeft, AlertCircle, Trash2, Type, Upload } from "lucide-react";
import { inputClassName, labelClassName } from "./siteSettingsStyles";

export default function HeroSlideCard({
  slide,
  index,
  totalSlides,
  onRemove,
  onUpdate,
  onImageUpload,
  onImageRestore,
  imageLibrary = [],
}) {
  return (
    <div className="relative p-6 rounded-4xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-6 group">
      <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-2 rounded-full absolute -top-4 left-6 shadow-xl">
        <span className="text-[10px] font-black uppercase tracking-widest">
          SLIDE #0{index + 1}
        </span>
        {totalSlides > 1 && (
          <button
            onClick={() => onRemove(slide.id)}
            className="ml-4 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group/img">
        <AdaptiveImage
          src={slide.image}
          alt={slide.title || "Preview"}
          fill
          className="object-cover"
          containerClassName="h-full"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={index === 0}
        />

        <div className="absolute inset-0 bg-black/40 opacity-100 lg:opacity-0 lg:group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 bg-amber-500/90 text-white px-3 py-2 rounded-xl backdrop-blur-sm shadow-xl">
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
              <AlertCircle size={12} /> Tamaño sugerido
            </p>
            <p className="text-xs font-bold mt-1">1920 x 1080 px</p>
            <p className="text-[9px] opacity-80 uppercase font-medium mt-0.5">
              (Relación 16:9)
            </p>
          </div>

          <label className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black tracking-widest cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 shadow-xl">
            <Upload size={12} />
            <span>CAMBIAR IMAGEN</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => onImageUpload(slide.id, e)}
            />
          </label>
        </div>
      </div>

      {imageLibrary.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Imágenes recientes
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {imageLibrary.map((imageUrl) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => onImageRestore?.(slide.id, imageUrl)}
                className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700"
                title="Restaurar imagen"
              >
                <AdaptiveImage
                  src={imageUrl}
                  alt="Imagen reciente"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div>
          <label className={labelClassName}>
            <AlignLeft size={10} /> Subtítulo
          </label>
          <input
            type="text"
            value={slide.subtitle}
            onChange={(e) => onUpdate(slide.id, "subtitle", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>
            <Type size={10} /> Título Principal
          </label>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onUpdate(slide.id, "title", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>
            <AlignLeft size={10} /> Descripción
          </label>
          <textarea
            value={slide.description}
            onChange={(e) => onUpdate(slide.id, "description", e.target.value)}
            className={`${inputClassName} h-24 py-4 resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
