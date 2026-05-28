import webpush from "web-push";

// Inicializar web-push con las llaves VAPID si están disponibles
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:soporte@deploy-shop.com", // Reemplazar con el email real de tu plataforma si es necesario
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Envía una notificación Web Push a todas las suscripciones registradas para un tenant.
 * 
 * @param {object} supabase Cliente de Supabase Admin
 * @param {string|number} tenantId ID del tenant asociado
 * @param {object} payload Objeto con { title, body, url, ... }
 */
export async function sendPushNotification(supabase, tenantId, payload) {
  try {
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[Push Notifications] Error obteniendo suscripciones:", error);
      return { success: false, error };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[Push Notifications] No hay suscripciones activas para el tenant: ${tenantId}`);
      return { success: true, sentCount: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || "Nueva actualización",
      body: payload.body || "",
      url: payload.url || "/",
      icon: payload.icon || "/icons/icon-512x512.png",
      badge: payload.badge || "/icons/icon-512x512.png",
      data: payload.data || {}
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { endpoint: sub.endpoint, success: true };
      } catch (err) {
        console.error(`[Push Notifications] Error enviando a endpoint ${sub.endpoint}:`, err.message);
        
        // Si el endpoint ya no existe o caducó (410 Gone o 404), eliminamos la suscripción inválida
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push Notifications] Eliminando suscripción inactiva: ${sub.endpoint}`);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        
        return { endpoint: sub.endpoint, success: false, statusCode: err.statusCode };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Push Notifications] Enviadas con éxito: ${successCount}/${subscriptions.length} para tenant ${tenantId}`);
    return { success: true, sentCount: successCount };
  } catch (err) {
    console.error("[Push Notifications] Error global en sendPushNotification:", err);
    return { success: false, error: err.message };
  }
}
