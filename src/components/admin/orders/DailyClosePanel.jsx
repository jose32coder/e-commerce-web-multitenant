"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import ExportButtons from "@/components/admin/shared/ExportButtons";
import Swal from "sweetalert2";

const COMPLETED = new Set([
  "paid",
  "pagado",
  "completed",
  "completado",
  "delivered",
  "entregado",
  "shipped",
  "enviado",
]);
const PENDING = new Set(["pending", "pendiente", "processing", "procesando"]);
const CANCELLED = new Set(["cancelled", "cancelado"]);

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function DailyClosePanel() {
  const {
    tenant_id: tenantId,
    loading: configLoading,
    site_name,
    commerce_settings,
  } = useSiteConfig();
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
        .select(
          "id, order_number, created_at, total, estado, metodo_pago, customer_name",
        )
        .eq("tenant_id", tenantId)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }

    fetchDailyOrders();
  }, [tenantId, configLoading, date, supabase]);

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
        const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
          "es-ES",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        );

        const paymentBreakdownHtml = Object.entries(summary.paymentBreakdown)
          .map(
            ([method, amount]) => `
              <div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;">
                <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">${method}</div>
                <div style="font-size:16px;font-weight:800;color:#0f172a;">${money(amount)}</div>
              </div>
            `,
          )
          .join("");

        const rowsHtml = orders
          .map(
            (o) => `
              <tr>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;">#${o.order_number || o.id}</td>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${new Date(o.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</td>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${o.customer_name || "N/A"}</td>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${o.estado || "N/A"}</td>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${o.metodo_pago || "N/A"}</td>
                <td style="padding:6px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(o.total)}</td>
              </tr>
            `,
          )
          .join("");

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
              <title>Cierre diario - ${formattedDate}</title>
              <style>
                body{font-family:Segoe UI,system-ui,sans-serif;color:#0f172a;padding:24px;}
                .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;}
                .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0;}
                .card{border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#f8fafc;}
                .label{font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;}
                .value{font-size:20px;font-weight:800;}
                table{width:100%;border-collapse:collapse;font-size:12px;}
                th{background:#0f172a;color:#fff;padding:8px;text-align:left;text-transform:uppercase;font-size:10px;}
              </style>
            </head>
            <body>
              <div class="header">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="logo" style="width:42px;height:42px;object-fit:contain;border-radius:8px;" />` : ""}
                  <div>
                    <div style="font-size:20px;font-weight:800;">${storeName}</div>
                    <div style="font-size:11px;color:#64748b;">Cierre diario</div>
                  </div>
                </div>
                <div style="text-align:right;font-size:12px;color:#64748b;">${formattedDate}</div>
              </div>

              <div class="grid">
                <div class="card"><div class="label">Ventas del día</div><div class="value">${money(summary.grossSales)}</div></div>
                <div class="card"><div class="label">Ganancia estimada</div><div class="value">${money(summary.estimatedProfit)}</div></div>
                <div class="card"><div class="label">Órdenes pagadas</div><div class="value">${summary.paidCount}</div></div>
                <div class="card"><div class="label">Ticket promedio</div><div class="value">${money(summary.avgTicket)}</div></div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 18px;">
                ${
                  Object.keys(summary.paymentBreakdown).length === 0
                    ? `<div style="grid-column:span 3;color:#64748b;font-size:12px;">Sin ventas pagadas en esta fecha.</div>`
                    : paymentBreakdownHtml
                }
              </div>

              <table>
                <thead>
                  <tr><th>Orden</th><th>Hora</th><th>Cliente</th><th>Estado</th><th>Pago</th><th style="text-align:right;">Total</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
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
        }, 550);
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Cierre Diario
          </h1>
          <p className="text-sm text-slate-500">
            Reporte de movimientos y resultados por jornada.
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
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
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Ventas por método de pago
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(summary.paymentBreakdown).length === 0 ? (
            <p className="text-sm text-slate-500">
              Sin ventas pagadas en esta fecha.
            </p>
          ) : (
            Object.entries(summary.paymentBreakdown).map(([method, amount]) => (
              <div
                key={method}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <p className="font-semibold text-slate-700">{method}</p>
                <p className="text-slate-900">{money(amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Movimientos del día
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay movimientos para esta fecha.
          </p>
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
                    <td className="px-2 py-2">
                      {new Date(o.created_at).toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>
    </article>
  );
}
