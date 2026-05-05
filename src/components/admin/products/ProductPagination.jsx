"use client";
import React from "react";

export default function ProductPagination({ 
  loading, 
  filteredProducts, 
  startIndex, 
  pageSize, 
  totalItems, 
  currentPage, 
  totalPages, 
  setPage 
}) {
  if (loading || filteredProducts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Mostrando{" "}
          <span className="text-slate-700 dark:text-slate-200">
            {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)}
          </span>{" "}
          de{" "}
          <span className="text-slate-700 dark:text-slate-200">
            {totalItems}
          </span>
        </p>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || currentPage <= 1}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Anterior
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || currentPage >= totalPages}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
