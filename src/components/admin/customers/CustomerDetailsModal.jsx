"use client";
import React from "react";
import { X, User } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";

export default function CustomerDetailsModal({ 
  customer, 
  onClose, 
  selectedCurrency, 
  setSelectedCurrency, 
  exchangeRates, 
  toOrderCode,
  buildWhatsappHref
}) {
  if (!customer) return null;

  const getCurrencySymbol = (code) => {
    switch (code) {
      case "VES": return "Bs ";
      case "USD": return "$ ";
      default: return `${code} `;
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen z-150 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300 p-5 sm:p-10 relative">
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex gap-3 items-center z-10">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-bold uppercase tracking-tighter cursor-pointer"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </select>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-50 dark:border-slate-700/50">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              {customer.nombre_completo}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm tracking-tight">
              CI/RIF: {customer.cedula}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Datos de Contacto
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-300">Teléfono:</span>
                {customer.telefono}
                <a
                  href={buildWhatsappHref(customer.telefono)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:underline text-[10px] uppercase font-bold ml-2"
                >
                  Chat
                </a>
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Email:</span>{" "}
                {customer.email || "No registrado"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Resumen Comercial
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Total Pedidos:</span>{" "}
                {customer.orders?.length || 0}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Total Gastado:</span>
                <span className="ml-2 font-black text-emerald-600 dark:text-emerald-400">
                  {getCurrencySymbol(selectedCurrency)}
                  {convertPrice(
                    customer.orders?.filter((o) => o.estado === "paid").reduce((sum, o) => sum + Number(o.total || 0), 0) || 0,
                    "USD",
                    selectedCurrency,
                    exchangeRates
                  ).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Historial de Compras
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-100/50 dark:bg-slate-900/80 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Orden</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Artículos</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {customer.orders?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">#{toOrderCode(order)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col gap-1">
                          {order.items && Array.isArray(order.items) ? (
                            order.items.slice(0, 3).map((item, i) => (
                              <span key={item.id || i} className="text-[10px] font-medium block leading-tight truncate max-w-[200px]">
                                {item.name || item.title} (x{item.quantity})
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] italic text-slate-400">Sin detalle</span>
                          )}
                          {order.items?.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-400">+ {order.items.length - 3} más...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">
                        {getCurrencySymbol(selectedCurrency)}
                        {convertPrice(Number(order.total), "USD", selectedCurrency, exchangeRates).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full uppercase text-[8px] font-black tracking-widest ${
                          order.estado === "pending"
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                            : order.estado === "paid"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        }`}>
                          {order.estado === "pending" ? "Pendiente" : order.estado === "paid" ? "Pagado" : "Cancelado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!customer.orders || customer.orders.length === 0) && (
              <div className="p-12 text-center text-slate-400 italic text-xs">Este cliente aún no ha realizado compras.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
