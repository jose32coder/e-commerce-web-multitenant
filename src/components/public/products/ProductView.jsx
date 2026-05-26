"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore, useTenantCart } from "@/lib/useCartStore";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_SITE_NAME,
  normalizeCommerceSettings,
} from "@/lib/siteConfig";
import AdaptiveImage from "@/components/ui/AdaptiveImage";

import { convertPrice, formatPrice } from "@/services/exchangeRates";
import { createClient } from "@/lib/supabase/client";
import { shareProduct } from "@/lib/shareProduct";

export default function ProductView({ product }) {
  const { site_name, commerce_settings, tenant_slug, exchange_rates } =
    useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;
  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );
  const currencySymbol = commerce?.currency_symbol || "$";
  const targetCurrency = commerce?.currency_code || "USD";
  const productNotices = (commerce.product_notices || [])
    .filter(Boolean)
    .slice(0, 3);

  const {
    name,
    description,
    short_description,
    price,
    discount_price,
    images,
    product_variants,
    base_currency = "USD",
    use_variant_only_pricing,
    stock,
  } = product;

  const [currentStock, setCurrentStock] = useState(Number(stock) || 0);
  const [localVariants, setLocalVariants] = useState(product_variants || []);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [activeCheckouts, setActiveCheckouts] = useState(0);

  // --- REALTIME STOCK SUBSCRIPTION ---
  useEffect(() => {
    const supabase = createClient();

    // 1. Suscripción a stock global
    const stockChannel = supabase
      .channel(`stock-update-${product.id}`)
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

    // 2. Suscripción a variantes
    const variantsChannel = supabase
      .channel(`variants-update-${product.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_variants",
          filter: `product_id=eq.${product.id}`,
        },
        (payload) => {
          setLocalVariants((prev) =>
            prev.map((v) =>
              v.id === payload.new.id ? { ...v, ...payload.new } : v,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(stockChannel);
      supabase.removeChannel(variantsChannel);
    };
  }, [product.id]);

  // --- PRESENCE SUBSCRIPTION (FOMO) ---
  useEffect(() => {
    const supabase = createClient();
    const presenceChannel = supabase.channel(
      `presence:checkout:${commerce.tenant_id}`,
    );

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        let count = 0;

        // Contamos cuántas sesiones de checkout tienen este producto
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            if (p.items?.includes(product.id)) {
              count++;
            }
          });
        });

        setActiveCheckouts(count);
      })
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [product.id, commerce.tenant_id]);

  // --- Lógica de Variantes Reactiva ---
  const attributeGroups = {};
  (localVariants || []).forEach((v) => {
    if (!v.attributes) return;
    Object.entries(v.attributes).forEach(([key, val]) => {
      if (!attributeGroups[key]) attributeGroups[key] = new Set();
      attributeGroups[key].add(String(val));
    });
  });
  const attributeKeys = Object.keys(attributeGroups);
  const hasVariants = attributeKeys.length > 0;

  const selectedVariant = hasVariants
    ? (localVariants || []).find((v) => {
        if (!v.attributes) return false;
        return attributeKeys.every(
          (key) => String(v.attributes[key]) === String(selectedAttrs[key]),
        );
      }) || null
    : null;

  const getVariantStock = (variant) =>
    Number(variant?.stock_quantity ?? variant?.stock_adjustment ?? 0);

  const isOptionAvailable = (key, val) =>
    (localVariants || []).some((v) => {
      if (!v.attributes || String(v.attributes[key]) !== String(val))
        return false;
      if (getVariantStock(v) <= 0) return false;
      return attributeKeys
        .filter((k) => k !== key && selectedAttrs[k])
        .every((k) => String(v.attributes[k]) === String(selectedAttrs[k]));
    });

  // --- Estados de Stock Calculados ---
  const selectedVariantStock = selectedVariant
    ? getVariantStock(selectedVariant)
    : null;
  const selectedVariantOutOfStock =
    hasVariants && selectedVariant ? selectedVariantStock <= 0 : false;

  const isOutOfStock =
    selectedVariantStock !== null
      ? selectedVariantStock <= 0
      : currentStock <= 0;

  const isLowStock =
    selectedVariantStock !== null
      ? selectedVariantStock > 0 && selectedVariantStock < 5
      : currentStock > 0 && currentStock < 5;

  const canInquiry = Boolean(commerce.whatsapp_number);
  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto *${name}* pero veo que no hay stock disponible. ¿Tienen disponibilidad o saben cuándo les llega?`,
  );
  const whatsappUrl = `https://wa.me/${commerce.whatsapp_number}?text=${whatsappMessage}`;

  const inquiryMsg = encodeURIComponent(
    `Hola! 👋 Me interesa el producto *${name}* y me gustaría confirmar si tienen disponibilidad inmediata antes de realizar el pago.`,
  );
  const inquiryUrl = `https://wa.me/${commerce.whatsapp_number}?text=${inquiryMsg}`;

  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useTenantCart(tenant_slug);
  const router = useRouter();

  // ----------------------------------------------------------------
  // LÓGICA DE VARIANTES — nuevo esquema: attributes (jsonb)
  // Ej de variante: { id, attributes: { Color: "Verde", Talla: "S" },
  //                   price_override: 5, stock_quantity: 3, sku: "..." }
  // ----------------------------------------------------------------

  const handleSelectAttr = (key, val) => {
    setSelectedAttrs((prev) => ({ ...prev, [key]: val }));
  };

  const allAttrsSelected =
    !hasVariants || attributeKeys.every((k) => selectedAttrs[k]);

  // ----------------------------------------------------------------
  // PRECIOS
  // ----------------------------------------------------------------
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
  const hasActiveOffer = rawOfferPrice > 0 && rawOfferPrice < rawRegularPrice;
  const rawBasePrice = isVariantOnlyPricing
    ? 0
    : hasActiveOffer
      ? rawOfferPrice
      : rawRegularPrice;
  const rawPriceOverride = Number(
    selectedVariant?.price_override ?? selectedVariant?.price_adjustment ?? 0,
  );
  const rawDisplayedPrice = isVariantOnlyPricing
    ? selectedVariant
      ? rawPriceOverride
      : minVariantAbsolutePrice
    : rawBasePrice + rawPriceOverride;

  const finalPrice = convertPrice(
    rawDisplayedPrice,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const finalRegularPrice = convertPrice(
    rawRegularPrice + rawPriceOverride,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const displayOverride = convertPrice(
    rawPriceOverride,
    base_currency,
    targetCurrency,
    exchange_rates,
  );
  const displayFromPrice = convertPrice(
    minVariantAbsolutePrice,
    base_currency,
    targetCurrency,
    exchange_rates,
  );

  const productImages = Array.isArray(images) ? images : ["/placeholder.jpg"];

  // ----------------------------------------------------------------
  // CARRITO
  // ----------------------------------------------------------------
  const handleAddToCart = () => {
    if (hasVariants && !allAttrsSelected) {
      Swal.fire({
        title: "¡Atención!",
        text: "Selecciona todas las opciones para continuar.",
        icon: "warning",
        confirmButtonColor: "#1A1A1A",
        background: "#FBF9F6",
        color: "#1A1A1A",
      });
      return false;
    }
    if (selectedVariantOutOfStock) {
      Swal.fire({
        title: "Sin stock",
        text: "La variante seleccionada está agotada.",
        icon: "warning",
        confirmButtonColor: "#1A1A1A",
        background: "#FBF9F6",
        color: "#1A1A1A",
      });
      return false;
    }
    // Pasamos un label legible de la combinación (ej: "Verde / S")
    const variantLabel = hasVariants
      ? Object.values(selectedAttrs).join(" / ")
      : null;
    addItem(product, 1, variantLabel, selectedVariant);
    return true;
  };

  const handleBuyNow = () => {
    const added = handleAddToCart();
    if (added) router.push(`${baseUrl}/checkout`);
  };

  const handleShare = async () => {
    const result = await shareProduct({
      name,
      tenantSlug: tenant_slug,
      slug: product?.slug,
    });

    if (result.method === "clipboard") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Enlace copiado",
        showConfirmButton: false,
        timer: 1600,
        timerProgressBar: true,
      });
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* ---- GALERÍA ---- */}
        <div className="md:col-span-7 flex flex-col lg:flex-row gap-4 w-full">
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:w-20 order-1 lg:order-0">
            {productImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative shrink-0 w-16 h-20 md:w-20 md:h-24 lg:w-full cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300",
                  selectedImage === index
                    ? "border-black"
                    : "border-transparent",
                )}
              >
                <AdaptiveImage
                  src={img}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>

          <div className="relative flex-1 aspect-3/4 bg-secondary rounded-2xl overflow-hidden shadow-md order-2 lg:order-0">
            <AdaptiveImage
              src={productImages[selectedImage]}
              alt={name || `Producto de ${brand}`}
              fill
              priority
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          </div>
        </div>

        {/* ---- INFORMACIÓN ---- */}
        <div className="md:col-span-5 flex flex-col space-y-4">
          <section>
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="h-9 px-3 text-[11px] cursor-pointer hover:bg-zinc-900 hover:text-white font-bold uppercase tracking-wider"
              >
                <Share2 size={14} className="mr-2" />
                Compartir
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">
              {name}
            </h1>
            <div className="mt-2 flex items-end gap-3">
              {hasActiveOffer && !isVariantOnlyPricing && (
                <p className="text-sm font-semibold text-red-500 line-through">
                  {currencySymbol}
                  {formatPrice(finalRegularPrice, targetCurrency)}
                </p>
              )}
              <p className="text-3xl font-bold text-black">
                {isVariantOnlyPricing && !selectedVariant ? "Desde " : ""}
                {currencySymbol}
                {formatPrice(finalPrice, targetCurrency)}
              </p>
            </div>
            {rawPriceOverride > 0 && !isVariantOnlyPricing && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Esta combinación tiene un recargo de +{currencySymbol}
                {formatPrice(displayOverride, targetCurrency)}.
              </p>
            )}
            {isVariantOnlyPricing && !selectedVariant && (
              <p className="mt-1 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                Precio variable por presentación (desde {currencySymbol}
                {formatPrice(displayFromPrice, targetCurrency)})
              </p>
            )}
            {hasActiveOffer && !isVariantOnlyPricing && (
              <p className="mt-1 text-xs font-semibold text-red-500 uppercase tracking-wide">
                Oferta activa
              </p>
            )}

            {isLowStock && !isOutOfStock && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  ¡Últimas {currentStock} unidades disponibles!
                </span>
              </div>
            )}

            {activeCheckouts > 0 && !isOutOfStock && (
              <div className="mt-2 flex items-center gap-2 animate-pulse">
                <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                  🔥 {activeCheckouts}{" "}
                  {activeCheckouts === 1 ? "persona está" : "personas están"}{" "}
                  por comprar esto ahora mismo
                </span>
              </div>
            )}

            {isOutOfStock && (
              <div className="mt-4 bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Producto Agotado
                </span>
              </div>
            )}
          </section>

          {short_description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {short_description}
            </p>
          )}

          {/* ---- SELECTORES DE VARIANTES ---- */}
          {hasVariants ? (
            <div className="space-y-4">
              {attributeKeys.map((attrKey) => (
                <div key={attrKey} className="space-y-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-ink">
                    {attrKey}
                    {selectedAttrs[attrKey] && (
                      <span className="ml-2 font-normal normal-case text-muted-foreground">
                        — {selectedAttrs[attrKey]}
                      </span>
                    )}
                  </span>
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
                <p className="text-xs text-muted-foreground italic">
                  Selecciona todas las opciones para continuar.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-honey-dark italic">
              Producto sin variantes. Agrega al carrito o compra ahora para
              continuar.
            </p>
          )}

          {/* ---- BOTONES ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-4">
            {isOutOfStock ? (
              canInquiry ? (
                <Button
                  size="lg"
                  asChild
                  className="col-span-full h-14 font-bold cursor-pointer tracking-widest bg-[#25D366] hover:bg-[#128C7E] text-white transition-all duration-300"
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consultar disponibilidad
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="col-span-full h-14 font-bold tracking-widest bg-slate-200 text-slate-400"
                >
                  Agotado
                </Button>
              )
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={selectedVariantOutOfStock}
                  className="w-full h-14 font-bold cursor-pointer tracking-widest transition-all border-slate active:scale-95 hover:bg-black hover:text-white duration-300"
                >
                  Agregar al carrito
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBuyNow}
                  disabled={selectedVariantOutOfStock}
                  className="w-full h-14 font-bold cursor-pointer tracking-widest border border-black transition-all active:scale-95 hover:bg-black hover:text-white duration-300"
                >
                  Comprar ahora
                </Button>
              </>
            )}
          </div>

          {commerce.whatsapp_number && (
            <a
              href={inquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest group"
            >
              <MessageCircle
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              ¿Confirmar disponibilidad por WhatsApp?
            </a>
          )}

          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="w-full"
          >
            <AccordionItem value="item-1" className="border-b-gray-300">
              <AccordionTrigger className="uppercase text-sm font-semibold tracking-wider hover:no-underline">
                Descripción
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600 prose prose-sm max-w-none">
                {description ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  "No hay descripción disponible."
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {productNotices.map((notice, index) => (
            <p
              key={`${index}-${notice}`}
              className="text-xs text-muted-foreground italic"
            >
              {notice}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
