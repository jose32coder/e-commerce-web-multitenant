"use client";
import React from "react";
import { X, Calendar } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";

export default function OrderDetailsModal({ 
  order, 
  onClose, 
  selectedCurrency, 
  setSelectedCurrency, 
  exchangeRates,
  toOrderCode
}) {
  if (!order) return null;

  const customerName =
    order.customer_name ||
    order.cliente_nombre ||
    order.clientes?.nombre_completo ||
    order.clientes?.full_name;
  const customerIdNumber =
    order.customer_id_number ||
    order.clientes?.cedula ||
    order.clientes?.id_number;
  const customerPhone =
    order.customer_phone ||
    order.clientes?.telefono ||
    order.clientes?.phone;

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

        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">
          Detalles de la Orden{" "}
          <span className="text-slate-400 dark:text-slate-500">
            #{toOrderCode(order)}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Información del Cliente
            </h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Nombre:</span>{" "}
                {customerName || "No registrado"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">CI/RIF:</span>{" "}
                {customerIdNumber || "No registrado"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Teléfono:</span>{" "}
                {customerPhone || "No registrado"}
              </p>
              {(order.clientes?.email || order.customer_email) && (
                <p>
                  <span className="font-bold text-slate-900 dark:text-slate-300">Email:</span>{" "}
                  {order.clientes?.email || order.customer_email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Datos del Pago
            </h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Referencia:</span>{" "}
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">
                  {order.referencia_pago || "No registrada"}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Total:</span>{" "}
                {getCurrencySymbol(selectedCurrency)}
                {convertPrice(Number(order.total), "USD", selectedCurrency, exchangeRates).toFixed(2)}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">Estado:</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                    order.estado === "pending"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                      : order.estado === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {order.estado === "pending" ? "Pendiente" : order.estado === "paid" ? "Completado" : "Cancelado"}
                </span>
              </p>
              {order.estado === "cancelled" && order.motivo_rechazo && (
                <p className="text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg text-xs font-medium">
                  Motivo Rechazo: {order.motivo_rechazo}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Artículos (Items)
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            {order.items && Array.isArray(order.items) ? (
              <ul className="space-y-3">
                {order.items.map((item, idx) => (
                  <li key={item.id || idx} className="flex justify-between items-center text-sm font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-white">
                        {item.name || item.title}{" "}
                        <span className="text-slate-500 dark:text-slate-400">x{item.quantity}</span>
                      </span>
                      {item.variant && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Variante: {item.variant}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">
                      {getCurrencySymbol(selectedCurrency)}
                      {convertPrice(Number(item.price) * Number(item.quantity), "USD", selectedCurrency, exchangeRates).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-slate-400 py-4 italic">No hay items en esta orden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
