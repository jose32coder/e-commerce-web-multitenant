"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_COMMERCE_SETTINGS,
  normalizeCommerceSettings,
  normalizeWhatsappNumber,
} from "@/lib/siteConfig";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useOrderTrackingStore } from "@/lib/useOrderTrackingStore";
import { createClient } from "@/lib/supabase/client";

export function ValidationWaitScreen({ orderId, onSuccess, whatsappNumber }) {
  const { commerce_settings, tenant_slug } = useSiteConfig();
  const { trackings, stopTracking, updateTrackingStatus } =
    useOrderTrackingStore();
  const [rejectionReason, setRejectionReason] = useState("");
  const supabase = createClient();

  // Obtenemos el estado desde el store global
  const tracking = tenant_slug ? trackings[tenant_slug] : null;
  const currentStatus = tracking?.status || "pending";
  const orderCode =
    tracking?.orderCode ||
    (orderId ? String(orderId).slice(-6).toUpperCase() : "N/A");

  // Suscripción en tiempo real + Polling de seguridad
  useEffect(() => {
    if (!orderId || !tenant_slug) return;

    console.log(`[Tracking] Iniciando monitoreo para orden: ${orderId}`);

    // 1. Suscribirse a cambios en tiempo real (WebSockets)
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.estado;
          const reason = payload.new.motivo_rechazo;
          console.log(`[Realtime] Cambio detectado: ${newStatus}`);
          
          if (newStatus && newStatus !== currentStatus) {
            updateTrackingStatus(tenant_slug, newStatus);
            if (reason) setRejectionReason(reason);
          }
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Estado de conexión: ${status}`);
      });

    // 2. Polling de seguridad con Exponential Backoff
    let timeoutId;
    let currentDelay = 3000; // Empezamos cada 3 segundos
    const MAX_DELAY = 30000; // Máximo cada 30 segundos

    const fetchCurrentStatus = async () => {
      // Si el componente se desmontó, no hacer nada
      if (!orderId) return;

      console.log(`[Polling] Verificando estado... (delay actual: ${currentDelay}ms)`);
      
      let { data, error } = await supabase
        .from("orders")
        .select("estado, motivo_rechazo")
        .eq("id", orderId)
        .maybeSingle();

      if (error && error.message.includes("motivo_rechazo")) {
        const retry = await supabase
          .from("orders")
          .select("estado")
          .eq("id", orderId)
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (data) {
        if (data.estado !== currentStatus) {
          console.log(`[Polling] Estado actualizado: ${data.estado}`);
          updateTrackingStatus(tenant_slug, data.estado);
        }
        if (data.motivo_rechazo && data.motivo_rechazo !== rejectionReason) {
          setRejectionReason(data.motivo_rechazo);
        }
        
        // Si el estado sigue siendo pendiente, programar siguiente consulta con backoff
        if (data.estado === "pending") {
          currentDelay = Math.min(currentDelay * 1.5, MAX_DELAY);
          timeoutId = setTimeout(fetchCurrentStatus, currentDelay);
        }
      } else if (error) {
        console.error(`[Tracking] Error en polling:`, error.message);
        // Reintentar de todos modos tras un error
        timeoutId = setTimeout(fetchCurrentStatus, currentDelay);
      }
    };

    fetchCurrentStatus();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId, tenant_slug, updateTrackingStatus, currentStatus, rejectionReason]);

  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );

  const configuredWhatsapp = normalizeWhatsappNumber(commerce.whatsapp_number);
  const supportWhatsapp = whatsappNumber || configuredWhatsapp;

  const motivo =
    rejectionReason || "Verifica los datos de tu pago e intenta nuevamente.";

  const supportMessage = `Hola, mi pedido #${orderCode} tiene problemas con la validación. ¿Que ocurrió?.`;
  const supportHref = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(supportMessage)}`
    : "#";

  // Efecto para disparar el onSuccess cuando el estado cambia a 'paid'
  useEffect(() => {
    if (currentStatus === "paid") {
      // Pequeño delay para que el usuario vea la transición si estaba en esta pantalla
      const timer = setTimeout(() => {
        onSuccess();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, onSuccess]);

  // Si el pago fue rechazado
  if (currentStatus === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center min-h-[50vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500"
        >
          <AlertCircle size={48} />
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-3xl font-serif font-black text-ink uppercase tracking-tight">
            Pago Rechazado
          </h2>
          <p className="text-honey-dark max-w-sm mx-auto">
            Lo sentimos, tu pago no pudo ser validado por el administrador.
          </p>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-sm font-bold text-rose-800 max-w-md mx-auto">
            <span className="block text-[10px] uppercase tracking-widest text-rose-400 mb-2">
              Sugerencia:
            </span>
            {motivo}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 h-14 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-105"
          >
            Contactar Soporte
          </a>
          <button
            onClick={() => stopTracking(tenant_slug)}
            className="flex items-center gap-2 bg-ink text-paper px-8 h-14 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-105 cursor-pointer"
          >
            <ArrowLeft size={16} /> Volver a Intentar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de Espera (Pending/Paid transicional)
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center min-h-[50vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="text-ink"
      >
        <Loader2 size={64} className="opacity-20" />
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-black text-ink uppercase tracking-tight animate-pulse">
          {currentStatus === "paid"
            ? "¡Pago Validado!"
            : "Validando tu pago..."}
        </h2>
        <p className="text-honey-dark max-w-sm mx-auto text-sm">
          {currentStatus === "paid"
            ? "Estamos procesando tu orden final. Un momento por favor."
            : "Por favor, espera en esta pantalla mientras nuestro equipo confirma tu pago vía WhatsApp."}
        </p>
        <div className="text-[10px] uppercase tracking-widest text-honey-dark/50 font-bold bg-white px-4 py-2 rounded-full border border-honey-light inline-block mt-4">
          Orden #{orderCode}
        </div>
      </div>
    </div>
  );
}
