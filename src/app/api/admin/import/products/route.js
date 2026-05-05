import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import {
  normalizeText,
  parsePipeList,
  parseSpreadsheetFile,
  safeNumber,
} from "@/lib/adminDataIO";

const ALLOWED_STATUS = new Set(["draft", "published"]);

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const parseVariants = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseProductRow = (row, index, categoryIdsByName) => {
  const errors = [];
  const name = String(row.name || "").trim();
  const slug = normalizeSlug(row.slug || name);
  const price = safeNumber(row.price, NaN);
  const discountPrice = safeNumber(row.discount_price, 0);
  const status = normalizeText(row.status) || "draft";
  const stock = Math.max(0, Math.trunc(safeNumber(row.stock, 0)));
  const featured = String(row.featured || "")
    .trim()
    .toLowerCase();
  const baseCurrency = String(row.base_currency || "USD").trim().toUpperCase();
  const images = parsePipeList(row.images).slice(0, 5);
  const rawCategoryIds = parsePipeList(row.category_ids);
  const categoryNames = parsePipeList(row.category_names);
  const variants = parseVariants(row.variants_json);

  if (!name) errors.push("name es obligatorio.");
  if (!slug) errors.push("slug no pudo generarse.");
  if (!Number.isFinite(price) || price <= 0) errors.push("price debe ser mayor a 0.");
  if (status && !ALLOWED_STATUS.has(status)) {
    errors.push("status debe ser draft o published.");
  }

  const resolvedCategoryIds = new Set(rawCategoryIds.filter(Boolean));
  categoryNames.forEach((catName) => {
    const id = categoryIdsByName.get(normalizeText(catName));
    if (id) resolvedCategoryIds.add(id);
  });

  if (resolvedCategoryIds.size === 0) {
    errors.push("Debe incluir al menos una categoría en category_ids o category_names.");
  }

  return {
    rowNumber: index + 2,
    errors,
    normalized: {
      name,
      slug,
      short_description: String(row.short_description || "").trim(),
      description: String(row.description || "").trim(),
      price,
      discount_price: discountPrice > 0 ? discountPrice : null,
      status: ALLOWED_STATUS.has(status) ? status : "draft",
      featured: featured === "true" || featured === "1" || featured === "yes",
      stock,
      base_currency: baseCurrency || "USD",
      images,
      category_ids: Array.from(resolvedCategoryIds),
      variants,
    },
  };
};

const syncProductCategories = async (supabase, { productId, tenantId, categoryIds }) => {
  await supabase.from("product_categories").delete().eq("product_id", productId);

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) return;

  await supabase.from("product_categories").insert(
    categoryIds.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
      tenant_id: tenantId,
    })),
  );
};

const syncProductVariants = async (supabase, { productId, tenantId, variants }) => {
  await supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);

  const normalizedVariants = (Array.isArray(variants) ? variants : [])
    .map((variant) => ({
      id: variant.id || undefined,
      product_id: productId,
      tenant_id: tenantId,
      attributes: variant.attributes || {},
      price_override: safeNumber(variant.price_override ?? variant.price_adjustment, 0),
      stock_quantity: Math.max(
        0,
        Math.trunc(safeNumber(variant.stock_quantity ?? variant.stock_adjustment, 0)),
      ),
      sku: variant.sku || null,
      is_active: true,
    }))
    .filter((variant) => Object.keys(variant.attributes || {}).length > 0);

  if (normalizedVariants.length === 0) return;

  await supabase.from("product_variants").upsert(normalizedVariants, {
    onConflict: "id",
  });
};

const syncProductStock = async (supabase, { productId, stock }) => {
  const { data: existingStock } = await supabase
    .from("product_stock")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();

  if (existingStock?.id) {
    await supabase
      .from("product_stock")
      .update({ quantity: stock })
      .eq("product_id", productId);
  } else {
    await supabase.from("product_stock").insert({
      product_id: productId,
      quantity: stock,
    });
  }
};

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { tenantId } = await resolveTenantContext(supabase);

    if (!tenantId) {
      return Response.json(
        { success: false, error: "No se pudo resolver tenant_id." },
        { status: 400 },
      );
    }

    const mode = request.nextUrl.searchParams.get("mode") === "apply" ? "apply" : "dry_run";
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json(
        { success: false, error: "Debes adjuntar un archivo XLSX o CSV." },
        { status: 400 },
      );
    }

    const rows = await parseSpreadsheetFile(file);

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json(
        { success: false, error: "El archivo no contiene filas para importar." },
        { status: 400 },
      );
    }

    const [{ data: categories, error: categoriesError }, { data: existingProducts, error: productsError }] =
      await Promise.all([
        supabase.from("categories").select("id,name").eq("tenant_id", tenantId),
        supabase.from("products").select("id,slug").eq("tenant_id", tenantId),
      ]);

    if (categoriesError) throw categoriesError;
    if (productsError) throw productsError;

    const categoryIdsByName = new Map(
      (categories || []).map((cat) => [normalizeText(cat.name), cat.id]),
    );
    const productsBySlug = new Map(
      (existingProducts || []).map((product) => [normalizeText(product.slug), product]),
    );

    const parsedRows = rows.map((row, index) =>
      parseProductRow(row, index, categoryIdsByName),
    );
    const errorRows = parsedRows.filter((row) => row.errors.length > 0);
    const validRows = parsedRows.filter((row) => row.errors.length === 0);

    const preview = parsedRows.map((row) => {
      const existing = productsBySlug.get(normalizeText(row.normalized.slug));
      return {
        rowNumber: row.rowNumber,
        action: existing ? "update" : "create",
        name: row.normalized.name,
        slug: row.normalized.slug,
        errors: row.errors,
      };
    });

    if (mode === "dry_run" || errorRows.length > 0) {
      return Response.json({
        success: errorRows.length === 0,
        mode: "dry_run",
        summary: {
          totalRows: rows.length,
          validRows: validRows.length,
          invalidRows: errorRows.length,
        },
        preview,
      });
    }

    let created = 0;
    let updated = 0;

    for (const row of validRows) {
      const payload = row.normalized;
      const existing = productsBySlug.get(normalizeText(payload.slug));
      const baseData = {
        tenant_id: tenantId,
        name: payload.name,
        slug: payload.slug,
        short_description: payload.short_description,
        description: payload.description,
        price: payload.price,
        discount_price: payload.discount_price,
        status: payload.status,
        featured: payload.featured,
        base_currency: payload.base_currency,
        images: (payload.images || []).slice(0, 5),
        category_id: payload.category_ids[0] || null,
      };

      let productId = existing?.id;

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("products")
          .update(baseData)
          .eq("id", existing.id)
          .eq("tenant_id", tenantId);
        if (updateError) throw updateError;
        updated += 1;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("products")
          .insert([baseData])
          .select("id")
          .single();
        if (insertError) throw insertError;
        productId = inserted.id;
        productsBySlug.set(normalizeText(payload.slug), { id: inserted.id, slug: payload.slug });
        created += 1;
      }

      await syncProductCategories(supabase, {
        productId,
        tenantId,
        categoryIds: payload.category_ids,
      });
      await syncProductVariants(supabase, {
        productId,
        tenantId,
        variants: payload.variants,
      });
      await syncProductStock(supabase, {
        productId,
        stock: payload.stock,
      });
    }

    return Response.json({
      success: true,
      mode: "apply",
      summary: {
        totalRows: rows.length,
        appliedRows: validRows.length,
        created,
        updated,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error importando productos." },
      { status: 500 },
    );
  }
}
