import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import { buildExportFile, safeNumber } from "@/lib/adminDataIO";

const getItemsQuantity = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (acc, item) => acc + safeNumber(item?.quantity, 0),
    0,
  );

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

    const [{ data: customers, error: customersError }, { data: orders, error: ordersError }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, full_name, id_number, phone, email")
          .eq("tenant_id", tenantId)
          .order("full_name", { ascending: true }),
        supabase
          .from("orders")
          .select("customer_id, customer_name, customer_id_number, total, estado, items")
          .eq("tenant_id", tenantId),
      ]);

    if (customersError) throw customersError;
    if (ordersError) throw ordersError;

    const rows = (customers || []).map((customer) => {
      const linkedOrders = (orders || []).filter(
        (order) =>
          order.customer_id === customer.id ||
          (order.customer_name || "").trim().toLowerCase() ===
            (customer.full_name || "").trim().toLowerCase(),
      );

      const paidOrders = linkedOrders.filter((order) => order.estado === "paid");

      return {
        id: customer.id,
        full_name: customer.full_name || "",
        id_number: customer.id_number || "",
        phone: customer.phone || "",
        email: customer.email || "",
        orders_count_paid: paidOrders.length,
        items_qty_paid: paidOrders.reduce(
          (sum, order) => sum + getItemsQuantity(order.items),
          0,
        ),
        total_spent_paid_usd: paidOrders.reduce(
          (sum, order) => sum + safeNumber(order.total, 0),
          0,
        ),
      };
    });

    const file = buildExportFile({
      rows,
      format,
      sheetName: "customers",
    });

    const dateCode = new Date().toISOString().slice(0, 10);
    return new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="customers_${dateCode}.${file.extension}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error exportando clientes." },
      { status: 500 },
    );
  }
}
