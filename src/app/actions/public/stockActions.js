"use server";

import { getAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Valida el stock de una lista de items en tiempo real.
 * Retorna un array con los items que tienen problemas de disponibilidad.
 */
export async function validateCartStock(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  
  const supabase = getAdminSupabaseClient();
  const problems = [];

  try {
    for (const item of items) {
      if (!item.id) continue;

      // 1. Obtener datos básicos del producto
      const { data: product, error: pError } = await supabase
        .from("products")
        .select("id, name, manage_stock, product_stock(quantity)")
        .eq("id", item.id)
        .single();

      if (pError || !product) continue;

      // 2. Validar stock (si tiene variantes es más complejo)
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, attributes, stock_quantity")
        .eq("product_id", item.id);

      const hasVariants = Array.isArray(variants) && variants.length > 0;

      if (hasVariants && item.variant) {
        // Buscar la variante específica
        const matchedVariant = variants.find(v => {
          if (!v.attributes) return false;
          const label = Object.values(v.attributes).join(" / ").toLowerCase();
          return label === String(item.variant).toLowerCase();
        });

        if (!matchedVariant || matchedVariant.stock_quantity < item.quantity) {
          problems.push({
            id: item.id,
            name: product.name,
            variant: item.variant,
            available: matchedVariant ? matchedVariant.stock_quantity : 0,
            requested: item.quantity
          });
        }
      } else {
        // Validar stock global
        const currentStock = Array.isArray(product.product_stock) 
          ? (product.product_stock[0]?.quantity || 0)
          : (product.product_stock?.quantity || 0);

        if (currentStock < item.quantity) {
          problems.push({
            id: item.id,
            name: product.name,
            variant: null,
            available: currentStock,
            requested: item.quantity
          });
        }
      }
    }

    return problems;
  } catch (error) {
    console.error("Error validando stock del carrito:", error);
    return [];
  }
}
