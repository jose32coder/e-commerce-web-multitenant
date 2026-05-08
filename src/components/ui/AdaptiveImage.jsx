"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { useState } from "react";

const isCloudinaryPublicId = (src) => {
  if (!src || typeof src !== "string") return false;
  const normalized = src.trim();
  if (normalized.startsWith("cloud://")) return true;
  // Si guardas solo public IDs de Cloudinary (ej: "my-folder/image-123")
  if (!normalized.startsWith("/") && !normalized.startsWith("http"))
    return true;
  return false;
};

<<<<<<< Updated upstream
export default function AdaptiveImage({ src, alt = "", ...props }) {
=======
// Asegúrate de que esta imagen esté en tu carpeta /public
const ULTIMATE_FALLBACK = "/banner-clothes.jpg";

export default function AdaptiveImage({
  src,
  alt = "",
  className,
  containerClassName,
  fill,
  loading = "lazy",
  sizes,
  ...props
}) {
>>>>>>> Stashed changes
  const [failed, setFailed] = useState(false);

  if (!src) {
    return null;
  }

  const effectiveSrc = failed ? "/placeholder.jpg" : src;

  // Para URLs completas (incluyendo Cloudinary), usamos next/image.
  // Reservamos CldImage solo para public IDs.
  if (isCloudinaryPublicId(effectiveSrc)) {
    return (
      <CldImage
        src={effectiveSrc}
        alt={alt}
        onError={() => setFailed(true)}
        {...props}
      />
    );
  }

<<<<<<< Updated upstream
=======
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

  const { loading: propsLoading, ...restProps } = props;
  const resolvedLoading = props.priority ? undefined : propsLoading || loading;

  const imageProps = {
    src: effectiveSrc,
    alt,
    fill: fill,
    loading: resolvedLoading,
    sizes: fill ? sizes || "100vw" : sizes,
    className: cn(
      "transition-all duration-700 ease-in-out",
      isLoading
        ? "opacity-0 scale-105 blur-lg"
        : "opacity-100 scale-100 blur-0",
      className,
    ),
    onLoad: handleLoad, // Solución al warning de la consola
    onError: handleError,
    ...restProps,
  };

>>>>>>> Stashed changes
  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
