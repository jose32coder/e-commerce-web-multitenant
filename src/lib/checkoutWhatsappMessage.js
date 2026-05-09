export function buildCheckoutWhatsappMessage(payload = {}) {
  const brand = payload.brand || "Tienda";
  const paymentMethod = payload.paymentMethod || "Pago Movil";
  const deliveryMethod = payload.deliveryMethod || "Delivery";
  const customerName = payload.customerName || "Cliente";
  const idNumber = payload.idNumber || "N/A";
  const reference = payload.reference || "N/A";
  const customerPhone = payload.customerPhone || "N/A";
  const orderCode = payload.orderCode ? `(#${payload.orderCode})` : "";
  const orderDetails = payload.orderDetails || "- Sin detalles";
  const totalLabel = payload.totalLabel || "$0.00";
  const shippingLabel = payload.shippingLabel || "N/A";
  const notes = payload.notes || "Ninguna";

  return `Hola ${brand}! 👋

He realizado un pago por ${paymentMethod}.

📌 *MÉTODO DE ENTREGA*: ${deliveryMethod}

📌 *DATOS DEL PAGO*
- Titular: ${customerName}
- CI/RIF: ${idNumber}
- Ref: ${reference}
- Telf: ${customerPhone}

🛒 *PEDIDO ${orderCode}*
${orderDetails}

💰 *TOTAL*: ${totalLabel}
🚚 *ENVÍO*: ${shippingLabel}

📝 *NOTAS*: ${notes}

📸 *Adjunto el comprobante de pago aquí abajo:*`;
}

