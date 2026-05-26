import { money } from "@/components/admin/orders/utils/ordersSummary";

const SummaryCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
  </div>
);

export default function OrdersSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 flex-1">
      <SummaryCard label="Ventas brutas" value={money(summary.grossSales)} />
      <SummaryCard label="Órdenes completadas" value={summary.paidCount} />
      <SummaryCard label="Órdenes pendientes" value={summary.pendingCount} />
      <SummaryCard label="Ticket promedio" value={money(summary.avgTicket)} />
    </div>
  );
}
