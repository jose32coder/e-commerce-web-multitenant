"use client";

import dynamic from "next/dynamic";
import ExportButtons from "@/components/admin/shared/ExportButtons";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import ProductPagination from "@/components/admin/products/ProductPagination";

const OrderDetailsModal = dynamic(
  () => import("@/components/admin/orders/OrderDetailsModal"),
  {
    ssr: false,
  },
);

export default function OrdersContentPanel({
  exportLoading,
  onExport,
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
  onRefresh,
  onClearFilters,
  advancedFiltersProps,
  paginatedOrders,
  loading,
  onViewDetails,
  onUpdateStatus,
  onReject,
  toOrderCode,
  exchangeRates,
  filteredOrders,
  startIndex,
  totalItems,
  currentPage,
  totalPages,
  setPage,
  selectedOrder,
  setSelectedOrder,
}) {
  return (
    <div className="space-y-6">
      <ExportButtons onExport={onExport} loading={exportLoading} />

      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        pageSize={pageSize}
        setPageSize={setPageSize}
        onRefresh={onRefresh}
        onClearFilters={onClearFilters}
        advancedFiltersProps={advancedFiltersProps}
      />

      <OrderTable
        orders={paginatedOrders}
        loading={loading}
        onViewDetails={onViewDetails}
        onUpdateStatus={onUpdateStatus}
        onReject={onReject}
        toOrderCode={toOrderCode}
        selectedCurrency={selectedCurrency}
        exchangeRates={exchangeRates}
      />

      <ProductPagination
        loading={loading}
        filteredProducts={filteredOrders}
        startIndex={startIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          exchangeRates={exchangeRates}
          toOrderCode={toOrderCode}
        />
      )}
    </div>
  );
}
