"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Type, Image as ImageIcon, Loader2 } from "lucide-react";
import SettingsSectionHeader from "./SettingsSectionHeader";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import StoreQrCard from "./StoreQrCard";
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
  logoTransform,
  onLogoUpload,
  onLogoRestore,
  onLogoTransformChange,
  logoLibrary = [],
  tenantCardConfig,
  onTenantCardConfigChange,
  onTenantCardBackgroundUpload,
  onTenantCardBackgroundRestore,
  tenantCardBackgroundLibrary = [],
  isUploadingLogo,
  isUploadingTenantCardBackground,
  nameChangeLimitReached,
  changesLeft,
  isLoading,
  whatsappNumber,
}) {
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [pendingLogoUrl, setPendingLogoUrl] = useState("");
  const [pendingTransform, setPendingTransform] = useState(
    logoTransform || { fit: "contain", scale: 1, x: 50, y: 50 },
  );

  useEffect(() => {
    setPendingTransform(
      logoTransform || { fit: "contain", scale: 1, x: 50, y: 50 },
    );
  }, [logoTransform]);

  useEffect(() => {
    return () => {
      if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl);
    };
  }, [pendingLogoUrl]);

  const effectiveLogoUrl = pendingLogoUrl || logoUrl;
  const effectiveTransform = pendingLogoUrl ? pendingTransform : logoTransform;
  const availableLogos = [
    ...new Set([logoUrl, ...logoLibrary].filter((url) => typeof url === "string" && url.trim())),
  ];
  const availableTenantCardBackgrounds = [
    ...new Set(
      [
        tenantCardConfig?.background_image_url,
        ...tenantCardBackgroundLibrary,
      ].filter((url) => typeof url === "string" && url.trim() && !url.startsWith("blob:")),
    ),
  ];
  const logoImageStyle = useMemo(
    () => ({
      objectFit: effectiveTransform?.fit || "contain",
      objectPosition: `${effectiveTransform?.x ?? 50}% ${effectiveTransform?.y ?? 50}%`,
      transform: `scale(${effectiveTransform?.scale ?? 1})`,
    }),
    [effectiveTransform],
  );

  const handleTenantCardChange = (field, value) => {
    onTenantCardConfigChange?.({
      ...(tenantCardConfig || {}),
      [field]: value,
    });
  };

  const handleLogoFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl);
    setPendingLogoFile(file);
    setPendingLogoUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleTransformPatch = (patch) => {
    const next = { ...pendingTransform, ...patch };
    setPendingTransform(next);
    if (!pendingLogoUrl) onLogoTransformChange?.(next);
  };

  const applyPendingLogo = async () => {
    if (!pendingLogoFile) return;
    await onLogoUpload?.(pendingLogoFile, pendingTransform);
    if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl);
    setPendingLogoFile(null);
    setPendingLogoUrl("");
  };

  const cancelPendingLogo = () => {
    if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl);
    setPendingLogoFile(null);
    setPendingLogoUrl("");
    setPendingTransform(logoTransform || { fit: "contain", scale: 1, x: 50, y: 50 });
  };

  return (
    <section className={sectionClassName}>
      <SettingsSectionHeader
        icon={<Type size={22} />}
        title="Identidad Visual"
        description="Nombre global y URL de tu tienda"
      />

      <div className="space-y-10 max-w-4xl">
        {/* LOGO UPLOAD SECTION */}
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6">
          <div className="relative group mx-auto sm:mx-0">
            <div className="h-24 w-24 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:border-slate-400">
              {effectiveLogoUrl ? (
                <div className="relative w-full h-full">
                  <AdaptiveImage
                    src={effectiveLogoUrl}
                    alt="Logo preview"
                    fill
                    className="p-2"
                    style={logoImageStyle}
                  />
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                      <Loader2
                        className="animate-spin text-slate-600"
                        size={20}
                      />
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

          <div className="w-full space-y-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Logo de la tienda
              </h4>
              <p className="mx-auto max-w-xs text-[10px] font-bold uppercase leading-relaxed tracking-wider text-slate-500 sm:mx-0 sm:max-w-none sm:text-[11px]">
                Recomendado: Fondo transparente (PNG) y forma cuadrada o
                rectangular pequeña. Máx 2MB.
              </p>
            </div>

            <label className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoFileSelect}
                disabled={isUploadingLogo}
              />
              {pendingLogoUrl
                ? "Elegir otro archivo"
                : isUploadingLogo
                  ? "Subiendo..."
                  : "Seleccionar logo"}
            </label>

            {pendingLogoUrl && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Encaje
                    <select
                      value={pendingTransform.fit}
                      onChange={(e) =>
                        handleTransformPatch({ fit: e.target.value })
                      }
                      className={`${inputClassName} mt-2 h-10`}
                    >
                      <option value="contain">Completo</option>
                      <option value="cover">Recortado</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Zoom
                    <input
                      type="range"
                      min="0.6"
                      max="2"
                      step="0.05"
                      value={pendingTransform.scale}
                      onChange={(e) =>
                        handleTransformPatch({ scale: Number(e.target.value) })
                      }
                      className="mt-4 w-full"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Horizontal
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pendingTransform.x}
                      onChange={(e) =>
                        handleTransformPatch({ x: Number(e.target.value) })
                      }
                      className="mt-4 w-full"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Vertical
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pendingTransform.y}
                      onChange={(e) =>
                        handleTransformPatch({ y: Number(e.target.value) })
                      }
                      className="mt-4 w-full"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
                  <button
                    type="button"
                    onClick={applyPendingLogo}
                    disabled={isUploadingLogo}
                    className="h-10 rounded-lg bg-slate-900 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    {isUploadingLogo ? "Subiendo..." : "Usar este logo"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelPendingLogo}
                    className="h-10 rounded-lg border border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {!pendingLogoUrl && logoUrl && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 sm:p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Zoom
                  <input
                    type="range"
                    min="0.6"
                    max="2"
                    step="0.05"
                    value={pendingTransform.scale}
                    onChange={(e) =>
                      handleTransformPatch({ scale: Number(e.target.value) })
                    }
                    className="mt-4 w-full"
                  />
                </label>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Encaje
                  <select
                    value={pendingTransform.fit}
                    onChange={(e) =>
                      handleTransformPatch({ fit: e.target.value })
                    }
                    className={`${inputClassName} mt-2 h-10`}
                  >
                    <option value="contain">Completo</option>
                    <option value="cover">Recortado</option>
                  </select>
                </label>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Biblioteca de logos
              </p>
              {availableLogos.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {availableLogos.map((imageUrl) => (
                    <button
                      type="button"
                      key={imageUrl}
                      onClick={() => onLogoRestore?.(imageUrl)}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
                      title="Restaurar logo"
                    >
                      <AdaptiveImage
                        src={imageUrl}
                        alt="Logo reciente"
                        fill
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Aún no hay logos guardados. Cuando subas uno, aparecerá aquí.
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className={labelClassName}>Nombre de la Tienda</label>
            <input
              type="text"
              value={isLoading ? "Cargando nombre..." : siteName || ""}
              onChange={(e) => onSiteNameChange(e.target.value)}
              disabled={nameChangeLimitReached || isLoading}
              className={`${inputClassName} ${
                nameChangeLimitReached || isLoading
                  ? "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
                  : ""
              } ${isLoading ? "animate-pulse text-slate-400" : ""}`}
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
                <p
                  className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                    changesLeft === 1 ? "text-amber-500" : "text-blue-500"
                  }`}
                >
                  {changesLeft === 1
                    ? "⚠️ Último cambio disponible este mes"
                    : `✓ Te quedan ${changesLeft} cambios este mes`}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className={labelClassName}>
              Identificador de URL (Slug)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                /
              </span>
              <input
                type="text"
                value={isLoading ? "Obteniendo URL..." : tenantSlug || ""}
                readOnly
                className={`${inputClassName} pl-8 font-mono text-xs bg-slate-50/50 dark:bg-slate-800/20 cursor-not-allowed opacity-70 ${
                  isLoading ? "animate-pulse text-slate-400" : ""
                }`}
                placeholder="mi-tienda-ideal"
              />
            </div>
            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
              ⚠️ ¡CUIDADO! Cambiar esto romperá todos tus enlaces compartidos.
            </p>
          </div>
        </div>

        <StoreQrCard
          siteName={siteName}
          tenantSlug={tenantSlug}
          logoUrl={logoUrl}
          whatsappNumber={whatsappNumber}
        />

        <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Diseño del selector de tiendas
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Elige si tu tienda se muestra con el diseño anterior o con la
              nueva tarjeta de fondo. Si activas el nuevo diseño, puedes subir
              una imagen de fondo y personalizar el texto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Estilo de tarjeta</label>
              <select
                value={tenantCardConfig?.card_style || "legacy"}
                onChange={(e) =>
                  handleTenantCardChange("card_style", e.target.value)
                }
                className={inputClassName}
              >
                <option value="legacy">Anterior</option>
                <option value="modern">Nuevo diseño</option>
              </select>
            </div>

            <div>
              <label className={labelClassName}>
                Ocultar etiqueta superior
              </label>
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={tenantCardConfig?.hide_deploy_label || false}
                  onChange={(e) =>
                    handleTenantCardChange(
                      "hide_deploy_label",
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                  Ocultar "DEPLOY"
                </span>
              </label>
            </div>
          </div>

          {tenantCardConfig?.card_style === "modern" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className={labelClassName}>Texto de la tarjeta</label>
                  <input
                    type="text"
                    value={tenantCardConfig?.custom_eyebrow || ""}
                    onChange={(e) =>
                      handleTenantCardChange("custom_eyebrow", e.target.value)
                    }
                    className={inputClassName}
                    placeholder="Categoría, lema corto, o texto pequeño"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className={labelClassName}>Título principal</label>
                  <input
                    type="text"
                    value={tenantCardConfig?.custom_title || ""}
                    onChange={(e) =>
                      handleTenantCardChange("custom_title", e.target.value)
                    }
                    className={inputClassName}
                    placeholder="Ej: Tecnología"
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>Descripción</label>
                <textarea
                  value={tenantCardConfig?.custom_description || ""}
                  onChange={(e) =>
                    handleTenantCardChange("custom_description", e.target.value)
                  }
                  className={`${inputClassName} h-24 resize-none`}
                  placeholder="Compra todo lo que necesitas en un solo lugar."
                />
              </div>

              <div>
                <label className={labelClassName}>Fondo de la tarjeta</label>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 h-48 mb-3">
                  {tenantCardConfig?.background_image_url ? (
                    <img
                      src={tenantCardConfig.background_image_url}
                      alt="Fondo de tarjeta"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      Imagen de fondo no seleccionada
                    </div>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 px-4 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onTenantCardBackgroundUpload}
                    disabled={isUploadingTenantCardBackground}
                  />
                  {isUploadingTenantCardBackground
                    ? "Subiendo..."
                    : "Cargar imagen de fondo"}
                </label>

                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Biblioteca de fondos
                  </p>
                  {availableTenantCardBackgrounds.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {availableTenantCardBackgrounds.map((imageUrl) => (
                        <button
                          type="button"
                          key={imageUrl}
                          onClick={() =>
                            onTenantCardBackgroundRestore?.(imageUrl)
                          }
                          className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
                          title="Restaurar fondo"
                        >
                          <img
                            src={imageUrl}
                            alt="Fondo reciente"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Aún no hay fondos guardados. Al subir uno, aparecerá aquí.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
