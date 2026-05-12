"use client";
import React from "react";
import { X, Calendar, Download, ShoppingBag } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

export default function OrderDetailsModal({
  order,
  onClose,
  selectedCurrency,
  setSelectedCurrency,
  exchangeRates,
  toOrderCode,
}) {
  const { site_name, commerce_settings } = useSiteConfig();
  const rawLogoUrl = commerce_settings?.logo_url || "";
  let logoUrl = rawLogoUrl
    ? rawLogoUrl.startsWith("http") || rawLogoUrl.startsWith("data:")
      ? rawLogoUrl
      : `${typeof window !== "undefined" ? window.location.origin : ""}${rawLogoUrl.startsWith("/") ? "" : "/"}${rawLogoUrl}`
    : "";

  // Forzar formato PNG para Cloudinary ya que react-pdf no soporta WebP (f_auto)
  if (logoUrl.includes("cloudinary.com")) {
    logoUrl = logoUrl.replace("f_auto", "f_png");
  }
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
    order.customer_phone || order.clientes?.telefono || order.clientes?.phone;

  const getCurrencySymbol = (code) => {
    switch (code) {
      case "VES":
        return "Bs ";
      case "USD":
        return "$ ";
      default:
        return `${code} `;
    }
  };

  const extractDeliveryFromNotes = (notes) => {
    if (!notes) return { method: null, provider: null, text: "" };
    const match = notes.match(/^\[ENTREGA:\s*(.*?)\|(.*?)\]\s*(.*)$/s);
    if (match) {
      return {
        method: match[1].trim() || null,
        provider: match[2].trim() || null,
        text: match[3].trim() || ""
      };
    }
    return { method: null, provider: null, text: notes };
  };

  const deliveryInfo = extractDeliveryFromNotes(order.notas);
  const actualShippingMethod = order.shipping_method || order.shippingMethod || deliveryInfo.method;
  const actualShippingProvider = order.shipping_provider || deliveryInfo.provider;
  const actualNotes = deliveryInfo.text;


  return (
    <div className="fixed inset-0 min-h-screen z-150 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300 p-6 sm:p-8 relative">
        {/* Botón de cerrar (siempre en la esquina) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* Header — estilo CustomerDetailsModal */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pr-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-50 dark:border-slate-700/50 shrink-0">
              <ShoppingBag size={32} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white truncate">
                {customerName || "Sin nombre"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm tracking-tight">
                Orden #{toOrderCode(order)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-[10px] font-bold uppercase tracking-tighter cursor-pointer h-10"
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
            {order.estado === "paid" && (
              <PDFDownloadLink
                document={
                  <InvoicePDF
                    formData={{
                      name: customerName,
                      idNumber: customerIdNumber,
                      phone: customerPhone,
                      paymentMethod: order.metodo_pago || "Transferencia",
                      reference: order.referencia_pago || "N/A",
                      shippingMethod: actualShippingMethod,
                      shippingProvider: actualShippingProvider,
                      notes: actualNotes,
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
                }
                fileName={`Nota_Entrega_${toOrderCode(order)}.pdf`}
                className="flex items-center gap-2 px-4 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
              >
                {({ loading }) => (
                  <>
                    <Download
                      size={14}
                      className={loading ? "animate-pulse" : ""}
                    />
                    <span className="hidden sm:inline">Nota de Entrega</span>
                  </>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Información del Cliente
            </h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Nombre:
                </span>{" "}
                {customerName || "No registrado"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  CI/RIF:
                </span>{" "}
                {customerIdNumber || "No registrado"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Teléfono:
                </span>{" "}
                {customerPhone || "No registrado"}
              </p>
              {(order.clientes?.email || order.customer_email) && (
                <p>
                  <span className="font-bold text-slate-900 dark:text-slate-300">
                    Email:
                  </span>{" "}
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
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Referencia:
                </span>{" "}
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">
                  {order.referencia_pago || "No registrada"}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Método:
                </span>{" "}
                {order.metodo_pago || "No especificado"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Entrega:
                </span>{" "}
                <span className="uppercase font-black text-blue-600 dark:text-blue-400">
                  {actualShippingMethod === 'pickup' ? 'Retiro' : 
                   actualShippingMethod === 'local' ? 'Delivery' : 
                   actualShippingMethod === 'national' ? 'Envío' : 
                   actualShippingMethod || 'No especificado'}
                   {actualShippingProvider ? ` (${actualShippingProvider.toUpperCase()})` : ''}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Total:
                </span>{" "}
                {getCurrencySymbol(selectedCurrency)}
                {convertPrice(
                  Number(order.total),
                  "USD",
                  selectedCurrency,
                  exchangeRates,
                ).toFixed(2)}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-slate-300">
                  Estado:
                </span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                    order.estado === "pending"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                      : order.estado === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {order.estado === "pending"
                    ? "Pendiente"
                    : order.estado === "paid"
                      ? "Completado"
                      : "Cancelado"}
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

        {/* Entrega y Notas */}
        {(actualShippingMethod || actualNotes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            {actualShippingMethod && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Método de Entrega
                </h3>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-300">
                      Tipo:
                    </span>{" "}
                    <span className="uppercase">{actualShippingMethod === 'pickup' ? 'Retiro en Tienda' : actualShippingMethod === 'local' ? 'Delivery Local' : actualShippingMethod === 'national' ? 'Envío Nacional' : actualShippingMethod}</span>
                  </p>
                  {actualShippingProvider && (
                    <p>
                      <span className="font-bold text-slate-900 dark:text-slate-300">
                        Empresa:
                      </span>{" "}
                      <span className="uppercase font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {actualShippingProvider}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {actualNotes && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Notas del Cliente
                </h3>
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-4 rounded-2xl">
                  <p className="text-xs text-amber-900 dark:text-amber-200 italic leading-relaxed">
                    "{actualNotes}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}


        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Artículos (Items)
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            {order.items && Array.isArray(order.items) ? (
              <ul className="space-y-3">
                {order.items.map((item, idx) => (
                  <li
                    key={item.id || idx}
                    className="flex justify-between items-center text-sm font-medium"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-white">
                        {item.name || item.title}{" "}
                        <span className="text-slate-500 dark:text-slate-400">
                          x{item.quantity}
                        </span>
                      </span>
                      {item.variant && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Variante: {item.variant}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">
                      {getCurrencySymbol(selectedCurrency)}
                      {convertPrice(
                        Number(item.price) * Number(item.quantity),
                        "USD",
                        selectedCurrency,
                        exchangeRates,
                      ).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-slate-400 py-4 italic">
                No hay items en esta orden.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
