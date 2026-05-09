"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { z } from "zod";

// Esquema de validación para feedback inmediato
const CheckoutFormSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto").max(100),
  phone: z.string().min(10, "Teléfono inválido").max(15),
  idNumber: z.string().min(5, "Cédula/RIF inválido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
  reference: z.string().min(3, "La referencia es necesaria").max(50),
});

// Store e iconos
import { useCartStore, useTenantCart } from "@/lib/useCartStore";
import { useOrderTrackingStore } from "@/lib/useOrderTrackingStore";
import { Button } from "@/components/ui/button";

// Componentes Modulares
import { CustomerForm } from "@/components/public/checkout/CustomerForm";
import { PaymentFields } from "@/components/public/checkout/PaymentFields";
import { OrderSummary } from "@/components/public/checkout/OrderSummary";
import { SuccessInvoice } from "@/components/public/checkout/SuccessInvoice";
import { ValidationWaitScreen } from "@/components/public/checkout/ValidationWaitScreen";
import { ShippingMethodSelector } from "@/components/public/checkout/ShippingMethodSelector";
import { HeaderTitle } from "@/components/public/checkout/UIElements";
import { processCheckoutOrder } from "@/app/actions/public/checkoutActions";
import { validateEntireForm } from "@/lib/checkoutValidation";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_SITE_NAME,
  normalizeCommerceSettings,
  normalizeWhatsappNumber,
} from "@/lib/siteConfig";
import { convertPrice, formatPrice } from "@/services/exchangeRates";

