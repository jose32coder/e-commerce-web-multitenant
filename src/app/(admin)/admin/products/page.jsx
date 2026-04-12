"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Package,
  Loader2,
  CheckSquare,
  Square,
  Star,
  StarOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { tenant_id: tenantId } = useSiteConfig();
  const supabase = createClient();

  const getErrorMessage = (error) =>
    error?.message || error?.details || "Error desconocido";

  const loadProducts = async () => {
    try {
      setLoading(true);

      let query = supabase.from("products").select(`
          *,
          product_variants(*),
          product_stock(quantity),
          product_categories!product_categories_product_id_fkey(
            category_id,
            categories!product_categories_category_id_fkey(name)
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
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos los estados" ||
      (statusFilter === "Publicados" && p.status === "published") ||
      (statusFilter === "Borradores" && p.status !== "published") ||
      (statusFilter === "Stock bajo" && Number(p.stock) <= 5);

    return matchesSearch && matchesStatus;
  });

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
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none cursor-pointer"
        >
          <Plus size={16} />
          NUEVO PRODUCTO
        </button>
      </header>

      {/* Filtros Estándar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-sm text-slate-900 dark:text-white transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-bold uppercase tracking-tighter cursor-pointer w-full md:w-auto"
        >
          <option value="Todos los estados">Todos los estados</option>
          <option value="Publicados">Publicados</option>
          <option value="Borradores">Borradores</option>
          <option value="Stock bajo">Stock bajo</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4">
        <div className="flex flex-wrap w-full items-center justify-between gap-3">
          <div className="flex items-center gap-6 justify-between">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              {allFilteredSelected ? (
                <CheckSquare size={14} />
              ) : (
                <Square size={14} />
              )}
              Seleccionar todo
            </button>

            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {selectedIds.length} seleccionados
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                runBulkUpdate({ status: "published" }, "Publicados")
              }
              disabled={selectedIds.length === 0 || bulkLoading}
              className="h-9 px-3 rounded-lg cursor-pointer bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Publicar
            </button>
            <button
              type="button"
              onClick={() =>
                runBulkUpdate({ status: "draft" }, "Pasaron a borrador")
              }
              disabled={selectedIds.length === 0 || bulkLoading}
              className="h-9 px-3 rounded-lg cursor-pointer bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Borrador
            </button>
            <button
              type="button"
              onClick={() =>
                runBulkUpdate({ featured: true }, "Marcados como destacados")
              }
              disabled={selectedIds.length === 0 || bulkLoading}
              className="h-9 px-3 rounded-lg cursor-pointer bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center gap-2"
            >
              <Star size={12} />
              Featured
            </button>
            <button
              type="button"
              onClick={() =>
                runBulkUpdate({ featured: false }, "Removidos de destacados")
              }
              disabled={selectedIds.length === 0 || bulkLoading}
              className="h-9 px-3 rounded-lg cursor-pointer bg-zinc-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center gap-2"
            >
              <StarOff size={12} />
              Quitar Featured
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0 || bulkLoading}
              className="h-9 px-3 rounded-lg cursor-pointer bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Estándar con scroll responsive */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <table className="w-full text-left font-sans">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-10">
                Sel
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Producto
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Precio
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                Stock
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic"
                >
                  <Loader2
                    className="animate-spin inline mr-2 text-slate-300 dark:text-slate-600"
                    size={20}
                  />
                  Sincronizando Producto...
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => toggleSelect(product.id)}
                      className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {selectedIds.includes(product.id) ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0 border border-slate-50 dark:border-slate-700/50 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name || "Producto"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} />
                        )}
                      </div>
                      <div className="max-w-37.5 sm:max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                          {product.category_names?.length > 0
                            ? product.category_names[0]
                            : "Sin categoría"}
                          {product.category_names?.length > 1 &&
                            ` (+${product.category_names.length - 1})`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-black ${product.stock <= 5 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}
                      >
                        {product.stock}{" "}
                        <span className="text-[9px] uppercase opacity-40">
                          unds
                        </span>
                      </span>
                      {product.stock <= 5 && (
                        <span className="text-[7px] font-black uppercase tracking-tighter text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md inline-block">
                          Stock Bajo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        product.status === "published"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {product.status === "published"
                        ? "Publicado"
                        : "Borrador"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(product)}
                        className="p-2 text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-400 font-medium"
                >
                  No hay productos cargados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
