import Swal from "sweetalert2";
import {
  isCancelledStatus,
  isCompletedStatus,
  isPendingStatus,
} from "@/components/admin/orders/utils/ordersStatusSets";

export function buildOrdersExportParams({
  format,
  tenantId,
  siteName,
  logoUrl,
  fromDate,
  toDate,
  statusFilter,
  paymentFilter,
  shippingMethodFilter,
  shippingProviderFilter,
  minTotal,
  maxTotal,
}) {
  const params = new URLSearchParams({
    format,
    tenant_id: String(tenantId || ""),
    store_name: siteName || "",
    logo_url: logoUrl || "",
  });

  if (fromDate) params.set("from", fromDate);
  if (toDate) params.set("to", toDate);
  if (statusFilter && statusFilter !== "Todos los estados") {
    params.set("status", statusFilter);
  }
  if (paymentFilter && paymentFilter !== "all") params.set("payment", paymentFilter);
  if (shippingMethodFilter && shippingMethodFilter !== "all") {
    params.set("shipping_method", shippingMethodFilter);
  }
  if (shippingProviderFilter && shippingProviderFilter !== "all") {
    params.set("shipping_provider", shippingProviderFilter);
  }
  if (minTotal !== "") params.set("min_total", minTotal);
  if (maxTotal !== "") params.set("max_total", maxTotal);

  return params;
}

function getBadgeClass(status) {
  if (isCompletedStatus(status)) return "badge-completed";
  if (isCancelledStatus(status)) return "badge-cancelled";
  if (isPendingStatus(status)) return "badge-pending";
  return "badge-default";
}

export async function handleOrdersExport({
  format,
  filteredOrders,
  tenantId,
  siteName,
  commerceSettings,
  toOrderCode,
  filters,
}) {
  Swal.fire({
    title: "GENERANDO REPORTE",
    text: "Por favor espere mientras preparamos el archivo.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    if (format === "pdf") {
      const storeName = siteName || "Mi Tienda";
      const logoUrl = commerceSettings?.logo_url || "";
      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce(
        (sum, o) => sum + Number(o.total || 0),
        0,
      );
      const completedCount = filteredOrders.filter((o) =>
        isCompletedStatus(o.estado),
      ).length;
      const pendingCount = filteredOrders.filter((o) =>
        isPendingStatus(o.estado),
      ).length;
      const currencySymbol = commerceSettings?.currency_symbol || "$";

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

              .badge {
                display: inline-block; padding: 2px 8px; border-radius: 20px;
                font-size: 7.5px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .badge-completed { background: #dcfce7; color: #15803d; }
              .badge-pending { background: #fef3c7; color: #a16207; }
              .badge-cancelled { background: #fee2e2; color: #dc2626; }
              .badge-default { background: #dbeafe; color: #1d4ed8; }

              .report-footer {
                margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;
                display: flex; justify-content: space-between; align-items: center;
                font-size: 8px; color: #94a3b8;
              }
              .footer-brand { font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
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
                  .map((o) => {
                    const statusClass = getBadgeClass(o.estado);
                    return `
                      <tr>
                        <td class="order-cell">#${toOrderCode(o)}</td>
                        <td class="client-cell">${o.customer_name || "Desconocido"}</td>
                        <td class="date-cell">${new Date(o.created_at).toLocaleDateString("es-ES")}</td>
                        <td class="total-cell">${currencySymbol}${Number(o.total || 0).toFixed(2)}</td>
                        <td style="text-align:center;"><span class="badge ${statusClass}">${o.estado || "Desconocido"}</span></td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>

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

    const params = buildOrdersExportParams({
      format,
      tenantId,
      siteName,
      logoUrl: commerceSettings?.logo_url || "",
      ...filters,
    });

    const response = await fetch(`/api/admin/export/orders?${params.toString()}`);
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
    Swal.fire("Error", error.message || "No se pudo exportar.", "error");
  }
}
