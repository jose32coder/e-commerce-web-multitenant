"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import ExportButtons from "@/components/admin/shared/ExportButtons";
import SalesSectionTabs from "@/components/admin/orders/SalesSectionTabs";
import Swal from "sweetalert2";

const COMPLETED = new Set(["paid", "pagado", "completed", "completado", "delivered", "entregado", "shipped", "enviado"]);
const PENDING = new Set(["pending", "pendiente", "processing", "procesando"]);
const CANCELLED = new Set(["cancelled", "cancelado"]);

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function DailyClosePage() {
  const { tenant_id: tenantId, loading: configLoading, site_name, commerce_settings } = useSiteConfig();
  const supabase = createClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    async function fetchDailyOrders() {
      if (!tenantId || configLoading) return;
      setLoading(true);
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(`${date}T23:59:59`);

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total, estado, metodo_pago, customer_name")
        .eq("tenant_id", tenantId)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }

    fetchDailyOrders();
  }, [tenantId, configLoading, date]);

  const summary = useMemo(() => {
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
        const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });

        let iframe = document.getElementById("print-iframe");
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.id = "print-iframe";
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }

        const paymentBreakdownHtml = Object.entries(summary.paymentBreakdown)
          .map(([method, amount]) => `
            <div class="payment-card">
              <div class="payment-method">${method}</div>
              <div class="payment-amount">${money(amount)}</div>
            </div>
          `).join("");

        const ordersHtml = orders.map((o) => {
          const stateLow = (o.estado || "").toLowerCase();
          let statusClass = "badge-default";
          if (["completed", "delivered", "paid", "pagado", "completado", "entregado", "shipped", "enviado"].includes(stateLow)) statusClass = "badge-completed";
          else if (["cancelled", "cancelado"].includes(stateLow)) statusClass = "badge-cancelled";
          else if (["pending", "pendiente", "processing", "procesando"].includes(stateLow)) statusClass = "badge-pending";

          const orderCode = o.order_number ? String(o.order_number).padStart(5, "0") : String(o.id || "").slice(-6).toUpperCase();
          const orderTime = new Date(o.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });

          return `
            <tr>
              <td class="order-cell">#${orderCode}</td>
              <td class="time-cell">${orderTime}</td>
              <td class="client-cell">${o.customer_name || "N/A"}</td>
              <td style="text-align:center;"><span class="badge ${statusClass}">${o.estado || "Desconocido"}</span></td>
              <td class="payment-cell">${o.metodo_pago || "N/A"}</td>
              <td class="total-cell">${money(o.total)}</td>
            </tr>
          `;
        }).join("");

        const html = `
          <html>
            <head>
              <title>Cierre Diario — ${storeName}</title>
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

                /* ── Sections ── */
                .section-title {
                  font-size: 12px;
                  font-weight: 800;
                  text-transform: uppercase;
                  color: #0f172a;
                  border-bottom: 1px solid #e2e8f0;
                  padding-bottom: 6px;
                  margin-bottom: 12px;
                  margin-top: 18px;
                }

                /* ── Stats ── */
                .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 8px;
                  margin-bottom: 12px;
                }
                .stats-grid-3 {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                  margin-bottom: 18px;
                }
                .stat-card {
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 8px 12px;
                  text-align: center;
                }
                .stat-value { font-size: 16px; font-weight: 800; color: #0f172a; }
                .stat-label { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-top: 2px; }
                .stat-card.primary { border-left: 3px solid #0f172a; }
                .stat-card.revenue { border-left: 3px solid #0ea5e9; }
                .stat-card.completed { border-left: 3px solid #22c55e; }
                .stat-card.pending { border-left: 3px solid #f59e0b; }
                .stat-card.cancelled { border-left: 3px solid #ef4444; }

                /* ── Payment Breakdown ── */
                .payment-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                  margin-bottom: 18px;
                }
                .payment-card {
                  background: #fff;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 8px 12px;
                }
                .payment-method { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; }
                .payment-amount { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }

                /* ── Table ── */
                table { width: 100%; border-collapse: collapse; font-size: 9px; }
                thead th {
                  background: #0f172a; color: #fff; padding: 6px 8px;
                  text-align: left; text-transform: uppercase; font-size: 7.5px;
                  letter-spacing: 0.5px; font-weight: 700;
                }
                thead th:first-child { border-radius: 6px 0 0 0; }
                thead th:last-child { border-radius: 0 6px 0 0; }
                tbody tr { border-bottom: 1px solid #f1f5f9; }
                tbody tr:nth-child(even) { background: #f8fafc; }
                tbody td { padding: 6px 8px; vertical-align: middle; }
                td.order-cell { font-weight: 700; color: #0f172a; }
                td.time-cell { color: #64748b; }
                td.client-cell { font-weight: 600; color: #1e293b; }
                td.payment-cell { color: #475569; }
                td.total-cell { font-weight: 700; color: #0f172a; text-align: right; }

                /* ── Status Badge ── */
                .badge {
                  display: inline-block; padding: 2px 6px; border-radius: 20px;
                  font-size: 7px; font-weight: 700; text-transform: uppercase;
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
                    <div class="brand-sub">Cierre de Caja Diario</div>
                  </div>
                </div>
                <div class="report-date">
                  <div class="label">Jornada del</div>
                  <div class="value">${formattedDate}</div>
                  <div class="value" style="font-size:9px; color:#94a3b8">Generado: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <!-- Section: Resumen General -->
              <div class="section-title">Resumen Financiero</div>
              <div class="stats-grid">
                <div class="stat-card revenue">
                  <div class="stat-value">${money(summary.grossSales)}</div>
                  <div class="stat-label">Ventas del día</div>
                </div>
                <div class="stat-card primary">
                  <div class="stat-value">${money(summary.estimatedProfit)}</div>
                  <div class="stat-label">Ganancia Estimada</div>
                </div>
                <div class="stat-card completed">
                  <div class="stat-value">${summary.paidCount}</div>
                  <div class="stat-label">Órdenes Pagadas</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${money(summary.avgTicket)}</div>
                  <div class="stat-label">Ticket Promedio</div>
                </div>
              </div>

              <div class="stats-grid-3">
                <div class="stat-card">
                  <div class="stat-value">${summary.totalMovements}</div>
                  <div class="stat-label">Movimientos Totales</div>
                </div>
                <div class="stat-card pending">
                  <div class="stat-value">${summary.pendingCount}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
                <div class="stat-card cancelled">
                  <div class="stat-value">${summary.cancelledCount}</div>
                  <div class="stat-label">Canceladas</div>
                </div>
              </div>

              <!-- Section: Métodos de Pago -->
              <div class="section-title">Ventas por método de pago</div>
              <div class="payment-grid">
                ${Object.keys(summary.paymentBreakdown).length === 0 ? `
                  <div style="grid-column: span 3; text-align: center; font-size: 10px; color: #64748b; padding: 12px;">
                    Sin ventas pagadas en esta fecha.
                  </div>
                ` : paymentBreakdownHtml}
              </div>

              <!-- Section: Movimientos -->
              <div class="section-title">Movimientos detallados</div>
              ${orders.length === 0 ? `
                <div style="text-align: center; font-size: 10px; color: #64748b; padding: 20px; border: 1px dashed #e2e8f0; border-radius: 8px;">
                  No hay movimientos para esta fecha.
                </div>
              ` : `
                <table>
                  <thead>
                    <tr>
                      <th style="width:12%">Nº Orden</th>
                      <th style="width:12%">Hora</th>
                      <th style="width:30%">Cliente</th>
                      <th style="width:16%; text-align:center;">Estado</th>
                      <th style="width:15%">Pago</th>
                      <th style="width:15%; text-align:right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ordersHtml}
                  </tbody>
                </table>
              `}

              <!-- Footer -->
              <div class="report-footer">
                <span class="footer-brand">${storeName}</span>
                <span>${orders.length} orden(es) · ${new Date().toLocaleDateString("es-ES")}</span>
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

      const params = new URLSearchParams({
        format,
        tenant_id: String(tenantId || ""),
        store_name: site_name || "",
        logo_url: commerce_settings?.logo_url || "",
        from: date,
        to: date,
      });

      const response = await fetch(
        `/api/admin/export/orders?${params.toString()}`,
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo exportar las ventas del día.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cierre_diario_${date}.${format}`;
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

  return (
    <section className="space-y-6">
      <SalesSectionTabs mode="route" activeTab="daily-close" />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Cierre Diario</h1>
          <p className="text-sm text-slate-500">Reporte de movimientos y resultados por jornada.</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </header>

      <ExportButtons onExport={handleExport} loading={exportLoading} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Ventas del día" value={money(summary.grossSales)} />
        <Card label="Ganancia estimada" value={money(summary.estimatedProfit)} />
        <Card label="Órdenes pagadas" value={summary.paidCount} />
        <Card label="Ticket promedio" value={money(summary.avgTicket)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Movimientos totales" value={summary.totalMovements} />
        <Card label="Pendientes" value={summary.pendingCount} />
        <Card label="Canceladas" value={summary.cancelledCount} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Ventas por método de pago</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(summary.paymentBreakdown).length === 0 ? (
            <p className="text-sm text-slate-500">Sin ventas pagadas en esta fecha.</p>
          ) : (
            Object.entries(summary.paymentBreakdown).map(([method, amount]) => (
              <div key={method} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-700">{method}</p>
                <p className="text-slate-900">{money(amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Movimientos del día</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">No hay movimientos para esta fecha.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Orden</th>
                  <th className="px-2 py-2">Hora</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Pago</th>
                  <th className="px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">#{o.order_number || o.id}</td>
                    <td className="px-2 py-2">{new Date(o.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-2 py-2">{o.customer_name || "N/A"}</td>
                    <td className="px-2 py-2">{o.estado || "N/A"}</td>
                    <td className="px-2 py-2">{o.metodo_pago || "N/A"}</td>
                    <td className="px-2 py-2">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

