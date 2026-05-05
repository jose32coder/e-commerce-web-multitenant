import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import { buildExportFile, safeNumber } from "@/lib/adminDataIO";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const tenantFromQuery = request.nextUrl.searchParams.get("tenant_id");
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: tenantFromQuery,
    });

    if (!tenantId) {
      return Response.json(
        { success: false, error: "No se pudo resolver tenant_id." },
        { status: 400 },
      );
    }

    const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        estado,
        customer_id,
        customer_name,
        customer_id_number,
        customer_phone,
        metodo_pago,
        referencia_pago,
        shipping_method,
        shipping_provider,
        total,
        items
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data || []).map((order) => ({
      id: order.id,
      order_number: order.order_number || "",
      created_at: order.created_at || "",
      estado: order.estado || "",
      customer_id: order.customer_id || "",
      customer_name: order.customer_name || "",
      customer_id_number: order.customer_id_number || "",
      customer_phone: order.customer_phone || "",
      metodo_pago: order.metodo_pago || "",
      referencia_pago: order.referencia_pago || "",
      shipping_method: order.shipping_method || "",
      shipping_provider: order.shipping_provider || "",
      total_usd: safeNumber(order.total, 0),
      items_json: JSON.stringify(order.items || []),
    }));

    const file = buildExportFile({
      rows,
      format,
      sheetName: "orders",
    });

    const dateCode = new Date().toISOString().slice(0, 10);
    return new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="orders_${dateCode}.${file.extension}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error exportando ventas." },
      { status: 500 },
    );
  }
}
