"use client";
import React from "react";
import { User, ShoppingBag, Eye, MessageCircle, Loader2 } from "lucide-react";

export default function CustomerTable({ 
  customers, 
  loading, 
  onViewDetails, 
  buildWhatsappHref 
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cliente</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Identificación</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Compras</th>
            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                <Loader2 className="animate-spin inline mr-2 text-slate-300 dark:text-slate-600" size={20} />
                Sincronizando clientes...
              </td>
            </tr>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-50 dark:border-slate-700/50">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-200 text-sm capitalize">
                        {customer.nombre_completo?.toLowerCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium lowercase">
                        {customer.email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono tracking-tighter">
                  {customer.cedula}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg w-fit">
                    <ShoppingBag size={12} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {customer.orders?.length || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 text-slate-400 dark:text-slate-500">
                    <button
                      onClick={() => onViewDetails(customer)}
                      className="p-2 hover:text-slate-900 cursor-pointer dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <a
                      href={buildWhatsappHref(customer.telefono)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No se encontraron clientes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
