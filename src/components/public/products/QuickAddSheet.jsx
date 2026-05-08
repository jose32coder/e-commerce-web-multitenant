"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/useCartStore";
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
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { getOptimizedImage } from "@/lib/getOptimizedImage";

export default function QuickAddSheet({ product, open, onClose }) {
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const { site_name, tenant_slug } = useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;

  if (!product) return null;

  const {
    name,
    price,
    discount_price,
    short_description,
    images,
    product_variants,
    slug,
  } = product;

  const normalizedVariants = useMemo(
    () =>
      (product_variants || []).map((variant) => ({
        ...variant,
        id: variant.id,
        name: variant.name || variant.attribute_name || "Variante",
        value: variant.value || variant.attribute_value || "",
        price_adjustment:
          Number(variant.price_adjustment ?? variant.price_override ?? 0) || 0,
        stock_adjustment:
          variant.stock_adjustment ?? variant.stock_quantity ?? null,
      })),
    [product_variants],
  );

  const selectedVariant = normalizedVariants.find(
    (variant) => String(variant.id) === String(selectedVariantId),
  );

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const regularPrice = Number(price) || 0;
  const offerPrice = Number(discount_price) || 0;
  const hasActiveOffer = offerPrice > 0 && offerPrice < regularPrice;
  const basePrice = hasActiveOffer ? offerPrice : regularPrice;
  const priceAdjustment = Number(selectedVariant?.price_adjustment) || 0;
  const finalPrice = basePrice + priceAdjustment;
  const finalRegularPrice = regularPrice + priceAdjustment;
  const imageUrl = images?.[0] || "/placeholder.jpg";
=======
=======
>>>>>>> Stashed changes
  const firstImage = images?.[0];
  const imageUrl =
    (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
    "/placeholder.jpg";
  const optimizedImageUrl = getOptimizedImage(imageUrl, 600);
<<<<<<< Updated upstream
>>>>>>> Stashed changes

  const hasVariants = normalizedVariants.length > 0;
  const hasMultipleVariantTypes =
    new Set(
      normalizedVariants
        .map((variant) => variant.name)
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase()),
    ).size > 1;

  const selectorLabel = hasMultipleVariantTypes
    ? "Seleccionar Variante"
    : `Seleccionar ${normalizedVariants[0]?.name || "Variante"}`;
=======
>>>>>>> Stashed changes

  useEffect(() => {
    if (!open) {
      setSelectedVariantId(null);
    }
  }, [open]);

  const ensureVariantBeforeContinue = () => {
    if (hasVariants && !selectedVariant) {
      Swal.fire({
        title: "¡Atención!",
        text: "Selecciona una variante para poder continuar.",
        icon: "warning",
        confirmButtonColor: "#1A1A1A",
        background: "#FBF9F6",
        color: "#1A1A1A",
      });
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!ensureVariantBeforeContinue()) return;

    addItem(product, 1, selectedVariant?.value || null, selectedVariant);
    onClose();
    setSelectedVariantId(null);
    Swal.fire({
      icon: "success",
      title: "¡Añadido!",
      text: `${name} al carrito`,
      toast: true,
      position: "top-end", // La ubica en la esquina superior derecha
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

    addItem(product, 1, selectedVariant?.value || null, selectedVariant);
    onClose();
    setSelectedVariantId(null);
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

<<<<<<< Updated upstream
        <div className="flex gap-5 mb-8">
          <div className="relative w-24 h-30 rounded-2xl overflow-hidden shrink-0 bg-secondary">
=======
        <div
          className={`flex flex-col sm:flex-row gap-5 sm:gap-5 items-stretch sm:items-start ${hasVariants ? "mb-8" : "mb-6"}`}
        >
          <div className="product-media-main bg-secondary w-full max-w-[200px] mx-auto sm:mx-0 sm:w-24 sm:max-w-none shrink-0">
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            <AdaptiveImage
              src={optimizedImageUrl}
              alt={`Imagen de ${name}`}
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
          </div>

          <div className="flex flex-col justify-center gap-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-honey-dark">
              {brand}
            </p>
            <h2 className="text-lg font-serif font-bold uppercase tracking-tight text-ink">
              {name || "Producto sin nombre"}
            </h2>

            <div className="flex items-end gap-2">
              {hasActiveOffer && (
                <p className="text-[11px] font-semibold text-red-500 line-through">
                  ${finalRegularPrice.toFixed(2)}
                </p>
              )}
              <p className="text-lg font-bold text-black">
                ${finalPrice.toFixed(2)}
              </p>
            </div>

            {priceAdjustment > 0 && (
              <p className="text-[10px] text-amber-700 font-semibold">
                +${priceAdjustment.toFixed(2)} por{" "}
                {selectedVariant?.name?.toLowerCase() || "atributo"}.
              </p>
            )}

            {hasActiveOffer && (
              <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">
                Oferta activa
              </p>
            )}

            {short_description && (
              <p className="text-[11px] text-gray-500 italic line-clamp-2">
                {short_description}
              </p>
            )}
          </div>
        </div>

        {hasVariants && (
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-honey-dark mb-3">
              {selectorLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {normalizedVariants.map((variant) => {
                const hasStockValue =
                  variant.stock_adjustment !== null &&
                  variant.stock_adjustment !== undefined;
                const stockValue = Number(variant.stock_adjustment) || 0;
                const isOutOfStock = hasStockValue && stockValue <= 0;

                return (
                  <Button
                    key={variant.id}
                    variant="ghost"
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={cn(
                      "min-w-14 h-11 cursor-pointer rounded-md uppercase transition-all duration-200 border disabled:cursor-not-allowed",
                      String(selectedVariantId) === String(variant.id)
                        ? "bg-ink text-paper border-ink shadow-md"
                        : "bg-transparent text-ink border-honey-light/50 hover:border-ink",
                      isOutOfStock && "opacity-35 line-through",
                    )}
                  >
                    {hasMultipleVariantTypes
                      ? `${variant.name}: ${variant.value}`
                      : variant.value}
                  </Button>
                );
              })}
            </div>
            {!selectedVariant && (
              <p className="mt-3 text-[10px] font-semibold text-amber-700">
                Debes seleccionar una variante antes de agregar al carrito.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleAddToCart}
              disabled={hasVariants && !selectedVariant}
              className="h-13 bg-ink cursor-pointer text-paper hover:bg-ink/90 font-bold uppercase text-[10px] tracking-[0.16em] shadow-lg"
            >
              <ShoppingBag size={16} className="mr-2" />
              Añadir
            </Button>

            <Button
              onClick={handleBuyNow}
              disabled={hasVariants && !selectedVariant}
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
