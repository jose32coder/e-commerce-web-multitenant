"use server";
import { revalidateTag } from "next/cache";

/**
 * Acción para revalidar la caché del servidor desde el cliente.
 * Se usa cuando se actualizan ajustes del sitio o datos del tenant.
 */
export async function revalidateSiteConfig(tenantId, tenantSlug) {
  try {
    if (tenantId) {
      revalidateTag(`site-settings-${tenantId}`);
      revalidateTag("site-settings");
    }
    if (tenantSlug) {
      revalidateTag(`tenant-slug-${tenantSlug}`);
      revalidateTag("tenants");
    }
    return { success: true };
  } catch (error) {
    console.error("Error revalidating tags:", error);
    return { success: false, error: error.message };
  }
}
