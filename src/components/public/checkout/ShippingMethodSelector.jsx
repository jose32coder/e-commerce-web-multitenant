"use client";

import React from "react";
import { Truck, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { convertPrice } from "@/services/exchangeRates";
import {
  DEFAULT_COMMERCE_SETTINGS,
  normalizeCommerceSettings,
} from "@/lib/siteConfig";

export function ShippingMethodSelector({ formData, setFormData, deliveryFee }) {
  const { commerce_settings, exchange_rates } = useSiteConfig();
  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );
  const deliveryEnabled = commerce.delivery_enabled !== false;
  const currencySymbol = commerce.currency_symbol || "$";
  const targetCurrency = commerce.currency_code || "USD";

  const deliveryFeeConverted = convertPrice(
    Number(deliveryFee) || 0,
    "USD",
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
    "USD",
    targetCurrency,
    exchange_rates,
  );

  const methods = [
    ...(localEnabled
      ? [
          {
            id: "local",
            label: "Delivery Local",
            description: `Entrega rápida en la zona por ${currencySymbol}${deliveryFeeConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
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
                  : `Envío por agencia (${currencySymbol}${nationalFeeConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })})`,
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
            description: "Pasa por nuestro local y ahorra el envío.",
            icon: <Store className="w-5 h-5" />,
            paymentType: "free",
          },
        ]
      : []),
  ];

  const gridClass =
    methods.length > 2
      ? "grid grid-cols-1 md:grid-cols-3 gap-4"
      : methods.length > 1
        ? "grid grid-cols-1 md:grid-cols-2 gap-4"
        : "grid grid-cols-1 gap-4";

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
              })
            }
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all text-center gap-3 ${
              formData.shippingMethod === method.id
                ? "border-ink bg-zinc-50 ring-4 ring-zinc-100"
                : "border-zinc-100 hover:border-zinc-200"
            }`}
          >
            <div
              className={`p-3 rounded-xl ${
                formData.shippingMethod === method.id
                  ? "bg-ink text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {method.icon}
            </div>
            <div>
              <p className="font-black text-[10px] uppercase tracking-widest text-ink mb-1">
                {method.label}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold leading-tight">
                {method.id === "local" && Number(deliveryFee) === 0
                  ? "Envío gratuito"
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
        </motion.div>
      )}
    </div>
  );
}
