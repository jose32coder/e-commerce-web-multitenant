"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Download,
  MonitorSmartphone,
  Share2,
  X,
} from "lucide-react";

const DISMISSED_KEY = "pwa-install-prompt-dismissed-at";
const DISMISS_DAYS = 7;

const isPromptDismissed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY));
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const getInstallContext = () => {
  const userAgent = window.navigator.userAgent || "";
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  return { isAndroid, isIos, isSafari, isStandalone };
};

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);
  const [installContext, setInstallContext] = useState(null);
  const [showManualInstallHelp, setShowManualInstallHelp] = useState(false);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  const [isSecureContextReady, setIsSecureContextReady] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const context = getInstallContext();
    setInstallContext(context);
    setIsSecureContextReady(window.isSecureContext);

    const hiddenRoutes = ["/admin", "/access", "/platform-access", "/register"];
    if (
      context.isStandalone ||
      hiddenRoutes.some((route) =>
        window.location.pathname.startsWith(route),
      ) ||
      isPromptDismissed()
    ) {
      return;
    }

    if ("Notification" in window) {
      setNotificationsGranted(Notification.permission === "granted");
      setNotificationsDenied(Notification.permission === "denied");
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const fallbackTimer = window.setTimeout(() => {
      setShowBanner(true);
    }, 1400);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installHelp = useMemo(() => {
    if (deferredPrompt) {
      return {
        title: "Instalar app",
        description:
          "Añade la tienda a tu dispositivo con el instalador del navegador.",
        actionLabel: "Instalar",
        canInstall: true,
      };
    }

    if (installContext?.isIos || installContext?.isSafari) {
      return {
        title: "Agregar a inicio",
        description: "Toca Compartir y luego Agregar a pantalla de inicio.",
        actionLabel: "Ver pasos",
        canInstall: false,
      };
    }

    if (installContext?.isAndroid) {
      return {
        title: "Agregar a inicio",
        description:
          "Abre el menu del navegador y elige Instalar app o Agregar a pantalla principal.",
        actionLabel: "Entendido",
        canInstall: false,
      };
    }

    return {
      title: "Instalar en escritorio",
      description:
        "Usa el icono de instalar en la barra de direcciones del navegador.",
      actionLabel: "Entendido",
      canInstall: false,
    };
  }, [deferredPrompt, installContext]);

  const closePrompt = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors in private mode.
    }
    setShowBanner(false);
  };

  const handleRequestNotification = async () => {
    if (
      !("Notification" in window) ||
      notificationsDenied ||
      !isSecureContextReady
    ) {
      setShowNotificationHelp(true);
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsGranted(permission === "granted");
    setNotificationsDenied(permission === "denied");

    if (permission === "granted") {
      window.dispatchEvent(new Event("pwa-notifications-granted"));
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleActivateApp = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await handleRequestNotification();
    } else if (notificationsDenied || !isSecureContextReady) {
      setShowNotificationHelp(true);
    }

    if (deferredPrompt) {
      await handleInstallApp();
      return;
    }

    setShowManualInstallHelp(true);
  };

  if (!showBanner) return null;

  const canAskNotifications =
    "Notification" in window &&
    isSecureContextReady &&
    !notificationsGranted &&
    !notificationsDenied;
  const notificationLabel = notificationsGranted
    ? "Notificaciones activas"
    : !isSecureContextReady
      ? "Requiere HTTPS"
      : notificationsDenied
        ? "Notificaciones bloqueadas"
        : "Permitir notificaciones";

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <MonitorSmartphone size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black tracking-tight">
                  Lleva la tienda contigo
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  Instala la app para abrir más rápido la tienda y recibir
                  avisos importantes.
                </p>
              </div>
              <button
                type="button"
                onClick={closePrompt}
                className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
                aria-label="Cerrar aviso de instalación"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    canAskNotifications
                      ? handleRequestNotification
                      : () => setShowNotificationHelp(true)
                  }
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-300 transition hover:border-neutral-600 hover:text-white"
                >
                  <Bell size={12} />
                  {notificationLabel}
                </button>
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-300">
                  {installHelp.canInstall ? (
                    <Download size={12} />
                  ) : (
                    <Share2 size={12} />
                  )}
                  {installHelp.title}
                </span>
              </div>

              {canAskNotifications && (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-neutral-800"
                >
                  <Bell size={13} />
                  Permitir notificaciones
                </button>
              )}

              {showNotificationHelp && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3 text-[11px] leading-relaxed text-neutral-400">
                  {!isSecureContextReady
                    ? "Las notificaciones solo muestran el botón de Permitir en HTTPS o localhost. En una IP local con HTTP el navegador las bloquea por seguridad."
                    : "Para desbloquearlas en Chrome: toca el icono junto a la URL, entra en Permisos o Configuración del sitio y cambia Notificaciones a Permitir. Esto nos ayuda a avisarte sobre novedades, ofertas y el estado de tus pedidos incluso cuando no tienes la tienda abierta."}
                </div>
              )}

              {showManualInstallHelp && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3 text-[11px] leading-relaxed text-neutral-400">
                  {installHelp.description}
                </div>
              )}

              <button
                type="button"
                onClick={handleActivateApp}
                className="inline-flex cursor-pointer h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-neutral-200"
              >
                {installHelp.canInstall ? (
                  <Download size={15} />
                ) : (
                  <Check size={15} />
                )}
                Activar app
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
