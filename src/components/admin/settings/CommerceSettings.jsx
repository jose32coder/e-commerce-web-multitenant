"use client";

import {
  CalendarDays,
  Building2,
  Shield,
  Smartphone,
  Wallet,
} from "lucide-react";
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

const DEFAULT_BUSINESS_HOURS = [
  { day: "Lun", enabled: true, open: "09:00", close: "18:00" },
  { day: "Mar", enabled: true, open: "09:00", close: "18:00" },
  { day: "Mie", enabled: true, open: "09:00", close: "18:00" },
  { day: "Jue", enabled: true, open: "09:00", close: "18:00" },
  { day: "Vie", enabled: true, open: "09:00", close: "18:00" },
  { day: "Sab", enabled: true, open: "10:00", close: "14:00" },
  { day: "Dom", enabled: false, open: "09:00", close: "18:00" },
];

export default function CommerceSettings({ value, onChange }) {
  const currencyDefaults = {
    USD: "$",
    VES: "Bs ",
  };

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

  const businessHours = Array.isArray(value.business_hours)
    ? DEFAULT_BUSINESS_HOURS.map((defaultDay, index) => ({
        ...defaultDay,
        ...(value.business_hours[index] || {}),
      }))
    : DEFAULT_BUSINESS_HOURS;

  const updateBusinessHour = (index, field, nextValue) => {
    const nextHours = businessHours.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: nextValue } : item,
    );
    handleFieldChange("business_hours", nextHours);
  };

  const deliveryEnabled = value?.delivery_enabled !== false;

  return (
    <section className={sectionClassName}>
      <SettingsSectionHeader
        icon={<Wallet size={22} />}
        title="Comercio y Legal"
        description="Configura metodos de pago, datos de cobro y textos legales"
      />

      <div className="space-y-10">
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
          <div>
            <label className={labelClassName}>
              <CalendarDays size={10} /> Horario de laburo
            </label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Horario por dia en formato 24h. Se mostrara al cliente en la
              tienda.
            </p>
          </div>

          <div className="space-y-3">
            {businessHours.map((item, index) => (
              <div
                key={item.day}
                className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 p-3"
              >
                <div className="flex items-center justify-between lg:hidden mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.day}
                  </span>
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) =>
                      updateBusinessHour(index, "enabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-[2.5rem_1.5rem_1fr_1fr] lg:items-center">
                  <span className="hidden lg:block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.day}
                  </span>
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) =>
                      updateBusinessHour(index, "enabled", e.target.checked)
                    }
                    className="hidden lg:block h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  <input
                    type="time"
                    value={item.open || "09:00"}
                    onChange={(e) =>
                      updateBusinessHour(index, "open", e.target.value)
                    }
                    disabled={item.enabled === false}
                    className={`${inputClassName} h-10 px-3 disabled:opacity-40 text-xs lg:text-sm`}
                  />
                  <input
                    type="time"
                    value={item.close || "18:00"}
                    onChange={(e) =>
                      updateBusinessHour(index, "close", e.target.value)
                    }
                    disabled={item.enabled === false}
                    className={`${inputClassName} h-10 px-3 disabled:opacity-40 text-xs lg:text-sm`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
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

          {/* <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-tight">
              La consulta de disponibilidad por WhatsApp se muestra desde la
              vista del producto (antes del checkout).
            </p>
          </div> */}
        </div>

        <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-6">
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

            <div className="space-y-4 border-l border-zinc-200 dark:border-zinc-800 pl-6">
              <label className={labelClassName}>Moneda y Símbolo</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <select
                    value={value.currency_code || "USD"}
                    onChange={(e) => {
                      const nextCode = e.target.value;
                      onChange({
                        ...value,
                        currency_code: nextCode,
                        currency_symbol:
                          currencyDefaults[nextCode] ??
                          value.currency_symbol ??
                          "$",
                      });
                    }}
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
                    readOnly={!!currencyDefaults[value.currency_code]}
                    placeholder="$"
                    className={`${inputClassName} read-only:bg-slate-50 dark:read-only:bg-slate-800/50 read-only:text-slate-500 dark:read-only:text-slate-400 read-only:cursor-not-allowed read-only:border-slate-200 dark:read-only:border-slate-700/60 read-only:shadow-none`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Panel de Logística Avanzada */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-8">
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
                      Costo del Delivery ({value.currency_code || "USD"})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={value.delivery_fee ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handleFieldChange("delivery_fee", null);
                        } else {
                          const num = parseFloat(val);
                          if (num >= 0) handleFieldChange("delivery_fee", num);
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className={inputClassName}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Mínimo para Delivery Gratis (
                      {value.currency_code || "USD"})
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={value.free_shipping_threshold ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handleFieldChange("free_shipping_threshold", null);
                        } else {
                          const num = parseFloat(val);
                          if (num >= 0)
                            handleFieldChange("free_shipping_threshold", num);
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className={inputClassName}
                      placeholder="0.00"
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
                    Envíos por MRW, Zoom, etc.
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
                          Monto del Envío ({value.currency_code || "USD"})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={value.shipping_national_fee ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              handleFieldChange("shipping_national_fee", null);
                            } else {
                              const num = parseFloat(val);
                              if (num >= 0)
                                handleFieldChange("shipping_national_fee", num);
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className={inputClassName}
                          placeholder="0.00"
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
        <div className="space-y-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900">
          <label className={labelClassName}>Metodos de pago activos</label>
          <div className="flex flex-wrap gap-3">
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

        <div className="space-y-5">
          {PAYMENT_OPTIONS.map((method) => {
            if (!isMethodActive(method)) return null;

            const methodConfig = value.payment_method_configs?.[method] || {};
            const fields = PAYMENT_METHOD_SCHEMAS[method] || [];

            return (
              <div
                key={method}
                className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900 space-y-4"
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
        </div>

        {/* Formularios avanzados por método (PayPal/Zelle/Binance/etc.) */}
        {/* Se dejan comentados para activarlos en una actualización futura. */}
        {/*
        <div className="space-y-3">
          <label className={labelClassName}>Formularios por metodo</label>
          ...inputs avanzados por metodo...
        </div>
        */}

        <div className="space-y-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900">
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
          <div className="space-y-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900">
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
              className={`${inputClassName} h-32 py-4 resize-none`}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900">
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
              className={`${inputClassName} h-32 py-4 resize-none`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
