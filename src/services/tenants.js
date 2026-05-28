import { createPlatformClient } from "@/lib/supabase/client";

export const PLAN_LIMITS = {
  Bronze: 1,
  Silver: 3,
  Gold: 10,
};

export const normalizePlanType = (value) => {
  const plan = String(value || "").trim();
  if (plan === "Silver" || plan === "Gold") return plan;
  return "Bronze";
};

export const getUserLimitForPlan = (planType) =>
  PLAN_LIMITS[normalizePlanType(planType)] ?? PLAN_LIMITS.Bronze;

export async function getTenants() {
  const supabase = createPlatformClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error.message);
    return [];
  }
  return data;
}

export async function getPendingInvitationsByTenantIds(tenantIds) {
  const ids = Array.isArray(tenantIds) ? tenantIds.filter(Boolean) : [];
  if (ids.length === 0) return new Map();

  const supabase = createPlatformClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, tenant_id, used, created_at")
    .in("tenant_id", ids)
    .eq("used", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error.message);
    return new Map();
  }

  const map = new Map();
  for (const row of data || []) {
    if (!map.has(row.tenant_id)) {
      map.set(row.tenant_id, row);
    }
  }
  return map;
}

export async function getPendingInvitationByTenantId(tenantId) {
  if (!tenantId) return null;
  const supabase = createPlatformClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, tenant_id, used, created_at")
    .eq("tenant_id", tenantId)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching invitation:", error.message);
    return null;
  }

  return data || null;
}

export async function createInvitationForTenant(tenantId) {
  if (!tenantId) throw new Error("tenantId is required to create invitation");
  const supabase = createPlatformClient();

  const { data, error } = await supabase
    .from("invitations")
    .insert([{ tenant_id: tenantId }])
    .select("id, tenant_id, used, created_at")
    .single();

  if (error) {
    console.error("Error creating invitation:", error.message);
    throw error;
  }

  return data;
}

export async function revokeInvitation(invitationId) {
  if (!invitationId) throw new Error("invitationId is required");
  const supabase = createPlatformClient();

  // Prefer hard delete for dev/staging. If RLS blocks, caller will handle error.
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("used", false);

  if (error) {
    console.error("Error revoking invitation:", error.message);
    throw error;
  }

  return true;
}

export async function createTenant(tenantData) {
  const supabase = createPlatformClient();

  // 1. Mapeamos los datos para que coincidan con las columnas de tu SQL
  const planType = normalizePlanType(tenantData.plan);
  const maxUsers = getUserLimitForPlan(planType);

  const payload = {
    name: tenantData.name,
    slug: tenantData.slug,
    plan_type: planType,
    max_users: maxUsers,
    user_limit: maxUsers,
    whatsapp_number: tenantData.whatsapp_number || null,
    status: "Active",
  };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert([payload])
    .select()
    .single();

  if (tenantError) {
    console.error("Error en Supabase al crear tenant:", tenantError.message);
    throw tenantError;
  }

  // 2. Opcional: crear settings base para el tenant nuevo
  await supabase
    .from("site_settings")
    .insert([{ tenant_id: tenant.tenant_id }]);

  // 3. Usamos 'tenant_id' porque así se llama tu llave primaria en la tabla
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .insert([{ tenant_id: tenant.tenant_id }])
    .select()
    .single();

  if (invitationError) {
    console.error("Error al crear invitación:", invitationError.message);
    throw invitationError;
  }

  return { tenant, invitation };
}

export async function updateTenant(tenantId, payload) {
  const supabase = createPlatformClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(payload)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvitation(tokenId) {
  const supabase = createPlatformClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*, tenants(*)")
    .eq("id", tokenId)
    .eq("used", false)
    .maybeSingle(); // Usar maybeSingle es más seguro para evitar errores 406

  if (error) {
    console.error("Error buscando invitación:", error.message);
    return null;
  }
  return data;
}
