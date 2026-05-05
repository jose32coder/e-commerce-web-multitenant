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

          <div className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                Consulta de Stock (WhatsApp)
              </p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-tight mt-1">
                Botón en checkout para verificar existencia antes de pagar.
              </p>
            </div>
            <label className="relative inline-flex h-6 w-11 shrink-0 items-center cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={!!value.whatsapp_stock_check}
                onChange={(e) =>
                  handleFieldChange("whatsapp_stock_check", e.target.checked)
                }
              />
              <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-green-500 dark:peer-checked:bg-green-600" />
              <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Gestión de Logística y Envío
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className={labelClassName}>
                Empresas de Envío Disponibles
              </label>
              <div className="space-y-2">
                {(
                  value.shipping_providers || [
                    { id: "mrw", name: "MRW", enabled: true },
                    { id: "zoom", name: "Zoom", enabled: true },
                  ]
                ).map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {provider.name}
                    </span>
                    <label className="relative inline-flex h-5 w-9 shrink-0 items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={provider.enabled}
                        onChange={(e) => {
                          const current = value.shipping_providers || [
                            { id: "mrw", name: "MRW", enabled: true },
                            { id: "zoom", name: "Zoom", enabled: true },
                          ];
                          const next = current.map((p) =>
                            p.id === provider.id
                              ? { ...p, enabled: e.target.checked }
                              : p,
                          );
                          handleFieldChange("shipping_providers", next);
                        }}
                      />
                      <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-blue-500" />
                      <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 italic">
                Activa las empresas con las que trabajas para que el cliente
                pueda elegir en el checkout.
              </p>
            </div>

            <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-6">
              <label className={labelClassName}>Moneda y Símbolo</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <select
                    value={value.currency_code || "USD"}
                    onChange={(e) =>
                      handleFieldChange("currency_code", e.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="VES">VES (Bolívares)</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={value.currency_symbol ?? "$"}
                    onChange={(e) =>
                      handleFieldChange("currency_symbol", e.target.value)
                    }
                    className={inputClassName}
                    placeholder="$"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Panel de Logística Avanzada */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-8">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Métodos de Entrega y Logística
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* 1. Delivery Local */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Delivery Local (Moto / Propio)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    Entregas cortas en tu zona con costo fijo.
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 shrink-0 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={!!value.shipping_local_enabled}
                    onChange={(e) =>
                      handleFieldChange(
                        "shipping_local_enabled",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-emerald-500" />
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {value.shipping_local_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className={labelClassName}>
                      Costo del Delivery ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={value.delivery_fee ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "delivery_fee",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={inputClassName}
                      placeholder="Ej: 3.00"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Mínimo para Delivery Gratis ($)
                    </label>
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
                      className={inputClassName}
                      placeholder="Ej: 50.00"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Envío Nacional */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Envíos Nacionales (Agencias)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    Envíos por MRW, Zoom, Tealca, etc.
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 shrink-0 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={!!value.shipping_national_enabled}
                    onChange={(e) =>
                      handleFieldChange(
                        "shipping_national_enabled",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-blue-500" />
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {value.shipping_national_enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClassName}>
                        Tipo de Cobro Nacional
                      </label>
                      <select
                        value={value.shipping_national_type || "cod"}
                        onChange={(e) =>
                          handleFieldChange(
                            "shipping_national_type",
                            e.target.value,
                          )
                        }
                        className={inputClassName}
                      >
                        <option value="cod">Cobro en Destino (C.O.D)</option>
                        <option value="fixed">Precio Fijo (Prepago)</option>
                        <option value="free">
                          Envío Gratis (Lo cubre la tienda)
                        </option>
                      </select>
                    </div>
                    {value.shipping_national_type === "fixed" && (
                      <div>
                        <label className={labelClassName}>
                          Monto del Envío ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value.shipping_national_fee ?? ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "shipping_national_fee",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={inputClassName}
                          placeholder="Ej: 7.00"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Retiro en Tienda */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Retiro en Tienda (Pickup)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    El cliente busca el pedido en tu local físico.
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 shrink-0 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={!!value.shipping_pickup_enabled}
                    onChange={(e) =>
                      handleFieldChange(
                        "shipping_pickup_enabled",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-orange-500" />
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            </div>
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
            onChange={(e) => handleFieldChange("privacy_title", e.target.value)}
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
            onChange={(e) => handleFieldChange("terms_content", e.target.value)}
            className={`${inputClassName} h-32 py-4 resize-none mt-3`}
          />
        </div>
      </div>
    </section>
  );
}
