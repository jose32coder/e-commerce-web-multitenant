import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Hash,
  TrendingDown,
  Lock,
  AlertTriangle,
  RefreshCw,
  Calculator,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { convertPrice } from "@/services/exchangeRates";

const PricingStock = ({
  formData,
  setFormData,
  readOnly = false,
  effectiveStock,
  autoCalculated = false,
  exchangeRates = null,
  commerceSettings = {},
}) => {
  const [workingCurrency, setWorkingCurrency] = useState("USD");
  const [calcValue, setCalcValue] = useState("");

  const primaryCurrency = commerceSettings?.currency_code || "USD";
  const primarySymbol = commerceSettings?.currency_symbol || "$";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyConversion = () => {
    if (!exchangeRates || !calcValue) return;

    const amount = parseFloat(calcValue);
    const targetBaseCurrency = formData.base_currency || primaryCurrency;
    
    // Convertir del workingCurrency al baseCurrency del producto
    const result = convertPrice(amount, workingCurrency, targetBaseCurrency, exchangeRates);

    setFormData((prev) => ({
      ...prev,
      price: result.toFixed(2), // Restauramos decimales para mayor precisión
    }));
    setCalcValue("");
  };

  const hasDiscount =
    formData.discount_price && parseFloat(formData.discount_price) > 0;

  // Estilo base para los contenedores de las cards (p-4 en móvil, p-5 en desktop)
  const cardBaseStyle =
    "group p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-all duration-200 shadow-sm";

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Grid de Inputs: 1 columna en móvil, 3 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Precio Base */}
        <div
          className={`${cardBaseStyle} focus-within:border-slate-400 dark:focus-within:border-slate-600`}
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                <DollarSign
                  size={12}
                  className="text-slate-600 dark:text-slate-400"
                />
              </div>
              Precio Base
            </label>
            {!readOnly ? (
              <select
                name="base_currency"
                value={formData.base_currency || primaryCurrency}
                onChange={handleChange}
                className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-2 py-0.5 outline-none border-none cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-2 py-0.5">
                {formData.base_currency || primaryCurrency}
              </span>
            )}
          </div>
          <Input
            required
            type="number"
            name="price"
            step="0.01"
            placeholder="0.00"
            className="h-10 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-md font-bold text-lg px-3 focus-visible:ring-1 focus-visible:ring-slate-400 transition-all no-spin"
            value={formData.price}
            onChange={handleChange}
            disabled={readOnly}
          />

          {/* Previsualización de conversión en vivo */}
          {exchangeRates && parseFloat(formData.price) > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 space-y-1">
              {(formData.base_currency || primaryCurrency) !== "USD" && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  Ref. Interna: ${" "}
                  {convertPrice(parseFloat(formData.price), formData.base_currency || primaryCurrency, "USD", exchangeRates).toFixed(2)}{" "}
                  USD
                </p>
              )}
              {(formData.base_currency || primaryCurrency) === "USD" && primaryCurrency !== "USD" && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  Público: ≈{" "}
                  {convertPrice(parseFloat(formData.price), "USD", primaryCurrency, exchangeRates).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                  {primaryCurrency}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Precio de Oferta */}
        <div
          className={`${cardBaseStyle} ${
            hasDiscount
              ? "bg-rose-50/30 dark:bg-rose-500/5 border-rose-200 dark:border-rose-900/50"
              : "focus-within:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <label
              className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                hasDiscount
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <div
                className={`p-1 rounded ${hasDiscount ? "bg-rose-100 dark:bg-rose-900/30" : "bg-slate-100 dark:bg-slate-800"}`}
              >
                <TrendingDown size={12} />
              </div>
              Oferta ($)
            </label>
            {hasDiscount && (
              <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase">
                Activa
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              type="number"
              name="discount_price"
              step="0.01"
              placeholder="0.00"
              className={`h-10 rounded-md font-bold text-lg px-3 focus-visible:ring-1 transition-all no-spin ${
                hasDiscount
                  ? "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 focus-visible:ring-rose-400"
                  : "bg-slate-50/50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 focus-visible:ring-rose-200"
              }`}
              value={formData.discount_price}
              onChange={handleChange}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Stock Total */}
        <div
          className={`${cardBaseStyle} ${autoCalculated || !formData.manage_stock ? "bg-slate-50/50 dark:bg-slate-900/50 border-dashed" : "focus-within:border-slate-400"}`}
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                <Hash size={12} />
              </div>
              Inventario
            </label>
            <div className="flex items-center gap-2">
              {!readOnly && !autoCalculated && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      manage_stock: !prev.manage_stock,
                    }))
                  }
                  className={`text-[9px] font-black cursor-pointer px-2 py-0.5 rounded transition-all ${
                    formData.manage_stock
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  {formData.manage_stock ? "SÍ" : "NO"}
                </button>
              )}
              {autoCalculated && <Lock size={10} className="text-slate-400" />}
            </div>
          </div>

          {formData.manage_stock ? (
            <>
              <Input
                required
                type="number"
                name="stock"
                placeholder="0"
                className={`h-10 border-slate-100 dark:border-slate-800 rounded-md font-bold text-lg px-3 transition-all no-spin ${
                  autoCalculated
                    ? "bg-transparent dark:text-slate-400 cursor-not-allowed border-none text-slate-500 shadow-none"
                    : "bg-slate-50/50 dark:bg-slate-950 dark:text-white focus-visible:ring-1 focus-visible:ring-slate-400 border-dashed"
                }`}
                value={autoCalculated ? effectiveStock : formData.stock}
                onChange={handleChange}
                disabled={readOnly || autoCalculated}
              />
              {autoCalculated && (
                <p className="mt-2 text-[9px] leading-tight font-medium uppercase tracking-tighter text-slate-400 dark:text-slate-500 italic">
                  Calculado por variantes
                </p>
              )}
            </>
          ) : (
            <div className="h-10 flex items-center px-3 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-md border border-emerald-100/50 dark:border-emerald-500/20">
              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Disponibilidad Ilimitada
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Asistente de Conversión */}
      {!readOnly && exchangeRates && (
        <div className="mt-2 p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-500 text-white rounded-lg shadow-lg shadow-slate-500/20">
              <Calculator size={16} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">
                Asistente de Conversión
              </h4>
              <p className="text-[9px] text-slate-500 font-medium mt-1">
                Ingresa el precio en otra moneda para calcular el valor base.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={workingCurrency}
              onChange={(e) => setWorkingCurrency(e.target.value)}
              className="h-10 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-slate-500 outline-none transition-all cursor-pointer"
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="number"
                placeholder={`Monto en ${workingCurrency}...`}
                value={calcValue}
                onChange={(e) => setCalcValue(e.target.value)}
                className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
              />
            </div>

            <button
              type="button"
              onClick={applyConversion}
              disabled={!calcValue || parseFloat(calcValue) <= 0}
              className="h-10 px-6 bg-slate-700 hover:bg-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-md font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-600/20 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={calcValue ? "animate-spin-slow" : ""}
              />
              Aplicar a Precio
            </button>
          </div>

          {calcValue && exchangeRates && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-left-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-400 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-tight">
                Resultado estimado:{" "}
                <span className="text-slate-700 dark:text-slate-400">
                  {(() => {
                    const amount = parseFloat(calcValue);
                    const targetBaseCurrency = formData.base_currency || primaryCurrency;
                    const result = convertPrice(amount, workingCurrency, targetBaseCurrency, exchangeRates);
                    return `${result.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${targetBaseCurrency}`;
                  })()}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alerta de validación */}
      {hasDiscount &&
        parseFloat(formData.discount_price) >= parseFloat(formData.price) && (
          <div className="flex items-center justify-center w-full px-2">
            <span className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-amber-600 dark:text-amber-500 px-4 py-2 rounded-md uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 w-full md:w-auto text-center justify-center shadow-sm">
              <AlertTriangle size={14} strokeWidth={2.5} />
              El precio de oferta debe ser menor al precio base
            </span>
          </div>
        )}
    </div>
  );
};

export default PricingStock;
