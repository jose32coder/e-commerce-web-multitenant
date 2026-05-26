"use client";
import { useState } from "react";
import useOrdersPageController from "@/components/admin/orders/hooks/useOrdersPageController";
import OrdersPageHeader from "@/components/admin/orders/OrdersPageHeader";
import OrdersSummaryCards from "@/components/admin/orders/OrdersSummaryCards";
import OrdersContentPanel from "@/components/admin/orders/OrdersContentPanel";
import SalesSectionTabs from "@/components/admin/orders/SalesSectionTabs";
import DailyClosePanel from "@/components/admin/orders/DailyClosePanel";

export default function OrdersPage() {
  const controller = useOrdersPageController();
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OrdersPageHeader />
      <SalesSectionTabs
        mode="local"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "general" ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <OrdersSummaryCards summary={controller.dailySummary} />
          </div>

          <OrdersContentPanel
            exportLoading={controller.exportLoading}
            onExport={controller.onExport}
            searchTerm={controller.searchTerm}
            setSearchTerm={controller.setSearchTerm}
            statusFilter={controller.statusFilter}
            setStatusFilter={controller.setStatusFilter}
            selectedCurrency={controller.selectedCurrency}
            setSelectedCurrency={controller.setSelectedCurrency}
            showAdvancedFilters={controller.showAdvancedFilters}
            setShowAdvancedFilters={controller.setShowAdvancedFilters}
            pageSize={controller.pageSize}
            setPageSize={controller.setPageSize}
            onRefresh={controller.fetchOrders}
            onClearFilters={controller.resetFilters}
            advancedFiltersProps={controller.advancedFiltersProps}
            paginatedOrders={controller.paginatedOrders}
            loading={controller.loading}
            onViewDetails={controller.setSelectedOrder}
            onUpdateStatus={controller.updateStatus}
            onReject={controller.handleReject}
            toOrderCode={controller.toOrderCode}
            selectedOrder={controller.selectedOrder}
            setSelectedOrder={controller.setSelectedOrder}
            exchangeRates={controller.exchangeRates}
            filteredOrders={controller.filteredOrders}
            startIndex={controller.startIndex}
            totalItems={controller.totalItems}
            currentPage={controller.currentPage}
            totalPages={controller.totalPages}
            setPage={controller.setPage}
          />
        </div>
      ) : (
        <DailyClosePanel />
      )}
    </div>
  );
}
