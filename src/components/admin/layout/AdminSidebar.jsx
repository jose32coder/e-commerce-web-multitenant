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
  const { site_name } = useSiteConfig();

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
            <div className="min-w-[40px] h-[40px] bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-xl shadow-lg">
              {site_name?.substring(0, 1).toUpperCase()}
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
        <nav className={`flex-1 space-y-4 ${isCollapsed ? "px-0" : "px-6"}`}>
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
        <div className="p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className={`
              flex cursor-pointer items-center gap-4 p-4 w-full rounded-2xl transition-all group font-bold text-xs uppercase tracking-widest
              bg-slate-900/90 text-red-400 ring-1 ring-red-500/35 shadow-inner shadow-black/20
              hover:bg-red-950/50 hover:text-red-300 hover:ring-red-400/50
              ${isCollapsed && !isMobileOpen ? "lg:justify-center lg:gap-0" : ""}
            `}
          >
            <LogOut size={20} className="shrink-0 text-red-300 group-hover:text-red-200" strokeWidth={2} />
            {(!isCollapsed || isMobileOpen) && <span>Salir</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
