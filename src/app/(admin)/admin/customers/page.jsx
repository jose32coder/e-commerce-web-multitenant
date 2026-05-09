"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import { formatWhatsappContactNumber } from "@/lib/siteConfig";
import { useSiteConfig } from "@/context/SiteConfigContext";

// Componentes extraídos
import ExportButtons from "@/components/admin/shared/ExportButtons";
import CustomerFilters from "@/components/admin/customers/CustomerFilters";
import CustomerTable from "@/components/admin/customers/CustomerTable";
import ProductPagination from "@/components/admin/products/ProductPagination";
import dynamic from "next/dynamic";

const CustomerDetailsModal = dynamic(() => import("@/components/admin/customers/CustomerDetailsModal"), {
  ssr: false,
});

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [sortBy, setSortBy] = useState("spent_desc");
  const [minOrdersPaid, setMinOrdersPaid] = useState("");
  const [minSpentUsd, setMinSpentUsd] = useState("");
  const [minItemsQty, setMinItemsQty] = useState("");
  const [onlyWithPurchases, setOnlyWithPurchases] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { tenant_id: tenantId, exchange_rates, site_name, commerce_settings } = useSiteConfig();
  const supabase = createClient();

  const toOrderCode = (order) => {
    if (order?.order_number) return String(order.order_number).padStart(5, "0");
    return String(order?.id || "")
      .slice(-6)
      .toUpperCase();
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      if (!tenantId) return;

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, customer_id, customer_name, customer_id_number, customer_phone, customer_email, total, estado, items, created_at, order_number",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Agrupar por cliente
      const grouped = new Map();
      (ordersData || []).forEach((order) => {
        const key =
          order.customer_id || order.customer_id_number || order.customer_phone;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            nombre_completo: order.customer_name,
            cedula: order.customer_id_number,
            telefono: order.customer_phone,
            email: order.customer_email,
            orders: [],
          });
        }
        grouped.get(key).orders.push(order);
      });

      setCustomers(Array.from(grouped.values()));
    } catch (error) {
      console.error("Error cargando clientes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenantId]);

  const withMetrics = customers.map((c) => {
    const paidOrders = (c.orders || []).filter((o) => o.estado === "paid");
    const itemsQtyPaid = paidOrders.reduce(
      (sum, o) =>
        sum +
        (Array.isArray(o.items)
          ? o.items.reduce((acc, i) => acc + Number(i.quantity || 0), 0)
          : 0),
      0,
    );
    const totalSpentPaidUsd = paidOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );
    return {
      ...c,
      paidOrdersCount: paidOrders.length,
      itemsQtyPaid,
      totalSpentPaidUsd,
    };
  });

  const filteredCustomers = withMetrics
    .filter((c) => {
      const searchOk =
        c.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cedula?.includes(searchTerm);
      const minOrdersOk = Number(minOrdersPaid || 0) <= c.paidOrdersCount;
      const minSpentOk = Number(minSpentUsd || 0) <= c.totalSpentPaidUsd;
      const minItemsOk = Number(minItemsQty || 0) <= c.itemsQtyPaid;
      const purchasesOk = !onlyWithPurchases || c.paidOrdersCount > 0;
      return searchOk && minOrdersOk && minSpentOk && minItemsOk && purchasesOk;
    })
    .sort((a, b) => {
      if (sortBy === "items_desc") return b.itemsQtyPaid - a.itemsQtyPaid;
      if (sortBy === "orders_desc")
        return b.paidOrdersCount - a.paidOrdersCount;
      if (sortBy === "name_asc")
        return (a.nombre_completo || "").localeCompare(b.nombre_completo || "");
      return b.totalSpentPaidUsd - a.totalSpentPaidUsd;
    });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, minOrdersPaid, minSpentUsd, minItemsQty, onlyWithPurchases]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

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
        const currencySymbol = commerce_settings?.currency_symbol || "$";
        
        const totalCustomers = filteredCustomers.length;
        const buyingCustomers = filteredCustomers.filter(c => c.paidOrdersCount > 0).length;
        const totalRevenue = filteredCustomers.reduce((sum, c) => sum + Number(c.totalSpentPaidUsd || 0), 0);
        const totalOrders = filteredCustomers.reduce((sum, c) => sum + Number(c.paidOrdersCount || 0), 0);

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
              <title>Reporte de Clientes — ${storeName}</title>
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
                .stat-card.buying { border-left: 3px solid #7e22ce; }
                .stat-card.orders { border-left: 3px solid #f59e0b; }
                .stat-card.revenue { border-left: 3px solid #22c55e; }

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
                td.name-cell { font-weight: 600; color: #1e293b; max-width: 180px; text-transform: capitalize; }
                td.contact-cell { color: #64748b; font-size: 8.5px; }
                td.orders-cell { text-align: center; font-weight: 600; color: #0f172a; }
                td.total-cell { font-weight: 700; color: #15803d; text-align: right; }

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
                    <div class="brand-sub">Reporte de Clientes</div>
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
                  <div class="stat-value">${totalCustomers}</div>
                  <div class="stat-label">Total Clientes</div>
                </div>
                <div class="stat-card buying">
                  <div class="stat-value">${buyingCustomers}</div>
                  <div class="stat-label">Con Compras</div>
                </div>
                <div class="stat-card orders">
                  <div class="stat-value">${totalOrders}</div>
                  <div class="stat-label">Órdenes Pagadas</div>
                </div>
                <div class="stat-card revenue">
                  <div class="stat-value">${currencySymbol}${totalRevenue.toFixed(2)}</div>
                  <div class="stat-label">Gastado (USD)</div>
                </div>
              </div>

              <!-- Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width:25%">Nombre</th>
                    <th style="width:15%">Identificación</th>
                    <th style="width:25%">Contacto</th>
                    <th style="width:15%; text-align:center;">Compras</th>
                    <th style="width:20%; text-align:right;">Gastado (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredCustomers
                    .map(
                      (c) => `
                    <tr>
                      <td class="name-cell">${c.nombre_completo?.toLowerCase() || "Desconocido"}</td>
                      <td class="contact-cell">${c.cedula || "—"}</td>
                      <td class="contact-cell">
                        ${c.email ? `<div>${c.email}</div>` : ""}
                        ${c.telefono ? `<div>${c.telefono}</div>` : ""}
                        ${!c.email && !c.telefono ? "—" : ""}
                      </td>
                      <td class="orders-cell">${c.paidOrdersCount}</td>
                      <td class="total-cell">${currencySymbol}${Number(c.totalSpentPaidUsd || 0).toFixed(2)}</td>
                    </tr>`,
                    )
                    .join("")}
                </tbody>
              </table>

              <!-- Footer -->
              <div class="report-footer">
                <span class="footer-brand">${storeName}</span>
                <span>Página 1 · ${filteredCustomers.length} cliente(s) · ${new Date().toLocaleDateString("es-ES")}</span>
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

      const storeNameParam = encodeURIComponent(site_name || "");
      const logoUrlParam = encodeURIComponent(commerce_settings?.logo_url || "");
      const response = await fetch(
        `/api/admin/export/customers?format=${format}&tenant_id=${tenantId}&store_name=${storeNameParam}&logo_url=${logoUrlParam}`,
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo exportar los clientes.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `clientes_export_${new Date().toISOString().slice(0, 10)}.${format}`;
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

  const buildWhatsappHref = (phone) => {
    const normalized = formatWhatsappContactNumber(phone, "58");
    return normalized ? `https://wa.me/${normalized}` : "#";
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
          Clientes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Base de datos de compradores registrados.
        </p>
      </header>

      <ExportButtons onExport={handleExport} loading={exportLoading} />

      <CustomerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        pageSize={pageSize}
        setPageSize={setPageSize}
        advancedFiltersProps={{
          minOrdersPaid,
          setMinOrdersPaid,
          minSpentUsd,
          setMinSpentUsd,
          minItemsQty,
          setMinItemsQty,
          onlyWithPurchases,
          setOnlyWithPurchases,
        }}
      />

      <CustomerTable
        customers={paginatedCustomers}
        loading={loading}
        onViewDetails={setSelectedCustomer}
        buildWhatsappHref={buildWhatsappHref}
      />

      <ProductPagination
        loading={loading}
        filteredProducts={filteredCustomers}
        startIndex={startIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          exchangeRates={exchange_rates}
          toOrderCode={toOrderCode}
          buildWhatsappHref={buildWhatsappHref}
        />
      )}
    </div>
  );
}
