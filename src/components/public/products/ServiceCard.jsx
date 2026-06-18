"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Share2, Clock, MessageCircle } from "lucide-react";
import { getOptimizedImage } from "@/lib/getOptimizedImage";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { DEFAULT_SITE_NAME } from "@/lib/siteConfig";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { convertPrice, formatPrice } from "@/services/exchangeRates";
import { shareProduct } from "@/lib/shareProduct";
import Swal from "sweetalert2";

export default function ServiceCard({
  service,
  index = 0,
  activeCategoryId = "all",
  allCategories = [],
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
    service_duration,
    service_booking_mode,
  } = service;

  // Lógica para determinar qué etiquetas de categoría mostrar
  const getDisplayCategories = () => {
    if (activeCategoryId !== "all" && allCategories.length > 0) {
      const activeCat = allCategories.find((c) => c.id === activeCategoryId);
      if (activeCat) return [activeCat.name];
    }

    if (category_ids && category_ids.length > 0 && allCategories.length > 0) {
      const linkedNames = allCategories
        .filter((c) => category_ids.includes(c.id))
        .map((c) => c.name);

      if (linkedNames.length > 0) return linkedNames;
    }

    return category?.name ? [category.name] : [];
  };

  const displayCategories = getDisplayCategories();

  const rawRegularPrice = Number(price) || 0;
  const rawOfferPrice = Number(discount_price) || 0;

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

  const hasActiveOffer = offerPrice > 0 && offerPrice < regularPrice;
  const displayPrice = hasActiveOffer ? offerPrice : regularPrice;

  const rawImageUrl = images?.[0] || "/placeholder.jpg";
  const imageUrl = getOptimizedImage(rawImageUrl, 400);

  const isPriority = index < 4;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await shareProduct({
      name,
      tenantSlug: tenant_slug,
      slug,
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
    <div className="group block relative">
      <Link
        href={`${baseUrl}/products/${slug}`}
        className="block"
        prefetch={false}
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#F9F9F9] aspect-3/4">
          <div className="absolute top-3 left-3 right-14 z-10 flex flex-wrap gap-1 items-center">
            {displayCategories.length > 0 && (
              <span
                className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-[0.18em] md:tracking-widest text-ink shadow-sm inline-block max-w-27.5 md:max-w-42.5 truncate"
                title={displayCategories[0]}
              >
                {displayCategories[0]}
              </span>
            )}
            <span className="bg-violet-600/90 text-white backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm inline-block">
              Servicio
            </span>
          </div>

          <AdaptiveImage
            src={imageUrl}
            alt={name || `Servicio de ${brand}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={isPriority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            draggable={false}
          />

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <Button
            onClick={handleShare}
            size="icon"
            className="absolute top-3 right-3 z-20 h-7 w-7 cursor-pointer bg-white/95 text-ink hover:bg-white shadow-md transition-all duration-300 opacity-85 group-hover:opacity-100"
            aria-label={`Compartir ${name}`}
          >
            <Share2 size={12} />
          </Button>

          <Button
            size="icon"
            className="absolute bottom-3 right-3 z-20 bg-white text-violet-600 hover:bg-violet-600 hover:text-white shadow-lg transition-all duration-300 scale-90 group-hover:scale-100 opacity-90 group-hover:opacity-100 cursor-pointer"
            aria-label={`Reservar ${name}`}
          >
            {service_booking_mode === "whatsapp" ? (
              <MessageCircle size={18} />
            ) : (
              <Calendar size={18} />
            )}
          </Button>
        </div>

        <div className="mt-3 md:mt-4 space-y-1 px-0.5 md:px-1">
          <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.22em] md:tracking-[0.3em] text-violet-600 leading-none">
            <Clock size={10} />
            {service_duration || "Consultar duración"}
          </span>

          <div className="flex flex-col gap-2 md:hidden">
            <h4 className="text-[11px] font-bold text-ink uppercase tracking-tight line-clamp-2">
              {name}
            </h4>
            <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
              {hasActiveOffer && (
                <span className="text-[9px] font-semibold text-red-500 line-through">
                  {currencySymbol}
                  {formatPrice(regularPrice, targetCurrency)}
                </span>
              )}
              {displayPrice === 0 ? (
                <span className="text-[12px] font-bold text-black uppercase tracking-tighter">
                  Consultar precio
                </span>
              ) : (
                <span className="text-[12px] font-bold text-black">
                  {currencySymbol}
                  {formatPrice(displayPrice, targetCurrency)}
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:block space-y-1.5">
            <div className="flex justify-between items-start gap-2 min-h-9">
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
                {displayPrice === 0 ? (
                  <span className="text-[14px] font-bold text-black uppercase tracking-tighter">
                    Consultar precio
                  </span>
                ) : (
                  <span className="text-[14px] font-bold text-black">
                    {currencySymbol}
                    {formatPrice(displayPrice, targetCurrency)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-1 font-light italic">
              {description || short_description}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
