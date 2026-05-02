"use client";

import { Building2, Shield, Smartphone, Wallet } from "lucide-react";
import SettingsSectionHeader from "./SettingsSectionHeader";
import {
  inputClassName,
  labelClassName,
  sectionClassName,
} from "./siteSettingsStyles";
import {
  PAYMENT_METHOD_SCHEMAS,
  PAYMENT_OPTIONS,
} from "@/lib/paymentMethodSchemas";

export default function CommerceSettings({ value, onChange }) {
  const handleFieldChange = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  const isMethodActive = (method) =>
    Array.isArray(value.payment_methods) &&
    value.payment_methods.includes(method);

  const togglePaymentMethod = (method) => {
    const currentMethods = Array.isArray(value.payment_methods)
      ? [...value.payment_methods]
      : [];

    const nextMethods = currentMethods.includes(method)
      ? currentMethods.filter((item) => item !== method)
      : [...currentMethods, method];

    onChange({ ...value, payment_methods: nextMethods });
  };

  const updatePaymentMethodConfig = (method, field, nextValue) => {
    const currentConfigs = value.payment_method_configs || {};
    const methodConfig = currentConfigs[method] || {};

    onChange({
      ...value,
      payment_method_configs: {
        ...currentConfigs,
        [method]: {
          ...methodConfig,
          [field]: nextValue,
        },
      },
    });
  };

  const updateProductNotice = (index, nextValue) => {
    const currentNotices = Array.isArray(value.product_notices)
      ? [...value.product_notices]
      : [];
    currentNotices[index] = nextValue;
    handleFieldChange("product_notices", currentNotices);
  };

  const deliveryEnabled = value?.delivery_enabled !== false;

  return (
    <section className={sectionClassName}>
      <SettingsSectionHeader
        icon={<Wallet size={22} />}
        title="Comercio y Legal"
        description="Configura metodos de pago, datos de cobro y textos legales"
      />

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div>
            <label className={labelClassName}>
              <Smartphone size={10} /> WhatsApp ventas
            </label>
            <input
              type="text"
              value={value.whatsapp_number}
              onChange={(e) =>
                handleFieldChange("whatsapp_number", e.target.value)
              }
              className={inputClassName}
              placeholder="584245555555"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Moneda Principal</label>
              <select
                value={value.currency_code || "USD"}
                onChange={(e) => handleFieldChange("currency_code", e.target.value)}
                className={inputClassName}
              >
                <option value="USD">USD ($)</option>
                <option value="COP">COP (Pesos)</option>
                <option value="VES">VES (Bolívares)</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>Símbolo</label>
              <input
                type="text"
                value={value.currency_symbol ?? "$"}
                onChange={(e) => handleFieldChange("currency_symbol", e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    handleFieldChange("currency_symbol", "$");
                  }
                }}
                className={inputClassName}
                placeholder="$"
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Ofrecer envío a domicilio
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Si lo desactivas, el checkout solo mostrará retiro en tienda y no
                se cobrará envío.
              </p>
            </div>
            <label className="inline-flex items-center gap-3 cursor-pointer shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {deliveryEnabled ? "Activo" : "Solo retiro"}
              </span>
              <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
                <input
                  type="checkbox"
                  role="switch"
                  className="peer sr-only"
                  checked={deliveryEnabled}
                  onChange={(e) =>
                    handleFieldChange("delivery_enabled", e.target.checked)
                  }
                  aria-checked={deliveryEnabled}
                />
                <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600" />
                <span className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-6" />
              </span>
            </label>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${deliveryEnabled ? "" : "opacity-55"}`}
          >
            <div>
              <label className={labelClassName}>Costo de envío estándar ($)</label>
              <input
                type="number"
                step="0.01"
                value={value.delivery_fee ?? ""}
                onChange={(e) =>
                  handleFieldChange("delivery_fee", parseFloat(e.target.value) || 0)
                }
                disabled={!deliveryEnabled}
                className={inputClassName}
                placeholder="Ej: 5.00"
              />
              <p className="text-[10px] mt-1 text-slate-400 italic">
                Este monto se sumará al total si no se alcanza el envío gratuito.
              </p>
            </div>
            <div>
              <label className={labelClassName}>Monto mínimo para envío gratis ($)</label>
              <input
                type="number"
                step="1"
                value={value.free_shipping_threshold ?? ""}
                onChange={(e) =>
                  handleFieldChange(
                    "free_shipping_threshold",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={!deliveryEnabled}
                className={inputClassName}
                placeholder="Ej: 50.00"
              />
              <p className="text-[10px] mt-1 text-slate-400 italic">
                Dejar en 0 si quieres que siempre se cobre el envío.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className={labelClassName}>Metodos de pago activos</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((method) => {
              const active = isMethodActive(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-4 h-10 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        {PAYMENT_OPTIONS.map((method) => {
          if (!isMethodActive(method)) return null;

          const methodConfig = value.payment_method_configs?.[method] || {};
          const fields = PAYMENT_METHOD_SCHEMAS[method] || [];

          return (
            <div
              key={method}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 space-y-3"
            >
              <p className="text-xs font-black uppercase tracking-widest">
                {method}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.field}>
                    <label className={labelClassName}>{field.label}</label>
                    <input
                      type={field.type || "text"}
                      value={methodConfig[field.field] || ""}
                      onChange={(e) =>
                        updatePaymentMethodConfig(
                          method,
                          field.field,
                          e.target.value,
                        )
                      }
                      className={inputClassName}
                      placeholder={field.placeholder}
                    />
                    {field.hint ? (
                      <p className="text-[10px] mt-1 text-slate-400">
                        {field.hint}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Formularios avanzados por método (PayPal/Zelle/Binance/etc.) */}
        {/* Se dejan comentados para activarlos en una actualización futura. */}
        {/*
        <div className="space-y-3">
          <label className={labelClassName}>Formularios por metodo</label>
          ...inputs avanzados por metodo...
        </div>
        */}

        <div className="space-y-3">
          <label className={labelClassName}>
            Avisos en detalle de producto (max. 3)
          </label>
          <div className="grid grid-cols-1 gap-3">
            {[0, 1, 2].map((idx) => (
              <textarea
                key={idx}
                value={(value.product_notices || [])[idx] || ""}
                onChange={(e) => updateProductNotice(idx, e.target.value)}
                className={`${inputClassName} h-20 py-3 resize-none`}
                placeholder={`Aviso ${idx + 1} (envios, delivery, cambios, etc.)`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <label className={labelClassName}>
              <Shield size={10} /> Titulo Privacidad
            </label>
            <input
              type="text"
              value={value.privacy_title}
              onChange={(e) =>
                handleFieldChange("privacy_title", e.target.value)
              }
              className={inputClassName}
            />
            <textarea
              value={value.privacy_content}
              onChange={(e) =>
                handleFieldChange("privacy_content", e.target.value)
              }
              className={`${inputClassName} h-32 py-4 resize-none mt-3`}
            />
          </div>

          <div>
            <label className={labelClassName}>
              <Shield size={10} /> Titulo Terminos
            </label>
            <input
              type="text"
              value={value.terms_title}
              onChange={(e) => handleFieldChange("terms_title", e.target.value)}
              className={inputClassName}
            />
            <textarea
              value={value.terms_content}
              onChange={(e) =>
                handleFieldChange("terms_content", e.target.value)
              }
              className={`${inputClassName} h-32 py-4 resize-none mt-3`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
