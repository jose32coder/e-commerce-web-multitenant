import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_NAME } from "@/lib/siteConfig";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Smartphone } from "lucide-react";
import { convertPrice, formatPrice } from "@/services/exchangeRates";
import { useSiteConfig } from "@/context/SiteConfigContext";

export function OrderSummary({
  items = [],
  subtotal,
  total,
  onVerify,
  deliveryFee = 0,
  threshold = 50,
  brandImageLabel = DEFAULT_SITE_NAME,
  shippingMethod = "delivery",
  shippingPaymentType = "cod",
  showStockInquiry = false,
  onStockInquiry = () => {},
  stockProblems = [],
  disabled = false,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const { commerce_settings, exchange_rates } = useSiteConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currencySymbol = commerce_settings?.currency_symbol || "$";
  const targetCurrency = commerce_settings?.currency_code || "USD";

  const isLocal = shippingMethod === "local" || shippingMethod === "delivery";
  const isNational = shippingMethod === "national";
  const isPickup = shippingMethod === "pickup";

  const isFree = isLocal && subtotal >= threshold && threshold > 0;

  // Conversiones para mostrar
  const subtotalValue = mounted ? subtotal : 0;
  const totalValue = mounted ? total : 0;
  const deliveryValue = mounted ? deliveryFee : 0;

  const subtotalConverted = convertPrice(subtotalValue, "USD", targetCurrency, exchange_rates);
  const deliveryFeeConverted = convertPrice(deliveryValue, "USD", targetCurrency, exchange_rates);
  const totalConverted = convertPrice(totalValue, "USD", targetCurrency, exchange_rates);


  return (
    <div className="bg-white border border-zinc-100 rounded-md p-8 shadow-xl shadow-zinc-200/50 h-fit">
      <h3 className="text-sm font-black text-ink uppercase tracking-[0.2em] mb-8">
        Tu Pedido
      </h3>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {mounted && safeItems.map((item) => {
          const itemBaseCurrency = item.base_currency || "USD";
          const itemTotalPriceConverted = convertPrice(
            ((Number(item.price) || 0) + (Number(item.price_adjustment) || 0)) * item.quantity,
            itemBaseCurrency,
            targetCurrency,
            exchange_rates
          );

          return (
            <div
              key={`${item.id}-${item.variant}`}
              className="flex gap-4 items-center"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F3F4F6]">
                <AdaptiveImage
                  src={
                    item.images?.[0] ||
                    item.image_url ||
                    `https://placehold.co/400x600/png?text=${encodeURIComponent(
                      brandImageLabel,
                    )}`
                  }
                  alt={item.name || "Producto"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black text-ink uppercase tracking-tight leading-tight mb-0.5 truncate">
                  {item.name}
                </h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  {item.variant && (
                    <>
                      <span className="text-ink/60">{item.variant}</span>
                      <span className="opacity-30">|</span>
                    </>
                  )}
                  <span>Cant: {item.quantity}</span>
                </p>
                <p className="text-[12px] font-bold text-ink mt-1">
                  {currencySymbol}{formatPrice(itemTotalPriceConverted, targetCurrency)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {stockProblems.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg space-y-2">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">
            ⚠️ Error de disponibilidad
          </p>
          <ul className="text-[11px] text-red-700 space-y-1 font-medium">
            {stockProblems.map((p, i) => (
              <li key={i}>
                • {p.name} {p.variant ? `(${p.variant})` : ""}: Solo quedan {p.available} unidades.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-zinc-100 space-y-4">
        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
          <span>Subtotal</span>
          <span className="text-ink">
            {currencySymbol}{formatPrice(subtotalConverted, targetCurrency)}
          </span>
        </div>

        {!isPickup && (
          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            <span>{isLocal ? "Delivery" : "Envío"}</span>
            <span className={cn(isFree ? "text-emerald-500" : "text-amber-500")}>
              {isFree
                ? "Gratis"
                : shippingPaymentType === "cod"
                  ? "Cobro en destino"
                  : deliveryValue > 0
                    ? `${currencySymbol}${formatPrice(deliveryFeeConverted, targetCurrency)}`
                    : "Gratis"}
            </span>
          </div>
        )}

        {isPickup && (
          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            <span>Entrega</span>
            <span className="text-emerald-500">Retiro en tienda</span>
          </div>
        )}

        <div className="pt-4 flex justify-between items-center text-ink">
          <span className="text-sm font-black uppercase tracking-[0.2em]">
            Total
          </span>
          <span className="text-2xl font-black">
            {currencySymbol}{formatPrice(totalConverted, targetCurrency)}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {showStockInquiry && (
          <Button
            onClick={onStockInquiry}
            variant="outline"
            className="w-full h-14 border-2 border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] rounded-md transition-all flex items-center justify-center gap-3 group cursor-pointer"
          >
            <Smartphone size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            Consultar Stock
          </Button>
        )}

        <Button
          onClick={onVerify}
          disabled={disabled}
          className={cn(
            "w-full h-16 text-paper shadow-2xl font-black uppercase text-[11px] tracking-[0.2em] rounded-md transition-all group cursor-pointer",
            disabled 
              ? "bg-zinc-200 text-zinc-400 shadow-none cursor-not-allowed" 
              : "bg-ink hover:bg-ink/90 shadow-ink/20 hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {disabled ? "Carrito no disponible" : "Verificar Pago"}
          {!disabled && (
            <ArrowRight
              size={16}
              className="ml-2 group-hover:translate-x-1 transition-transform"
            />
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Lock size={12} className="opacity-50" />
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
            Verifica bien tu pedido antes de confirmar el pago
          </span>
        </div>
      </div>
    </div>
  );
}
