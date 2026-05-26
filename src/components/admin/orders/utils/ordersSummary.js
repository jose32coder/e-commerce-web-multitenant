import {
  isCancelledStatus,
  isCompletedStatus,
  isPendingStatus,
} from "@/components/admin/orders/utils/ordersStatusSets";

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export function buildOrdersSummary(orders = []) {
  let grossSales = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  const paymentBreakdown = {};

  for (const order of orders) {
    const total = Number(order.total || 0);
    if (isCompletedStatus(order.estado)) {
      grossSales += total;
      paidCount += 1;
      const key = order.metodo_pago || "No especificado";
      paymentBreakdown[key] = (paymentBreakdown[key] || 0) + total;
    } else if (isPendingStatus(order.estado)) {
      pendingCount += 1;
    } else if (isCancelledStatus(order.estado)) {
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
}
