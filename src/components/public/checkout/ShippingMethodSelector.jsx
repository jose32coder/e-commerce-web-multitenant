"use client";

import React from "react";
import { Truck, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { convertPrice, formatPrice } from "@/services/exchangeRates";
import {
  DEFAULT_COMMERCE_SETTINGS,
  normalizeCommerceSettings,
} from "@/lib/siteConfig";

export function ShippingMethodSelector({
  formData,
  setFormData,
  deliveryFee,
  subtotal = 0,
  threshold = 0,
  errors = {},
}) {
  const { commerce_settings, exchange_rates } = useSiteConfig();
  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );
  const deliveryEnabled = commerce.delivery_enabled !== false;
  const currencySymbol = commerce.currency_symbol || "$";
  const targetCurrency = commerce.currency_code || "USD";

  const shippingBaseCurrency = commerce?.currency_code || "USD";

  const deliveryFeeConverted = convertPrice(
    Number(deliveryFee) || 0,
    shippingBaseCurrency,
    targetCurrency,
    exchange_rates,
  );

  const localEnabled = commerce.shipping_local_enabled !== false;
  const nationalEnabled = commerce.shipping_national_enabled !== false;
  const pickupEnabled = commerce.shipping_pickup_enabled !== false;
  const nationalType = commerce.shipping_national_type || "cod";
  const nationalFee = Number(commerce.shipping_national_fee || 0);

  const nationalFeeConverted = convertPrice(
    nationalFee,
    shippingBaseCurrency,
    targetCurrency,
    exchange_rates,
  );

  const isFreeLocal = subtotal >= threshold && threshold > 0;

  const methods = [
    ...(localEnabled
      ? [
          {
            id: "local",
            label: "Delivery Local",
            description: isFreeLocal
              ? "¡Gratis por el monto de tu compra! ✨"
              : `Entrega rápida en la zona por ${currencySymbol}${formatPrice(deliveryFeeConverted, targetCurrency)}`,
            icon: <Truck className="w-5 h-5" />,
            paymentType: "paid",
          },
        ]
      : []),
    ...(nationalEnabled
      ? [
          {
            id: "national",
            label: "Envío Nacional",
            description:
              nationalType === "cod"
                ? "Enviamos por agencias (MRW, Zoom). Cobro en Destino."
                : nationalType === "free"
                  ? "Envío gratuito a nivel nacional."
                  : `Envío por agencia (${currencySymbol}${formatPrice(nationalFeeConverted, targetCurrency)})`,
            icon: <Truck className="w-5 h-5" />,
            paymentType: nationalType === "fixed" ? "paid" : nationalType,
          },
        ]
      : []),
    ...(pickupEnabled
      ? [
          {
            id: "pickup",
            label: "Retiro en Tienda",
            description: "Pasa por nuestro local y retira en tienda",
            icon: <Store className="w-5 h-5" />,
            paymentType: "free",
          },
        ]
      : []),
  ];

  const gridClass = `grid gap-2 sm:gap-4 ${
    methods.length === 3
      ? "grid-cols-3"
      : methods.length === 2
        ? "grid-cols-2"
        : "grid-cols-1"
  }`;

  const enabledProviders = (commerce.shipping_providers || []).filter(
    (p) => p.enabled,
  );

  return (
    <div className="space-y-6">
      <div className={gridClass}>
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                shippingMethod: method.id,
                shippingPaymentType: method.paymentType,
                ...(method.id !== "national"
                  ? {
                      shippingProvider: "",
                      shippingCity: "",
                      shippingBranchCode: "",
                    }
                  : {}),
              })
            }
            className={`flex flex-col items-center justify-start h-full p-2.5 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all text-center gap-2 sm:gap-3 ${
              formData.shippingMethod === method.id
                ? "border-ink bg-zinc-50 ring-2 sm:ring-4 ring-zinc-100"
                : "border-zinc-100 hover:border-zinc-200"
            }`}
          >
            <div
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${
                formData.shippingMethod === method.id
                  ? "bg-ink text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {React.cloneElement(method.icon, { 
                className: "w-4 h-4 sm:w-5 h-5" 
              })}
            </div>
            <div className="min-w-0 w-full flex flex-col gap-1">
              <p className="font-black text-[8px] sm:text-[10px] uppercase tracking-tight sm:tracking-widest text-ink leading-tight">
                {method.label}
              </p>
              <p className="text-[7px] sm:text-[9px] text-zinc-500 font-bold leading-[1.1] sm:leading-tight line-clamp-2 sm:line-clamp-none">
                {method.id === "local" && Number(deliveryFee) === 0
                  ? "Gratuito"
                  : method.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {formData.shippingMethod === "national" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-100 rounded-2xl p-6 space-y-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            ¿Por qué agencia deseas recibir? (Cobro Destino):
          </p>
          <div className="flex flex-wrap gap-3">
            {enabledProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    shippingProvider: provider.id,
                  })
                }
                className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.shippingProvider === provider.id
                    ? "border-ink bg-ink text-white"
                    : "border-zinc-100 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                {provider.name}
              </button>
            ))}
          </div>
          {formData.shippingProvider && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                  Ciudad del envío
                </span>
                <input
                  type="text"
                  value={formData.shippingCity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingCity: e.target.value,
                    })
                  }
                  placeholder="Ej: Caracas"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-white px-4 py-3 text-xs font-bold text-ink outline-none transition-all placeholder:text-zinc-300 focus:border-ink"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                  Código de sede
                </span>
                <input
                  type="text"
                  value={formData.shippingBranchCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingBranchCode: e.target.value,
                    })
                  }
                  placeholder="Ej: 010101"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-white px-4 py-3 text-xs font-bold text-ink outline-none transition-all placeholder:text-zinc-300 focus:border-ink"
                />
              </label>
            </div>
          )}
          {(errors.shippingCity || errors.shippingBranchCode) && (
            <p className="text-[10px] font-bold text-red-500">
              {errors.shippingCity || errors.shippingBranchCode}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
