"use client";
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

const ProductForm = dynamic(() => import("@/components/admin/ProductForm"), {
  ssr: false,
});

// Componentes extraídos (con estilos originales preservados)
import ExportButtons from "@/components/admin/shared/ExportButtons";
import ProductFilters from "@/components/admin/products/ProductFilters";
import BulkActions from "@/components/admin/products/BulkActions";
import ProductTable from "@/components/admin/products/ProductTable";
import ProductPagination from "@/components/admin/products/ProductPagination";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const config = useSiteConfig();
  const tenantId = config?.tenant_id;
  const supabase = createClient();

  const loadProducts = async () => {
    try {
      setLoading(true);

      let query = supabase.from("products").select(`
          *,
          product_variants(*),
          product_stock(quantity),
          product_categories(
            category_id,
            categories(name)
          )
        `);

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const normalized = (data || []).map((product) => {
        const stockObj = Array.isArray(product.product_stock)
          ? product.product_stock[0]
          : product.product_stock;
        const categoryIds = (product.product_categories || []).map(
          (pc) => pc.category_id,
        );
        const categoryNames = (product.product_categories || [])
          .map((pc) => pc.categories?.name)
          .filter(Boolean);
        return {
          ...product,
          stock: stockObj?.quantity ?? 0,
          variants: (product.product_variants || []).map((v) => ({
            ...v,
            price_adjustment:
              Number(v.price_adjustment ?? v.price_override ?? 0) || 0,
            stock_quantity: Number(v.stock_quantity ?? 0) || 0,
          })),
          category_ids: categoryIds,
          category_names: categoryNames,
          product_variants: undefined,
          product_categories: undefined,
          product_stock: undefined,
        };
      });

      setProducts(normalized);
    } catch (error) {
      console.error("Error cargando productos:", error?.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [tenantId]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = (p.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos los estados" ||
      (statusFilter === "Publicados" && p.status === "published") ||
      (statusFilter === "Borradores" && p.status !== "published") ||
      (statusFilter === "Stock bajo" &&
        Number(p.stock) <= 5 &&
        Number(p.stock) >= 0 &&
        Number(p.stock) < 999999);

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize, products.length]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleCreate = () => {
    setEditingProduct(null);
    setViewOnly(false);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product,
      variants: product.product_variants || product.variants || [],
    });
    setViewOnly(false);
    setShowForm(true);
  };

  const handleView = (product) => {
    setEditingProduct({
      ...product,
      variants: product.product_variants || product.variants || [],
    });
    setViewOnly(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#f1f5f9",
      confirmButtonText: "SÍ, ELIMINAR",
      cancelButtonText: "CANCELAR",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton:
          "rounded-xl uppercase text-xs tracking-widest px-8 py-4 px-8",
        cancelButton:
          "rounded-xl uppercase text-xs tracking-widest px-8 py-4 px-8 ml-2 text-slate-500",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        const resp = await fetch(`/api/products/${id}`, { method: "DELETE" });
        const resJson = await resp.json();
        if (!resp.ok) throw new Error(resJson.error);

        Swal.fire({
          icon: "success",
          title: "Eliminado",
          timer: 1500,
          showConfirmButton: false,
        });
        setSelectedIds((prev) =>
          prev.filter((selectedId) => selectedId !== id),
        );
        loadProducts();
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProducts.map((product) => product.id);
    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const runBulkUpdate = async (payload, successMessage) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .in("id", selectedIds);
      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: successMessage,
        timer: 1600,
        showConfirmButton: false,
      });
      setSelectedIds([]);
      await loadProducts();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: "¿Eliminar seleccionados?",
      text: `Se eliminarán ${selectedIds.length} producto(s).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#94a3b8",
    });
    if (!result.isConfirmed) return;

    setBulkLoading(true);
    try {
      for (const id of selectedIds) {
        const resp = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!resp.ok) {
          const resJson = await resp.json();
          throw new Error(resJson.error || "Error eliminando productos");
        }
      }
      await Swal.fire({
        icon: "success",
        title: "Productos eliminados",
        timer: 1600,
        showConfirmButton: false,
      });
      setSelectedIds([]);
      await loadProducts();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setBulkLoading(false);
    }
  };

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
        const storeName = config?.site_name || "Mi Tienda";
        const logoUrl = config?.commerce_settings?.logo_url || "";
        const totalProducts = filteredProducts.length;
        const publishedCount = filteredProducts.filter((p) => p.status === "published").length;
        const draftCount = totalProducts - publishedCount;
        const lowStockCount = filteredProducts.filter((p) => Number(p.stock) <= 5 && Number(p.stock) < 999999).length;
        const currencySymbol = config?.commerce_settings?.currency_symbol || "$";

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
              <title>Reporte de Productos — ${storeName}</title>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 12mm 10mm 14mm 10mm;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                  color: #1e293b;
                  background: #fff;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }

                /* ── Header ── */
                .report-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding-bottom: 16px;
                  border-bottom: 3px solid #0f172a;
                  margin-bottom: 18px;
                }
                .brand-block { display: flex; align-items: center; gap: 14px; }
                .brand-logo {
                  width: 52px; height: 52px; border-radius: 10px;
                  object-fit: contain; background: #f1f5f9; padding: 4px;
                }
                .brand-name {
                  font-size: 22px; font-weight: 800; text-transform: uppercase;
                  letter-spacing: -0.5px; color: #0f172a;
                }
                .brand-sub { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
                .report-date { text-align: right; }
                .report-date .label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                .report-date .value { font-size: 11px; color: #334155; font-weight: 600; }

                /* ── Stats ── */
                .stats-bar {
                  display: flex; gap: 8px; margin-bottom: 18px;
                }
                .stat-card {
                  flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
                  border-radius: 8px; padding: 10px 14px; text-align: center;
                }
                .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
                .stat-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px; }
                .stat-card.published { border-left: 3px solid #22c55e; }
                .stat-card.draft { border-left: 3px solid #f59e0b; }
                .stat-card.low-stock { border-left: 3px solid #ef4444; }

                /* ── Table ── */
                table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
                thead th {
                  background: #0f172a; color: #fff; padding: 8px 10px;
                  text-align: left; text-transform: uppercase; font-size: 8px;
                  letter-spacing: 1px; font-weight: 700;
                }
                thead th:first-child { border-radius: 6px 0 0 0; }
                thead th:last-child { border-radius: 0 6px 0 0; }
                tbody tr { border-bottom: 1px solid #f1f5f9; }
                tbody tr:nth-child(even) { background: #f8fafc; }
                tbody tr:hover { background: #f1f5f9; }
                tbody td { padding: 7px 10px; vertical-align: middle; }
                td.name-cell { font-weight: 600; color: #1e293b; max-width: 260px; }
                td.price-cell { font-weight: 700; color: #0f172a; white-space: nowrap; }
                td.stock-cell { text-align: center; }
                td.category-cell { color: #64748b; font-size: 8.5px; }

                /* ── Status Badge ── */
                .badge {
                  display: inline-block; padding: 2px 8px; border-radius: 20px;
                  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .badge-published { background: #dcfce7; color: #15803d; }
                .badge-draft { background: #fef3c7; color: #a16207; }
                .badge-low { background: #fee2e2; color: #dc2626; font-size: 7px; }

                /* ── Footer ── */
                .report-footer {
                  margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;
                  display: flex; justify-content: space-between; align-items: center;
                  font-size: 8px; color: #94a3b8;
                }
                .footer-brand { font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
              </style>
            </head>
            <body>
              <!-- Header -->
              <div class="report-header">
                <div class="brand-block">
                  ${logoUrl ? `<img class="brand-logo" src="${logoUrl}" alt="Logo" />` : ""}
                  <div>
                    <div class="brand-name">${storeName}</div>
                    <div class="brand-sub">Reporte de Inventario</div>
                  </div>
                </div>
                <div class="report-date">
                  <div class="label">Generado el</div>
                  <div class="value">${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  <div class="value" style="font-size:9px; color:#94a3b8">${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <!-- Stats -->
              <div class="stats-bar">
                <div class="stat-card">
                  <div class="stat-value">${totalProducts}</div>
                  <div class="stat-label">Total Productos</div>
                </div>
                <div class="stat-card published">
                  <div class="stat-value">${publishedCount}</div>
                  <div class="stat-label">Publicados</div>
                </div>
                <div class="stat-card draft">
                  <div class="stat-value">${draftCount}</div>
                  <div class="stat-label">Borradores</div>
                </div>
                <div class="stat-card low-stock">
                  <div class="stat-value">${lowStockCount}</div>
                  <div class="stat-label">Stock Bajo</div>
                </div>
              </div>

              <!-- Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width:5%">#</th>
                    <th style="width:38%">Producto</th>
                    <th style="width:17%">Categoría</th>
                    <th style="width:13%">Precio</th>
                    <th style="width:12%">Stock</th>
                    <th style="width:15%">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredProducts
                    .map(
                      (p, i) => {
                        const statusClass = p.status === "published" ? "badge-published" : "badge-draft";
                        const statusLabel = p.status === "published" ? "Publicado" : "Borrador";
                        const stockDisplay = p.stock >= 999999 ? "∞" : p.stock;
                        const isLow = Number(p.stock) <= 5 && Number(p.stock) < 999999;
                        const categoryText = (p.category_names || []).join(", ") || "—";
                        return `
                    <tr>
                      <td style="color:#94a3b8; font-size:8px; text-align:center">${i + 1}</td>
                      <td class="name-cell">${p.name}</td>
                      <td class="category-cell">${categoryText}</td>
                      <td class="price-cell">${currencySymbol}${Number(p.price).toFixed(2)}</td>
                      <td class="stock-cell">${stockDisplay}${isLow ? ' <span class="badge badge-low">Bajo</span>' : ""}</td>
                      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    </tr>`;
                      },
                    )
                    .join("")}
                </tbody>
              </table>

              <!-- Footer -->
              <div class="report-footer">
                <span class="footer-brand">${storeName}</span>
                <span>Página 1 · ${filteredProducts.length} producto(s) · ${new Date().toLocaleDateString("es-ES")}</span>
              </div>
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
        }, 600);
        return;
      }

      const storeName = encodeURIComponent(config?.site_name || "");
      const logoUrl = encodeURIComponent(config?.commerce_settings?.logo_url || "");
      const response = await fetch(
        `/api/admin/export/products?format=${format}&tenant_id=${tenantId}&store_name=${storeName}&logo_url=${logoUrl}`,
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo exportar los productos.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `productos_export_${new Date().toISOString().slice(0, 10)}.${format}`;
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

  const filteredIds = filteredProducts.map((product) => product.id);
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Productos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestiona el stock y precios de tus productos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-md transition-all font-bold text-xs uppercase tracking-widest shadow-lg bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 dark:hover:bg-slate-200 shadow-slate-200 dark:shadow-none cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        </div>
      </header>

      <ExportButtons onExport={handleExport} loading={exportLoading} />

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      <BulkActions
        selectedIds={selectedIds}
        allFilteredSelected={allFilteredSelected}
        toggleSelectAllFiltered={toggleSelectAllFiltered}
        runBulkUpdate={runBulkUpdate}
        handleBulkDelete={handleBulkDelete}
        bulkLoading={bulkLoading}
      />

      <ProductTable
        loading={loading}
        filteredProducts={filteredProducts}
        paginatedProducts={paginatedProducts}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        handleView={handleView}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <ProductPagination
        loading={loading}
        filteredProducts={filteredProducts}
        startIndex={startIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />

      <ProductForm
        show={showForm}
        onClose={() => setShowForm(false)}
        editingProduct={editingProduct}
        onSave={loadProducts}
        readOnly={viewOnly}
      />
    </div>
  );
}
