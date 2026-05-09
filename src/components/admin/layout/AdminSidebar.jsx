"use client";
import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  BarChart3,
  Users,
  History,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import AdminNavLink from "./AdminNavLink";

export default function AdminSidebar({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  setIsMobileOpen,
  canAccess,
  handleLogout,
}) {
  const { site_name, commerce_settings } = useSiteConfig();
  const logoUrl = commerce_settings?.logo_url;

  const navItems = [
    {
      href: "/admin",
      icon: <LayoutDashboard size={20} />,
      label: "Panel",
      permission: "Panel",
    },
    {
      href: "/admin/products",
      icon: <ShoppingBag size={20} />,
      label: "Productos",
      permission: "Productos",
    },
    {
      href: "/admin/categories",
      icon: <Tags size={20} />,
      label: "Categorías",
      permission: "Categorías",
    },
    {
      href: "/admin/orders",
      icon: <BarChart3 size={20} />,
      label: "Ventas",
      permission: "Ventas",
    },
    {
      href: "/admin/customers",
      icon: <Users size={20} />,
      label: "Clientes",
      permission: "Clientes",
    },
    {
      href: "/admin/history",
      icon: <History size={20} />,
      label: "Bitácora",
      permission: "Bitácora",
    },
    {
      href: "/admin/settings",
      icon: <Settings size={20} />,
      label: "Ajustes",
      permission: "Ajustes",
    },
  ];

  return (
    <aside
      className={`
        fixed h-full z-70 bg-slate-950 border-r border-slate-900 flex flex-col
        transition-all duration-500 ease-in-out shadow-2xl shadow-slate-900/20
        ${isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
      `}
    >
      {/* BOTÓN COLAPSO (Desktop) */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-18 bg-slate-800 text-white rounded-full p-1.5 shadow-xl z-50 border-2 border-slate-950 cursor-pointer hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* BOTÓN CERRAR (Móvil) */}
      <button
        onClick={() => setIsMobileOpen(false)}
        className="lg:hidden absolute right-4 top-4 text-slate-500 hover:text-white"
      >
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden h-full scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-1">
        {/* LOGO SECTION */}
        <div
          className={`
    flex items-center h-24 transition-all duration-300
    ${isCollapsed ? "lg:justify-center" : "px-6"}
    justify-start px-6 lg:px-0
  `}
        >
          <div className="flex items-center lg:px-5 gap-3 overflow-hidden">
            {/* Icono/Avatar del Logo */}
            <div className="min-w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-xl shadow-lg overflow-hidden border border-white/20">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={site_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                site_name?.substring(0, 1).toUpperCase()
              )}
            </div>

            {/* Nombre del Sitio */}
            <h2
              className={`
        font-black tracking-tighter uppercase text-white truncate text-lg
        transition-opacity duration-300
        /* Ocultar en desktop si está colapsado, pero mostrar SIEMPRE en mobile */
        ${isCollapsed ? "lg:hidden opacity-0" : "lg:block opacity-100"}
        block
      `}
            >
              {site_name}
            </h2>
          </div>
        </div>
        {/* NAVEGACIÓN */}
        <nav className="flex-1 space-y-4 px-3">
          {navItems.map(
            (item) =>
              canAccess(item.permission) && (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isCollapsed={isCollapsed}
                  onClick={() => setIsMobileOpen(false)}
                />
              ),
          )}
        </nav>

        {/* SALIR — contraste explícito sobre rail oscuro (icono rojo puro se pierde al colapsar) */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            type="button"
            onClick={handleLogout}
            className={`
      flex cursor-pointer items-center bg-red-500/10 w-full rounded-xl transition-all duration-300 group
      text-red-500 hover:text-red-400 hover:bg-red-500/15
      p-2 /* Padding uniforme */
      ${isCollapsed && !isMobileOpen ? "justify-center" : "px-3 gap-4"}
    `}
          >
            {/* Contenedor de icono con tamaño fijo para que no se mueva */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-lg bg-slate-800 group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
              <LogOut size={20} strokeWidth={2} />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <span className="font-semibold text-sm tracking-wide whitespace-nowrap">
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
