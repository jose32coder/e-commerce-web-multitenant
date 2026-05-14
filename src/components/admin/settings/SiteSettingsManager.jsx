"use client";

import React, { useEffect, useState } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { logAudit } from "@/lib/auditLog";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_MENU,
  DEFAULT_HOME_INTRO,
  DEFAULT_PROMO_DIVIDER,
  DEFAULT_PRODUCTS_INTRO,
  normalizeCommerceSettings,
  normalizeFooterSettings,
  normalizeHeaderMenu,
  normalizeHomeIntro,
  normalizePromoDivider,
  updateSiteConfig,
} from "@/lib/siteConfig";
import { createClient } from "@/lib/supabase/client";
import { CLOUDINARY_CONFIG } from "../product-form/config";
import { buildTenantCloudinaryFolder } from "@/lib/cloudinaryFolders";
import { revalidateSiteConfig } from "@/app/actions/revalidate";
import EditorialContentSettings from "./EditorialContentSettings";
import HeroSliderSettings from "./HeroSliderSettings";
import SiteIdentitySettings from "./SiteIdentitySettings";
import SiteSettingsFooter from "./SiteSettingsFooter";
import HeaderMenuSettings from "./HeaderMenuSettings";
import PromoDividerSettings from "./PromoDividerSettings";
import FooterSettings from "./FooterSettings";
import CommerceSettings from "./CommerceSettings";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Loader2, Save, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

const hasValueChanged = (currentValue, nextValue) =>
  JSON.stringify(currentValue) !== JSON.stringify(nextValue);

const normalizeSlides = (value) => (Array.isArray(value) ? value : []);

