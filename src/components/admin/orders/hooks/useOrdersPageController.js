"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { updateOrderStatusAction } from "@/app/actions/admin/orderActions";
import {
  buildOrdersFilterOptions,
  DEFAULT_STATUS_FILTER,
  filterOrders,
} from "@/components/admin/orders/utils/ordersFilters";
import { buildOrdersSummary } from "@/components/admin/orders/utils/ordersSummary";
import { handleOrdersExport } from "@/components/admin/orders/utils/ordersExport";

export default function useOrdersPageController() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [shippingMethodFilter, setShippingMethodFilter] = useState("all");
  const [shippingProviderFilter, setShippingProviderFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const { tenant_id: tenantId, exchange_rates, site_name, commerce_settings } =
    useSiteConfig();
  const supabase = createClient();

  const filters = useMemo(
    () => ({
      searchTerm,
      statusFilter,
      fromDate,
      toDate,
      minTotal,
      maxTotal,
      paymentFilter,
      shippingMethodFilter,
      shippingProviderFilter,
    }),
    [
      searchTerm,
      statusFilter,
      fromDate,
      toDate,
      minTotal,
      maxTotal,
      paymentFilter,
      shippingMethodFilter,
      shippingProviderFilter,
    ],
  );

  const toOrderCode = useCallback((order) => {
    if (order?.order_number) return String(order.order_number).padStart(5, "0");
    return String(order?.id || "")
      .slice(-6)
      .toUpperCase();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      if (!tenantId) {
        setOrders([]);
        return;
      }
      let query = supabase
        .from("orders")
        .select("*, order_number")
        .eq("tenant_id", tenantId);

      if (statusFilter !== DEFAULT_STATUS_FILTER) {
        query = query.eq("estado", statusFilter);
      }
      if (fromDate) {
        query = query.gte("created_at", new Date(fromDate).toISOString());
      }
      if (toDate) {
        query = query.lte(
          "created_at",
          new Date(`${toDate}T23:59:59`).toISOString(),
        );
      }
      if (minTotal !== "") {
        query = query.gte("total", Number(minTotal));
      }
      if (maxTotal !== "") {
        query = query.lte("total", Number(maxTotal));
      }
      if (paymentFilter !== "all") {
        query = query.eq("metodo_pago", paymentFilter);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      const message = error?.message || error?.details || "Error desconocido";
      console.error("Error cargando órdenes:", message);
    } finally {
      setLoading(false);
    }
  }, [
    tenantId,
    supabase,
    statusFilter,
    fromDate,
    toDate,
    minTotal,
    maxTotal,
    paymentFilter,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, shippingMethodFilter, shippingProviderFilter]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setCurrentUser(data.user);
    };
    loadCurrentUser();
  }, [supabase]);

  const updateStatus = useCallback(
    async (id, newStatus, reason = null) => {
      if (!tenantId) return;
      Swal.fire({
        title: "Actualizando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await updateOrderStatusAction({
        orderId: id,
        newStatus,
        tenantId,
        reason,
        userId: currentUser?.id,
        userEmail: currentUser?.email,
      });

      Swal.close();
      if (response.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Orden marcada como ${newStatus}`,
          showConfirmButton: false,
          timer: 3000,
        });
        fetchOrders();
      } else {
        Swal.fire("Error", response.error || "No se pudo actualizar", "error");
      }
    },
    [tenantId, currentUser?.id, currentUser?.email, fetchOrders],
  );

  const handleReject = useCallback(
    async (id) => {
      const { value: formValues } = await Swal.fire({
        title: "Rechazar Orden",
        html: `
          <select id="swal-reason" class="swal2-select" style="max-width: 100%; width: 80%">
            <option value="Referencia de pago inválida o no coincide">Referencia de pago inválida o no coincide</option>
            <option value="Monto incompleto">Monto incompleto</option>
            <option value="Otro">Otro (Especificar)</option>
          </select>
          <input id="swal-other-reason" class="swal2-input" placeholder="Especifique el motivo..." style="display:none; max-width: 100%; width: 80%">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e11d48",
        didOpen: () => {
          const select = document.getElementById("swal-reason");
          const input = document.getElementById("swal-other-reason");
          select.addEventListener("change", (e) => {
            input.style.display = e.target.value === "Otro" ? "block" : "none";
          });
        },
        preConfirm: () => {
          const select = document.getElementById("swal-reason").value;
          const input = document.getElementById("swal-other-reason").value;
          if (select === "Otro" && !input.trim()) {
            Swal.showValidationMessage("Debe especificar el motivo");
            return false;
          }
          return select === "Otro" ? input.trim() : select;
        },
      });

      if (formValues) await updateStatus(id, "cancelled", formValues);
    },
    [updateStatus],
  );

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setFromDate("");
    setToDate("");
    setMinTotal("");
    setMaxTotal("");
    setPaymentFilter("all");
    setShippingMethodFilter("all");
    setShippingProviderFilter("all");
    setPage(1);
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders, filters), [orders, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const { paymentOptions, shippingMethodOptions, shippingProviderOptions } =
    useMemo(() => buildOrdersFilterOptions(orders), [orders]);

  const dailySummary = useMemo(() => buildOrdersSummary(orders), [orders]);

  const onExport = useCallback(
    async (format) => {
      setExportLoading(true);
      try {
        await handleOrdersExport({
          format,
          filteredOrders,
          tenantId,
          siteName: site_name,
          commerceSettings: commerce_settings,
          toOrderCode,
          filters: {
            fromDate,
            toDate,
            statusFilter,
            paymentFilter,
            shippingMethodFilter,
            shippingProviderFilter,
            minTotal,
            maxTotal,
          },
        });
      } finally {
        setExportLoading(false);
      }
    },
    [
      filteredOrders,
      tenantId,
      site_name,
      commerce_settings,
      toOrderCode,
      fromDate,
      toDate,
      statusFilter,
      paymentFilter,
      shippingMethodFilter,
      shippingProviderFilter,
      minTotal,
      maxTotal,
    ],
  );

  return {
    loading,
    exportLoading,
    selectedOrder,
    setSelectedOrder,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedCurrency,
    setSelectedCurrency,
    showAdvancedFilters,
    setShowAdvancedFilters,
    pageSize,
    setPageSize,
    page,
    setPage,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    minTotal,
    setMinTotal,
    maxTotal,
    setMaxTotal,
    paymentFilter,
    setPaymentFilter,
    shippingMethodFilter,
    setShippingMethodFilter,
    shippingProviderFilter,
    setShippingProviderFilter,
    paymentOptions,
    shippingMethodOptions,
    shippingProviderOptions,
    filteredOrders,
    paginatedOrders,
    totalItems,
    totalPages,
    currentPage,
    startIndex,
    dailySummary,
    exchangeRates: exchange_rates,
    fetchOrders,
    resetFilters,
    updateStatus,
    handleReject,
    onExport,
    toOrderCode,
    advancedFiltersProps: {
      fromDate,
      setFromDate,
      toDate,
      setToDate,
      minTotal,
      setMinTotal,
      maxTotal,
      setMaxTotal,
      paymentFilter,
      setPaymentFilter,
      paymentOptions,
      shippingMethodFilter,
      setShippingMethodFilter,
      shippingMethodOptions,
      shippingProviderFilter,
      setShippingProviderFilter,
      shippingProviderOptions,
    },
  };
}
