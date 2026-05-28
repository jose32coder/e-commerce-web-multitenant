import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const { subscription, tenantId } = await req.json();

    if (!subscription || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Suscripción y tenantId son requeridos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = getAdminSupabaseClient();

    // Guardamos la suscripción en una tabla de push_subscriptions.
    // Usamos upsert para evitar duplicar suscripciones con el mismo endpoint.
    const { error } = await supabase.from("push_subscriptions").upsert({
      endpoint: subscription.endpoint,
      auth_key: subscription.keys?.auth || "",
      p256dh_key: subscription.keys?.p256dh || "",
      tenant_id: tenantId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "endpoint"
    });

    if (error) {
      console.error("[Push Service] Error guardando suscripción:", error);
      return new Response(
        JSON.stringify({ error: "Error al guardar en base de datos." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Push Service] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
