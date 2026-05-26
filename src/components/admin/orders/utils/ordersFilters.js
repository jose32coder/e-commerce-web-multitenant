export const DEFAULT_STATUS_FILTER = "Todos los estados";

export function extractDeliveryFromNotes(notes) {
  if (!notes) return { method: null, provider: null };
  const match = String(notes).match(/^\[ENTREGA:\s*(.*?)\|(.*?)\]/s);
  if (!match) return { method: null, provider: null };
  return {
    method: match[1]?.trim() || null,
    provider: match[2]?.trim() || null,
  };
}

export function getShippingMethod(order = {}) {
  return order.shipping_method || extractDeliveryFromNotes(order.notas).method || "";
}

export function getShippingProvider(order = {}) {
  return (
    order.shipping_provider || extractDeliveryFromNotes(order.notas).provider || ""
  );
}

export function filterOrders(
  orders = [],
  {
    searchTerm = "",
    statusFilter = DEFAULT_STATUS_FILTER,
    fromDate = "",
    toDate = "",
    minTotal = "",
    maxTotal = "",
    paymentFilter = "all",
    shippingMethodFilter = "all",
    shippingProviderFilter = "all",
  },
) {
  const query = String(searchTerm || "").toLowerCase();

  return orders.filter((o) => {
    const matchesSearch =
      String(o.id || "").toLowerCase().includes(query) ||
      String(o.customer_name || "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === DEFAULT_STATUS_FILTER || o.estado === statusFilter;

    const createdDate = o.created_at ? new Date(o.created_at) : null;
    const fromOk = !fromDate || (createdDate && createdDate >= new Date(fromDate));
    const toOk =
      !toDate || (createdDate && createdDate <= new Date(`${toDate}T23:59:59`));

    const totalUsd = Number(o.total || 0);
    const minTotalOk = minTotal === "" || totalUsd >= Number(minTotal);
    const maxTotalOk = maxTotal === "" || totalUsd <= Number(maxTotal);
    const paymentOk =
      paymentFilter === "all" || String(o.metodo_pago || "") === paymentFilter;

    const shippingMethodOk =
      shippingMethodFilter === "all" ||
      String(getShippingMethod(o)) === shippingMethodFilter;
    const shippingProviderOk =
      shippingProviderFilter === "all" ||
      String(getShippingProvider(o)) === shippingProviderFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      fromOk &&
      toOk &&
      minTotalOk &&
      maxTotalOk &&
      paymentOk &&
      shippingMethodOk &&
      shippingProviderOk
    );
  });
}

export function buildOrdersFilterOptions(orders = []) {
  return {
    paymentOptions: Array.from(
      new Set(orders.map((o) => o.metodo_pago).filter(Boolean)),
    ),
    shippingMethodOptions: Array.from(
      new Set(orders.map((o) => getShippingMethod(o)).filter(Boolean)),
    ),
    shippingProviderOptions: Array.from(
      new Set(orders.map((o) => getShippingProvider(o)).filter(Boolean)),
    ),
  };
}
