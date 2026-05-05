import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import { buildExportFile, toPipeList } from "@/lib/adminDataIO";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const tenantFromQuery = request.nextUrl.searchParams.get("tenant_id");
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: tenantFromQuery,
    });

    if (!tenantId) {
      return Response.json(
        { success: false, error: "No se pudo resolver tenant_id." },
        { status: 400 },
      );
    }

    const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        tenant_id,
        name,
        slug,
        status,
        featured,
        price,
        discount_price,
        base_currency,
        images,
        product_stock(quantity),
        product_variants(id,attributes,price_override,stock_quantity,sku),
        product_categories(category_id)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data || []).map((product) => {
      const stockObj = Array.isArray(product.product_stock)
        ? product.product_stock[0]
        : product.product_stock;

      return {
        id: product.id,
        name: product.name || "",
        slug: product.slug || "",
        status: product.status || "draft",
        featured: Boolean(product.featured),
        price: Number(product.price || 0),
        discount_price: Number(product.discount_price || 0) || "",
        base_currency: product.base_currency || "USD",
        stock: Number(stockObj?.quantity || 0),
        category_ids: toPipeList(
          (product.product_categories || []).map((pc) => pc.category_id),
        ),
        images: toPipeList(product.images || []),
        images_count: Array.isArray(product.images) ? product.images.length : 0,
        variants_json: JSON.stringify(
          (product.product_variants || []).map((v) => ({
            id: v.id,
            attributes: v.attributes || {},
            price_override: Number(v.price_override || 0),
            stock_quantity: Number(v.stock_quantity || 0),
            sku: v.sku || "",
          })),
        ),
      };
    });

    const file = buildExportFile({
      rows,
      format,
      sheetName: "products",
    });

    const dateCode = new Date().toISOString().slice(0, 10);
    return new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="products_${dateCode}.${file.extension}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error exportando productos." },
      { status: 500 },
    );
  }
}
