"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Minimize2,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useOrderTrackingStore } from "@/lib/useOrderTrackingStore";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { cn } from "@/lib/utils";
import { buildCheckoutWhatsappMessage } from "@/lib/checkoutWhatsappMessage";
import { formatWhatsappContactNumber, normalizeWhatsappNumber } from "@/lib/siteConfig";

export default function TrackingFloatingWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { tenant_slug, commerce_settings } = useSiteConfig();
  const { trackings, stopTracking } = useOrderTrackingStore();

  const tracking = tenant_slug ? trackings[tenant_slug] : null;

  const statusConfig = {
    pending: {
      label: "Validando Pago",
      icon: <Loader2 className="animate-spin" size={18} />,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    },
    paid: {
      label: "¡Pago Aceptado!",
      icon: <CheckCircle2 className="text-emerald-500" size={18} />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    cancelled: {
      label: "Pago Rechazado",
      icon: <AlertCircle className="text-rose-500" size={18} />,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100",
    },
    default: {
      label: tracking?.status || "Procesando",
      icon: <Package size={18} />,
      color: "text-zinc-500",
      bgColor: "bg-zinc-50",
      borderColor: "border-zinc-100",
    },
  };

  const config = tracking
    ? statusConfig[tracking.status] || statusConfig.default
    : null;
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const supportWhatsapp = formatWhatsappContactNumber(
    normalizeWhatsappNumber(commerce_settings?.whatsapp_number),
    String(commerce_settings?.customer_phone_country_code || "58"),
  );
  const resendHref =
    tracking?.whatsappPayload && supportWhatsapp
      ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(buildCheckoutWhatsappMessage(tracking.whatsappPayload))}`
      : "";

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    Swal.fire({
      title: "¿Finalizar Seguimiento?",
      text: "Se ocultará esta orden de tu pantalla de seguimiento.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1A1A1A",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      background: "#FBF9F6",
      color: "#1A1A1A",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        stopTracking(tenant_slug);
        setIsExpanded(false);
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "pointer-events-auto bg-white dark:bg-slate-900 border shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 mb-4",
              isExpanded ? "w-72" : "w-64",
            )}
            style={{ borderColor: "var(--honey-light)" }}
          >
            {tracking ? (
              <>
                {/* Cabecera con Orden Activa */}
                <div className="p-4 flex items-center justify-between border-b border-honey-light">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-xl", config.bgColor)}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-honey-dark opacity-60">
                        Orden #{tracking.orderCode}
                      </p>
                      <p
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-tight",
                          config.color,
                        )}
                      >
                        {config.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg text-zinc-400 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-zinc-50/50 dark:bg-slate-800/50 flex flex-col gap-2">
                  <Link
                    href={`${baseUrl}/checkout?view_tracking=true`}
                    className="flex items-center justify-center gap-2 w-full bg-ink text-paper px-4 h-11 rounded-2xl font-bold uppercase text-[9px] tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-sm"
                  >
                    <span>Ver Detalles</span>
                    <ExternalLink size={14} />
                  </Link>
                  {resendHref && (
                    <a
                      href={resendHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full bg-emerald-500 text-white px-4 h-10 rounded-2xl font-bold uppercase text-[9px] tracking-widest hover:bg-emerald-600 transition-colors"
                    >
                      Reenviar WhatsApp
                    </a>
                  )}
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-full text-zinc-500 hover:text-rose-600 hover:bg-rose-50 px-4 h-10 rounded-2xl font-bold uppercase text-[9px] tracking-widest transition-colors cursor-pointer"
                  >
                    Finalizar Seguimiento
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Cabecera Estado Inactivo (Rastreo General) */}
                <div className="p-5 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      Rastrea tu pedido
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed px-2">
                      Por el momento no tienes compras pendientes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto h-12 w-12 md:h-14 md:w-14 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer relative bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105"
          >
            <Package size={24} className="scale-90 md:scale-100" />
            {tracking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-orange-500"></span>
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
