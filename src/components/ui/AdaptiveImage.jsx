"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const isCloudinaryPublicId = (src) => {
  if (!src || typeof src !== "string") return false;
  const normalized = src.trim();
  // Si es una URL completa de Cloudinary, a veces es mejor usar Image de Next
  // CldImage prefiere solo el PublicID (ej: "v12345/folder/image")
  if (normalized.startsWith("cloud://")) return true;
  if (!normalized.startsWith("/") && !normalized.startsWith("http"))
    return true;
  return false;
};

// Asegúrate de que esta imagen esté en tu carpeta /public
const ULTIMATE_FALLBACK = "/banner-clothes.jpg";

export default function AdaptiveImage({
  src,
  alt = "",
  className,
  containerClassName,
  fill,
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryWithDefault, setRetryWithDefault] = useState(false);

  // Reset de estados si el src cambia externamente
  useEffect(() => {
    setFailed(false);
    setIsLoading(true);
    setRetryWithDefault(false);
  }, [src]);

  const effectiveSrc = retryWithDefault ? ULTIMATE_FALLBACK : src;

  // Manejador de carga moderno (reemplaza onLoadingComplete)
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Manejador de errores con reintento único al fallback local
  const handleError = () => {
    if (!retryWithDefault) {
      setRetryWithDefault(true);
    } else {
      setFailed(true);
      setIsLoading(false);
    }
  };

  // 1. Estado: No hay imagen ni fallback (Skeleton inicial)
  if (!effectiveSrc && !isLoading) {
    return (
      <div
        className={cn(
          "w-full h-full bg-slate-100 animate-pulse rounded-lg",
          className,
        )}
      />
    );
  }

  // 2. Estado: Fallo total (Imagen no disponible)
  if (failed) {
    return (
      <div
        className={cn(
          "w-full h-full bg-slate-200 flex items-center justify-center",
          className,
        )}
      >
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 opacity-50">
          Imagen no disponible
        </span>
      </div>
    );
  }

  const imageProps = {
    src: effectiveSrc,
    alt: alt,
    fill: fill,
    className: cn(
      "transition-all duration-700 ease-in-out",
      isLoading
        ? "opacity-0 scale-105 blur-lg"
        : "opacity-100 scale-100 blur-0",
      className,
    ),
    onLoad: handleLoad, // Solución al warning de la consola
    onError: handleError,
    ...props,
  };

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        containerClassName,
      )}
    >
      {/* Skeleton de carga superpuesto */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin opacity-20" />
        </div>
      )}

      {isCloudinaryPublicId(effectiveSrc) ? (
        <CldImage {...imageProps} />
      ) : (
        <Image
          {...imageProps}
          // Optimizamos por defecto, especialmente Supabase. Desactivamos solo si es un host no configurado
          unoptimized={
            typeof effectiveSrc === "string" && 
            effectiveSrc.startsWith("http") && 
            !effectiveSrc.includes("supabase.co")
          }
        />
      )}
    </div>
  );
}
