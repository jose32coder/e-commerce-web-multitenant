"use client";

import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

import { convertPrice } from "@/services/exchangeRates";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isSelected,
  onToggle,
}) {
  const { commerce_settings, exchange_rates } = useSiteConfig();
  const currencySymbol = commerce_settings?.currency_symbol || "$";
  const targetCurrency = commerce_settings?.currency_code || "USD";
  const itemBaseCurrency = item.base_currency || "USD";

  const priceConverted = convertPrice(
    (Number(item.price) || 0) + (Number(item.price_adjustment) || 0),
    itemBaseCurrency,
    targetCurrency,
    exchange_rates
  );
  const adjustmentConverted = convertPrice(
    Number(item.price_adjustment) || 0,
    itemBaseCurrency,
    targetCurrency,
    exchange_rates
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="border border-honey-light/50 rounded-md p-4 md:p-5 mb-3 flex flex-row gap-4 sm:gap-5 relative group hover:shadow-xl hover:shadow-ink/5 transition-all duration-500"
    >
      {/* SELECCIÓN INDIVIDUAL */}
      <button
        onClick={() => onToggle(item.id, item.variant)}
        className="flex items-center justify-center text-honey-dark hover:text-ink transition-colors px-1"
      >
        {isSelected ? (
          <CheckCircle2 size={24} className="text-ink fill-ink/5" />
        ) : (
          <Circle size={24} className="opacity-20" />
        )}
      </button>

      {/* IMAGEN PRODUCTO */}
      <div className="relative w-full sm:w-24 h-48 sm:h-32 bg-secondary rounded-2xl overflow-hidden shrink-0 border border-honey-light/30">
        <AdaptiveImage
          src={item.images?.[0]?.url || item.images?.[0] || "/placeholder.jpg"}
          alt={item.name || item.title || "Producto"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* DETALLES */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h3 className="text-lg font-serif font-bold text-ink uppercase tracking-tight leading-tight">
              {item.name || item.title}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {item.variant && (
                <p className="text-[9px] text-honey-dark font-bold uppercase tracking-[0.15em]">
                  Variante: <span className="text-ink">{item.variant}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onRemove(item.id, item.variant)}
            className="text-honey-dark hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <span className="text-lg font-bold text-ink">
              {currencySymbol}{priceConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            {adjustmentConverted > 0 && (
              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                +{currencySymbol}{adjustmentConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })} por variante
              </p>
            )}
          </div>

          <div className="flex items-center bg-[#FBF9F6] border border-honey-light/50 rounded-full p-1 shadow-sm">
            <button
              disabled={item.quantity <= 1}
              onClick={() =>
                onUpdateQuantity(item.id, item.quantity - 1, item.variant)
              }
              className="w-7 h-7 flex cursor-pointer items-center justify-center text-honey-dark hover:text-ink disabled:opacity-20 transition-all font-bold"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-[12px] font-bold text-ink">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(item.id, item.quantity + 1, item.variant)
              }
              className="w-7 h-7 flex cursor-pointer items-center justify-center text-honey-dark hover:text-ink transition-all font-bold"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
