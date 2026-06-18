export function buildServiceWhatsappMessage(payload = {}) {
  const brand = payload.brand || "Tienda";
  const serviceName = payload.serviceName || "Servicio";
  const duration = payload.duration;
  const priceLabel = payload.priceLabel;
  const optionsLabel = payload.optionsLabel;

  let message = `Hola ${brand}! 👋\n\nMe interesa solicitar el siguiente servicio:\n\n📌 *SERVICIO*: ${serviceName}`;

  if (optionsLabel) {
    message += `\n✨ *OPCIÓN*: ${optionsLabel}`;
  }

  if (duration) {
    message += `\n⏱ *DURACIÓN*: ${duration}`;
  }

  if (priceLabel) {
    message += `\n💰 *PRECIO*: ${priceLabel}`;
  }

  message += `\n\n¿Tienen disponibilidad? ¡Gracias!`;

  return message;
}
