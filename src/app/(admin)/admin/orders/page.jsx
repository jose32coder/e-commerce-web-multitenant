"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const Card = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
  </div>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily close summary constants
  const COMPLETED = new Set(["paid", "pagado", "completed", "completado", "delivered", "entregado", "shipped", "enviado"]);
  const PENDING = new Set(["pending", "pendiente", "processing", "procesando"]);
  const CANCELLED = new Set(["cancelled", "cancelado"]);
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  const dailySummary = useMemo(() => {
    let grossSales = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    const paymentBreakdown = {};
    for (const order of orders) {
      const status = String(order.estado || "").toLowerCase();
      const total = Number(order.total || 0);
      if (COMPLETED.has(status)) {
        grossSales += total;
        paidCount += 1;
        const key = order.metodo_pago || "No especificado";
        paymentBreakdown[key] = (paymentBreakdown[key] || 0) + total;
      } else if (PENDING.has(status)) {
        pendingCount += 1;
      } else if (CANCELLED.has(status)) {
        cancelledCount += 1;
      }
    }
    const avgTicket = paidCount > 0 ? grossSales / paidCount : 0;
    return {
      grossSales,
      estimatedProfit: grossSales,
      paidCount,
      pendingCount,
      cancelledCount,
      totalMovements: orders.length,
      avgTicket,
      paymentBreakdown,
    };
  }, [orders]);

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const { tenant_id: tenantId, exchange_rates, site_name, commerce_settings } = useSiteConfig();
  const supabase = createClient();

  const toOrderCode = (order) => {
    if (order?.order_number) return String(order.order_number).padStart(5, "0");
    return String(order?.id || "")
      .slice(-6)
      .toUpperCase();
  };

  const getErrorMessage = (error) =>
    error?.message || error?.details || "Error desconocido";

  const extractDeliveryFromNotes = (notes) => {
    if (!notes) return { method: null, provider: null };
    const match = String(notes).match(/^\[ENTREGA:\s*(.*?)\|(.*?)\]/s);
    if (!match) return { method: null, provider: null };
    return {
      method: match[1]?.trim() || null,
      provider: match[2]?.trim() || null,
    };
  };

  const getShippingMethod = (order) =>
    order.shipping_method || extractDeliveryFromNotes(order.notas).method || "";

  const getShippingProvider = (order) =>
    order.shipping_provider ||
    extractDeliveryFromNotes(order.notas).provider ||
    "";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("Todos los estados");
    setFromDate("");
    setToDate("");
    setMinTotal("");
    setMaxTotal("");
    setPaymentFilter("all");
    setShippingMethodFilter("all");
    setShippingProviderFilter("all");
    setPage(1);
  };

  const buildExportParams = (format) => {
    const params = new URLSearchParams({
      format,
      tenant_id: String(tenantId || ""),
      store_name: site_name || "",
      logo_url: commerce_settings?.logo_url || "",
    });

    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (statusFilter !== "Todos los estados") params.set("status", statusFilter);
    if (paymentFilter !== "all") params.set("payment", paymentFilter);
    if (shippingMethodFilter !== "all") params.set("shipping_method", shippingMethodFilter);
    if (shippingProviderFilter !== "all") params.set("shipping_provider", shippingProviderFilter);
    if (minTotal !== "") params.set("min_total", minTotal);
    if (maxTotal !== "") params.set("max_total", maxTotal);

    return params;
  };

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

      if (statusFilter !== "Todos los estados") {
        query = query.eq("estado", statusFilter);
      }
      if (fromDate) {
        query = query.gte("created_at", new Date(fromDate).toISOString());
      }
      if (toDate) {
        query = query.lte(
          "created_at",
          new Date(`${toDate}T23:59:59`).toISOString(),
        );
      }
      if (minTotal !== "") {
        query = query.gte("total", Number(minTotal));
      }
      if (maxTotal !== "") {
        query = query.lte("total", Number(maxTotal));
      }
      if (paymentFilter !== "all") {
        query = query.eq("metodo_pago", paymentFilter);
      }
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
  }, [
    tenantId,
    statusFilter,
    fromDate,
    toDate,
    minTotal,
    maxTotal,
    paymentFilter,
    shippingMethodFilter,
    shippingProviderFilter,
  ]);

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
    const shippingMethodOk =
      shippingMethodFilter === "all" ||
      String(getShippingMethod(o)) === shippingMethodFilter;
    const shippingProviderOk =
      shippingProviderFilter === "all" ||
      String(getShippingProvider(o)) === shippingProviderFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      fromOk &&
      toOk &&
      minTotalOk &&
      maxTotalOk &&
      paymentOk &&
      shippingMethodOk &&
      shippingProviderOk
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
      title: "GENERANDO REPORTE",
      text: "Por favor espere mientras preparamos el archivo.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (format === "pdf") {
        const storeName = site_name || "Mi Tienda";
        const logoUrl = commerce_settings?.logo_url || "";
        const totalOrders = filteredOrders.length;
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const completedCount = filteredOrders.filter((o) => ["completed", "delivered", "paid", "pagado", "completado", "entregado", "shipped", "enviado"].includes((o.estado || "").toLowerCase())).length;
        const pendingCount = filteredOrders.filter((o) => ["pending", "pendiente", "processing", "procesando"].includes((o.estado || "").toLowerCase())).length;
        const currencySymbol = commerce_settings?.currency_symbol || "$";

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
              <title>Reporte de Ventas — ${storeName}</title>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 12mm 10mm 14mm 10mm;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                  color: #1e293b;
                  background: #fff;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }

                /* ── Header ── */
                .report-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding-bottom: 16px;
                  border-bottom: 3px solid #0f172a;
                  margin-bottom: 18px;
                }
                .brand-block { display: flex; align-items: center; gap: 14px; }
                .brand-logo {
                  width: 52px; height: 52px; border-radius: 10px;
                  object-fit: contain; background: #f1f5f9; padding: 4px;
                }
                .brand-name {
                  font-size: 22px; font-weight: 800; text-transform: uppercase;
                  letter-spacing: -0.5px; color: #0f172a;
                }
                .brand-sub { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
                .report-date { text-align: right; }
                .report-date .label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                .report-date .value { font-size: 11px; color: #334155; font-weight: 600; }

                /* ── Stats ── */
                .stats-bar {
                  display: flex; gap: 8px; margin-bottom: 18px;
                }
                .stat-card {
                  flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
                  border-radius: 8px; padding: 10px 14px; text-align: center;
                }
                .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
                .stat-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px; }
                .stat-card.revenue { border-left: 3px solid #0ea5e9; }
                .stat-card.completed { border-left: 3px solid #22c55e; }
                .stat-card.pending { border-left: 3px solid #f59e0b; }

                /* ── Table ── */
                table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
                thead th {
                  background: #0f172a; color: #fff; padding: 8px 10px;
                  text-align: left; text-transform: uppercase; font-size: 8px;
                  letter-spacing: 1px; font-weight: 700;
                }
                thead th:first-child { border-radius: 6px 0 0 0; }
                thead th:last-child { border-radius: 0 6px 0 0; }
                tbody tr { border-bottom: 1px solid #f1f5f9; }
                tbody tr:nth-child(even) { background: #f8fafc; }
                tbody tr:hover { background: #f1f5f9; }
                tbody td { padding: 7px 10px; vertical-align: middle; }
                td.order-cell { font-weight: 700; color: #0f172a; }
                td.client-cell { font-weight: 600; color: #1e293b; max-width: 180px; }
                td.date-cell { color: #64748b; font-size: 8.5px; }
                td.total-cell { font-weight: 700; color: #0f172a; text-align: right; }

                /* ── Status Badge ── */
                .badge {
                  display: inline-block; padding: 2px 8px; border-radius: 20px;
                  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .badge-completed { background: #dcfce7; color: #15803d; }
                .badge-pending { background: #fef3c7; color: #a16207; }
                .badge-cancelled { background: #fee2e2; color: #dc2626; }
                .badge-default { background: #dbeafe; color: #1d4ed8; }

                /* ── Footer ── */
                .report-footer {
                  margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;
                  display: flex; justify-content: space-between; align-items: center;
                  font-size: 8px; color: #94a3b8;
                }
                .footer-brand { font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
              </style>
            </head>
            <body>
              <!-- Header -->
              <div class="report-header">
                <div class="brand-block">
                  ${logoUrl ? `<img class="brand-logo" src="${logoUrl}" alt="Logo" />` : ""}
                  <div>
                    <div class="brand-name">${storeName}</div>
                    <div class="brand-sub">Reporte de Ventas</div>
                  </div>
                </div>
                <div class="report-date">
                  <div class="label">Generado el</div>
                  <div class="value">${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  <div class="value" style="font-size:9px; color:#94a3b8">${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <!-- Stats -->
              <div class="stats-bar">
                <div class="stat-card">
                  <div class="stat-value">${totalOrders}</div>
                  <div class="stat-label">Total Órdenes</div>
                </div>
                <div class="stat-card revenue">
                  <div class="stat-value">${currencySymbol}${totalRevenue.toFixed(2)}</div>
                  <div class="stat-label">Ingresos (USD)</div>
                </div>
                <div class="stat-card completed">
                  <div class="stat-value">${completedCount}</div>
                  <div class="stat-label">Completadas</div>
                </div>
                <div class="stat-card pending">
                  <div class="stat-value">${pendingCount}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
              </div>

              <!-- Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width:12%">Nº Orden</th>
                    <th style="width:30%">Cliente</th>
                    <th style="width:15%">Fecha</th>
                    <th style="width:20%; text-align:right;">Total (USD)</th>
                    <th style="width:23%; text-align:center;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredOrders
                    .map(
                      (o) => {
                        const stateLow = (o.estado || "").toLowerCase();
                        let statusClass = "badge-default";
                        if (["completed", "delivered", "paid", "pagado", "completado", "entregado", "shipped", "enviado"].includes(stateLow)) statusClass = "badge-completed";
                        else if (["cancelled", "cancelado"].includes(stateLow)) statusClass = "badge-cancelled";
                        else if (["pending", "pendiente", "processing", "procesando"].includes(stateLow)) statusClass = "badge-pending";
                        
                        return `
                    <tr>
                      <td class="order-cell">#${toOrderCode(o)}</td>
                      <td class="client-cell">${o.customer_name || "Desconocido"}</td>
                      <td class="date-cell">${new Date(o.created_at).toLocaleDateString("es-ES")}</td>
                      <td class="total-cell">${currencySymbol}${Number(o.total || 0).toFixed(2)}</td>
                      <td style="text-align:center;"><span class="badge ${statusClass}">${o.estado || "Desconocido"}</span></td>
                    </tr>`;
                      },
                    )
                    .join("")}
                </tbody>
              </table>

              <!-- Footer -->
              <div class="report-footer">
                <span class="footer-brand">${storeName}</span>
                <span>Página 1 · ${filteredOrders.length} orden(es) · ${new Date().toLocaleDateString("es-ES")}</span>
              </div>
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
        }, 600);
        return;
      }

      const response = await fetch(
        `/api/admin/export/orders?${buildExportParams(format).toString()}`,
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
        title: "EXPORTACIÓN LISTA",
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
    new Set(orders.map((o) => getShippingMethod(o)).filter(Boolean)),
  );
  const shippingProviderOptions = Array.from(
    new Set(orders.map((o) => getShippingProvider(o)).filter(Boolean)),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards + Cierre del día */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 flex-1">
          <Card label="Ventas brutas" value={money(dailySummary.grossSales)} />
          <Card label="Órdenes completadas" value={dailySummary.paidCount} />
          <Card label="Órdenes pendientes" value={dailySummary.pendingCount} />
          <Card label="Ticket promedio" value={money(dailySummary.avgTicket)} />
        </div>
        <Link
          href="/admin/daily-close"
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          📋 Cierre del día
        </Link>
      </div>

      {/* Export Buttons */}
      <ExportButtons onExport={handleExport} loading={exportLoading} />

      {/* Filters */}
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
        onRefresh={fetchOrders}
        onClearFilters={resetFilters}
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
          paymentOptions,
          shippingMethodFilter,
          setShippingMethodFilter,
          shippingMethodOptions,
          shippingProviderFilter,
          setShippingProviderFilter,
          shippingProviderOptions,
        }}
      />

      {/* Orders Table */}
      <OrderTable
        orders={paginatedOrders}
        loading={loading}
        onSelectOrder={setSelectedOrder}
        onUpdateStatus={updateStatus}
        onReject={handleReject}
        toOrderCode={toOrderCode}
        selectedCurrency={selectedCurrency}
        exchangeRates={exchange_rates}
      />

      {/* Pagination */}
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
