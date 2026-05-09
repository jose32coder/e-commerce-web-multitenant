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

  const { tenant_id: tenantId, exchange_rates } = useSiteConfig();
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
      title: "Generando reporte...",
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
              <title>Reporte de Clientes</title>
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
              <h1>Reporte de Clientes</h1>
              <div class="meta">Generado el: ${new Date().toLocaleString()}</div>
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Identificación</th><th>Email</th><th>Teléfono</th><th>Compras</th><th>Total Gastado (USD)</th></tr>
                </thead>
                <tbody>
                  ${filteredCustomers
                    .map(
                      (c) => `
                    <tr>
                      <td style="text-transform: capitalize;">${c.nombre_completo?.toLowerCase()}</td>
                      <td>${c.cedula || "N/A"}</td>
                      <td>${c.email || "N/A"}</td>
                      <td>${c.telefono || "N/A"}</td>
                      <td>${c.paidOrdersCount}</td>
                      <td>$${Number(c.totalSpentPaidUsd || 0).toFixed(2)}</td>
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
        `/api/admin/export/customers?format=${format}&tenant_id=${tenantId}`,
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
