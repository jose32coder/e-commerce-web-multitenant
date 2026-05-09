"use client";
import React from "react";
import { Eye, Check, X, Calendar, Loader2, FileText } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

export default function OrderTable({ 
  orders, 
  loading, 
  selectedCurrency, 
  exchangeRates, 
  toOrderCode, 
  onViewDetails, 
  onUpdateStatus, 
  onReject 
}) {
  const { site_name } = useSiteConfig();
  const getCurrencySymbol = (code) => {
    switch (code) {
      case "VES": return "Bs ";
      case "COP": return "COP ";
      case "USD": return "$ ";
      default: return `${code} `;
    }
  };

  const handleInvoiceAction = async (order, customerName, customerPhone) => {
    const choice = await Swal.fire({
      title: "Nota de Entrega",
      text: "¿Cómo deseas abrir el PDF?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Abrir en navegador",
      denyButtonText: "Descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      denyButtonColor: "#2563eb",
    });

    if (!(choice.isConfirmed || choice.isDenied)) return;

    const { pdf } = await import("@react-pdf/renderer");
    const doc = (
      <InvoicePDF
        formData={{
          name: customerName,
          idNumber: order.customer_id_number || order.clientes?.id_number || "N/A",
          phone: customerPhone,
          paymentMethod: order.metodo_pago || "Transferencia",
          reference: order.referencia_pago || "N/A",
        }}
        finalTotal={Number(order.total)}
        purchasedItems={order.items || []}
        orderCode={toOrderCode(order)}
        brand={site_name}
        issueDate={new Date(order.created_at).toLocaleDateString()}
        currencySymbol={getCurrencySymbol(selectedCurrency)}
        targetCurrency={selectedCurrency}
        exchangeRates={exchangeRates}
      />
    );

    const blob = await pdf(doc).toBlob();
    const objectUrl = URL.createObjectURL(blob);

    if (choice.isConfirmed) {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `Nota_Entrega_${toOrderCode(order)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500"># Orden</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cliente</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden sm:table-cell">Fecha</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Estado</th>
            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                <Loader2 className="animate-spin inline mr-2" size={20} />
                Sincronizando ventas...
              </td>
            </tr>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const customerName =
                order.customer_name ||
                order.clientes?.nombre_completo ||
                order.clientes?.full_name;
              const customerPhone =
                order.customer_phone ||
                order.clientes?.telefono ||
                order.clientes?.phone;

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      #{toOrderCode(order)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-200 text-sm">
                      {customerName || "Desconocido"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter font-medium">
                      {customerPhone || "Sin teléfono"}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
                      <Calendar size={12} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                    {getCurrencySymbol(selectedCurrency)}
                    {convertPrice(Number(order.total), "USD", selectedCurrency, exchangeRates).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        order.estado === "pending"
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                          : order.estado === "paid"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {order.estado === "pending" ? "Pendiente" : order.estado === "paid" ? "Completado" : "Cancelado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 text-slate-400 dark:text-slate-500">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-2 hover:text-slate-900 cursor-pointer dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>

                      {order.estado === "paid" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleInvoiceAction(order, customerName, customerPhone)
                          }
                          className="p-2 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all cursor-pointer"
                          title="Nota de Entrega"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      {order.estado === "pending" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(order.id, "paid")}
                            className="p-2 hover:text-emerald-600 cursor-pointer dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                            title="Completar"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => onReject(order.id)}
                            className="p-2 cursor-pointer hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                No se encontraron ventas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
