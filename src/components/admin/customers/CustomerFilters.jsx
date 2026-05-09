"use client";
import React from "react";
import { Search } from "lucide-react";

export default function CustomerFilters({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  showAdvancedFilters, 
  setShowAdvancedFilters,
  pageSize,
  setPageSize,
  advancedFiltersProps
}) {
  const {
    minOrdersPaid, setMinOrdersPaid,
    minSpentUsd, setMinSpentUsd,
    minItemsQty, setMinItemsQty,
    onlyWithPurchases, setOnlyWithPurchases
  } = advancedFiltersProps;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-sm transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="md:col-span-3 h-10 px-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg text-xs font-bold uppercase tracking-tighter cursor-pointer"
        >
          <option value="spent_desc">Mas gastan</option>
          <option value="items_desc">Mas productos</option>
          <option value="orders_desc">Mas pedidos</option>
          <option value="name_asc">Nombre A-Z</option>
        </select>
        <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 h-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Mostrar
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-transparent text-slate-900 dark:text-white border-none focus:ring-0 outline-none text-xs font-black uppercase tracking-widest cursor-pointer py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvancedFilters((prev) => !prev)}
          className="md:col-span-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-[10px] font-black uppercase tracking-wider"
        >
          {showAdvancedFilters ? "Menos" : "Mas"}
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <input
            type="number"
            min="0"
            placeholder="Min pedidos"
            value={minOrdersPaid}
            onChange={(e) => setMinOrdersPaid(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Min gastado USD"
            value={minSpentUsd}
            onChange={(e) => setMinSpentUsd(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Min productos"
            value={minItemsQty}
            onChange={(e) => setMinItemsQty(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <label className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <input
              type="checkbox"
              checked={onlyWithPurchases}
              onChange={(e) => setOnlyWithPurchases(e.target.checked)}
            />
            Solo con compras
          </label>
        </div>
      )}
    </div>
  );
}
