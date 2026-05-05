"use client";

import { Type, Image as ImageIcon, Loader2 } from "lucide-react";
import SettingsSectionHeader from "./SettingsSectionHeader";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import {
  inputClassName,
  labelClassName,
  sectionClassName,
} from "./siteSettingsStyles";

export default function SiteIdentitySettings({ 
  siteName, 
  onSiteNameChange,
  tenantSlug,
  logoUrl,
  onLogoUpload,
  nameChangeLimitReached,
  changesLeft,
  isLoading,
  isUploadingLogo
}) {
  return (
    <section className={sectionClassName}>
      <SettingsSectionHeader
        icon={<Type size={22} />}
        title="Identidad Visual"
        description="Nombre global y URL de tu tienda"
      />

      <div className="space-y-10 max-w-4xl">
        {/* LOGO UPLOAD SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:border-slate-400">
              {logoUrl ? (
                <div className="relative w-full h-full">
                  <AdaptiveImage
                    src={logoUrl}
                    alt="Logo preview"
                    fill
                    className="object-contain p-2"
                  />
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-slate-600" size={20} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-black uppercase">Logo</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Logo de la tienda
              </h4>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                Recomendado: Fondo transparente (PNG) y forma cuadrada o rectangular pequeña. Máx 2MB.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onLogoUpload}
                disabled={isUploadingLogo}
              />
              {isUploadingLogo ? "Subiendo..." : "Cambiar Logo"}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className={labelClassName}>Nombre de la Tienda</label>
            <input
              type="text"
              value={isLoading ? "Cargando nombre..." : (siteName || "")}
              onChange={(e) => onSiteNameChange(e.target.value)}
              disabled={nameChangeLimitReached || isLoading}
              className={`${inputClassName} ${
                (nameChangeLimitReached || isLoading) ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : ''
              } ${isLoading ? 'animate-pulse text-slate-400' : ''}`}
              placeholder="Ej: WINKSTORE"
            />
            {isLoading ? (
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider animate-pulse">
                Consultando base de datos...
              </p>
            ) : nameChangeLimitReached ? (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Límite de cambios alcanzado (0/3 este mes)
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Este nombre aparecerá en el Header, Footer y correos.
                </p>
                <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  changesLeft === 1 ? "text-amber-500" : "text-blue-500"
                }`}>
                  {changesLeft === 1 
                    ? "⚠️ Último cambio disponible este mes" 
                    : `✓ Te quedan ${changesLeft} cambios este mes`}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className={labelClassName}>Identificador de URL (Slug)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">/</span>
              <input
                type="text"
                value={isLoading ? "Obteniendo URL..." : (tenantSlug || "")}
                readOnly
                className={`${inputClassName} pl-8 font-mono text-xs bg-slate-50/50 dark:bg-slate-800/20 cursor-not-allowed opacity-70 ${
                  isLoading ? 'animate-pulse text-slate-400' : ''
                }`}
                placeholder="mi-tienda-ideal"
              />
            </div>
            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
              ⚠️ ¡CUIDADO! Cambiar esto romperá todos tus enlaces compartidos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
