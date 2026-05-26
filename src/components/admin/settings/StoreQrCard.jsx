"use client";

import { useMemo, useState } from "react";
import { Download, Link2, Share2 } from "lucide-react";
import { buildClientUrl } from "@/lib/url";

function normalizePhone(value = "") {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

export default function StoreQrCard({
  siteName,
  tenantSlug,
  logoUrl,
  whatsappNumber,
}) {
  const [copyLabel, setCopyLabel] = useState("Copiar enlace");
  const safeSlug = String(tenantSlug || "").trim();
  const storeUrl = useMemo(() => {
    if (!safeSlug) return "";
    return buildClientUrl(`/${safeSlug}`);
  }, [safeSlug]);

  const qrSrc = useMemo(() => {
    if (!storeUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=16&data=${encodeURIComponent(storeUrl)}`;
  }, [storeUrl]);

  const shareText = useMemo(() => {
    const phone = normalizePhone(whatsappNumber);
    const lines = [
      siteName || "Mi Tienda",
      storeUrl,
      phone ? `Contacto: +${phone}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  }, [siteName, storeUrl, whatsappNumber]);

  const handleCopy = async () => {
    if (!storeUrl) return;
    await navigator.clipboard.writeText(storeUrl);
    setCopyLabel("Copiado");
    setTimeout(() => setCopyLabel("Copiar enlace"), 1500);
  };

  const handleShare = async () => {
    if (!storeUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: siteName || "Mi Tienda",
          text: shareText,
          url: storeUrl,
        });
        return;
      } catch {
        // fallback copy
      }
    }
    await handleCopy();
  };

  const handleDownload = async () => {
    if (!qrSrc) return;

    const qrImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 920;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(qrImg, 100, 70, 500, 500);

    if (logoUrl) {
      try {
        const logoImg = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = logoUrl;
        });

        const logoSize = 96;
        const centerX = canvas.width / 2 - logoSize / 2;
        const centerY = 320 - logoSize / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(centerX - 8, centerY - 8, logoSize + 16, logoSize + 16);
        ctx.drawImage(logoImg, centerX, centerY, logoSize, logoSize);
      } catch {
        // ignore logo error
      }
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 28px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(siteName || "Mi Tienda", canvas.width / 2, 650);

    ctx.fillStyle = "#475569";
    ctx.font = "500 18px Segoe UI";
    ctx.fillText(storeUrl, canvas.width / 2, 700);

    const phone = normalizePhone(whatsappNumber);
    if (phone) {
      ctx.fillText(`Contacto: +${phone}`, canvas.width / 2, 740);
    }

    const link = document.createElement("a");
    link.download = `qr_tienda_${safeSlug || "store"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5">
      <div>
        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
          QR de la tienda
        </h4>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          Escanea para abrir la tienda web y comparte el acceso rapido.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative w-60 h-60 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR tienda"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              Sin URL de tienda
            </div>
          )}
          {logoUrl && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl border border-slate-200 p-1.5 shadow">
              <img
                src={logoUrl}
                alt="Logo tienda"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {siteName || "Mi Tienda"}
          </p>
          <p className="text-[11px] text-slate-500 break-all">
            {storeUrl || "Sin URL"}
          </p>
          {whatsappNumber ? (
            <p className="text-[11px] text-slate-500">
              Contacto: +{normalizePhone(whatsappNumber)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="h-10 px-3 rounded-lg cursor-pointer bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
        >
          <Share2 size={14} />
          Compartir
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="h-10 px-3 rounded-lg cursor-pointer border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
        >
          <Link2 size={14} />
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="h-10 px-3 rounded-lg cursor-pointer border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
        >
          <Download size={14} />
          Descargar
        </button>
      </div>
    </div>
  );
}
