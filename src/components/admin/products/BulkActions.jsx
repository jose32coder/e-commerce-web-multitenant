"use client";
import React from "react";
import { CheckSquare, Square, Star, StarOff } from "lucide-react";

export default function BulkActions({ 
  selectedIds, 
  allFilteredSelected, 
  toggleSelectAllFiltered, 
  runBulkUpdate, 
  handleBulkDelete, 
  bulkLoading 
}) {
  return (
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

        <div className="flex gap-2 overflow-x-auto pb-2.5">
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
  );
}
