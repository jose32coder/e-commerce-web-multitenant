"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLink({ href, icon, label, isCollapsed, onClick }) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center rounded-xl transition-all duration-300 group overflow-hidden
        ${isCollapsed ? "lg:justify-center lg:p-4 lg:w-12 lg:h-12 lg:mx-auto p-4 gap-4 [@media_(min-width:1024px)_and_(max-height:760px)]:p-3" : "gap-4 p-4 [@media_(min-width:1024px)_and_(max-height:760px)]:p-3 [@media_(min-width:1024px)_and_(max-height:760px)]:gap-3"}
        ${isActive ? "bg-white text-slate-900 shadow-xl shadow-white/5 ring-4 ring-slate-900" : "hover:bg-slate-900 text-slate-400 hover:text-white"}
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className={`
          text-xs font-bold uppercase tracking-tight whitespace-nowrap transition-all duration-300
          ${isCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100 w-auto"}
          block
        `}
      >
        {label}
      </span>
    </Link>
  );
}
