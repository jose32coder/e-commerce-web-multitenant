"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";

const COMPLETED = new Set(["paid", "pagado", "completed", "completado", "delivered", "entregado", "shipped", "enviado"]);
const PENDING = new Set(["pending", "pendiente", "processing", "procesando"]);
const CANCELLED = new Set(["cancelled", "cancelado"]);

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function DailyClosePage() {
  const { tenant_id: tenantId, loading: configLoading } = useSiteConfig();
  const supabase = createClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Cierre Diario</h1>
          <p className="text-sm text-slate-500">Reporte de movimientos y resultados por jornada.</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </header>

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

