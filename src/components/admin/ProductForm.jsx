"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import Swal from "sweetalert2";

// UI Components (Shadcn & Custom)
import { Button } from "@/components/ui/button";

// Product Form Sub-components
import MainInfo from "./product-form/MainInfo";
import PricingStock from "./product-form/PricingStock";
import MediaAndStatus from "./product-form/MediaAndStatus";
import VariantManager from "./product-form/VariantManager";
import { CLOUDINARY_CONFIG } from "./product-form/config";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getExchangeRates } from "@/services/exchangeRates";
import { createClient } from "@/lib/supabase/client";
import {
  buildTenantCloudinaryFolder,
  slugifyCloudinarySegment,
} from "@/lib/cloudinaryFolders";

const ProductForm = ({
  show,
  onClose,
  onSave,
  editingProduct = null,
  readOnly = false,
}) => {
  const { commerce_settings } = useSiteConfig();
  const supabase = createClient();
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      const rates = await getExchangeRates(supabase);
      setExchangeRates(rates);
    };
    fetchRates();
  }, []);

  const sanitizeVariants = (variants = []) =>
    variants.map((v) => ({
      ...v,
      name: String(v.name || v.attribute_name || "Talla").trim(),
      value: String(v.value || v.attribute_value || "").trim(),
      stock_adjustment: Number(v.stock_adjustment ?? v.stock_quantity) || 0,
      price_adjustment: Number(v.price_adjustment ?? v.price_override) || 0,
    }));

  const calculateTotalStock = (variants = [], fallbackStock = 0) =>
    variants.length > 0
      ? variants.reduce((acc, v) => acc + (Number(v.stock_adjustment) || 0), 0)
      : Number(fallbackStock) || 0;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]); // [{ file, blobUrl }]
  const { tenant_id: tenantId, tenant_slug: tenantSlug } = useSiteConfig();

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    price: "",
    discount_price: "",
    stock: "",
    category_ids: [], // Soporte para múltiples categorías
    images: [],
    status: "draft",
    featured: false,
    slug: "",
    variants: [],
    manage_stock: true, // Por defecto manejamos stock
    base_currency: commerce_settings?.currency_code || "USD",
    use_variant_only_pricing: false,
    item_type: "product",
    service_duration: "",
    service_booking_mode: "whatsapp",
  });

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      setNewImageFiles([]);
      fetchCategories();

      if (editingProduct) {
        const initialVariants = sanitizeVariants(
          editingProduct.variants || editingProduct.product_variants || [],
        );

        setFormData({
          ...editingProduct,
          category_ids: editingProduct.category_ids || [],
          short_description: editingProduct.short_description || "",
          description: editingProduct.description || "",
          discount_price: editingProduct.discount_price || "",
          variants: initialVariants,
          stock: calculateTotalStock(
            initialVariants,
            editingProduct.stock || 0,
          ),
          manage_stock: editingProduct.manage_stock ?? (editingProduct.stock < 900000), // Si es muy alto, asumimos que no maneja stock
          base_currency: editingProduct.base_currency || commerce_settings?.currency_code || "USD",
          use_variant_only_pricing:
            editingProduct.use_variant_only_pricing ??
            (Number(editingProduct.price) === 0 && initialVariants.length > 0),
          item_type: editingProduct.item_type || "product",
          service_duration: editingProduct.service_duration || "",
          service_booking_mode: editingProduct.service_booking_mode || "whatsapp",
        });
      } else {
        resetForm();
      }
    } else {
      document.body.style.overflow = "auto";
    }
  }, [show, editingProduct]);

  const resetForm = () => {
    // Revocar todos los blobs actuales para evitar memory leaks
    newImageFiles.forEach((f) => URL.revokeObjectURL(f.blobUrl));
    setNewImageFiles([]);

    setFormData({
      name: "",
      short_description: "",
      description: "",
      price: "",
      discount_price: "",
      stock: "",
      category_ids: [], // <-- SIEMPRE ARRAY VACÍO
      subcategory_id: "",
      images: [], // <-- SIEMPRE ARRAY VACÍO
      status: "draft",
      featured: false,
      slug: "",
      variants: [], // <-- SIEMPRE ARRAY VACÍO (Esto evita el error en VariantManager)
      manage_stock: true,
      base_currency: commerce_settings?.currency_code || "USD",
      use_variant_only_pricing: false,
      item_type: "product",
      service_duration: "",
      service_booking_mode: "whatsapp",
    });
  };

  // Cleanup blobs and body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
      newImageFiles.forEach((f) => URL.revokeObjectURL(f.blobUrl));
    };
  }, [newImageFiles]);

  const fetchCategories = async () => {
    try {
      const url = tenantId ? `/api/categories?tenant_id=${tenantId}` : "/api/categories";
      const resp = await fetch(url);
      const result = await resp.json();
      console.log("Categorías obtenidas:", result);

      if (result.success) {
        // Si result.data es null/undefined por error de la API,
        // ponemos [] para que se oculte el cargando
        setCategories(result.data || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]); // Importante: ante un error, dejamos de cargar
    }
  };
  const handleCategoryChange = (catId) => {
    setFormData((prev) => {
      const currentIds = prev.category_ids || [];
      const isSelected = currentIds.includes(catId);
      const newIds = isSelected
        ? currentIds.filter((id) => id !== catId)
        : [...currentIds, catId];

      return { ...prev, category_ids: newIds };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const currentCount = Array.isArray(formData.images) ? formData.images.length : 0;
    const availableSlots = Math.max(0, 5 - currentCount);

    if (availableSlots <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Límite alcanzado",
        text: "Cada producto permite un máximo de 5 imágenes.",
      });
      return;
    }

    const filesToUse = files.slice(0, availableSlots);
    if (filesToUse.length < files.length) {
      Swal.fire({
        icon: "info",
        title: "Solo se agregaron 5 imágenes",
        text: "Se ignoraron las imágenes adicionales por el límite permitido.",
      });
    }

    const newFilesWithUrls = filesToUse.map((file) => ({
      file,
      blobUrl: URL.createObjectURL(file),
    }));

    setNewImageFiles((prev) => [...prev, ...newFilesWithUrls]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newFilesWithUrls.map((f) => f.blobUrl)],
    }));
  };

  const removeImage = (index) => {
    const imageUrlToRemove = formData.images[index];

    // Si es un blob URL, revocarlo y quitarlo de newImageFiles
    if (imageUrlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrlToRemove);
      setNewImageFiles((prev) =>
        prev.filter((f) => f.blobUrl !== imageUrlToRemove),
      );
    }

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const uploadNewImages = async () => {
    if (newImageFiles.length === 0) return [];

    setUploading(true);
    try {
      const productSegment =
        slugifyCloudinarySegment(formData.slug) ||
        slugifyCloudinarySegment(formData.name) ||
        "product";

      const folder = buildTenantCloudinaryFolder({
        tenantSlug,
        tenantId,
        area: "products",
        subpath: productSegment,
      });

      const uploadPromises = newImageFiles.map(async ({ file }) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        data.append("cloud_name", CLOUDINARY_CONFIG.cloudName);
        data.append("folder", folder);

        const resp = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
          method: "POST",
          body: data,
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(
            errorData.error?.message || "Error al subir a Cloudinary",
          );
        }

        const resJson = await resp.json();
        return resJson.secure_url;
      });

      return await Promise.all(uploadPromises);
    } catch (err) {
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    const variantOnlyPricing = formData.use_variant_only_pricing === true;
    const cleanedVariants = sanitizeVariants(formData.variants || []);
    const isService = formData.item_type === "service";
    if (!formData.name?.trim()) errors.push("El nombre es obligatorio");
    if (!formData.category_ids || formData.category_ids.length === 0)
      errors.push("Selecciona al menos una categoría");
    const parsedPrice = formData.price === "" ? 0 : parseFloat(formData.price);
    if (!variantOnlyPricing && parsedPrice < 0)
      errors.push("El precio base no puede ser negativo. Usa 0 para 'Consultar precio'.");
    if (
      variantOnlyPricing &&
      !cleanedVariants.some((variant) => Number(variant.price_adjustment) > 0)
    ) {
      errors.push(
        "Activa al menos una variante con precio mayor a 0 para usar precio solo por variantes",
      );
    }
    if ((formData.images || []).length > 5)
      errors.push("Solo se permiten hasta 5 imágenes por producto");

    // Si no hay variantes, MANEJAMOS STOCK, y NO es servicio, el stock debe ser >= 0
    if (!isService && formData.variants.length === 0 && formData.manage_stock) {
      if (formData.stock === "" || isNaN(formData.stock))
        errors.push("El stock es obligatorio para productos sin variantes");
    }

    if (errors.length > 0) {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });

      Toast.fire({
        icon: "warning",
        title: "Faltan datos",
        html: `<ul class="text-xs text-left list-disc pl-4">${errors.map((e) => `<li>${e}</li>`).join("")}</ul>`,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Subir imágenes nuevas primero
      const newUrls = await uploadNewImages();

      // 2. Limpiar y validar variantes (Aseguramos que stock_adjustment sea número)
      const cleanedVariants = sanitizeVariants(formData.variants || []);

      // 3. CALCULAR STOCK TOTAL: Si hay variantes, sumamos sus stocks.
      // Si no hay variantes, usamos el stock general del formulario.
      let totalStock = calculateTotalStock(cleanedVariants, formData.stock);

      // Si NO manejamos stock (ej: restaurante), forzamos un valor infinito
      if (!formData.manage_stock) {
        totalStock = 999999;
      }

      // 4. Filtrar URLs de blobs y combinar con las nuevas URLs reales de Cloudinary
      const finalImages = [
        ...formData.images.filter((url) => !url.startsWith("blob:")),
        ...newUrls,
      ].slice(0, 5);

      // 5. Construir objeto final para enviar
      const finalFormData = {
        ...formData,
        price: formData.use_variant_only_pricing ? 0 : (formData.price === "" ? 0 : formData.price),
        discount_price: formData.use_variant_only_pricing
          ? ""
          : formData.discount_price,
        category_ids: [
          ...new Set((formData.category_ids || []).filter(Boolean)),
        ],
        images: finalImages,
        variants: cleanedVariants, // Enviamos variantes limpias
        stock: totalStock, // Enviamos el stock real calculado
        tenant_id: tenantId || formData.tenant_id || null,
      };

      // Generar slug si no existe
      if (!finalFormData.slug) {
        finalFormData.slug = finalFormData.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "");
      }

      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFormData),
      });

      const result = await resp.json();
      if (result.success) {
        const isService = formData.item_type === "service";
        const itemLabel = isService ? "servicio" : "producto";
        Swal.fire({
          icon: "success",
          title: editingProduct ? "¡Actualizado!" : "¡Creado!",
          text: `El ${itemLabel} se ha ${editingProduct ? "actualizado" : "guardado"} correctamente.${!isService ? ` Stock total: ${totalStock}` : ""}`,
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: "rounded-[2rem]" },
        });
        onSave();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Ups...",
        text: err.message,
        customClass: { popup: "rounded-md" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const variantsPreview = sanitizeVariants(formData.variants || []);
  const isAutoStock = variantsPreview.length > 0;
  const effectiveStock = calculateTotalStock(variantsPreview, formData.stock);

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl z-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-md shadow-2xl relative border border-white/20 dark:border-slate-700/50 flex flex-col max-h-[85vh] sm:max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Elegante */}
        <div className="p-5 sm:p-8 pb-4 sm:pb-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                {readOnly
                  ? (formData.item_type === "service" ? "Detalles del Servicio" : "Detalles del Producto")
                  : editingProduct
                    ? (formData.item_type === "service" ? "Editar Servicio" : "Editar Producto")
                    : (formData.item_type === "service" ? "Nuevo Servicio" : "Nuevo Producto")}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-[0.2em]">
                {formData.item_type === "service" ? "Configuración de Servicio" : "Configuración de Catálogo e Inventario"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Cuerpo del Formulario con Grid */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Reemplazo de ScrollArea por div estándar con overflow-y-auto */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 min-h-0 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Columna Principal (Información y Precios) */}
              <div className="lg:col-span-8 space-y-8 sm:space-y-10">
                {/* Toggle Tipo de Item: Producto / Servicio */}
                {!readOnly && (
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, item_type: "product" }))}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        formData.item_type !== "service"
                          ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      📦 Producto
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, item_type: "service", manage_stock: false }))}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        formData.item_type === "service"
                          ? "bg-violet-600 shadow-sm text-white"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      🛠️ Servicio
                    </button>
                  </div>
                )}

                <MainInfo
                  formData={formData}
                  setFormData={setFormData}
                  readOnly={readOnly}
                />

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                  <PricingStock
                    formData={formData}
                    setFormData={setFormData}
                    readOnly={readOnly}
                    effectiveStock={calculateTotalStock(formData.variants, formData.stock)}
                    autoCalculated={formData.variants?.length > 0}
                    exchangeRates={exchangeRates}
                    commerceSettings={commerce_settings}
                  />
                </div>
              </div>

              {/* Columna Lateral (Media y Categorías) */}
              <div className="lg:col-span-4 space-y-8 lg:border-l lg:border-slate-50 dark:lg:border-slate-800 lg:pl-8">
                <MediaAndStatus
                  formData={formData}
                  setFormData={setFormData}
                  categories={categories}
                  uploading={uploading}
                  handleImageUpload={handleImageUpload}
                  handleCategoryChange={handleCategoryChange}
                  removeImage={removeImage}
                  readOnly={readOnly}
                />
              </div>

              {/* Sección Inferior (Variantes) — solo para Productos */}
              {formData.item_type !== "service" && (
                <div className="lg:col-span-12 pt-8 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <VariantManager
                    formData={formData}
                    setFormData={setFormData}
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Footer de Acciones */}
          <div className="p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3 sm:gap-4 flex-col sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-md px-6 sm:px-8 h-12 w-full sm:w-auto cursor-pointer text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 sm:border-none"
            >
              {/* Cambio dinámico del texto según readOnly */}
              {readOnly ? "Cerrar" : "Cancelar y Salir"}
            </Button>

            {!readOnly && (
              <Button
                disabled={loading || uploading}
                className="bg-slate-900 w-full h-12 sm:w-auto cursor-pointer dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 text-white rounded-md px-8 sm:px-10 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none transition-all disabled:opacity-50 gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Save size={18} />{" "}
                    {editingProduct
                      ? (formData.item_type === "service" ? "Actualizar Servicio" : "Actualizar Producto")
                      : (formData.item_type === "service" ? "Crear Servicio" : "Crear Producto")}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
