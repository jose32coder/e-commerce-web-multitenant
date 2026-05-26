"use client";
import Link from "next/link";
import { BarChart3, Calendar } from "lucide-react";

const tabs = [
  {
    key: "general",
    icon: BarChart3,
    label: "Ventas Generales",
  },
  {
    key: "daily-close",
    icon: Calendar,
    label: "Cierre del Día",
  },
];

export default function SalesSectionTabs({
  mode = "local",
  activeTab = "general",
  onTabChange,
}) {
  const isRouteMode = mode === "route";

  return (
    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-md w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        const commonClass = `
          flex items-center gap-3 px-6 py-3 rounded-md transition-all font-black text-[10px] tracking-widest uppercase cursor-pointer
          ${
            isActive
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none -translate-y-0.5"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }
        `;

        if (isRouteMode) {
          const href = tab.key === "general" ? "/admin/orders" : "/admin/daily-close";
          return (
            <Link key={tab.key} href={href} className={commonClass}>
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange?.(tab.key)}
            className={commonClass}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
