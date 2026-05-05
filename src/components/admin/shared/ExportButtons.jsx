"use client";
import React from "react";
import { Download } from "lucide-react";

export default function ExportButtons({ onExport, loading }) {
  return (
    <div className="mt-6 mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700/50 p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => onExport("pdf")}
          disabled={loading}
          className="h-10 px-4 rounded-md cursor-pointer border border-slate-300 dark:border-slate-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <Download size={14} />
          Exportar PDF
        </button>
        <button
          onClick={() => onExport("xlsx")}
          disabled={loading}
          className="h-10 px-4 rounded-md cursor-pointer border border-slate-300 dark:border-slate-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <Download size={14} />
          Exportar Excel
        </button>
      </div>
    </div>
  );
}