export default function SiteSettingsManager() {
  const {
    tenant_id: tenantId,
    tenant_slug: tenantSlug,
    site_name: currentName,
    hero_slides: currentSlides,
    home_intro: currentHomeIntro,
    products_intro: currentProductsIntro,
    header_menu: currentHeaderMenu,
    promo_divider: currentPromoDivider,
    footer_settings: currentFooterSettings,
    commerce_settings: currentCommerceSettings,
    refresh,
    patchConfig,
  } = useSiteConfig();

  console.log("[SiteSettingsManager] current tenantId:", tenantId);
  const supabase = createClient();

  const [siteName, setSiteName] = useState(currentName || "");
  const [newTenantSlug, setNewTenantSlug] = useState(tenantSlug || "");
  const [slides, setSlides] = useState(normalizeSlides(currentSlides));
  const [homeIntro, setHomeIntro] = useState(DEFAULT_HOME_INTRO);
  const [productsIntro, setProductsIntro] = useState(DEFAULT_PRODUCTS_INTRO);
  const [headerMenu, setHeaderMenu] = useState(DEFAULT_HEADER_MENU);
  const [promoDivider, setPromoDivider] = useState(DEFAULT_PROMO_DIVIDER);
  const [footerSettings, setFooterSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [commerceSettings, setCommerceSettings] = useState(
    DEFAULT_COMMERCE_SETTINGS,
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [actorName, setActorName] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [nameChangeHistory, setNameChangeHistory] = useState([]);
  const [nameChangeLimitReached, setNameChangeLimitReached] = useState(false);
  const [changesLeft, setChangesLeft] = useState(3);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);

  useEffect(() => {
    setSiteName(currentName);
    setNewTenantSlug(tenantSlug);
    setSlides(normalizeSlides(currentSlides));
    setHomeIntro(normalizeHomeIntro(currentHomeIntro));
    setProductsIntro({
      ...DEFAULT_PRODUCTS_INTRO,
      ...(currentProductsIntro || {}),
    });
    setHeaderMenu(normalizeHeaderMenu(currentHeaderMenu));
    setPromoDivider(normalizePromoDivider(currentPromoDivider));
    setFooterSettings(normalizeFooterSettings(currentFooterSettings));
    setCommerceSettings(normalizeCommerceSettings(currentCommerceSettings));
  }, [
    currentName,
    currentSlides,
    currentHomeIntro,
    currentProductsIntro,
    currentHeaderMenu,
    currentPromoDivider,
    currentFooterSettings,
    currentCommerceSettings,
  ]);

  useEffect(() => {
    const loadActor = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.warn("No se pudo obtener usuario actual:", authError.message);
          return;
        }

        if (!user) return;

        setCurrentUser(user);

        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setActorName(profile?.full_name || user.email || "Admin");
      } catch (error) {
        console.warn("Fallo al cargar actor en ajustes:", error?.message);
      }
    };

    loadActor();
  }, [supabase]);

  // Verificar límite de cambios de nombre y cargar slug actual
  useEffect(() => {
    const checkNameLimit = async () => {
      if (!tenantId) return;
      const { data } = await supabase
        .from("tenants")
        .select("name_change_history, slug")
        .eq("tenant_id", tenantId)
        .single();

      if (data) {
        // Cargar el slug actual si el estado está vacío
        if (data.slug) {
          setNewTenantSlug(data.slug);
        }

        const history = Array.isArray(data.name_change_history)
          ? data.name_change_history
          : [];
        setNameChangeHistory(history);

        // Contar cambios en los últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentChanges = history.filter((dateStr) => {
          const changeDate = new Date(dateStr);
          return changeDate > thirtyDaysAgo;
        });

        const left = Math.max(0, 3 - recentChanges.length);
        setChangesLeft(left);

        if (left <= 0) {
          setNameChangeLimitReached(true);
        } else {
          setNameChangeLimitReached(false);
        }
      }
      setIsLoadingIdentity(false);
    };

    checkNameLimit();
  }, [tenantId, supabase, currentName]);

  const handleNameChange = (val) => {
    setSiteName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setNewTenantSlug(autoSlug);
  };

  const handleTenantCardConfigChange = (nextTenantCard) => {
    setCommerceSettings((prev) => ({
      ...prev,
      tenant_selector_card: {
        ...prev.tenant_selector_card,
        ...(nextTenantCard || {}),
      },
    }));
  };

  const handleAddSlide = () => {
    if (slides.length >= 3) return;

    const newSlide = {
      id: Date.now(),
      subtitle: "- Nueva Colección",
      title: "Título del Slide",
      description: "Descripción breve del slide aquí.",
      image: "/banner-clothes.jpg",
    };

    setSlides((prev) => [...prev, newSlide]);
  };

  const handleRemoveSlide = async (id) => {
    if (slides.length <= 1) {
      await Swal.fire({
        title: "No puedes eliminar",
        text: "Debe quedar al menos un slide en el hero.",
        icon: "info",
        confirmButtonColor: "#0f172a",
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Eliminar este slide?",
      text: "Los cambios se aplicarán en la tienda cuando guardes la sección Contenido y Home.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;
    setSlides((prev) => prev.filter((slide) => slide.id !== id));
  };

  const handleUpdateSlide = (id, field, value) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === id ? { ...slide, [field]: value } : slide,
      ),
    );
  };

  const handleImageUpload = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    handleUpdateSlide(id, "image", localPreviewUrl);

    setUploading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append(
      "folder",
      buildTenantCloudinaryFolder({
        tenantSlug,
        tenantId,
        area: "site",
        subpath: "hero",
      }),
    );

    try {
      const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir imagen");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        "/upload/w_800,q_auto,f_auto/",
      );

      handleUpdateSlide(id, "image", optimizedUrl);
      URL.revokeObjectURL(localPreviewUrl);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Error al subir la imagen" });
    } finally {
      setUploading(false);
    }
  };

  const handlePromoImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPromoDivider((prev) => ({ ...prev, image: localPreviewUrl }));

    setUploading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append(
      "folder",
      buildTenantCloudinaryFolder({
        tenantSlug,
        tenantId,
        area: "site",
        subpath: "promo-divider",
      }),
    );

    try {
      const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir imagen del promo divider");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        "/upload/w_1600,q_auto,f_auto/",
      );

      setPromoDivider((prev) => ({ ...prev, image: optimizedUrl }));
      URL.revokeObjectURL(localPreviewUrl);
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        message: "Error al subir imagen del promo divider",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setCommerceSettings((prev) => ({ ...prev, logo_url: localPreviewUrl }));

    setUploading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append(
      "folder",
      buildTenantCloudinaryFolder({
        tenantSlug,
        tenantId,
        area: "site",
        subpath: "identity",
      }),
    );

    try {
      const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir logo");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        "/upload/w_400,q_auto,f_auto/",
      );

      setCommerceSettings((prev) => ({ ...prev, logo_url: optimizedUrl }));
      URL.revokeObjectURL(localPreviewUrl);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Error al subir el logo" });
    } finally {
      setUploading(false);
    }
  };

  const handleTenantCardBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setCommerceSettings((prev) => ({
      ...prev,
      tenant_selector_card: {
        ...prev.tenant_selector_card,
        background_image_url: localPreviewUrl,
      },
    }));

    setUploading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append(
      "folder",
      buildTenantCloudinaryFolder({
        tenantSlug,
        tenantId,
        area: "site",
        subpath: "tenant-card",
      }),
    );

    try {
      const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir imagen de fondo");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        "/upload/w_1600,q_auto,f_auto/",
      );

      setCommerceSettings((prev) => ({
        ...prev,
        tenant_selector_card: {
          ...prev.tenant_selector_card,
          background_image_url: optimizedUrl,
        },
      }));
      URL.revokeObjectURL(localPreviewUrl);
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        message: "Error al subir la imagen de fondo",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSection = async (section) => {
    const payload = getPayloadForSection(section);
    if (!Object.keys(payload).length) return;

    if (section === "general") {
      const nameChanged = siteName !== currentName;

      // 1. Validar límite de cambios de nombre/slug (3 al mes)
      if (nameChanged && nameChangeLimitReached) {
        Swal.fire({
          title: "Límite alcanzado",
          text: "Has alcanzado el límite de 3 cambios de identidad por mes.",
          icon: "error",
          confirmButtonColor: "#0f172a",
        });
        return;
      }

      if (nameChanged) {
        // Validar disponibilidad del slug
        const { data: existing } = await supabase
          .from("tenants")
          .select("tenant_id")
          .eq("slug", newTenantSlug)
          .maybeSingle();

        if (existing && existing.tenant_id !== tenantId) {
          Swal.fire({
            title: "URL No Disponible",
            text: "Este identificador ya está siendo usado por otra tienda. Elige uno diferente.",
            icon: "error",
            confirmButtonColor: "#0f172a",
          });
          return;
        }

        const result = await Swal.fire({
          title: "¿Cambiar URL y Nombre?",
          text: "Esto cambiará el nombre y la URL de tu tienda. Los enlaces viejos dejarán de funcionar. ¿Estás seguro?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, cambiar Nombre y URL",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#64748b",
        });

        if (!result.isConfirmed) return;
      }

      setLoading(true);
      try {
        if (nameChanged) {
          const tenantUpdate = {
            name: siteName,
            slug: newTenantSlug,
            slug_updated_at: new Date().toISOString(),
            name_change_history: [
              ...nameChangeHistory,
              new Date().toISOString(),
            ],
          };

          const { error: tErr } = await supabase
            .from("tenants")
            .update(tenantUpdate)
            .eq("tenant_id", tenantId);

          if (tErr) {
            console.error("Error actualizando tabla tenants:", tErr);
            throw new Error(`Error en tabla tenants: ${tErr.message}`);
          }
        }

        // Sync logo_url to tenants table for platform-wide access
        const logoUrlToSave = commerceSettings?.logo_url || null;
        if (logoUrlToSave !== undefined) {
          await supabase
            .from("tenants")
            .update({ logo_url: logoUrlToSave })
            .eq("tenant_id", tenantId);
        }

        await updateSiteConfig(payload, { tenantId });
        await revalidateSiteConfig(tenantId, nameChanged ? newTenantSlug : tenantSlug);

        await logAudit(supabase, {
          tipo: "ajuste",
          accion: "editar",
          descripcion: "Identidad de tienda actualizada (Nombre/Slug)",
          usuario_id: currentUser?.id ?? null,
          usuario_nombre: actorName,
          meta: { section, siteName, newTenantSlug },
        });

        patchConfig({
          site_name: siteName,
          header_menu: headerMenu,
          commerce_settings: payload.commerce_settings,
          tenant_slug: nameChanged ? newTenantSlug : tenantSlug,
        });

        Swal.fire({
          title: "¡Guardado!",
          text: "La identidad de tu tienda se ha actualizado correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        refresh();
      } catch (err) {
        console.error("DETALLE DEL ERROR AL GUARDAR:", err);
        Swal.fire({
          title: "Error al guardar",
          text:
            err.message ||
            "Ocurrió un error inesperado al actualizar la configuración",
          icon: "error",
          confirmButtonColor: "#0f172a",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await updateSiteConfig(payload, { tenantId });
      await revalidateSiteConfig(tenantId, tenantSlug);
      await logAudit(supabase, {
        tipo: "ajuste",
        accion: "editar",
        descripcion: `Sección ${section} guardada`,
        usuario_id: currentUser?.id ?? null,
        usuario_nombre: actorName,
        meta: {
          section: section,
          payload,
        },
      });

      patchConfig(payload);

      const savedMessage =
        section === "home"
          ? "El contenido de inicio se actualizó correctamente."
          : section === "footer"
            ? "Footer y comercio se actualizaron correctamente."
            : `Sección ${section} guardada correctamente.`;

      await Swal.fire({
        title: "¡Guardado!",
        text: savedMessage,
        icon: "success",
        timer: 2200,
        showConfirmButton: false,
      });
      refresh();
    } catch (err) {
      console.error("DETALLE DEL ERROR:", err);
      setStatus({
        type: "error",
        message: err.message || "Error al guardar sección",
      });
      await Swal.fire({
        title: "Error al guardar",
        text: err.message || "Ocurrió un error al guardar esta sección.",
        icon: "error",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPayloadForSection = (section) => {
    switch (section) {
      case "general":
        return {
          site_name: siteName,
          header_menu: headerMenu,
          commerce_settings: {
            ...commerceSettings,
            logo_url: commerceSettings.logo_url,
          },
        };
      case "home":
        return {
          site_name: siteName,
          hero_slides: slides,
          home_intro: homeIntro,
          products_intro: productsIntro,
          promo_divider: promoDivider,
        };
      case "footer":
        return {
          site_name: siteName,
          footer_settings: footerSettings,
          commerce_settings: commerceSettings,
        };
      default:
        return {};
    }
  };

  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Identidad y Navegación" },
    { id: "home", label: "Contenido y Home" },
    { id: "footer", label: "Comercio y Footer" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Configuración Web
        </h2>

        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-md w-fit max-w-full overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 sm:px-6 py-2 sm:py-2.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
        {activeTab === "general" && (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">
                Identidad Visual
              </h3>
              <SiteIdentitySettings
                siteName={siteName}
                onSiteNameChange={handleNameChange}
                tenantSlug={newTenantSlug}
                logoUrl={commerceSettings?.logo_url}
                onLogoUpload={handleLogoUpload}
                tenantCardConfig={commerceSettings?.tenant_selector_card}
                onTenantCardConfigChange={handleTenantCardConfigChange}
                onTenantCardBackgroundUpload={handleTenantCardBackgroundUpload}
                isUploadingLogo={uploading}
                isUploadingTenantCardBackground={uploading}
                nameChangeLimitReached={nameChangeLimitReached}
                changesLeft={changesLeft}
                isLoading={isLoadingIdentity}
              />
            </div>

            <div className="h-px bg-slate-50 dark:bg-slate-800" />

            <div className="space-y-6">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">
                Menú de Navegación
              </h3>
              <HeaderMenuSettings
                headerMenu={headerMenu}
                onHeaderMenuChange={setHeaderMenu}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => handleSaveSection("general")}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 h-12 rounded-md hover:bg-slate-700 dark:hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 disabled:opacity-50 cursor-pointer w-full sm:w-auto justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Guardar Identidad
              </button>
            </div>
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <HeroSliderSettings
              slides={slides}
              homeIntro={homeIntro}
              onHomeIntroPatch={(patch) =>
                setHomeIntro((prev) =>
                  normalizeHomeIntro({ ...prev, ...patch }),
                )
              }
              onAddSlide={handleAddSlide}
              onRemoveSlide={handleRemoveSlide}
              onUpdateSlide={handleUpdateSlide}
              onImageUpload={handleImageUpload}
            />

            <div className="h-px bg-slate-50 dark:bg-slate-800" />

            <EditorialContentSettings
              homeIntro={homeIntro}
              onHomeIntroChange={setHomeIntro}
              productsIntro={productsIntro}
              onProductsIntroChange={setProductsIntro}
            />

            <div className="h-px bg-slate-50 dark:bg-slate-800" />

            <PromoDividerSettings
              value={promoDivider}
              onChange={setPromoDivider}
              onImageUpload={handlePromoImageUpload}
              uploading={uploading}
            />

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => handleSaveSection("home")}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 h-12 rounded-md hover:bg-slate-700 dark:hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 disabled:opacity-50 cursor-pointer w-full sm:w-auto justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Guardar Contenido
              </button>
            </div>
          </div>
        )}

        {activeTab === "footer" && (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">
                Configuración Comercial
              </h3>
              <CommerceSettings
                value={commerceSettings}
                onChange={setCommerceSettings}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">
                Información del Pie de Página
              </h3>
              <FooterSettings
                value={footerSettings}
                onChange={setFooterSettings}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => handleSaveSection("footer")}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 h-12 rounded-md hover:bg-slate-700 dark:hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 disabled:opacity-50 cursor-pointer w-full sm:w-auto justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Guardar Comercio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
