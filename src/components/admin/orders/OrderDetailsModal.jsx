"use client";
import React from "react";
import { X, Calendar, Download, FileText } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

export default function OrderDetailsModal({ 
  order, 
  onClose, 
  selectedCurrency, 
  setSelectedCurrency, 
  exchangeRates,
  toOrderCode
}) {
  const { site_name, commerce_settings } = useSiteConfig();
  const rawLogoUrl = commerce_settings?.logo_url || "";
  let logoUrl = rawLogoUrl 
    ? (rawLogoUrl.startsWith("http") || rawLogoUrl.startsWith("data:")
        ? rawLogoUrl 
        : `${typeof window !== "undefined" ? window.location.origin : ""}${rawLogoUrl.startsWith("/") ? "" : "/"}${rawLogoUrl}`)
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

  const handlePrintOptions = async () => {
    const result = await Swal.fire({
      title: "Opciones de Reporte",
      text: "¿Deseas visualizar el reporte en el navegador o descargarlo directamente?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Visualizar",
      denyButtonText: "Descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      denyButtonColor: "#2563eb",
      cancelButtonColor: "#f1f5f9",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl uppercase text-[10px] tracking-widest px-6 py-3 font-bold",
        denyButton: "rounded-xl uppercase text-[10px] tracking-widest px-6 py-3 font-bold ml-2",
        cancelButton: "rounded-xl uppercase text-[10px] tracking-widest px-6 py-3 font-bold ml-2 text-slate-500",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      await generateAndHandlePDF("view");
    } else if (result.isDenied) {
      await generateAndHandlePDF("download");
    }
  };

  const generateAndHandlePDF = async (action) => {
    Swal.fire({
      title: "GENERANDO REPORTE",
      text: "Por favor espere mientras preparamos el archivo.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const doc = (
        <InvoicePDF
          formData={{
            name: customerName,
            idNumber: customerIdNumber,
            phone: customerPhone,
            paymentMethod: order.metodo_pago || "Transferencia",
            reference: order.referencia_pago || "N/A"
          }}
          finalTotal={Number(order.total)}
          purchasedItems={order.items || []}
          orderCode={toOrderCode(order)}
          brand={site_name}
          logoUrl={logoUrl}
          issueDate={new Date(order.created_at).toLocaleDateString()}
          currencySymbol={getCurrencySymbol(selectedCurrency)}
          targetCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
      );

      console.log("Generando PDF con logo:", logoUrl);
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      Swal.close();

      if (action === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `Nota_Entrega_${toOrderCode(order)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo generar el reporte", "error");
    }
  };

  return (    <div className="fixed inset-0 min-h-screen z-150 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300 p-6 sm:p-8 relative">
        {/* Botón de cerrar (siempre en la esquina) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all z-20"
        >
          <X size={20} />
        </button>

        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pr-10">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
            Detalles <span className="text-slate-400 dark:text-slate-500">#{toOrderCode(order)}</span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-[10px] font-bold uppercase tracking-tighter cursor-pointer h-10"
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
            
            <button
              onClick={handlePrintOptions}
              className="flex items-center gap-2 px-4 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg whitespace-nowrap"
            >
              <FileText size={14} />
              <span>Nota de Entrega</span>
            </button>
          </div>
        </header>

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
