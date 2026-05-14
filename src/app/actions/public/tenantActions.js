"use server";

import { createClient } from "@/lib/supabase/server";
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
