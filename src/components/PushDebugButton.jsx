"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

const resolveTenantId = () => {
  const pathPart = window.location.pathname.split("/").filter(Boolean)[0];
  if (!pathPart || ["admin", "access", "platform-access", "register"].includes(pathPart)) {
    return "global";
  }
  return pathPart;
};

/**
 * Detects if the push service error is a known localhost limitation.
 * On localhost, browsers often can't reach the external Push Service
 * (FCM for Chrome, Mozilla Push Service for Firefox).
 */
function isPushServiceLocalhostError(error) {
  const msg = error?.message?.toLowerCase() || "";
  return (
    msg.includes("push service") ||
    msg.includes("registration failed") ||
    msg.includes("aborterror") ||
    error?.name === "AbortError" ||
    error?.name === "NotAllowedError"
  );
}

/**
 * Sends a local notification using the Notification API directly
 * (bypasses the Push Service entirely — works on localhost).
 */
function sendLocalNotification() {
  const notification = new Notification("🔔 Deploy Shop — Prueba Local", {
    body: "✅ Las notificaciones funcionan correctamente. En producción (HTTPS) se enviarán via Web Push.",
    icon: "/icons/icon-512x512.png",
    badge: "/icons/icon-512x512.png",
    tag: "local-test",
    vibrate: [100, 50, 100],
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export default function PushDebugButton() {
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const isLocal = window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("trycloudflare.com");

    // Se muestra si estás en entorno de desarrollo O si estás usando el túnel de prueba
    if (process.env.NODE_ENV !== "production" || isLocal) {
      setIsMounted(true);
    }
  }, []);

  if (!isMounted) return null;

  const showError = (title, text) =>
    Swal.fire({
      title,
      text,
      icon: "error",
      confirmButtonColor: "#0f172a",
    });

  const handleTestPush = async () => {
    setLoading(true);

    try {
      // ── Pre-flight checks ──────────────────────────────────────────
      if (!("serviceWorker" in navigator)) {
        await showError("Push no disponible", "Este navegador no soporta Service Workers.");
        return;
      }

      if (!("PushManager" in window)) {
        await showError("Push no disponible", "Este navegador no soporta Web Push.");
        return;
      }

      if (!("Notification" in window)) {
        await showError("Notificaciones no disponibles", "Este navegador no soporta Notification API.");
        return;
      }

      if (!window.isSecureContext) {
        await showError(
          "Origen no seguro",
          "Web Push solo funciona en HTTPS o localhost. En una IP local con HTTP el navegador puede fallar con 'push service error'.",
        );
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
      if (!vapidPublicKey) {
        await showError("VAPID faltante", "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en .env.");
        return;
      }

      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission !== "granted") {
        await showError("Permiso no concedido", "Activa las notificaciones del sitio para probar Web Push.");
        return;
      }

      // ── Try full Push Service flow ──────────────────────────────────
      const registration = await navigator.serviceWorker.ready;
      let subscription = null;
      let pushServiceFailed = false;

      try {
        subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }
      } catch (pushError) {
        // ── Known localhost limitation ─────────────────────────────
        if (isPushServiceLocalhostError(pushError)) {
          pushServiceFailed = true;
          console.warn(
            "⚠️ [PushDebug] Push Service no disponible en localhost:",
            pushError.message,
          );
        } else {
          throw pushError; // Re-throw unknown errors
        }
      }

      // ── Fallback: local notification (localhost) ────────────────────
      if (pushServiceFailed) {
        sendLocalNotification();

        await Swal.fire({
          title: "Modo local activado",
          html: `
            <div style="text-align:left; font-size:14px; line-height:1.6">
              <p>El <strong>Push Service externo</strong> (FCM/Mozilla) no está disponible en <code>localhost</code>. Esto es <strong>normal y esperado</strong>.</p>
              <br/>
              <p>✅ Se envió una <strong>notificación local</strong> como prueba — debería aparecer ahora.</p>
              <br/>
              <p>📦 En <strong>producción</strong> (con HTTPS), Web Push funcionará completamente incluyendo notificaciones en segundo plano.</p>
            </div>
          `,
          icon: "info",
          confirmButtonColor: "#0f172a",
          confirmButtonText: "Entendido",
        });
        return;
      }

      // ── Full flow: subscribe + send via backend ─────────────────────
      const tenantId = resolveTenantId();

      const subscribeResponse = await fetch("/api/public/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, tenantId }),
      });

      const subscribeResult = await subscribeResponse.json().catch(() => ({}));
      if (!subscribeResponse.ok) {
        throw new Error(subscribeResult.error || "No se pudo guardar la suscripción.");
      }

      const testResponse = await fetch("/api/public/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, tenantId }),
      });

      const testResult = await testResponse.json().catch(() => ({}));
      if (!testResponse.ok) {
        throw new Error(testResult.error || "No se pudo enviar la notificación.");
      }

      await Swal.fire({
        title: "Push funcionando 🎉",
        text: "Se envió una notificación de prueba vía Web Push.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      await showError("Error de push", error?.message || "No se pudo completar la prueba.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTestPush}
      disabled={loading}
      className="fixed bottom-24 right-4 z-60 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      title="Probar notificación push"
      aria-label="Probar notificación push"
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <BellRing size={18} />}
    </button>
  );
}