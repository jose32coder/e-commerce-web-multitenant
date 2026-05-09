import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { normalizeCommerceSettings } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { convertPrice, formatPrice } from "@/services/exchangeRates";

export default function CartSummary({ totalItems, subtotal, discount = 0 }) {
  const { commerce_settings, tenant_slug, exchange_rates } = useSiteConfig();
  const commerce = normalizeCommerceSettings(commerce_settings);
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const currencySymbol = commerce?.currency_symbol || "$";
  const targetCurrency = commerce?.currency_code || "USD";

  const deliveryFee = Number(commerce.delivery_fee || 0);
  const threshold = Number(commerce.free_shipping_threshold || 50);

  // Lógica de envío gratuito (comparamos en moneda base USD para consistencia)
  const isFree = subtotal >= threshold && threshold > 0;
  
  // Conversiones para mostrar
  const subtotalConverted = convertPrice(subtotal, "USD", targetCurrency, exchange_rates);
  const discountConverted = convertPrice(discount, "USD", targetCurrency, exchange_rates);
  const deliveryFeeConverted = convertPrice(deliveryFee, "USD", targetCurrency, exchange_rates);
  const thresholdConverted = convertPrice(threshold, "USD", targetCurrency, exchange_rates);
  
  const appliedDelivery = isFree ? 0 : deliveryFeeConverted;
  const totalConverted = subtotalConverted - discountConverted + appliedDelivery;

  return (
    <div className="border border-honey-light/50 rounded-4xl p-6 md:p-8 shadow-2xl shadow-ink/5 sticky top-24 bg-white/50 backdrop-blur-sm">
      <h2 className="text-xl font-serif font-bold text-ink mb-6 uppercase tracking-tighter">
        Resumen del pedido
      </h2>

      {/* DESGLOSE */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-honey-dark uppercase tracking-widest font-bold">
            Subtotal
          </span>
          <span className="font-bold text-ink">
            {currencySymbol}{formatPrice(subtotalConverted, targetCurrency)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-honey-dark uppercase tracking-widest font-bold">
              Descuento
            </span>
            <span className="font-bold text-red-500">
              -{currencySymbol}{formatPrice(discountConverted, targetCurrency)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-honey-dark uppercase tracking-widest font-bold">
            Envío
          </span>
          <span
            className={cn(
              "font-bold uppercase tracking-tighter",
              isFree ? "text-green-600" : "text-amber-600",
            )}
          >
            {isFree
              ? "Gratuito"
              : deliveryFee > 0
                ? `${currencySymbol}${formatPrice(deliveryFeeConverted, targetCurrency)}`
                : "Cobro en destino"}
          </span>
        </div>

        <div className="pt-4 border-t border-honey-light/50 flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-serif font-bold text-ink uppercase tracking-tight">
              Total
            </span>
            <span className="text-3xl font-serif font-bold text-ink">
              {currencySymbol}{formatPrice(totalConverted, targetCurrency)}
            </span>
          </div>
          {threshold > 0 && (
            <p className="text-[9px] text-honey-dark italic font-medium text-center mt-2">
              {isFree
                ? "✨ ¡Envío gratuito aplicado!"
                : `* Envío gratuito en compras mayores a ${currencySymbol}${formatPrice(thresholdConverted, targetCurrency)}`}
            </p>
          )}
        </div>
      </div>

      {/* BOTÓN CHECKOUT */}
      <Button
        asChild
        className="w-full h-14 bg-ink text-paper hover:bg-ink/90 shadow-xl shadow-ink/10 font-bold uppercase text-[11px] tracking-[0.2em] group"
      >
        <Link
          href={`${baseUrl}/checkout`}
          className="flex items-center justify-center gap-2"
        >
          Pagar ahora{" "}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </Button>
    </div>
  );
}
