"use client";
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

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
  const { tenant_id: tenantId } = useSiteConfig();
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
              <title>Reporte de Productos</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
                th { background-color: #f4f4f4; text-transform: uppercase; }
                h1 { text-transform: uppercase; letter-spacing: -1px; margin-bottom: 5px; }
                .meta { font-size: 10px; color: #666; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Reporte de Productos</h1>
              <div class="meta">Generado el: ${new Date().toLocaleString()}</div>
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Precio</th><th>Stock</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  ${filteredProducts
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.name}</td>
                      <td>$${Number(p.price).toFixed(2)}</td>
                      <td>${p.stock >= 999999 ? "Ilimitado" : p.stock}</td>
                      <td>${p.status}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
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
        }, 500);
        return;
      }

      const response = await fetch(
        `/api/admin/export/products?format=${format}&tenant_id=${tenantId}`,
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
