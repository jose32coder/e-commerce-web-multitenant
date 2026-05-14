import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import { buildCategoryTree, normalizeParentIds } from "@/lib/categoryRelations";

// GET /api/categories
export async function GET(request) {
  const supabase = await createClient();

  // Capturamos store_type y tenant_id de la URL
  const searchParams = request.nextUrl.searchParams;
  const storeType = searchParams.get("store_type");
  const tenantFromQuery = searchParams.get("tenant_id");

  let query = supabase.from("categories").select("*");

  // LÓGICA DE FILTRADO
  const { tenantId, user, role } = await resolveTenantContext(supabase, {
    fallbackTenantId: tenantFromQuery,
  });

  let effectiveStoreType = storeType;

  // Si no pasaron store_type explícito, lo buscamos del tenant
  if (!effectiveStoreType && tenantId) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("store_type")
      .eq("tenant_id", tenantId);
    
    const tenantData = tenants?.[0];
    if (tenantData?.store_type) {
      effectiveStoreType = tenantData.store_type;
    }
  }

  if (tenantId) {
    if (effectiveStoreType) {
      // Retorna las globales del store_type + las personalizadas del tenant (mismo store_type).
      // Back-compat: incluye tenant categories con store_type NULL.
      query = query.or(
        `and(tenant_id.eq.${tenantId},store_type.eq.${effectiveStoreType}),and(tenant_id.eq.${tenantId},store_type.is.null),and(tenant_id.is.null,store_type.eq.${effectiveStoreType})`,
      );
    } else {
      // Solo las del tenant
      query = query.eq("tenant_id", tenantId);
    }
  } else if (effectiveStoreType) {
    // Si no hay tenant (ej. Super Admin preview), solo trae maestras de ese tipo
    query = query.is("tenant_id", null).eq("store_type", effectiveStoreType);
  } else {
    // Escenario de error o sin filtros - devolvemos vacío para no saturar
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: categories, error } = await query.order("name", {
    ascending: true,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  // Mantenemos tu lógica de árbol de categorías
  const links = (categories || [])
    .filter((c) => c.parent_id)
    .map((c) => ({
      parent_id: c.parent_id,
      subcategory_id: c.id,
    }));

  return NextResponse.json({
    success: true,
    data: buildCategoryTree(categories || [], links),
  });
}

// POST /api/categories
// POST /api/categories
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      parent_id,
      parent_ids,
      store_type: storeTypeFromPayload,
      tenant_id: payloadTenantId,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Nombre y slug son obligatorios" },
        { status: 400 },
      );
    }

    // --- LÓGICA DE RESOLUCIÓN DE SESIÓN MULTI-PORTAL ---

    // 1. Intentamos primero con el cliente de ADMIN (Tienda)
    let supabase = await createClient("sb-admin-auth");
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Si no hay usuario, intentamos con el de PLATAFORMA
    if (!user) {
      supabase = await createClient("sb-platform-auth");
      const {
        data: { user: platformUser },
      } = await supabase.auth.getUser();
      user = platformUser;
    }

    // 3. Resolvemos el contexto del tenant usando el cliente que sí tiene sesión
    const { tenantId, user: authUser } = await resolveTenantContext(supabase, {
      fallbackTenantId: payloadTenantId,
    });

    // 4. Validación final del Tenant
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo resolver el tenant de la categoría. Sesión no encontrada o tenant_id ausente.",
        },
        { status: 400 },
      );
    }

    // --- PROCESAMIENTO E INSERCIÓN ---

    const normalizedParentIds = normalizeParentIds(parent_ids ?? parent_id);
    const legacyParentId = normalizedParentIds[0] || null;

    let storeTypeToPersist = storeTypeFromPayload || null;
    if (!storeTypeToPersist) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("store_type")
        .eq("tenant_id", tenantId);
      
      const tenantData = tenants?.[0];
      storeTypeToPersist = tenantData?.store_type || null;
    }

    const { data: inserted, error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          slug,
          parent_id: legacyParentId,
          tenant_id: tenantId, // Usamos el ID validado por el contexto
          store_type: storeTypeToPersist,
        },
      ])
      .select();
    
    const data = inserted?.[0];

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("API Error in POST /api/categories:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error interno" },
      { status: 500 },
    );
  }
}
