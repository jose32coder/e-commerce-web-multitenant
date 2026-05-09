import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("order_id") || "").trim();
    const tenantSlug = String(searchParams.get("tenant_slug") || "").trim();

    if (!orderId || !tenantSlug) {
      return NextResponse.json(
        { error: "Parámetros order_id y tenant_slug son requeridos." },
        { status: 400 },
      );
    }

    const supabase = getAdminSupabaseClient();

    let { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("slug", tenantSlug)
      .eq("status", "Active")
      .maybeSingle();

    if (tenantError || !tenant) {
      const fallback = await supabase
        .from("tenants")
        .select("tenant_id")
        .eq("slug", tenantSlug)
        .maybeSingle();
      tenant = fallback.data;
      tenantError = fallback.error;
    }

    if (tenantError || !tenant?.tenant_id) {
      return NextResponse.json(
        { error: "No se encontró tenant para ese slug." },
        { status: 404 },
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("estado, motivo_rechazo")
      .eq("id", orderId)
      .eq("tenant_id", tenant.tenant_id)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      return NextResponse.json(
        { error: "No se encontró orden para ese tenant." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        status: order.estado || "pending",
        rejectionReason: order.motivo_rechazo || "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No se pudo consultar el estado de la orden." },
      { status: 500 },
    );
  }
}

