import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";

const normalizeProductVariants = (variants = []) =>
  (variants || []).map((variant) => ({
    ...variant,
    // La tabla usa 'attributes' (jsonb) con el nuevo VariantManager
    attributes: variant.attributes || {},
    price_adjustment:
      Number(variant.price_adjustment ?? variant.price_override ?? 0) || 0,
    stock_quantity:
      Number(variant.stock_quantity ?? variant.stock_adjustment ?? 0) || 0,
  }));

const mapProductForClient = (product) => {
  const stockObj = Array.isArray(product.product_stock)
    ? product.product_stock[0]
    : product.product_stock;

  const categoryIds = Array.isArray(product.product_categories)
    ? product.product_categories.map((pc) => pc.category?.id).filter(Boolean)
    : [];

  return {
    ...product,
    stock: stockObj ? stockObj.quantity : 0,
    category_ids: categoryIds,
    product_variants: normalizeProductVariants(product.product_variants),
  };
};

const mapVariantToDb = (variant, { tenantId, productId }) => ({
  product_id: productId,
  tenant_id: tenantId,
  // El VariantManager genera { attributes: { Color: "Rojo", Talla: "M" } }
  // La tabla product_variants tiene una columna 'attributes' de tipo jsonb.
  attributes: variant.attributes || {},
  price_override:
    Number(variant.price_adjustment ?? variant.price_override ?? 0) || 0,
  stock_quantity:
    Number(variant.stock_quantity ?? variant.stock_adjustment ?? 0) || 0,
  sku: variant.sku || null,
});

// GET /api/products
export async function GET(request) {
  try {
    const supabase = await createClient();
    const tenantFromQuery = request.nextUrl.searchParams.get("tenant_id");
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: tenantFromQuery,
    });

    // GET /api/products
    let query = supabase.from("products").select(`
  *,
  product_categories!product_categories_product_id_fkey (
    category_id,
    category:categories!product_categories_category_id_fkey (
      id,
      name
    )
  ),
  product_stock(quantity),
  product_variants(*)
`);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return NextResponse.json({
      success: true,
      data: (data || []).map(mapProductForClient),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/products
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      short_description,
      description,
      price,
      discount_price,
      stock,
      images,
      category_ids = [], // Array de categorías para la tabla pivot
      status,
      featured,
      slug,
      variants = [],
      tenant_id: payloadTenantId,
    } = body;
    const normalizedCategoryIds = [
      ...new Set((category_ids || []).filter(Boolean)),
    ];
    const normalizedImages = (images || []).slice(0, 5);

    if (!name || !price || normalizedCategoryIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nombre, precio y al menos una categoría son obligatorios",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: payloadTenantId,
    });

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo resolver el tenant para crear el producto.",
        },
        { status: 400 },
      );
    }

    // 1. Insertar el producto
    const { data: product, error: pError } = await supabase
      .from("products")
      .insert([
        {
          name,
          short_description,
          description,
          price: parseFloat(price),
          discount_price: discount_price ? parseFloat(discount_price) : null,
          images: normalizedImages,
          status: status || "draft",
          featured: featured || false,
          slug:
            slug ||
            name
              .toLowerCase()
              .replace(/ /g, "-")
              .replace(/[^\w-]+/g, ""),
          category_id:
            normalizedCategoryIds.length > 0 ? normalizedCategoryIds[0] : null,
          tenant_id: tenantId,
        },
      ])
      .select()
      .single();

    if (pError) throw pError;
    const productId = product.id;

    const categoryRelations = normalizedCategoryIds.map((catId) => ({
      product_id: productId,
      category_id: catId,
      tenant_id: tenantId,
    }));

    if (categoryRelations.length > 0) {
      const { error: catError } = await supabase
        .from("product_categories")
        .insert(categoryRelations);

      if (catError) throw new Error(`Error en categorías: ${catError.message}`);
    }

    const parsedStock = parseInt(stock) || 0;
    if (parsedStock > 0) {
      const { error: stockEx } = await supabase.from("stock_movements").insert({
        tenant_id: tenantId,
        product_id: productId,
        movement_type: "adjustment",
        quantity: parsedStock,
        reason: "Initial stock creation",
        reference_type: "products_api",
      });
      if (stockEx) console.warn("Failed creating initial stock:", stockEx);
    }

    // 3. Insertar variantes si existen
    if (variants.length > 0) {
      const variantsToInsert = variants
        .map((v) => mapVariantToDb(v, { tenantId, productId }))
        // Solo descartamos si no tiene ningún atributo definido
        .filter((v) => v.attributes && Object.keys(v.attributes).length > 0);

      if (variantsToInsert.length > 0) {
        const { error: vError } = await supabase
          .from("product_variants")
          .insert(variantsToInsert);

        if (vError) {
          throw new Error(`Error guardando variantes: ${vError.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
