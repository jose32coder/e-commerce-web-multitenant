"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Loader2,
  BellRing,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { convertPrice } from "@/services/exchangeRates";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PENDING_ORDER_STATUSES = [
  "pending",
  "pendiente",
  "processing",
  "procesando",
];

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    ventasHoy: 0,
    ordenesTotales: 0,
    stockBajo: 0,
    ventasPendientes: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [productSales, setProductSales] = useState({
    bestSellers: [],
    lowSellers: [],
  });
  const [loading, setLoading] = useState(true);
  const [dashboardCurrency, setDashboardCurrency] = useState("USD");
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const {
    tenant_id: tenantId,
    exchange_rates,
    loading: configLoading,
  } = useSiteConfig();

  useEffect(() => {
    async function fetchDashboardData() {
      if (!tenantId || configLoading) return;

      setLoading(true);
      setMetrics({
        ventasHoy: 0,
        ordenesTotales: 0,
        stockBajo: 0,
        ventasPendientes: 0,
      });
      setLowStockProducts([]);
      setPendingOrders([]);
      setProductSales({ bestSellers: [], lowSellers: [] });

      const supabase = createClient();
      const buildCustomerFromOrder = (order) => {
        const embedded = order?.customer || order?.cliente || {};
        return {
          full_name:
            embedded?.full_name || order?.customer_name || "Desconocido",
        };
      };

      const attachCustomers = async (orders) => {
        const ids = [
          ...new Set(orders.map((order) => order.customer_id).filter(Boolean)),
        ];
        if (ids.length === 0) {
          return orders.map((order) => ({
            ...order,
            clientes: buildCustomerFromOrder(order),
          }));
        }

        const tables = ["customers"];
        let customerMap = new Map();

        for (const tableName of tables) {
          const { data, error } = await supabase
            .from(tableName)
            .select("id, full_name")
            .in("id", ids)
            .eq("tenant_id", tenantId);

          if (!error) {
            customerMap = new Map((data || []).map((row) => [row.id, row]));
            break;
          }
        }

        return orders.map((order) => ({
          ...order,
          clientes:
            customerMap.get(order.customer_id) || buildCustomerFromOrder(order),
        }));
      };

      // 1. Ventas Hoy (estado Completado / paid)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data: hoyOrders } = await supabase
        .from("orders")
        .select("total")
        .eq("estado", "paid")
        .eq("tenant_id", tenantId)
        .gte("created_at", startOfToday.toISOString());

      const ventasHoy =
        hoyOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;

      // 2. Órdenes Totales
      const { count: ordenesTotales } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const { data: pendingSalesData, count: ventasPendientes } = await supabase
        .from("orders")
        .select(
          "id, total, estado, created_at, customer_id, customer_name, customer_id_number, customer_phone, order_number",
          { count: "exact" },
        )
        .eq("tenant_id", tenantId)
        .in("estado", PENDING_ORDER_STATUSES)
        .order("created_at", { ascending: false })
        .limit(5);

      // 3. Stock Bajo (detalles)
      const { data: lowStockData } = await supabase
        .from("product_stock")
        .select(
          `
          quantity,
          products (
            id,
            name
          )
        `,
        )
        .eq("tenant_id", tenantId)
        .lte("quantity", 5);

      const lowStockItems = (lowStockData || []).map((item) => ({
        id: item.products?.id,
        name: item.products?.name || "Producto sin nombre",
        quantity: item.quantity,
      }));
      setLowStockProducts(lowStockItems);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .eq("tenant_id", tenantId);

      const { data: paidOrdersForSales } = await supabase
        .from("orders")
        .select("items")
        .eq("tenant_id", tenantId)
        .eq("estado", "paid");

      const productMap = new Map(
        (productsData || []).map((product) => [
          String(product.id),
          {
            id: product.id,
            name: product.name || "Producto sin nombre",
            quantity: 0,
          },
        ]),
      );

      (paidOrdersForSales || []).forEach((order) => {
        const orderItems = Array.isArray(order.items) ? order.items : [];

        orderItems.forEach((item) => {
          const itemId = item.id ? String(item.id) : "";
          if (!itemId) return;

          const current = productMap.get(itemId) || {
            id: item.id,
            name: item.name || item.title || "Producto sin nombre",
            quantity: 0,
          };

          productMap.set(itemId, {
            ...current,
            quantity: current.quantity + (Number(item.quantity) || 0),
          });
        });
      });

      const salesRanking = Array.from(productMap.values());
      setProductSales({
        bestSellers: [...salesRanking]
          .sort(
            (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name),
          )
          .slice(0, 5),
        lowSellers: [...salesRanking]
          .sort(
            (a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name),
          )
          .slice(0, 5),
      });

      // 4. Últimas Órdenes
      const { data: recientes } = await supabase
        .from("orders")
        .select(
          "id, total, estado, created_at, customer_id, customer_name, customer_id_number, customer_phone, order_number",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      setMetrics({
        ventasHoy,
        ordenesTotales: ordenesTotales || 0,
        stockBajo: lowStockItems.length,
        ventasPendientes: ventasPendientes || 0,
      });
      setPendingOrders(await attachCustomers(pendingSalesData || []));
      setRecentOrders(await attachCustomers(recientes || []));
      setLoading(false);
    }

    if (tenantId && !configLoading) {
      fetchDashboardData();
    }
  }, [tenantId, configLoading]);

  return (
    <div className="space-y-8 md:space-y-12 pb-10 transition-all duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Resumen General
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Actividad comercial de tu tienda para el día de hoy.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 flex-wrap rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm dark:shadow-inner transition-colors">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
            Sistema Sincronizado
          </span>
        </div>
      </header>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Ventas Hoy"
          value={
            loading ? (
              <Loader2 className="animate-spin text-slate-300" size={32} />
            ) : (
              `${dashboardCurrency === "VES" ? "Bs " : "$"}${convertPrice(metrics.ventasHoy, "USD", dashboardCurrency, exchange_rates).toFixed(2)}`
            )
          }
          trend={loading ? "..." : "Hoy"}
          isPositive={true}
          icon={TrendingUp}
          color="bg-emerald-500"
          rightElement={
            <select
              value={dashboardCurrency}
              onChange={(e) => setDashboardCurrency(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
          }
        />
        <StatCard
          label="Órdenes Históricas"
          value={
            loading ? (
              <Loader2 className="animate-spin text-slate-300" size={32} />
            ) : (
              metrics.ordenesTotales
            )
          }
          trend={loading ? "..." : "Total"}
          isPositive={true}
          icon={ShoppingCart}
          color="bg-slate-900"
        />
        <StatCard
          label="Ventas Pendientes"
          value={
            loading ? (
              <Loader2 className="animate-spin text-slate-300" size={32} />
            ) : (
              metrics.ventasPendientes
            )
          }
          trend={
            loading ? "..." : metrics.ventasPendientes > 0 ? "Nuevo" : "Al dia"
          }
          isPositive={metrics.ventasPendientes === 0}
          icon={BellRing}
          color={
            metrics.ventasPendientes > 0 ? "bg-amber-500" : "bg-slate-300"
          }
          onClick={() =>
            metrics.ventasPendientes > 0 && router.push("/admin/orders")
          }
          className={
            metrics.ventasPendientes > 0
              ? "cursor-pointer hover:scale-[1.02]"
              : ""
          }
        />
        <StatCard
          label="Stock Bajo"
          value={
            loading ? (
              <Loader2 className="animate-spin text-slate-300" size={32} />
            ) : (
              metrics.stockBajo
            )
          }
          trend={loading ? "..." : "A Revisar"}
          isPositive={metrics.stockBajo === 0}
          icon={Package}
          color={metrics.stockBajo > 0 ? "bg-orange-500" : "bg-slate-300"}
          onClick={() => metrics.stockBajo > 0 && setShowLowStockModal(true)}
          className={
            metrics.stockBajo > 0 ? "cursor-pointer hover:scale-[1.02]" : ""
          }
        />
      </div>

      <PendingSalesNotice
        pendingOrders={pendingOrders}
        pendingCount={metrics.ventasPendientes}
        loading={loading}
      />

      {/* PRODUCTOS VENDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductSalesPanel
          title="Productos mas vendidos"
          subtitle="Ranking por unidades en ordenes completadas"
          items={productSales.bestSellers}
          loading={loading}
          icon={TrendingUp}
          tone="emerald"
        />
        <ProductSalesPanel
          title="Productos menos vendidos"
          subtitle="Incluye productos sin ventas registradas"
          items={productSales.lowSellers}
          loading={loading}
          icon={TrendingDown}
          tone="orange"
        />
      </div>

      {/* MODAL STOCK BAJO */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center isolate">
          {/* Overlay con mayor opacidad para dar contraste */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowLowStockModal(false)}
          />

          {/* Contenedor del Modal */}
          <div className="relative z-110 bg-white dark:bg-slate-900 rounded-md w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 m-4">
            <header className="p-8 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                  Productos en <br />{" "}
                  <span className="text-orange-500">Stock Bajo</span>
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2">
                  Revisión de inventario
                </p>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </header>

            <div className="max-h-[50vh] overflow-y-auto p-6 pt-2 space-y-3 no-scrollbar">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700/50 group hover:border-orange-200 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
                    {product.name}
                  </span>
                  <span className="px-3 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-md shrink-0 shadow-lg shadow-orange-500/20">
                    QUEDAN: {product.quantity}
                  </span>
                </div>
              ))}
            </div>

            <footer className="p-8 pt-4">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="w-full py-4 bg-slate-900 cursor-pointer dark:bg-orange-500 text-white rounded-md text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-orange-500/10 active:scale-[0.98] transition-all"
              >
                Entendido
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* TABLA DE ÓRDENES RECIENTES Y ACCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              Órdenes Recientes
            </h2>
            <Link
              href="/admin/orders"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:underline"
            >
              Ver todas <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center text-slate-300">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Orden
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Total
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          #
                          {order.order_number
                            ? String(order.order_number).padStart(5, "0")
                            : String(order.id).slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-37.5">
                          {order.clientes?.full_name || "Desconocido"}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No hay órdenes registradas
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            Accesos Rápidos
          </h2>
          <div className="flex flex-col gap-4">
            <QuickAction
              title="Productos"
              description="Gestionar stock y precios"
              href="/admin/products"
            />
            <QuickAction
              title="Categorías"
              description="Organizar el catálogo"
              href="/admin/categories"
            />
            <QuickAction
              title="Ventas"
              description="Historial de pedidos"
              href="/admin/orders"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PendingSalesNotice({ pendingOrders, pendingCount, loading }) {
  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-8">
        <div className="flex items-center justify-center py-6 text-slate-300">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </section>
    );
  }

  if (pendingCount === 0) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BellRing size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white">
                Ventas pendientes
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                No hay ventas nuevas esperando revision.
              </p>
            </div>
          </div>
          <span className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            Al dia
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-amber-50/70 dark:bg-amber-500/10 rounded-3xl border border-amber-200/80 dark:border-amber-500/20 shadow-sm overflow-hidden">
      <header className="p-6 border-b border-amber-200/70 dark:border-amber-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <BellRing size={20} strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-amber-50 dark:border-slate-900 animate-pulse" />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white">
              Ventas pendientes por revisar
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
              Hay {pendingCount} venta{pendingCount === 1 ? "" : "s"} nueva
              {pendingCount === 1 ? "" : "s"} esperando validacion.
            </p>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/10"
        >
          Revisar ventas <ArrowUpRight size={15} />
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 p-4">
        {pendingOrders.map((order) => (
          <Link
            key={order.id}
            href="/admin/orders"
            className="bg-white/90 dark:bg-slate-900/50 rounded-2xl border border-amber-100 dark:border-amber-500/10 p-4 hover:border-amber-300 dark:hover:border-amber-400/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-black text-slate-500 dark:text-slate-400">
                  #
                  {order.order_number
                    ? String(order.order_number).padStart(5, "0")
                    : String(order.id).slice(-6).toUpperCase()}
                </p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mt-2">
                  {order.clientes?.full_name || "Desconocido"}
                </h3>
              </div>
              <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase tracking-widest shrink-0">
                Pendiente
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-5">
              <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
                ${Number(order.total || 0).toFixed(2)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {new Date(order.created_at).toLocaleDateString("es-VE", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSalesPanel({
  title,
  subtitle,
  items,
  loading,
  icon: Icon,
  tone,
}) {
  const isEmerald = tone === "emerald";

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            {subtitle}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
            isEmerald ? "bg-emerald-500" : "bg-orange-500"
          }`}
        >
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="py-10 flex justify-center text-slate-300">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((product, index) => (
              <div
                key={product.id || `${product.name}-${index}`}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isEmerald
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="truncate text-sm font-black text-slate-800 dark:text-slate-200">
                    {product.name}
                  </span>
                </div>
                <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                  {product.quantity} uds
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm">
            No hay productos registrados
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  trend,
  isPositive,
  icon: Icon,
  color,
  onClick,
  className = "",
  rightElement,
}) {
  return (
    <div
      onClick={onClick}
      className={`
      relative overflow-hidden
      bg-white dark:bg-slate-800 p-8 rounded-2xl dark:rounded-3xl
      border border-slate-100 dark:border-slate-700/50
      shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
      transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${onClick ? "hover:shadow-lg dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 cursor-pointer" : "cursor-default"}
      group ${className}
    `}
    >
      {/* Luz interna en hover (Sólo Dark Mode) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all duration-500 group-hover:bg-white/10 hidden dark:block" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div
          className={`p-3 rounded-2xl ${color} text-white dark:bg-slate-900 dark:text-white dark:border dark:border-slate-700/50 dark:shadow-inner transition-colors`}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-[10px] font-black px-3 py-1 rounded-full border ${
              isPositive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
            }`}
          >
            {trend}
          </span>
          {rightElement}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 dark:group-hover:text-slate-300 transition-colors">
          {label}
        </p>
        <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          {value}
        </h3>
      </div>
    </div>
  );
}

function QuickAction({ title, description, href }) {
  return (
    <Link
      href={href}
      className="
      flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50
      hover:border-slate-900 dark:hover:border-white hover:-translate-y-1 shadow-sm hover:shadow-xl
      transition-all duration-300 group cursor-pointer
    "
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-200 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {title}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {description}
        </span>
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-transparent dark:border-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-slate-700 group-hover:text-white transition-all dark:shadow-inner">
        <ArrowUpRight size={20} />
      </div>
    </Link>
  );
}
