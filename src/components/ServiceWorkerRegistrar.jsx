"use client";

import { useEffect } from "react";

/**
 * Converts a Base64-URL VAPID key to a Uint8Array for the PushManager.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Handles Web Push subscription independently.
 * This prevents Push Service errors from breaking the PWA installation.
 */
async function handlePushSubscription(ready, tenantId) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    // 1. Check existing subscription
    let subscription = await ready.pushManager.getSubscription();

    if (!subscription) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

      if (!vapidPublicKey) {
        console.warn("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY no definida. Push desactivado.");
        return;
      }

      // 2. Request subscription to Push Service
      subscription = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("[PWA] Suscripción Push creada:", JSON.stringify(subscription));

      // 3. Send subscription to backend
      try {
        await fetch("/api/public/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription, tenantId }),
        });
        console.log("[PWA] Suscripción guardada exitosamente en el backend.");
      } catch (err) {
        console.error("[PWA] Error enviando suscripción al backend:", err);
      }
    } else {
      console.log("[PWA] Suscripción Push existente reutilizada.");
    }
  } catch (pushError) {
    // CAPTURA EL ABORTERROR DE LOCALHOST AQUÍ:
    // Evita que este error rompa el ciclo de vida del Service Worker principal
    console.warn(
      "⚠️ [PWA] El servicio Push falló (común en localhost/túneles):",
      pushError.message
    );
  }
}

/**
 * Registers the service worker safely.
 */
async function registerServiceWorker(tenantId) {
  if (!("serviceWorker" in navigator)) return;

  try {
    // 1. Registro básico del Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[PWA] Service Worker registrado en scope:", registration.scope);

    // 2. Esperamos a que esté 100% listo y activo
    const ready = await navigator.serviceWorker.ready;

    // 3. Ejecutamos la lógica de notificaciones en paralelo sin bloquear el hilo principal
    handlePushSubscription(ready, tenantId);

  } catch (error) {
    console.error("[PWA] Error crítico en el registro del Service Worker:", error);
  }
}

/**
 * Global initializer component — registers SW after hydration.
 * Place this in the root layout to ensure it runs once.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    let tenantId = "global";

    try {
      const dataAttr = document.getElementById("tenant-root-container");
      if (dataAttr) {
        const matches = window.location.pathname.split("/");
        if (matches.length > 1 && matches[1] !== "admin" && matches[1] !== "register") {
          tenantId = matches[1];
        }
      }
    } catch (e) { }

    const subscribeAfterPermission = async () => {
      if (!("serviceWorker" in navigator)) return;
      const ready = await navigator.serviceWorker.ready;
      handlePushSubscription(ready, tenantId);
    };

    // Esperar a que la página cargue completamente para no competir con los scripts de Next.js/Turbopack
    const handleLoad = () => registerServiceWorker(tenantId);

    if (document.readyState === "complete") {
      registerServiceWorker(tenantId);
    } else {
      window.addEventListener("load", handleLoad);
    }

    window.addEventListener("pwa-notifications-granted", subscribeAfterPermission);

    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("pwa-notifications-granted", subscribeAfterPermission);
    };
  }, []);

  return null;
}
