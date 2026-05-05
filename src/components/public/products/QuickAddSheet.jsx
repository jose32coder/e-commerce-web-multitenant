"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenantCart } from "@/lib/useCartStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { DEFAULT_SITE_NAME } from "@/lib/siteConfig";
import { convertPrice } from "@/services/exchangeRates";
import AdaptiveImage from "@/components/ui/AdaptiveImage";

export default function QuickAddSheet({ product, open, onClose }) {
  const { site_name, tenant_slug, commerce_settings, exchange_rates } =
    useSiteConfig();
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const { addItem } = useTenantCart(tenant_slug);
  const router = useRouter();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;
  const currencySymbol = commerce_settings?.currency_symbol || "$";
  const targetCurrency = commerce_settings?.currency_code || "USD";

  if (!product) return null;

  const {
    name,
    price,
    discount_price,
    short_description,
    images,
    product_variants,
    slug,
    base_currency = "USD",
  } = product;

  const attributeGroups = useMemo(() => {
    const groups = {};
    (product_variants || []).forEach((v) => {
      if (!v.attributes) return;
      Object.entries(v.attributes).forEach(([key, val]) => {
        if (!groups[key]) groups[key] = new Set();
        groups[key].add(String(val));
      });
    });
    return groups;
  }, [product_variants]);

  const attributeKeys = Object.keys(attributeGroups);
  const hasVariants = attributeKeys.length > 0;

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      (product_variants || []).find((v) => {
        if (!v.attributes) return false;
        return attributeKeys.every(
          (key) => String(v.attributes[key]) === String(selectedAttrs[key]),
        );
      }) || null
    );
  }, [hasVariants, product_variants, attributeKeys, selectedAttrs]);

  const isOptionAvailable = (key, val) =>
    (product_variants || []).some((v) => {
      if (!v.attributes || String(v.attributes[key]) !== String(val))
        return false;
      return attributeKeys
        .filter((k) => k !== key && selectedAttrs[k])
        .every((k) => String(v.attributes[k]) === String(selectedAttrs[k]));
    });

  const handleSelectAttr = (key, val) => {
    setSelectedAttrs((prev) => ({ ...prev, [key]: val }));
  };

  const allAttrsSelected =
    !hasVariants || attributeKeys.every((k) => selectedAttrs[k]);

  const rawRegularPrice = Number(price) || 0;
  const rawOfferPrice = Number(discount_price) || 0;
  const hasActiveOffer = rawOfferPrice > 0 && rawOfferPrice < rawRegularPrice;
  const rawBasePrice = hasActiveOffer ? rawOfferPrice : rawRegularPrice;
  const rawPriceAdjustment = Number(
    selectedVariant?.price_override ?? selectedVariant?.price_adjustment ?? 0,
  );

  // Convertimos los precios
  const finalPrice = convertPrice(
    rawBasePrice + rawPriceAdjustment,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const finalRegularPrice = convertPrice(
    rawRegularPrice + rawPriceAdjustment,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const displayAdjustment = convertPrice(
    rawPriceAdjustment,
    base_currency,
    targetCurrency,
    exchange_rates,
  );

  const imageUrl = images?.[0] || "/placeholder.jpg";

  useEffect(() => {
    if (!open) {
      setSelectedAttrs({});
    }
  }, [open]);

  const ensureVariantBeforeContinue = () => {
    if (hasVariants && !allAttrsSelected) {
      Swal.fire({
        title: "¡Atención!",
        text: "Selecciona todas las opciones para poder continuar.",
        icon: "warning",
        confirmButtonColor: "#1A1A1A",
        background: "#FBF9F6",
        color: "#1A1A1A",
      });
      return false;
    }
    return true;
  };

  const processAdd = () => {
    const variantLabel = hasVariants
      ? Object.values(selectedAttrs).join(" / ")
      : null;
    addItem(product, 1, variantLabel, selectedVariant);
    onClose();
    setSelectedAttrs({});
  };

  const handleAddToCart = () => {
    if (!ensureVariantBeforeContinue()) return;
    processAdd();
    Swal.fire({
      icon: "success",
      title: "¡Añadido!",
      text: `${name} al carrito`,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: "#FBF9F6",
      color: "#1A1A1A",
      iconColor: "#10b981",
    });
  };

  const handleBuyNow = () => {
    if (!ensureVariantBeforeContinue()) return;
    processAdd();
    router.push(`${baseUrl}/checkout`);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-6 pb-10 pt-8 max-w-lg mx-auto sm:rounded-t-3xl border-none"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="sr-only">Añadir {name} al carrito</SheetTitle>
          <SheetDescription className="sr-only">
            Selecciona variante y añade el producto al carrito
          </SheetDescription>
        </SheetHeader>

        <div
          className={`flex flex-col sm:flex-row gap-5 sm:gap-5 items-stretch sm:items-start ${hasVariants ? "mb-8" : "mb-6"}`}
        >
          <div className="relative w-full max-w-[200px] aspect-square mx-auto sm:mx-0 sm:w-24 sm:max-w-none sm:aspect-auto sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-secondary">
            <AdaptiveImage
              src={imageUrl}
              alt={`Imagen de ${name}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 200px, 96px"
              priority
            />
          </div>

          <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-1 sm:justify-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-honey-dark">
              {brand}
            </p>
            <h2 className="text-lg font-serif font-bold uppercase tracking-tight text-ink wrap-break-word line-clamp-3 sm:line-clamp-2">
              {name || "Producto sin nombre"}
            </h2>

            {short_description && (
              <p className="text-[11px] text-gray-500 italic line-clamp-3 sm:line-clamp-2">
                {short_description}
              </p>
            )}

            <div className="flex flex-col items-baseline gap-x-3 gap-y-1">
              <div className="flex items-baseline gap-1">
                {hasActiveOffer && (
                  <p className="text-[11px] font-semibold text-red-500 line-through">
                    {currencySymbol}
                    {finalRegularPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                )}
                {hasActiveOffer && (
                  <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">
                    Oferta activa
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-black tabular-nums">
                {currencySymbol}
                {finalPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            {rawPriceAdjustment > 0 && (
              <p className="text-[10px] text-amber-700 font-semibold">
                +{currencySymbol}
                {displayAdjustment.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                de recargo por combinación.
              </p>
            )}
          </div>
        </div>

        {hasVariants && (
          <div className="mb-6 space-y-4">
            {attributeKeys.map((attrKey) => (
              <div key={attrKey} className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-honey-dark">
                  SELECCIONAR {attrKey.toUpperCase()}
                  {selectedAttrs[attrKey] && (
                    <span className="ml-1 text-ink normal-case font-semibold">
                      - {selectedAttrs[attrKey]}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...attributeGroups[attrKey]].map((val) => {
                    const available = isOptionAvailable(attrKey, val);
                    const isSelected = selectedAttrs[attrKey] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!available}
                        onClick={() => handleSelectAttr(attrKey, val)}
                        className={cn(
                          "min-w-14 h-11 px-3 rounded-md uppercase transition-all duration-200 border text-xs font-bold",
                          "cursor-pointer disabled:cursor-not-allowed select-none",
                          isSelected
                            ? "bg-black text-white border-black shadow-md"
                            : "bg-transparent text-black border-gray-200 hover:border-black",
                          !available && "opacity-25 line-through",
                        )}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!allAttrsSelected && (
              <p className="mt-2 text-[10px] font-semibold text-amber-700">
                Debes seleccionar una combinación antes de agregar al carrito.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleAddToCart}
              disabled={hasVariants && !allAttrsSelected}
              className="h-13 bg-ink cursor-pointer text-paper hover:bg-ink/90 font-bold uppercase text-[10px] tracking-[0.16em] shadow-lg"
            >
              <ShoppingBag size={16} className="mr-2" />
              Añadir
            </Button>

            <Button
              onClick={handleBuyNow}
              disabled={hasVariants && !allAttrsSelected}
              variant="outline"
              className="h-13 cursor-pointer border-ink text-ink hover:bg-ink hover:text-paper font-bold uppercase text-[10px] tracking-[0.16em]"
            >
              Comprar Ya
            </Button>
          </div>

          <Button
            asChild
            variant="ghost"
            className="w-full h-10 text-honey-dark hover:text-ink font-bold uppercase text-[9px] tracking-[0.2em]"
          >
            <Link
              href={`${baseUrl}/products/${slug}`}
              onClick={onClose}
              className="flex items-center gap-2"
            >
              Ver detalle completo
              <ArrowRight size={12} />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
