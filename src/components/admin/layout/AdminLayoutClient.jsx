"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";
import { SiteConfigProvider } from "@/context/SiteConfigContext";

// Sub-componentes
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import AdminMobileMenu from "@/components/admin/layout/AdminMobileMenu";
import FloatingRates from "@/components/admin/currency/FloatingRates";

const ROLE_PERMISSIONS = {
  super_admin: [
    "Panel",
    "Productos",
    "Categorías",
    "Ventas",
    "Clientes",
    "Bitácora",
    "Ajustes",
  ],
  editor: ["Panel", "Productos", "Categorías", "Ventas"],
  viewer: ["Panel", "Ventas"],
};

export default function AdminLayoutClient({
  children,
  initialProfile,
  initialRole,
  initialSiteConfig,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const seenOrderToastIdsRef = useRef(new Set());
  const realtimeDebugEnabled = process.env.NODE_ENV !== "production";

  // Redirección si no hay sesión (excepto en /access)
  useEffect(() => {
    if (pathname !== "/access" && !initialProfile && !initialRole) {
      router.push("/access");
    }
  }, [pathname, initialProfile, initialRole, router]);

  // Sidebar & Theme Initialization
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
  }, [isMobileOpen]);

  // Realtime global alert for new sales
  useEffect(() => {
    const tenantId = initialProfile?.tenant_id ?? initialSiteConfig?.tenant_id;
    if (!tenantId) return;

    const channel = supabase
      .channel(`admin-new-orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log("[Realtime][Admin][orders:INSERT]", payload);
          const newOrderId = payload?.new?.id;
          if (!newOrderId) return;
          if (seenOrderToastIdsRef.current.has(newOrderId)) return;

          seenOrderToastIdsRef.current.add(newOrderId);
          if (seenOrderToastIdsRef.current.size > 100) {
            seenOrderToastIdsRef.current.clear();
            seenOrderToastIdsRef.current.add(newOrderId);
          }

          const orderCode = payload?.new?.order_number
            ? String(payload.new.order_number).padStart(5, "0")
            : String(newOrderId).slice(-6).toUpperCase();
          const customerName = payload?.new?.customer_name || "";

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `🛒 Nueva venta #${orderCode}`,
            text: customerName
              ? `Cliente: ${customerName}`
              : "Se registró una nueva orden en tiempo real.",
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            customClass: {
              popup: "!bg-emerald-50 !border !border-emerald-200",
            },
          });
        },
      )
      .subscribe((status) => {
        console.log("[Realtime][Admin] channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    supabase,
    initialProfile?.tenant_id,
    initialSiteConfig?.tenant_id,
    realtimeDebugEnabled,
  ]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  const handleLogout = () => {
    Swal.fire({
      title: "¿CERRAR SESIÓN?",
      text: "Se finalizará tu sesión actual en este dispositivo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#000000",
      cancelButtonColor: "#f44336",
      confirmButtonText: "SÍ, SALIR",
      cancelButtonText: "CANCELAR",
      background: "#ffffff",
      customClass: {
        popup: "rounded-[30px] border border-zinc-100",
        title: "font-black tracking-tighter text-2xl",
        confirmButton:
          "rounded-xl font-bold text-[10px] tracking-[0.2em] px-8 py-3",
        cancelButton:
          "rounded-xl font-bold text-[10px] tracking-[0.2em] px-8 py-3",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        router.push("/access");
        router.refresh();
      }
    });
  };

  const canAccess = (label) => {
    if (initialRole === "super_admin") return true;
    if (initialProfile?.permissions?.length > 0) {
      if (initialProfile.permissions.includes("all")) return true;
      return initialProfile.permissions.includes(label);
    }
    return initialRole && ROLE_PERMISSIONS[initialRole]?.includes(label);
  };

  // El layout de /access no necesita el sidebar ni el header
  if (pathname === "/access") {
    return (
      <SiteConfigProvider initialData={initialSiteConfig}>
        {children}
      </SiteConfigProvider>
    );
  }

  return (
    <SiteConfigProvider
      tenantId={initialProfile?.tenant_id ?? null}
      initialData={initialSiteConfig}
    >
        <div className="flex min-h-screen bg-[#FBFBFB] dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-all duration-500">
          <AdminHeader
            isCollapsed={isCollapsed}
            setIsMobileOpen={setIsMobileOpen}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            userProfile={initialProfile}
            userRole={initialRole}
            pathname={pathname}
          />

          <AdminMobileMenu
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />

          <AdminSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={toggleSidebar}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            canAccess={canAccess}
            handleLogout={handleLogout}
          />

          <main
            className={`
            flex-1 p-4 lg:p-6 pt-24 lg:pt-28 pb-24 lg:pb-28 transition-all duration-500
            ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}
            ml-0 w-full max-w-full overflow-x-auto
          `}
          >
            {children}
          </main>

          <FloatingRates />
        </div>
    </SiteConfigProvider>
  );
}
