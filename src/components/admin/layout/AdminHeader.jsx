"use client";
import React from "react";
import { Menu, Sun, Moon, User } from "lucide-react";
import Link from "next/link";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AdminHeader({
  isCollapsed,
  setIsMobileOpen,
  toggleTheme,
  isDarkMode,
  userProfile,
  userRole,
  pathname,
}) {
  const { site_name, commerce_settings } = useSiteConfig();
  const logoUrl = commerce_settings?.logo_url;

  const getPageTitle = (path) => {
    const titles = {
      "/admin": "PANEL",
      "/admin/products": "PRODUCTOS",
      "/admin/categories": "CATEGORÍAS",
      "/admin/orders": "ÓRDENES",
      "/admin/daily-close": "ÓRDENES",
      "/admin/customers": "CLIENTES",
      "/admin/history": "BITÁCORA",
      "/admin/settings": "AJUSTES",
      "/admin/profile": "PERFIL",
    };
    return titles[path] || "DASHBOARD";
  };

  return (
    <header
      className={`
        fixed top-0 right-0 z-40 h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-zinc-100 dark:border-slate-800
        flex items-center justify-between px-4 transition-all duration-500
        ${isCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"}
      `}
    >
      {/* Lado izquierdo (Botón menú y Título de escritorio) */}
      <div className="flex items-center gap-4 w-1/3">
        {/* Botón hamburguesa (Solo móvil) */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>

        {/* Título Desktop e Icono */}
        <div className="hidden lg:flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={site_name}
              className="h-8 w-auto object-contain"
            />
          )}
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-slate-500">
            Dashboard /{" "}
            <span className="text-slate-900 dark:text-white">
              {getPageTitle(pathname)}
            </span>
          </h1>
        </div>
      </div>

      {/* Centro (Título Móvil) */}
      <div className="lg:hidden flex-1 flex justify-center items-center px-2 overflow-hidden">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={site_name}
            className="h-8 max-w-[120px] object-contain"
          />
        ) : (
          <span className="font-black uppercase tracking-tighter text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-full text-center">
            {site_name} Admin
          </span>
        )}
      </div>

      {/* Tema & Perfil (Derecha) */}
      <div className="flex items-center justify-end gap-3 w-1/3">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          href="/admin/profile"
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="hidden sm:flex flex-col items-end text-right">
            <p className="text-xs font-black uppercase tracking-tighter leading-none mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Mi Perfil
            </p>
            <p className="text-[9px] text-zinc-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              {userRole?.replace("_", " ")}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-100 dark:shadow-none group-hover:scale-105 transition-all overflow-hidden">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <User size={18} />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
