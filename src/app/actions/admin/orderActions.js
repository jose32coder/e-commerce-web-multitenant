"use server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

/**
 * Actualiza el estado de una orden y restaura el stock si se cancela.
 */
export async function updateOrderStatusAction({ orderId, newStatus, tenantId, reason, userId, userEmail }) {
  try {
    const supabase = getAdminSupabaseClient();

    // 1. Obtener la orden actual para saber su estado previo e items
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !order) {
      throw new Error("No se pudo encontrar la orden para actualizar.");
    }

    const previousStatus = order.estado;

    // 2. Si el estado cambia a 'cancelled' y antes NO estaba cancelado, restauramos stock
    if (newStatus === "cancelled" && previousStatus !== "cancelled") {
      const items = order.items || [];
      
      for (const item of items) {
        if (!item.id) continue;
        const qty = Number(item.quantity) || 0;

        // Verificar si el producto o variante es ilimitado antes de restaurar
        // (Aunque si es ilimitado no se descontó, así que restaurar no haría daño pero es mejor ser precisos)
        
        // Restaurar en stock_movements (esto dispara el trigger que suma al product_stock)
        const { error: moveError } = await supabase
          .from("stock_movements")
          .insert({
            tenant_id: tenantId,
            product_id: item.id,
            movement_type: "refund", // Usamos refund para sumar
            quantity: qty,
            reason: `Orden #${orderId} cancelada`,
            reference_type: "order_cancellation",
            reference_id: String(orderId)
          });

        if (moveError) console.error("Error restaurando stock global:", moveError);

        // Si tiene variante, también hay que sumarle a la variante directamente
        // (El trigger de stock_movements actualiza product_stock pero no product_variants)
        if (item.variant) {
            // Buscamos la variante por nombre/atributos (o si tuviéramos el variant_id en el JSONB sería mejor)
            // Por ahora, busquemos por el string de la variante
            const { data: variants } = await supabase
                .from("product_variants")
                .select("id, stock_quantity, attributes")
                .eq("product_id", item.id)
                .eq("tenant_id", tenantId);

            const matched = variants?.find(v => {
                const val = Object.values(v.attributes || {}).join(" / ").toLowerCase();
                return val === String(item.variant).toLowerCase();
            });

            if (matched && Number(matched.stock_quantity) < 999999) {
                await supabase
                    .from("product_variants")
                    .update({ stock_quantity: Number(matched.stock_quantity) + qty })
                    .eq("id", matched.id);
            }
        }
      }
    }

    // 3. Actualizar el estado de la orden
    const updateData = { estado: newStatus };
    if (reason) updateData.motivo_rechazo = reason;

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .eq("tenant_id", tenantId);

    if (updateError) throw updateError;

    // 4. Log de auditoría
    const actionLabel = newStatus === "paid" ? "aceptar" : newStatus === "cancelled" ? "rechazar" : "actualizar";
    await logAudit(supabase, {
      tipo: "orden",
      accion: actionLabel,
      descripcion: `Orden #${orderId} marcada como "${newStatus}"${reason ? ` — Motivo: ${reason}` : ""}`,
      usuario_id: userId,
      usuario_nombre: userEmail || "Admin",
      meta: {
        order_id: orderId,
        nuevo_estado: newStatus,
        anterior_estado: previousStatus,
        motivo: reason || null
      }
    });

    // 5. Disparar Web Push de actualización al cliente
    try {
      const { sendPushNotification } = await import("@/services/pushNotificationService");
      const orderCode = order.order_number ? String(order.order_number).padStart(5, "0") : String(orderId).slice(-6).toUpperCase();
      
      let title = `📦 Estado de tu orden #${orderCode}`;
      let body = `El estado de tu pedido ha cambiado a: ${newStatus}`;
      
      if (newStatus === "paid") {
        title = `✅ ¡Pago Aprobado! (#${orderCode})`;
        body = `Tu pago ha sido validado correctamente. Estamos preparando tu envío.`;
      } else if (newStatus === "cancelled") {
        title = `⚠️ Pago Rechazado (#${orderCode})`;
        body = reason ? `Detalle: ${reason}` : `Hubo un inconveniente validando tu pago.`;
      }

      // Enviamos el push usando el tenantId (el cliente estará suscrito a este scope)
      await sendPushNotification(supabase, tenantId, {
        title,
        body,
        url: `/${order.tenant_slug || tenantId}/checkout?orderId=${orderId}`, // Redirigir al tracking de su orden
        data: { orderId }
      });
    } catch (pushErr) {
      console.error("[Push Update] Error enviando push:", pushErr);
    }

    return { success: true };
  } catch (error) {
    console.error("Error en updateOrderStatusAction:", error);
    return { success: false, error: error.message };
  }
}
