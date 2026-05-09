"use client";
import React from "react";
import { Search } from "lucide-react";

export default function OrderFilters({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  selectedCurrency, 
  setSelectedCurrency, 
  showAdvancedFilters, 
  setShowAdvancedFilters,
  pageSize,
  setPageSize,
  advancedFiltersProps
}) {
  const {
    fromDate, setFromDate,
    toDate, setToDate,
    minTotal, setMinTotal,
    maxTotal, setMaxTotal,
    paymentFilter, setPaymentFilter,
    shippingMethodFilter, setShippingMethodFilter,
    shippingProviderFilter, setShippingProviderFilter,
    paymentOptions,
    shippingMethodOptions,
    shippingProviderOptions
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
            placeholder="Buscar por ID o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-sm transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="md:col-span-3 h-10 px-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-bold uppercase tracking-tighter cursor-pointer"
        >
          <option value="Todos los estados">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="md:col-span-2 h-10 px-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-bold uppercase tracking-tighter cursor-pointer"
        >
          <option value="USD">USD</option>
          <option value="VES">VES</option>
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
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Min USD"
            value={minTotal}
            onChange={(e) => setMinTotal(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max USD"
            value={maxTotal}
            onChange={(e) => setMaxTotal(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-10 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-bold uppercase tracking-tighter"
          >
            <option value="all">Todos pagos</option>
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={shippingMethodFilter}
            onChange={(e) => setShippingMethodFilter(e.target.value)}
            className="h-10 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-bold uppercase tracking-tighter"
          >
            <option value="all">Todos envios</option>
            {shippingMethodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={shippingProviderFilter}
            onChange={(e) => setShippingProviderFilter(e.target.value)}
            className="h-10 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-bold uppercase tracking-tighter"
          >
            <option value="all">Todos proveedores</option>
            {shippingProviderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
