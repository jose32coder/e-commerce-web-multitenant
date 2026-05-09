import React from "react";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "@/components/admin/layout/AdminLayoutClient";
import { getSiteConfigServerCached } from "@/lib/siteConfig.server";
import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";

export async function generateMetadata() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId =
    user?.user_metadata?.tenant_id || user?.app_metadata?.tenant_id;

  if (!user) {
    return {
      title: {
        default: `${PLATFORM_BRAND_NAME} | Admin`,
        template: `%s | ${PLATFORM_BRAND_NAME}`,
      },
    };
  }

  const siteConfig = await getSiteConfigServerCached({ tenantId });
  const resolvedBrand = siteConfig?.site_name || PLATFORM_BRAND_NAME;

  return {
    title: {
      default: `${resolvedBrand} | Admin`,
      template: `%s | ${resolvedBrand}`,
    },
  };
}

export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  // 1. Verificar usuario de forma segura contra el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile = null;
  let userRole = "viewer";
  let siteConfig = null;

  if (user) {
    const metadataRole =
      user.user_metadata?.access_scope || user.app_metadata?.access_scope;

    if (metadataRole === "platform_admin" || metadataRole === "admin") {
      userRole = "super_admin";
      userProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || "Administrador",
        email: user.email,
        role: "super_admin",
        tenant_id: user.user_metadata?.tenant_id || null,
        permissions: ["all"],
      };
    } else {
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        userRole = profile.role || "viewer";
        userProfile = profile;
      }
    }

    // 2. Obtener configuración del sitio para este tenant
    siteConfig = await getSiteConfigServerCached({
      tenantId: userProfile?.tenant_id,
    });
  }

  return (
    <AdminLayoutClient
      initialProfile={userProfile}
      initialRole={userRole}
      initialSiteConfig={siteConfig}
    >
      {children}
    </AdminLayoutClient>
  );
}
