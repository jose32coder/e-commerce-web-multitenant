"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export async function getTenantConfig() {
  const supabase = await createClient();

  // 1. Obtener el ID del usuario de la sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No hay sesión activa" };

  // 2. Buscar el tenant_id en staff_profiles usando el ID del usuario
  const { data: profiles, error: profileError } = await supabase
    .from("staff_profiles")
    .select("tenant_id")
    .eq("id", user.id);

  const profile = profiles?.[0];

  if (profileError || !profile) {
    console.error("Error al buscar perfil staff:", profileError);
    return { success: false, error: "No se encontró perfil de administrador" };
  }

  // 3. Ahora sí, buscar los datos de ESE tenant específico
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("tenant_id, store_type")
    .eq("tenant_id", profile.tenant_id);
  
  const data = tenants?.[0] || null;

  if (error) return { success: false, error: error.message };

  return { success: true, data };
}

// CORRECCIÓN: Ahora recibe typeId Y tenantId
export async function updateTenantStoreType(typeId, tenantId) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  // Actualizamos el tenant_id que nos pasó el componente
    const { data: updatedTenants, error } = await supabase
    .from("tenants")
    .update({ store_type: typeId })
    .eq("tenant_id", tenantId)
    .select();
  
  const data = updatedTenants?.[0] || null;

  if (error) {
    console.error("Error en DB:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, data };
}

/**
 * Update a tenant (name, slug, plan, whatsapp) using the platform-admin session.
 * Slug is always regenerated from the name on the server to guarantee consistency.
 */
export async function updateTenantAction(tenantId, payload) {
  const supabase = await createClient("sb-platform-auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Build the update object
  const updateData = {};

  if (payload.name != null) {
    updateData.name = payload.name;
    // Always regenerate slug from name
    updateData.slug = slugify(payload.name);
  }

  // Allow explicit slug override
  if (payload.slug != null && payload.slug !== "") {
    updateData.slug = slugify(payload.slug);
  }

  if (payload.plan_type != null) updateData.plan_type = payload.plan_type;
  if (payload.whatsapp_number !== undefined)
    updateData.whatsapp_number = payload.whatsapp_number || null;

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "No hay datos para actualizar" };
  }

  const { data: updatedTenants, error } = await supabase
    .from("tenants")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .select();

  if (error) {
    console.error("[updateTenantAction] DB error:", error.message);
    return { success: false, error: error.message };
  }

  const data = updatedTenants?.[0] || null;

  if (!data) {
    return { success: false, error: "No se encontró el tenant o no se pudo actualizar" };
  }

  revalidatePath("/tenants");
  return { success: true, data };
}

/**
 * Update the store identity from the tenant admin.
 * Uses the admin client only after proving the signed-in user belongs to the tenant.
 */
export async function updateTenantIdentityAction(tenantId, payload) {
  const numericTenantId = Number(tenantId);
  const nextName = String(payload?.name || "").trim();
  const nextSlug = slugify(payload?.slug || nextName);

  if (!numericTenantId || !nextName || !nextSlug) {
    return {
      success: false,
      error: "Nombre e identificador de URL son obligatorios.",
    };
  }

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) return { success: false, error: "No autorizado" };

  const { data: profile, error: profileError } = await authSupabase
    .from("staff_profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const userTenantId =
    Number(profile?.tenant_id || user.user_metadata?.tenant_id || 0) || null;
  const isPlatformAdmin =
    user.user_metadata?.access_scope === "platform_admin" ||
    user.app_metadata?.access_scope === "platform_admin" ||
    user.user_metadata?.access_scope === "admin" ||
    user.app_metadata?.access_scope === "admin";

  if (profileError || (!isPlatformAdmin && userTenantId !== numericTenantId)) {
    return { success: false, error: "No tienes permiso para editar esta tienda." };
  }

  const adminSupabase = getAdminSupabaseClient();

  const { data: currentTenant, error: currentError } = await adminSupabase
    .from("tenants")
    .select("tenant_id, name, slug, name_change_history")
    .eq("tenant_id", numericTenantId)
    .maybeSingle();

  if (currentError) return { success: false, error: currentError.message };
  if (!currentTenant) {
    return { success: false, error: "No se encontró la tienda." };
  }

  const nameChanged = currentTenant.name !== nextName;
  const slugChanged = currentTenant.slug !== nextSlug;

  if (!nameChanged && !slugChanged) {
    return { success: true, data: currentTenant };
  }

  const history = Array.isArray(currentTenant.name_change_history)
    ? currentTenant.name_change_history
    : [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentChanges = history.filter((dateStr) => {
    const changeDate = new Date(dateStr);
    return Number.isFinite(changeDate.getTime()) && changeDate > thirtyDaysAgo;
  });

  if ((nameChanged || slugChanged) && recentChanges.length >= 3) {
    return {
      success: false,
      error: "Has alcanzado el límite de 3 cambios de identidad por mes.",
    };
  }

  const { data: existingSlug, error: slugError } = await adminSupabase
    .from("tenants")
    .select("tenant_id")
    .eq("slug", nextSlug)
    .neq("tenant_id", numericTenantId)
    .maybeSingle();

  if (slugError) return { success: false, error: slugError.message };
  if (existingSlug) {
    return {
      success: false,
      error: "Este identificador ya está siendo usado por otra tienda.",
    };
  }

  const changedAt = new Date().toISOString();
  const { data: updatedTenant, error: updateError } = await adminSupabase
    .from("tenants")
    .update({
      name: nextName,
      slug: nextSlug,
      slug_updated_at: changedAt,
      name_change_history: [...history, changedAt],
    })
    .eq("tenant_id", numericTenantId)
    .select("tenant_id, name, slug, name_change_history")
    .single();

  if (updateError) return { success: false, error: updateError.message };

  return { success: true, data: updatedTenant };
}

/**
 * Sync the public tenant logo used by the platform tenant selector.
 * The store itself reads the logo from site_settings.commerce_settings.logo_url,
 * while the root selector reads tenants.logo_url for fast public listing.
 */
export async function updateTenantLogoAction(tenantId, logoUrl) {
  const numericTenantId = Number(tenantId);

  if (!numericTenantId) {
    return { success: false, error: "tenant_id inválido." };
  }

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) return { success: false, error: "No autorizado" };

  const { data: profile, error: profileError } = await authSupabase
    .from("staff_profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const userTenantId =
    Number(profile?.tenant_id || user.user_metadata?.tenant_id || 0) || null;
  const isPlatformAdmin =
    user.user_metadata?.access_scope === "platform_admin" ||
    user.app_metadata?.access_scope === "platform_admin" ||
    user.user_metadata?.access_scope === "admin" ||
    user.app_metadata?.access_scope === "admin" ||
    user.user_metadata?.access_scope === "platform" ||
    user.app_metadata?.access_scope === "platform";

  if (profileError || (!isPlatformAdmin && userTenantId !== numericTenantId)) {
    return { success: false, error: "No tienes permiso para editar esta tienda." };
  }

  const adminSupabase = getAdminSupabaseClient();
  const safeLogoUrl = String(logoUrl || "").trim() || null;

  const { data, error } = await adminSupabase
    .from("tenants")
    .update({ logo_url: safeLogoUrl })
    .eq("tenant_id", numericTenantId)
    .select("tenant_id, logo_url")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/tenants");

  return { success: true, data };
}