export default function CheckoutPage() {
  const {
    tenant_slug,
    site_name,
    commerce_settings,
    tenant_id,
    exchange_rates,
  } = useSiteConfig();
  const { items, getTotalPrice, clearCart } = useTenantCart(tenant_slug);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingOrderRestored, setIsPendingOrderRestored] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [purchasedItems, setPurchasedItems] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    phone: "",
    email: "",
    shippingMethod: "delivery", // 'delivery' o 'pickup'
    shippingProvider: "", // Ej: 'mrw', 'zoom'
    shippingPaymentType: "cod", // 'paid' (pagado aquí) o 'cod' (cobro en destino)
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  // Llave única para evitar duplicados en reintentos
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    // Generamos la llave una sola vez al montar
    if (typeof window !== "undefined") {
      setIdempotencyKey(crypto.randomUUID());
    }
  }, []);

  const [idType, setIdType] = useState("V");
  const [errors, setErrors] = useState({});

  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || DEFAULT_SITE_NAME;
  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );
  const activePaymentMethods = (commerce.payment_methods || []).filter(Boolean);
  const whatsappNumber = normalizeWhatsappNumber(commerce.whatsapp_number);
  const brandImageLabel = brand.replace(/\s+/g, "+");
  const selectedPaymentMethod =
    formData.paymentMethod || activePaymentMethods[0] || "";

  useEffect(() => {
    if (!formData.paymentMethod && activePaymentMethods.length > 0) {
      setFormData((prev) => ({
        ...prev,
        paymentMethod: activePaymentMethods[0],
      }));
    }
  }, [activePaymentMethods, formData.paymentMethod]);

  const currencySymbol = commerce?.currency_symbol || "$";
  const targetCurrency = commerce?.currency_code || "USD";

  useEffect(() => {
    const unsubscribe = useCartStore.persist?.onFinishHydration?.(() =>
      setMounted(true),
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const { trackings, startTracking, stopTracking } = useOrderTrackingStore();

  useEffect(() => {
    const currentTracking = trackings[tenant_slug];
    const viewTracking = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view_tracking') === 'true' : false;

    if (currentTracking?.orderId) {
      if (!viewTracking) {
        Swal.fire({
          title: "Tienes una orden activa",
          text: "Para iniciar una nueva compra, debes finalizar el seguimiento de tu orden actual. ¿Qué deseas hacer?",
          icon: "info",
          showCancelButton: true,
          confirmButtonColor: "#1A1A1A",
          cancelButtonColor: "#ef4444",
          confirmButtonText: "Ver mi orden actual",
          cancelButtonText: "Nueva compra",
          background: "#FBF9F6",
          color: "#1A1A1A",
        }).then((result) => {
          if (result.isConfirmed) {
            setOrderId(currentTracking.orderId);
            if (currentTracking.status === "paid") {
              setIsSuccess(true);
              setIsWaiting(false);
            } else {
              setIsWaiting(true);
            }
          } else {
            stopTracking(tenant_slug);
            setIsWaiting(false);
          }
          setIsPendingOrderRestored(true);
        });
      } else {
        setOrderId(currentTracking.orderId);
        if (currentTracking.status === "paid") {
          setIsSuccess(true);
          setIsWaiting(false);
        } else {
          setIsWaiting(true);
        }
        setIsPendingOrderRestored(true);
      }
    } else {
      setIsWaiting(false);
      setIsPendingOrderRestored(true);
    }
  }, [tenant_slug, trackings, stopTracking]);

  const deliveryEnabled = commerce.delivery_enabled !== false;

  useEffect(() => {
    if (!deliveryEnabled) {
      setFormData((prev) =>
        prev.shippingMethod === "pickup"
          ? prev
          : { ...prev, shippingMethod: "pickup" },
      );
    }
  }, [deliveryEnabled]);

  useEffect(() => {
    if (!isPendingOrderRestored) return;

    if (items.length === 0 && !isSuccess && !isWaiting) {
      router.push(`${baseUrl}/products`);
    }
  }, [items, isSuccess, isWaiting, router, isPendingOrderRestored, baseUrl]);

  if (!mounted) return null;

  const subtotal = mounted ? getTotalPrice() : 0;
  const deliveryFee = Number(commerce.delivery_fee || 0);
  const nationalFee = Number(commerce.shipping_national_fee || 0);
  const threshold = Number(commerce.free_shipping_threshold || 50);
  
  const isFreeShipping = 
    deliveryEnabled && 
    formData.shippingMethod === "local" && 
    subtotal >= threshold && 
    threshold > 0;

  // Calculamos qué monto de envío aplicar
  let appliedDelivery = 0;
  
  if (formData.shippingMethod === "local" && !isFreeShipping) {
    appliedDelivery = deliveryFee;
  } else if (formData.shippingMethod === "national" && formData.shippingPaymentType === "paid") {
    appliedDelivery = nationalFee;
  }

  const total = subtotal + appliedDelivery;

  // Realizamos las conversiones de los totales
  const totalConverted = convertPrice(
    total,
    "USD",
    targetCurrency,
    exchange_rates,
  );
  const deliveryFeeConverted = convertPrice(
    deliveryFee,
    "USD",
    targetCurrency,
    exchange_rates,
  );

  const handleCustomerFound = (customer) => {
    setFormData((prev) => ({
      ...prev,
      name: customer.full_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
    }));

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `¡Bienvenido de nuevo, ${customer.full_name?.split(" ")[0]}!`,
      showConfirmButton: false,
      timer: 3000,
      background: "#FBF9F6",
      color: "#1A1A1A",
    });
  };

  const handleVerifyPayment = () => {
    // 1. Validación de cliente (Zod)
    const result = CheckoutFormSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "¡Atención!",
        text: "Por favor revisa los datos ingresados.",
        showConfirmButton: false,
        timer: 3000,
        background: "#FFF5F5",
        color: "#C53030",
      });
      return;
    }

    setErrors({});

    Swal.fire({
      title: "¿Confirmar Envío?",
      text: "Se guardará tu pedido y se abrirá WhatsApp para enviar tu comprobante de pago.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, procesar pedido",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1A1A1A",
      cancelButtonColor: "#A68D6B",
      background: "#FBF9F6",
      color: "#1A1A1A",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Procesando pedido...",
          text: "Estamos guardando tu información y reservando tu inventario.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          background: "#FBF9F6",
          color: "#1A1A1A",
        });

        try {
          const fullIdNumber = `${idType}${formData.idNumber}`;
          const currentItems = Array.isArray(items) ? items : [];
          const payload = {
            ...formData,
            idNumber: fullIdNumber,
            paymentMethod: selectedPaymentMethod,
            tenantId: tenant_id || null,
            tenantSlug: tenant_slug || null,
            idempotencyKey, // Enviamos la llave de seguridad
          };
          // Nota: Guardamos 'total' (en USD) en la base de datos para mantener consistencia financiera
          const response = await processCheckoutOrder(payload, currentItems, total);

          if (!response || !response.success) {
            Swal.fire({
              title: "Error al procesar",
              text:
                response?.error ||
                "Ocurrió un problema guardando tu pedido. Por favor intenta de nuevo.",
              icon: "error",
              confirmButtonColor: "#1A1A1A",
              background: "#FBF9F6",
              color: "#1A1A1A",
            });
            return;
          }

          const orderDetails = currentItems
            .map(
              (item) =>
                `- ${item.name} (Variante: ${item.variant || "Única"}) x${item.quantity}`,
            )
            .join("\n");

          const safeOrderId =
            response?.orderId !== undefined && response?.orderId !== null
              ? String(response.orderId)
              : "";
          const safeOrderNumber = response?.orderNumber || "";

          const displayOrderCode = safeOrderNumber
            ? String(safeOrderNumber).padStart(5, "0")
            : safeOrderId
              ? safeOrderId.slice(-6).toUpperCase()
              : "";

          const orderIdShort = displayOrderCode ? `(#${displayOrderCode})` : "";
          const orderCode = displayOrderCode;

          if (safeOrderId) {
            startTracking(tenant_slug, safeOrderId, orderCode);
          }

          const shippingMethodLabel =
            !deliveryEnabled || formData.shippingMethod === "pickup"
              ? "RETIRO EN TIENDA 🛍️"
              : isFreeShipping
                ? "GRATIS ✨"
                : `${currencySymbol}${formatPrice(deliveryFeeConverted, targetCurrency)} 🚚`;

          const message = `Hola ${brand}! 👋

He realizado un pago por ${selectedPaymentMethod}.

📌 *MÉTODO DE ENTREGA*: ${!deliveryEnabled || formData.shippingMethod === "pickup" ? "Retiro en Tienda" : "Delivery"}

📌 *DATOS DEL PAGO*
- Titular: ${formData.name}
- CI/RIF: ${fullIdNumber}
- Ref: ${formData.reference}
- Telf: ${formData.phone}

🛒 *PEDIDO ${orderIdShort}*
${orderDetails}

💰 *TOTAL*: ${currencySymbol}${formatPrice(totalConverted, targetCurrency)}
🚚 *ENVÍO*: ${shippingMethodLabel}${formData.shippingProvider ? ` (${formData.shippingProvider.toUpperCase()})` : ""}

📝 *NOTAS*: ${formData.notes || "Ninguna"}

📸 *Adjunto el comprobante de pago aquí abajo:*`;

          Swal.close();

          const whatsappHref = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
            : "";

          if (whatsappHref) window.open(whatsappHref, "_blank");

          // Pasamos el total ya convertido para la UI de éxito
          setFinalTotal(totalConverted);
          setOrderId(safeOrderId);
          setOrderNumber(safeOrderNumber);
          setPurchasedItems([...currentItems]);
          clearCart();
          setIsWaiting(true);
        } catch (err) {
          console.error("Error inesperado en checkout:", err);
          Swal.fire({
            title: "Error al procesar",
            text: err?.message || "Ocurrió un error inesperado. Por favor intenta de nuevo.",
            icon: "error",
            confirmButtonColor: "#1A1A1A",
            background: "#FBF9F6",
            color: "#1A1A1A",
          });
        }
      }
    });
  };

  const handleStockInquiry = () => {
    const orderDetails = items
      .map(
        (item) =>
          `- ${item.name} (Variante: ${item.variant || "Única"}) x${item.quantity}`,
      )
      .join("\n");

    const message = `Hola! 👋\n\nMe gustaría consultar la disponibilidad de los siguientes productos antes de realizar mi compra:\n\n${orderDetails}\n\n¿Tienen stock disponible para poder realizar mi compra?`;

    const whatsappHref = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      : "";

    if (whatsappHref) window.open(whatsappHref, "_blank");
  };

  return (
    <main className="min-h-screen p-4 md:p-10 bg-[#F8F9FA] print:bg-white print:p-0 print:min-h-0">
      <div className="max-w-6xl mx-auto print:max-w-none print:m-0">
        <div className="w-full">
          {isWaiting && !isSuccess ? (
            <ValidationWaitScreen
              orderId={orderId}
              whatsappNumber={whatsappNumber}
              onSuccess={() => {
                setIsWaiting(false);
                setIsSuccess(true);
              }}
            />
          ) : !isSuccess ? (
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Columna Izquierda: Formularios */}
              <div className="w-full lg:w-[62%] space-y-10">
                <HeaderTitle />

                <div className="space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      Método de Entrega
                    </h2>
                    <ShippingMethodSelector
                      formData={formData}
                      setFormData={setFormData}
                      deliveryFee={deliveryFee}
                    />
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      Información del Cliente
                    </h2>
                    <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-zinc-100">
                      <CustomerForm
                        formData={formData}
                        setFormData={setFormData}
                        onCustomerFound={handleCustomerFound}
                        errors={errors}
                        setErrors={setErrors}
                        idType={idType}
                        setIdType={setIdType}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      Detalles del Pago
                    </h2>
                    <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-zinc-100">
                      <PaymentFields
                        formData={formData}
                        setFormData={setFormData}
                        paymentMethods={activePaymentMethods}
                        selectedPaymentMethod={selectedPaymentMethod}
                        commerceSettings={commerce}
                        errors={errors}
                        setErrors={setErrors}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Resumen y Acción */}
              <aside className="w-full lg:w-[38%]">
                <div className="lg:sticky lg:top-24 space-y-6">
                  <OrderSummary
                    items={items}
                    subtotal={subtotal}
                    total={total}
                    deliveryFee={appliedDelivery}
                    threshold={threshold}
                    brandImageLabel={brandImageLabel}
                    onVerify={handleVerifyPayment}
                    shippingMethod={formData.shippingMethod}
                    shippingPaymentType={formData.shippingPaymentType}
                    showStockInquiry={!!commerce.whatsapp_stock_check}
                    onStockInquiry={handleStockInquiry}
                  />
                </div>
              </aside>
            </div>
          ) : (
            <SuccessInvoice
              formData={formData}
              finalTotal={finalTotal}
              purchasedItems={purchasedItems}
              orderId={orderId}
              orderNumber={orderNumber}
            />
          )}
        </div>
      </div>
    </main>
  );
}
