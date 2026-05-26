export const COMPLETED = new Set([
  "paid",
  "pagado",
  "completed",
  "completado",
  "delivered",
  "entregado",
  "shipped",
  "enviado",
]);

export const PENDING = new Set(["pending", "pendiente", "processing", "procesando"]);
export const CANCELLED = new Set(["cancelled", "cancelado"]);

export const isCompletedStatus = (status) =>
  COMPLETED.has(String(status || "").toLowerCase());

export const isPendingStatus = (status) =>
  PENDING.has(String(status || "").toLowerCase());

export const isCancelledStatus = (status) =>
  CANCELLED.has(String(status || "").toLowerCase());
