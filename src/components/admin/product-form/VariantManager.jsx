import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Combine,
  DollarSign,
  Package,
  Barcode,
  Layers,
  RefreshCw,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

const VariantManager = ({ formData, setFormData, readOnly = false }) => {
  const variantLimit = 999; // Unlimited

  const [attributeGroups, setAttributeGroups] = useState([
    { id: 1, name: "", values: "" },
  ]);

  const variants = formData?.variants || [];
  const totalVariationsCount = variants.length;

  const totalStockSum = React.useMemo(() => {
    return variants.reduce((acc, v) => {
      const val = Number(v.stock_adjustment ?? v.stock_quantity) || 0;
      return acc + val;
    }, 0);
  }, [variants]);

  useEffect(() => {
    if (variants.length > 0 && attributeGroups[0].name === "") {
      const firstVariant = variants[0].attributes;
      if (firstVariant) {
        const names = Object.keys(firstVariant);
        const reconstructed = names.map((name, idx) => ({
          id: idx,
          name: name,
          values: [...new Set(variants.map((v) => v.attributes[name]))].join(
            ", ",
          ),
        }));
        setAttributeGroups(reconstructed);
      }
    }
  }, [variants]);

  const slugify = (text) => {
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  };

  const generateCombinations = () => {
    const productNameSlug = slugify(formData.name || "prod");
    const groups = attributeGroups
      .filter((g) => g.name && g.values)
      .map((g) => ({
        name: g.name.trim(),
        values: g.values.split(",").map((v) => v.trim()),
      }));

    if (groups.length === 0) return;

    const combos = groups.reduce(
      (acc, group) => {
        const result = [];
        acc.forEach((a) => {
          group.values.forEach((v) => {
            result.push({ ...a, [group.name]: v });
          });
        });
        return result;
      },
      [{}],
    );

    const newVariants = combos.map((combo) => {
      const skuParts = [productNameSlug];
      Object.values(combo).forEach((val) => skuParts.push(slugify(val)));

      return {
        attributes: combo,
        price_adjustment: 0,
        stock_adjustment: 0, // Cambiado a stock_adjustment para ser consistente con ProductForm
        sku: skuParts.join("-").toUpperCase(),
      };
    });

    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (idx, field, value) => {
    if (!Array.isArray(formData?.variants)) return;

    const newVariants = [...formData.variants];

    if (field === "stock_adjustment" || field === "stock_quantity" || field === "price_adjustment") {
      const numValue = value === "" ? 0 : Number(value);
      // Actualizamos ambos por si acaso, pero preferimos stock_adjustment
      newVariants[idx][field] = numValue;
      if (field === "stock_quantity") newVariants[idx].stock_adjustment = numValue;
      if (field === "stock_adjustment") newVariants[idx].stock_quantity = numValue;
    } else {
      newVariants[idx][field] = value;
    }

    setFormData({ ...formData, variants: newVariants });
  };

  const handleFocus = (e) => e.target.select();

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* CABECERA DE SECCIÓN */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <Layers className="text-slate-500" size={32} />
            Gestión de Variantes
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider ml-11">
            Configura múltiples versiones de tu producto
          </p>
        </div>

        {variants.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-6 py-3 rounded-md flex items-center gap-4 animate-in zoom-in-95">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-md flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest leading-none mb-1">
                Resumen de Inventario
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {totalVariationsCount}
                  <span className="text-[10px] ml-1 opacity-40 font-bold uppercase">
                    {totalVariationsCount === 1 ? "variación" : "variaciones"}
                  </span>
                </p>
                <span className="text-slate-300">|</span>
                <p className="text-xl font-bold text-slate-600 dark:text-slate-400 leading-none">
                  {totalStockSum}
                  <span className="text-[10px] ml-1 opacity-40 font-bold uppercase">
                    {totalStockSum === 1 ? "unidad" : "unidades"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-md border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md flex items-center justify-center shadow-xl">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                1. Definir Atributos
              </h3>
            </div>

            <div className="space-y-6">
              {attributeGroups.map((group, index) => (
                <div key={group.id} className="group space-y-3 relative">
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">
                        Nombre del Atributo
                      </label>
                      <input
                        placeholder="Ej: Color, Talla, Herramienta..."
                        className="w-full px-5 h-12 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold outline-none border border-transparent focus:border-slate-500 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-white"
                        value={group.name}
                        onChange={(e) => {
                          const newGroups = [...attributeGroups];
                          newGroups[index].name = e.target.value;
                          setAttributeGroups(newGroups);
                        }}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">
                        Valores (Separados por coma)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="M, Azul, Pequeño..."
                        className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold outline-none border border-transparent focus:border-slate-500 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-white resize-none"
                        value={group.values}
                        onChange={(e) => {
                          const newGroups = [...attributeGroups];
                          newGroups[index].values = e.target.value;
                          setAttributeGroups(newGroups);
                        }}
                        disabled={readOnly}
                      />
                    </div>
                  </div>

                  {!readOnly && attributeGroups.length > 1 && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 w-8 h-8 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      onClick={() =>
                        setAttributeGroups(
                          attributeGroups.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAttributeGroups([
                      ...attributeGroups,
                      { id: Date.now(), name: "", values: "" },
                    ])
                  }
                  className="w-full h-12 cursor-pointer rounded-md border-2 border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-all gap-2"
                >
                  <Plus size={16} /> Añadir Atributo
                </Button>
              )}

              <Button
                type="button"
                onClick={generateCombinations}
                disabled={
                  readOnly ||
                  attributeGroups.every((g) => !g.name || !g.values)
                }
                className="w-full h-14 bg-slate-600 cursor-pointer hover:bg-slate-700 text-white rounded-md font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none transition-all gap-3"
              >
                <RefreshCw size={18} />
                Generar Matrix
              </Button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md flex items-start gap-3">
              <Info className="text-slate-500 shrink-0" size={16} />
              <p className="text-[10px] text-slate-900 dark:text-slate-300 font-medium leading-relaxed uppercase tracking-tighter">
                Al generar, el sistema creará automáticamente los códigos de
                referencia sugeridos basándose en el nombre de tu producto.
              </p>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: MATRIZ DE RESULTADOS */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between ml-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-md flex items-center justify-center shadow-lg">
                <Combine size={16} />
              </div>
              <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                2. Control de Inventario
              </h3>
            </div>
            {variants.length > 0 && (
              <span className="text-[10px] font-black uppercase text-slate-400 bg-white dark:bg-slate-800 px-4 py-1.5">
                {variants.length} combinaciones detectadas
              </span>
            )}
          </div>

          {variants.length > 0 ? (
            <div className="space-y-4">
              {/* VISTA DESKTOP (TABLA) */}
              <div className="hidden lg:block overflow-hidden bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">
                        Variante
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Stock
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Precio (+/-)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {variants.map((v, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 pt-5 pb-2">
                            <div className="flex gap-1.5 flex-wrap">
                              {v.attributes &&
                                Object.entries(v.attributes).map(
                                  ([key, val]) => (
                                    <span
                                      key={key}
                                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                                    >
                                      {val}
                                    </span>
                                  ),
                                )}
                            </div>
                          </td>
                          <td className="px-6 pt-5 pb-2">
                            <div className="relative w-24">
                              <Package
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"
                              />
                              <input
                                type="number"
                                className="w-full pl-9 pr-3 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-xs font-black text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
                                value={v.stock_adjustment ?? v.stock_quantity ?? 0}
                                onChange={(e) =>
                                  updateVariant(
                                    idx,
                                    "stock_adjustment",
                                    e.target.value,
                                  )
                                }
                                onFocus={handleFocus}
                                disabled={readOnly}
                              />
                            </div>
                          </td>
                          <td className="px-6 pt-5 pb-2">
                            <div className="relative w-28">
                              <DollarSign
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                              />
                              <input
                                type="number"
                                className="w-full pl-9 pr-3 h-10 bg-slate-50 dark:bg-slate-800 rounded-md text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500 transition-all border-none"
                                value={v.price_adjustment}
                                onChange={(e) =>
                                  updateVariant(
                                    idx,
                                    "price_adjustment",
                                    e.target.value,
                                  )
                                }
                                onFocus={handleFocus}
                                disabled={readOnly}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 group">
                          <td colSpan={3} className="px-6 pb-4 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                Cód. Ref.
                              </span>
                              <div className="relative flex-1">
                                <Barcode
                                  size={13}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                  readOnly
                                  placeholder="AUTOGEN"
                                  className="w-full pl-8 pr-4 h-8 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-400 dark:text-slate-500 outline-none border-none uppercase cursor-default"
                                  value={v.sku || ""}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA MOBILE (CARDS) */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-6 rounded-md
                 border border-slate-100 dark:border-slate-800 shadow-lg space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        {v.attributes &&
                          Object.entries(v.attributes).map(([key, val]) => (
                            <span
                              key={key}
                              className="px-3 py-1 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-500/20"
                            >
                              {val}
                            </span>
                          ))}
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">
                          Stock
                        </label>
                        <div className="relative">
                          <Package
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"
                          />
                          <input
                            type="number"
                            className="w-full pl-9 pr-3 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-xs font-black text-emerald-700 dark:text-emerald-400 outline-none border-none"
                            value={v.stock_adjustment ?? v.stock_quantity ?? 0}
                            onChange={(e) =>
                              updateVariant(
                                idx,
                                "stock_adjustment",
                                e.target.value,
                              )
                            }
                            onFocus={handleFocus}
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-1.5">
                          Precio (+/-)
                        </label>
                        <div className="relative">
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                              <DollarSign
                                size={14}
                                className="text-slate-400 group-focus-within/input:text-slate-500 transition-colors duration-300"
                              />
                            </div>
                            <input
                              type="number"
                              className={`
        w-full pl-10 pr-4 h-11
        bg-white dark:bg-slate-900
        rounded-md text-[11px] font-bold
        text-slate-900 dark:text-white
        outline-none border border-slate-200 dark:border-slate-700
        hover:border-slate-300 dark:hover:border-slate-600
        focus:border-slate-500/50 focus:ring-4 focus:ring-slate-500/10
        transition-all duration-300 shadow-sm
        ${readOnly ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}
      `}
                              placeholder="0.00"
                              value={v.price_adjustment}
                              onChange={(e) =>
                                updateVariant(
                                  idx,
                                  "price_adjustment",
                                  e.target.value,
                                )
                              }
                              onFocus={handleFocus}
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1 block mb-1.5">
                        Código Ref.
                      </label>
                      <div className="relative">
                        <Barcode
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          readOnly
                          placeholder="AUTOGEN"
                          className="w-full pl-9 pr-4 h-11 bg-slate-100 dark:bg-slate-800/60 rounded-md text-[10px] font-bold text-slate-400 dark:text-slate-500 outline-none border-none uppercase cursor-default select-all"
                          value={v.sku || ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="group h-125 border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-md flex flex-col items-center justify-center gap-6 hover:border-slate-300 dark:hover:border-slate-900 transition-all duration-500">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-200 dark:text-slate-700 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Combine size={48} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                  Esperando Combinaciones
                </p>
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase">
                  Sigue el paso 1 a la izquierda
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantManager;
