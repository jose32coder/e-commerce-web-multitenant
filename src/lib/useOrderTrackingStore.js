import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useOrderTrackingStore = create()(
  persist(
    (set, get) => ({
      // Estructura: { [tenantSlug]: { orderId, orderCode, status, lastUpdate, whatsappPayload? } }
      trackings: {},

      /**
       * Inicia el rastreo para un tenant específico
       */
      startTracking: (tenantSlug, orderId, orderCode, whatsappPayload = null) => {
        if (!tenantSlug || !orderId) return;
        const { trackings } = get();
        
        set({
          trackings: {
            ...trackings,
            [tenantSlug]: {
              orderId,
              orderCode: orderCode || orderId.slice(-6).toUpperCase(),
              status: "pending",
              whatsappPayload:
                whatsappPayload && typeof whatsappPayload === "object"
                  ? whatsappPayload
                  : null,
              lastUpdate: Date.now(),
            },
          },
        });
      },

      /**
       * Actualiza el estado de un rastreo existente
       */
      updateTrackingStatus: (tenantSlug, status) => {
        if (!tenantSlug) return;
        const { trackings } = get();
        if (!trackings[tenantSlug]) return;

        set({
          trackings: {
            ...trackings,
            [tenantSlug]: {
              ...trackings[tenantSlug],
              status,
              lastUpdate: Date.now(),
            },
          },
        });
      },

      /**
       * Detiene y limpia el rastreo de un tenant
       */
      stopTracking: (tenantSlug) => {
        if (!tenantSlug) return;
        const { trackings } = get();
        const newTrackings = { ...trackings };
        delete newTrackings[tenantSlug];
        
        set({ trackings: newTrackings });
      },

      /**
       * Helper para obtener el rastreo actual de un tenant
       */
      getTracking: (tenantSlug) => {
        return get().trackings[tenantSlug] || null;
      },
    }),
    {
      name: "order-tracking-storage",
    },
  ),
);
