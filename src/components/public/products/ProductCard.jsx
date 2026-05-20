"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Share2 } from "lucide-react";
import QuickAddSheet from "@/components/public/products/QuickAddSheet";
import { getOptimizedImage } from "@/lib/getOptimizedImage";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { DEFAULT_SITE_NAME } from "@/lib/siteConfig";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { convertPrice, formatPrice } from "@/services/exchangeRates";
import { createClient } from "@/lib/supabase/client";

export default function ProductCard({
  product,
  index = 0,
  activeCategoryId = "all",
  allCategories = [],
  onSheetOpenChange,
}) {
  const { site_name, tenant_slug, commerce_settings, exchange_rates } =
    useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;
  const currencySymbol = commerce_settings?.currency_symbol || "$";
  const targetCurrency = commerce_settings?.currency_code || "USD";

  const {
    name,
    price,
    discount_price,
    description,
    short_description,
    category,
    category_ids,
    slug,
    images,
    base_currency = "USD",
    use_variant_only_pricing,
    product_variants,
    stock,
  } = product;

  const [currentStock, setCurrentStock] = useState(Number(stock) || 0);
  const uniqueChannelId = useRef(Math.random().toString(36).substring(7));

  // --- REALTIME STOCK SUBSCRIPTION ---
  useEffect(() => {
    const supabase = createClient();
    const stockChannel = supabase
      .channel(`card-stock-${product.id}-${uniqueChannelId.current}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_stock",
          filter: `product_id=eq.${product.id}`,
        },
        (payload) => {
          setCurrentStock(Number(payload.new.quantity) || 0);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stockChannel);
    };
  }, [product.id]);

  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock < 5;

  // Lógica para determinar qué etiquetas de categoría mostrar
  const getDisplayCategories = () => {
    // 1. Si estamos en una categoría específica, mostramos esa (si el producto pertenece a ella)
    if (activeCategoryId !== "all" && allCategories.length > 0) {
      const activeCat = allCategories.find((c) => c.id === activeCategoryId);
      if (activeCat) return [activeCat.name];
    }

    // 2. Si estamos en "Todo" o no hay filtro, intentamos mostrar todas sus categorías vinculadas
    if (category_ids && category_ids.length > 0 && allCategories.length > 0) {
      const linkedNames = allCategories
        .filter((c) => category_ids.includes(c.id))
        .map((c) => c.name);

      if (linkedNames.length > 0) return linkedNames;
    }

    // 3. Fallback: la categoría principal que viene en el objeto product
    return category?.name ? [category.name] : [];
  };

  const displayCategories = getDisplayCategories();

  const rawRegularPrice = Number(price) || 0;
  const rawOfferPrice = Number(discount_price) || 0;
  const isVariantOnlyPricing = use_variant_only_pricing === true;
  const variantAbsolutePrices = (product_variants || [])
    .map((variant) =>
      Number(variant?.price_adjustment ?? variant?.price_override ?? 0),
    )
    .filter((value) => value > 0);
  const minVariantAbsolutePrice =
    variantAbsolutePrices.length > 0 ? Math.min(...variantAbsolutePrices) : 0;

  const regularPrice = convertPrice(
    rawRegularPrice,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const offerPrice = convertPrice(
    rawOfferPrice,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const fromVariantPrice = convertPrice(
    minVariantAbsolutePrice,
    base_currency,
    targetCurrency,
    exchange_rates,
  );

  const hasActiveOffer =
    !isVariantOnlyPricing && offerPrice > 0 && offerPrice < regularPrice;
  const displayPrice = isVariantOnlyPricing
    ? fromVariantPrice
    : hasActiveOffer
      ? offerPrice
      : regularPrice;

  // En Supabase guardas un array de strings, por lo que images[0] es directamente la URL
  const rawImageUrl = images?.[0] || "/placeholder.jpg";
  const imageUrl = getOptimizedImage(rawImageUrl, 400);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (onSheetOpenChange) {
      onSheetOpenChange(sheetOpen);
    }
  }, [sheetOpen, onSheetOpenChange]);

  const isPriority = index < 4;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSheetOpen(true);
  };

  const handleSharePlaceholder = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="group block relative">
      <Link
        href={`${baseUrl}/products/${slug}`}
        className="block"
        prefetch={false}
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#F9F9F9] aspect-3/4">
          {displayCategories.length > 0 && (
            <div className="absolute top-3 left-3 right-14 z-10 flex flex-wrap gap-1 items-center">
              <span
                className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-[0.18em] md:tracking-widest text-ink shadow-sm inline-block max-w-27.5 md:max-w-42.5 truncate"
                title={displayCategories[0]} // Muestra el texto completo al pasar el mouse
              >
                {displayCategories[0]}
              </span>

              {displayCategories.length > 1 && (
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[7px] md:text-[10px] font-bold text-ink shadow-sm shrink-0">
                  +{displayCategories.length - 1}
                </span>
              )}
            </div>
          )}

          <AdaptiveImage
            src={imageUrl}
            alt={name || `Producto de ${brand}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={isPriority}
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${isOutOfStock ? "grayscale opacity-60" : ""}`}
            draggable={false}
          />

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="bg-black/80 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/20">
                Agotado
              </span>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                Pocas unidades
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <Button
            onClick={handleSharePlaceholder}
            size="icon"
            className="absolute top-3 right-3 z-20 h-7 w-7 cursor-pointer bg-white/95 text-ink hover:bg-white shadow-md transition-all duration-300 opacity-85 group-hover:opacity-100"
            aria-label={`Compartir ${name}`}
          >
            <Share2 size={12} />
          </Button>

          <Button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            size="icon"
            className={`absolute bottom-3 right-3 z-20 bg-white text-ink hover:bg-ink hover:text-white shadow-lg transition-all duration-300 scale-90 group-hover:scale-100 opacity-90 group-hover:opacity-100 ${isOutOfStock ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            aria-label={
              isOutOfStock ? "Producto agotado" : `Añadir ${name} al carrito`
            }
          >
            <Plus size={18} />
          </Button>
        </div>

        <div className="mt-3 md:mt-4 space-y-1 px-0.5 md:px-1">
          {displayCategories.length > 0 && (
            <span className="block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.22em] md:tracking-[0.3em] text-honey-dark leading-none">
              {displayCategories[0]}
              {displayCategories.length > 1 && (
                <span className="ml-1 text-slate-400">
                  +{displayCategories.length - 1}
                </span>
              )}
            </span>
          )}

          <div className="flex flex-col gap-2 md:hidden">
            <h4 className="text-[11px] font-bold text-ink uppercase tracking-tight line-clamp-2">
              {name}
            </h4>
            {(description || short_description) && (
              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 font-light italic">
                {description || short_description}
              </p>
            )}
            <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
              {hasActiveOffer && (
                <span className="text-[9px] font-semibold text-red-500 line-through">
                  {currencySymbol}
                  {formatPrice(regularPrice, targetCurrency)}
                </span>
              )}
              <span className="text-[12px] font-bold text-black">
                {isVariantOnlyPricing ? "Desde " : ""}
                {currencySymbol}
                {formatPrice(displayPrice, targetCurrency)}
              </span>
            </div>
          </div>

          <div className="hidden md:block space-y-1.5">
            <div className="flex justify-between items-start gap-2 min-h-[36px]">
              <h4 className="text-[13px] font-bold text-ink uppercase tracking-tight line-clamp-2 flex-1">
                {name}
              </h4>
              <div className="flex flex-col items-end leading-tight shrink-0">
                {hasActiveOffer && (
                  <span className="text-[10px] font-semibold text-red-500 line-through">
                    {currencySymbol}
                    {formatPrice(regularPrice, targetCurrency)}
                  </span>
                )}
                <span className="text-[14px] font-bold text-black">
                  {isVariantOnlyPricing ? "Desde " : ""}
                  {currencySymbol}
                  {formatPrice(displayPrice, targetCurrency)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-1 font-light italic">
              {description || short_description}
            </p>
          </div>
        </div>
      </Link>

      <QuickAddSheet
        product={product}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
