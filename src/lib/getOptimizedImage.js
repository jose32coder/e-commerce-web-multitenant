// lib/cloudinary.js
export const getOptimizedImage = (url, width = 800) => {
  if (!url) return "";

  // Buscamos el punto donde Cloudinary permite insertar los parámetros
  // Normalmente después de "/upload/"
  const parts = url.split("/upload/");

  if (parts.length !== 2) return url; // Si no es URL de Cloudinary, devolver original

  const [baseUrl, imagePath] = parts;

  const safeWidth =
    Number.isFinite(Number(width)) && Number(width) > 0
      ? Math.round(Number(width))
      : 800;

  // f_auto: Formato automático (WebP/AVIF)
  // q_auto: Calidad automática
  // c_limit: evita distorsión y no fuerza recorte
  // w_{n}: limita el ancho del recurso descargado
  const params = `f_auto,q_auto,c_limit,w_${safeWidth}`;

  return `${baseUrl}/upload/${params}/${imagePath}`;
};
