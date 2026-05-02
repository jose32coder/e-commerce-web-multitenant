"use client";

import AdaptiveImage from "@/components/ui/AdaptiveImage";
import {
  AlignLeft,
  Image as ImageIcon,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import SettingsSectionHeader from "./SettingsSectionHeader";
import {
  inputClassName,
  labelClassName,
  sectionClassName,
} from "./siteSettingsStyles";

export default function PromoDividerSettings({
  value,
  onChange,
  onImageUpload,
  uploading,
}) {
  const handleFieldChange = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  const enabled = value?.enabled !== false;

  return (
    <section className={sectionClassName}>
      <SettingsSectionHeader
        icon={<Sparkles size={22} />}
        title="Promo Divider"
        description="Controla el bloque promocional entre secciones"
      />

      <div className="mb-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Mostrar bloque promocional en la tienda
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Si lo desactivas, el bloque no se mostrará en la página de inicio.
            Puedes seguir editando el contenido aquí.
          </p>
        </div>
        <label className="inline-flex items-center gap-3 cursor-pointer shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {enabled ? "Visible" : "Oculto"}
          </span>
          <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
            <input
              type="checkbox"
              role="switch"
              checked={enabled}
              onChange={(e) =>
                onChange({ ...value, enabled: e.target.checked })
              }
              className="peer sr-only"
              aria-checked={enabled}
            />
            <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600" />
            <span className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-6" />
          </span>
        </label>
      </div>

      {!enabled ? (
        <p className="mb-6 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
          El bloque está oculto para los visitantes.
        </p>
      ) : null}

      <div
        className={`grid grid-cols-1 xl:grid-cols-2 gap-8 transition-opacity ${
          enabled ? "" : "opacity-55"
        }`}
      >
        <div className="space-y-4 rounded-4xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
          <div>
            <label className={labelClassName}>
              <AlignLeft size={10} /> Eyebrow
            </label>
            <input
              type="text"
              value={value.eyebrow ?? ""}
              onChange={(e) => handleFieldChange("eyebrow", e.target.value)}
              className={inputClassName}
              placeholder="Archive 2026"
            />
          </div>

          <div>
            <label className={labelClassName}>
              <Type size={10} /> Titulo principal
            </label>
            <input
              type="text"
              value={value.title_primary ?? ""}
              onChange={(e) =>
                handleFieldChange("title_primary", e.target.value)
              }
              className={inputClassName}
              placeholder="The New"
            />
          </div>

          <div>
            <label className={labelClassName}>
              <Type size={10} /> Titulo secundario
            </label>
            <input
              type="text"
              value={value.title_secondary ?? ""}
              onChange={(e) =>
                handleFieldChange("title_secondary", e.target.value)
              }
              className={inputClassName}
              placeholder="Standard"
            />
          </div>

          <div>
            <label className={labelClassName}>
              <AlignLeft size={10} /> Descripcion
            </label>
            <textarea
              value={value.description ?? ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className={`${inputClassName} h-24 py-4 resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                <Type size={10} /> Boton CTA
              </label>
              <input
                type="text"
                value={value.cta_label ?? ""}
                onChange={(e) => handleFieldChange("cta_label", e.target.value)}
                className={inputClassName}
                placeholder="Explorar Seleccion"
              />
            </div>

            <div>
              <label className={labelClassName}>
                <AlignLeft size={10} /> Footer
              </label>
              <input
                type="text"
                value={value.footer_text ?? ""}
                onChange={(e) =>
                  handleFieldChange("footer_text", e.target.value)
                }
                className={inputClassName}
                placeholder="Minimal Aesthetics — Edition 001"
              />
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 space-y-4">
          <label className={labelClassName}>
            <ImageIcon size={10} /> Imagen del bloque
          </label>
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <AdaptiveImage
              src={value.image || ""}
              alt="Promo divider preview"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <label className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black tracking-widest cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 shadow-xl">
                <Upload size={12} />
                {uploading ? "SUBIENDO..." : "CAMBIAR IMAGEN"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={uploading}
                  onChange={onImageUpload}
                />
              </label>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Recomendado: 1920x1080 para mantener el encuadre y el parallax.
          </p>
        </div>
      </div>
    </section>
  );
}
