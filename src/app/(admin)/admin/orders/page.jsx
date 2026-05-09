"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { updateOrderStatusAction } from "@/app/actions/admin/orderActions";

// Componentes extraídos
import ExportButtons from "@/components/admin/shared/ExportButtons";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import ProductPagination from "@/components/admin/products/ProductPagination";
import dynamic from "next/dynamic";

const OrderDetailsModal = dynamic(() => import("@/components/admin/orders/OrderDetailsModal"), {
  ssr: false,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [shippingMethodFilter, setShippingMethodFilter] = useState("all");
  const [shippingProviderFilter, setShippingProviderFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { tenant_id: tenantId, exchange_rates } = useSiteConfig();
  const supabase = createClient();

  const toOrderCode = (order) => {
    if (order?.order_number) return String(order.order_number).padStart(5, "0");
    return String(order?.id || "")
      .slice(-6)
      .toUpperCase();
  };

  const getErrorMessage = (error) =>
    error?.message || error?.details || "Error desconocido";

  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (!tenantId) {
        setOrders([]);
        return;
      }
      let query = supabase
        .from("orders")
        .select("*, order_number")
        .eq("tenant_id", tenantId);
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;

      // Simplificamos la carga de clientes integrando la lógica necesaria
      setOrders(data || []);
    } catch (error) {
      console.error("Error cargando órdenes:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setCurrentUser(data.user);
    };
    loadCurrentUser();
  }, [tenantId]);

  const updateStatus = async (id, newStatus, reason = null) => {
    if (!tenantId) return;
    Swal.fire({
      title: "Actualizando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const response = await updateOrderStatusAction({
      orderId: id,
      newStatus,
      tenantId,
      reason,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
    });

    Swal.close();
    if (response.success) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Orden marcada como ${newStatus}`,
        showConfirmButton: false,
        timer: 3000,
      });
      fetchOrders();
    } else {
      Swal.fire("Error", response.error || "No se pudo actualizar", "error");
    }
  };

  const handleReject = async (id) => {
    const { value: formValues } = await Swal.fire({
      title: "Rechazar Orden",
      html: `
        <select id="swal-reason" class="swal2-select" style="max-width: 100%; width: 80%">
          <option value="Referencia de pago inválida o no coincide">Referencia de pago inválida o no coincide</option>
          <option value="Monto incompleto">Monto incompleto</option>
          <option value="Otro">Otro (Especificar)</option>
        </select>
        <input id="swal-other-reason" class="swal2-input" placeholder="Especifique el motivo..." style="display:none; max-width: 100%; width: 80%">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e11d48",
      didOpen: () => {
        const select = document.getElementById("swal-reason");
        const input = document.getElementById("swal-other-reason");
        select.addEventListener("change", (e) => {
          input.style.display = e.target.value === "Otro" ? "block" : "none";
        });
      },
      preConfirm: () => {
        const select = document.getElementById("swal-reason").value;
        const input = document.getElementById("swal-other-reason").value;
        if (select === "Otro" && !input.trim()) {
          Swal.showValidationMessage("Debe especificar el motivo");
          return false;
        }
        return select === "Otro" ? input.trim() : select;
      },
    });

    if (formValues) await updateStatus(id, "cancelled", formValues);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      String(o.id || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "Todos los estados" || o.estado === statusFilter;
    const createdDate = o.created_at ? new Date(o.created_at) : null;
    const fromOk =
      !fromDate || (createdDate && createdDate >= new Date(fromDate));
    const toOk =
      !toDate || (createdDate && createdDate <= new Date(`${toDate}T23:59:59`));
    const totalUsd = Number(o.total || 0);
    const minTotalOk = minTotal === "" || totalUsd >= Number(minTotal);
    const maxTotalOk = maxTotal === "" || totalUsd <= Number(maxTotal);
    const paymentOk =
      paymentFilter === "all" || String(o.metodo_pago || "") === paymentFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      fromOk &&
      toOk &&
      minTotalOk &&
      maxTotalOk &&
      paymentOk
    );
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, fromDate, toDate, minTotal, maxTotal, paymentFilter, shippingMethodFilter, shippingProviderFilter]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const handleExport = async (format) => {
    setExportLoading(true);
    Swal.fire({
      title: "Generando archivo...",
      text: "Preparando el reporte. Por favor espere.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (format === "pdf") {
        let iframe = document.getElementById("print-iframe");
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.id = "print-iframe";
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }
        const html = `
          <html>
            <head>
              <title>Reporte de Ventas</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
                th { background-color: #f4f4f4; text-transform: uppercase; }
                h1 { text-transform: uppercase; letter-spacing: -1px; margin-bottom: 5px; }
                .meta { font-size: 10px; color: #666; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Reporte de Ventas</h1>
              <div class="meta">Generado el: ${new Date().toLocaleString()}</div>
              <table>
                <thead>
                  <tr><th># Orden</th><th>Cliente</th><th>Fecha</th><th>Total (USD)</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  ${filteredOrders
                    .map(
                      (o) => `
                    <tr>
                      <td>#${toOrderCode(o)}</td>
                      <td>${o.customer_name || "Desconocido"}</td>
                      <td>${new Date(o.created_at).toLocaleDateString()}</td>
                      <td>$${Number(o.total || 0).toFixed(2)}</td>
                      <td>${o.estado}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          Swal.close();
        }, 500);
        return;
      }

      const response = await fetch(
        `/api/admin/export/orders?format=${format}&tenant_id=${tenantId}`,
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo exportar las ventas.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ventas_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: "success",
        title: "Exportación lista",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setExportLoading(false);
    }
  };

  const paymentOptions = Array.from(
    new Set(orders.map((o) => o.metodo_pago).filter(Boolean)),
  );
  const shippingMethodOptions = Array.from(
    new Set(orders.map((o) => o.shipping_method).filter(Boolean)),
  );
  const shippingProviderOptions = Array.from(
    new Set(orders.map((o) => o.shipping_provider).filter(Boolean)),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
          Ventas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Monitoreo y gestión de pedidos en tiempo real.
        </p>
      </header>

      <ExportButtons onExport={handleExport} loading={exportLoading} />

      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        pageSize={pageSize}
        setPageSize={setPageSize}
        advancedFiltersProps={{
          fromDate,
          setFromDate,
          toDate,
          setToDate,
          minTotal,
          setMinTotal,
          maxTotal,
          setMaxTotal,
          paymentFilter,
          setPaymentFilter,
          shippingMethodFilter,
          setShippingMethodFilter,
          shippingProviderFilter,
          setShippingProviderFilter,
          paymentOptions,
          shippingMethodOptions,
          shippingProviderOptions,
        }}
      />

      <OrderTable
        orders={paginatedOrders}
        loading={loading}
        selectedCurrency={selectedCurrency}
        exchangeRates={exchange_rates}
        toOrderCode={toOrderCode}
        onViewDetails={setSelectedOrder}
        onUpdateStatus={updateStatus}
        onReject={handleReject}
      />

      <ProductPagination
        loading={loading}
        filteredProducts={filteredOrders}
        startIndex={startIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          exchangeRates={exchange_rates}
          toOrderCode={toOrderCode}
        />
      )}
    </div>
  );
}
