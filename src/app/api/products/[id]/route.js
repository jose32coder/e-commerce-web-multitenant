import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";

const mapVariantToDb = (variant, { tenantId, productId }) => ({
  id: variant.id || undefined, // <--- CRUCIAL: Mantener el ID si existe
  product_id: productId,
  tenant_id: tenantId,
  attributes: variant.attributes || {},
  price_override:
    Number(variant.price_adjustment ?? variant.price_override ?? 0) || 0,
  stock_quantity:
    Number(variant.stock_quantity ?? variant.stock_adjustment ?? 0) || 0,
  sku: variant.sku || null,
});

const getMissingColumnName = (error) => {
  const message = error?.message || error?.details || "";
  if (!message) return null;
  const pgrstMatch = message.match(/Could not find the '([^']+)' column/i);
  if (pgrstMatch?.[1]) return pgrstMatch[1];
  const pgMatch = message.match(/column ["']?([^"'\s]+)["']? does not exist/i);
  return pgMatch?.[1] || null;
};

// PUT /api/products/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      short_description,
      description,
      price,
      discount_price,
      stock,
      images,
      category_ids = [],
      status,
      featured,
      slug,
      variants = [],
      tenant_id: payloadTenantId,
      use_variant_only_pricing,
      base_currency,
    } = body;

    const normalizedCategoryIds = [
      ...new Set((category_ids || []).filter(Boolean)),
    ];
    const normalizedImages = (images || []).slice(0, 5);
    const variantOnlyPricing = use_variant_only_pricing === true;
    const parsedPrice = Number(price);
    const hasPricedVariant = (variants || []).some(
      (variant) =>
        Number(variant?.price_adjustment ?? variant?.price_override ?? 0) > 0,
    );

    if (!variantOnlyPricing && !(parsedPrice > 0)) {
      return NextResponse.json(
        { success: false, error: "El precio base debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (variantOnlyPricing && !hasPricedVariant) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Debes definir al menos una variante con precio mayor a 0 para usar precio solo por variantes",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: payloadTenantId,
    });

    // 1. Actualizar el producto principal
    const productPayload = {
      name,
      short_description,
      description,
      price: variantOnlyPricing ? 0 : parsedPrice,
      discount_price:
        variantOnlyPricing || !discount_price ? null : parseFloat(discount_price),
      images: normalizedImages,
      status,
      featured,
      slug,
      category_id:
        normalizedCategoryIds.length > 0 ? normalizedCategoryIds[0] : null,
      use_variant_only_pricing: variantOnlyPricing,
      base_currency: base_currency || "USD",
    };

    let updatePayload = { ...productPayload };
    let product = null;
    let pError = null;

    while (true) {
      let productUpdate = supabase.from("products").update(updatePayload).eq("id", id);
      if (tenantId) {
        productUpdate = productUpdate.eq("tenant_id", tenantId);
      }

      const result = await productUpdate.select().single();

      if (!result.error) {
        product = result.data;
        break;
      }

      const missingColumn = getMissingColumnName(result.error);
      if (missingColumn && Object.prototype.hasOwnProperty.call(updatePayload, missingColumn)) {
        delete updatePayload[missingColumn];
        continue;
      }

      pError = result.error;
      break;
    }

    if (pError) throw pError;

    // 2. CORRECCIÓN DE STOCK: Actualización absoluta y auditoría
    const parsedStock = parseInt(stock) || 0;
    const { data: currentStockObj } = await supabase
      .from("product_stock")
      .select("quantity")
      .eq("product_id", id)
      .single();

    const currentStockQuant = currentStockObj
      ? Number(currentStockObj.quantity)
      : 0;
    const stockDiff = parsedStock - currentStockQuant;

    if (stockDiff !== 0) {
      // Insertamos movimiento para el historial
      await supabase.from("stock_movements").insert({
        tenant_id: tenantId,
        product_id: id,
        movement_type: stockDiff > 0 ? "adjustment" : "out",
        quantity: Math.abs(stockDiff),
        reason: "Admin stock update",
        reference_type: "products_api",
      });

      // Actualizamos el valor real para evitar duplicados por suma
      await supabase
        .from("product_stock")
        .update({ quantity: parsedStock })
        .eq("product_id", id);
    }

    // 3. CORRECCIÓN DE CATEGORÍAS: Sincronización multi-categoría
    if (normalizedCategoryIds.length > 0) {
      // Limpiamos relaciones anteriores en la tabla intermedia
      await supabase.from("product_categories").delete().eq("product_id", id);

      const categoryRelations = normalizedCategoryIds.map((catId) => ({
        product_id: id,
        category_id: catId,
        tenant_id: tenantId,
      }));

      const { error: catError } = await supabase
        .from("product_categories")
        .insert(categoryRelations);

      if (catError)
        throw new Error(`Error vinculando categorías: ${catError.message}`);
    }

    // 4. Gestión de variantes con Soft Delete (tu lógica actual)
    if (variants) {
      let deactivateVariants = supabase
        .from("product_variants")
        .update({ is_active: false })
        .eq("product_id", id);

      if (tenantId)
        deactivateVariants = deactivateVariants.eq("tenant_id", tenantId);

      const { error: softDeleteError } = await deactivateVariants;
      if (softDeleteError)
        throw new Error(
          `Error al desactivar variantes: ${softDeleteError.message}`,
        );

      if (variants.length > 0) {
        const variantsToProcess = variants
          .map((v) => ({
            ...mapVariantToDb(v, { tenantId, productId: id }),
            is_active: true,
          }))
          .filter((v) => v.attributes && Object.keys(v.attributes).length > 0);

        if (variantsToProcess.length > 0) {
          // onConflict: 'id' le dice a Supabase que si el ID ya existe, haga UPDATE
          const { error: upsertError } = await supabase
            .from("product_variants")
            .upsert(variantsToProcess, { onConflict: "id" });

          if (upsertError)
            throw new Error(
              `Error guardando variantes: ${upsertError.message}`,
            );
        }
      }
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
