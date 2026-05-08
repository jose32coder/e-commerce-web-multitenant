import { cn } from "@/lib/utils";
import { DEFAULT_SITE_NAME } from "@/lib/siteConfig";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
<<<<<<< Updated upstream
=======
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Smartphone } from "lucide-react";
import { convertPrice } from "@/services/exchangeRates";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getOptimizedImage } from "@/lib/getOptimizedImage";
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

export function OrderSummary({
  items,
  subtotal,
  total,
  brandImageLabel = DEFAULT_SITE_NAME,
}) {
  return (
    <div className="bg-paper border border-honey-light/50 rounded-[2.5rem] p-8 h-fit lg:sticky lg:top-10 shadow-sm">
      <h3 className="text-lg font-serif font-bold text-ink uppercase tracking-tight mb-6">
        Tu Pedido
      </h3>
<<<<<<< Updated upstream
      <div className="space-y-6 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={`${item.id}-${item.variant}`} className="flex gap-4">
            <div className="relative w-16 h-20 rounded-md overflow-hidden shrink-0 bg-secondary">
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
                priority // Agregado para mejorar el LCP detectado en consola
                sizes="64px"
                className="object-cover"
              />
=======

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {mounted && items.map((item) => {
          const itemBaseCurrency = item.base_currency || "USD";
          const firstImage = item.images?.[0];
          const itemImage =
            (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
            item.image_url ||
            `https://placehold.co/400x600/png?text=${encodeURIComponent(
              brandImageLabel,
            )}`;
          const optimizedItemImage = getOptimizedImage(itemImage, 220);
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
              <div className="product-media-thumb w-16 shrink-0 bg-[#F3F4F6]">
                <AdaptiveImage
                  src={optimizedItemImage}
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
                  {currencySymbol}{itemTotalPriceConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
>>>>>>> Stashed changes
            </div>
            <div className="flex-1 py-1">
              {/* Ajustado a item.name según tu console.log */}
              <h4 className="text-xs font-bold text-ink uppercase leading-tight mb-1">
                {item.name}
              </h4>
              <p className="text-[10px] text-honey-dark font-medium mb-2">
                Cant: {item.quantity} | Talla: {item.variant}
              </p>
              {Number(item.price_adjustment) > 0 && (
                <p className="text-[10px] text-amber-700 font-semibold mb-2">
                  +${Number(item.price_adjustment).toFixed(2)} por variante
                </p>
              )}
              <p className="text-xs font-bold text-ink">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-honey-light/50 space-y-3 font-bold text-[10px] uppercase tracking-widest text-honey-dark">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-ink">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <span
            className={cn(
              "text-[9px]",
              total >= 50 ? "text-green-600" : "text-amber-600",
            )}
          >
            {total >= 50 ? "Gratis" : "Cobro en destino"}
          </span>
        </div>
        <div className="pt-4 flex justify-between items-baseline text-ink border-t border-honey-light/10">
          <span className="text-lg font-serif">Total</span>
          <span className="text-2xl font-serif">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
