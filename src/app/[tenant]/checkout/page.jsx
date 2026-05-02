"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

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
import { convertPrice } from "@/services/exchangeRates";

export default function CheckoutPage() {
  const { tenant_slug, site_name, commerce_settings, tenant_id, exchange_rates } =
    useSiteConfig();
  const { items, getTotalPrice, clearCart } = useTenantCart(tenant_slug);
  const [mounted, setMounted] = useState(
    () => useCartStore.persist?.hasHydrated?.() ?? true,
  );
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
    paymentMethod: "",
    reference: "",
    notes: "",
  });

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

  const { trackings, startTracking } = useOrderTrackingStore();

  useEffect(() => {
    const currentTracking = trackings[tenant_slug];
    if (currentTracking?.orderId) {
      setOrderId(currentTracking.orderId);
      setIsWaiting(true);
    } else {
      setIsWaiting(false);
    }
    setIsPendingOrderRestored(true);
  }, [tenant_slug, trackings]);

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

  const subtotal = getTotalPrice();
  const deliveryFee = Number(commerce.delivery_fee || 0);
  const threshold = Number(commerce.free_shipping_threshold || 50);
  const isFreeShipping =
    deliveryEnabled &&
    formData.shippingMethod === "delivery" &&
    subtotal >= threshold &&
    threshold > 0;

  const appliedDelivery =
    !deliveryEnabled ||
    formData.shippingMethod === "pickup" ||
    isFreeShipping
      ? 0
      : deliveryFee;
  
  const total = subtotal + appliedDelivery;

  // Realizamos las conversiones de los totales
  const totalConverted = convertPrice(total, "USD", targetCurrency, exchange_rates);
  const deliveryFeeConverted = convertPrice(deliveryFee, "USD", targetCurrency, exchange_rates);

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
    const currentErrors = validateEntireForm(formData, idType);
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "¡Atención!",
        text: "Por favor corrige los campos marcados en rojo.",
        showConfirmButton: false,
        timer: 3000,
        background: "#FFF5F5",
        color: "#C53030",
      });
      return;
    }

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

        const fullIdNumber = `${idType}${formData.idNumber}`;
        const payload = {
          ...formData,
          idNumber: fullIdNumber,
          paymentMethod: selectedPaymentMethod,
          tenantId: tenant_id || null,
          tenantSlug: tenant_slug || null,
        };
        // Nota: Guardamos 'total' (en USD) en la base de datos para mantener consistencia financiera
        const response = await processCheckoutOrder(payload, items, total);

        if (!response.success) {
          Swal.fire({
            title: "Error al procesar",
            text:
              response.error ||
              "Ocurrió un problema guardando tu pedido. Por favor intenta de nuevo.",
            icon: "error",
            confirmButtonColor: "#1A1A1A",
            background: "#FBF9F6",
            color: "#1A1A1A",
          });
          return;
        }

        const orderDetails = items
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
          : (safeOrderId ? safeOrderId.slice(-6).toUpperCase() : "");

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
              : `${currencySymbol}${deliveryFeeConverted.toLocaleString(undefined, { minimumFractionDigits: 2 })} 🚚`;

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

💰 *TOTAL*: ${currencySymbol}${totalConverted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
🚚 *ENVÍO*: ${shippingMethodLabel}

📝 *NOTAS*: ${formData.notes || "Ninguna"}

📸 *Adjunto el comprobante de pago aquí abajo:*`;

        Swal.close();

        const whatsappHref = whatsappNumber
          ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
          : "";

        if (whatsappHref) window.open(whatsappHref, "_blank");

        if (response.success) {
          // Pasamos el total ya convertido para la UI de éxito
          setFinalTotal(totalConverted);
          setOrderId(safeOrderId);
          setOrderNumber(safeOrderNumber);
          setPurchasedItems([...items]);
          clearCart();
          setIsWaiting(true);
        }
      }
    });
  };

  return (
    <main className="min-h-screen p-4 md:p-10 bg-[#F8F9FA] print:bg-white print:p-0 print:min-h-0">
      <div className="max-w-6xl mx-auto print:max-w-none print:m-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
            <div className="flex flex-col lg:flex-row gap-12 items-start">
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
              <div className="w-full lg:w-[38%] lg:sticky lg:top-10">
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  total={total}
                  deliveryFee={deliveryFee}
                  threshold={threshold}
                  brandImageLabel={brandImageLabel}
                  onVerify={handleVerifyPayment}
                  shippingMethod={formData.shippingMethod}
                />
              </div>
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
        </motion.div>
      </div>
    </main>
  );
}
