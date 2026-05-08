"use client";
import React from "react";
import { Loader2, Package, CheckSquare, Square, Eye, Edit, Trash2 } from "lucide-react";
import { getOptimizedImage } from "@/lib/getOptimizedImage";

export default function ProductTable({ 
  loading, 
  filteredProducts, 
  paginatedProducts, 
  selectedIds, 
  toggleSelect, 
  handleView, 
  handleEdit, 
  handleDelete 
}) {
  return (
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
            paginatedProducts.map((product) => {
              const firstImage = product.images?.[0];
              const imageUrl =
                (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
                "";
              const optimizedThumb = getOptimizedImage(imageUrl, 140);

              return (
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
                    <div className="product-media-thumb w-12 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0 border border-slate-50 dark:border-slate-700/50">
                      {product.images?.[0] ? (
                        <img
                          src={optimizedThumb}
                          alt={product.name || "Producto"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={16} />
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
                      {Number(product.stock) >= 999999 ? "Ilimitado" : product.stock}{" "}
                      {Number(product.stock) < 999999 && (
                        <span className="text-[9px] uppercase opacity-40">
                          unds
                        </span>
                      )}
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
              );
            })
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
  );
}
