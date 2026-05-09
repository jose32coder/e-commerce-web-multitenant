"use server";

import { logAudit } from "@/lib/auditLog";
import { formatWhatsappContactNumber } from "@/lib/siteConfig";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";

// Esquema de validación estricto para Checkout
const CheckoutSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto").max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  phone: z.string().min(10, "Teléfono inválido").max(15),
  idNumber: z.string().min(5, "Cédula/RIF inválido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Método de pago requerido"),
  reference: z.string().min(3, "Referencia demasiado corta").max(50),
  customerPhoneCountryCode: z.string().optional().nullable(),
  tenantId: z.union([z.string(), z.number()]).nullable().optional(),
  tenantSlug: z.string().nullable().optional(),
  shippingMethod: z.enum(["local", "national", "delivery", "pickup"]),
  shippingProvider: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  idempotencyKey: z.string().uuid().optional(),
});

const normalizeVariantValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const CUSTOMER_TABLE = "customers";

const getErrorMessage = (error) =>
  error?.message || error?.details || "Error desconocido";

const isNoRowsError = (error) => error?.code === "PGRST116";

const isMissingTableError = (error) =>
  error?.code === "PGRST205" ||
  /Could not find the table/i.test(getErrorMessage(error));

const getMissingColumnName = (error) => {
  const message = getErrorMessage(error);
  if (!message) return null;

  const pgrstMatch = message.match(/Could not find the '([^']+)' column/i);
  if (pgrstMatch?.[1]) return pgrstMatch[1];

  const pgMatch = message.match(/column ["']?([^"'\s]+)["']? does not exist/i);
  if (pgMatch?.[1]) return pgMatch[1];

  return null;
};

const findExistingCustomer = async (supabase, idNumber, tenantId) => {
  // Extraemos solo los dígitos para búsqueda legacy
  const rawIdNumber = String(idNumber || "").replace(/\D/g, "");

  return supabase
    .from(CUSTOMER_TABLE)
    .select("id")
    .or(`id_number.eq.${idNumber},id_number.eq.${rawIdNumber}`)
    .eq("tenant_id", tenantId)
    .limit(1)
    .single();
};

const insertCustomer = async (supabase, payload) =>
  supabase.from(CUSTOMER_TABLE).insert([payload]).select("id").single();

const createOrderWithFallback = async (supabase, payload) => {
  const orderPayload = { ...payload };

  while (true) {
    const { data, error } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select("id, order_number")
      .single();

    if (!error) {
      return { data, error: null, usedPayload: orderPayload };
    }

    const missingColumn = getMissingColumnName(error);
    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(orderPayload, missingColumn)
    ) {
      delete orderPayload[missingColumn];
      continue;
    }

    return { data: null, error, usedPayload: orderPayload };
  }
};

export async function processCheckoutOrder(formData, items = [], total) {
  try {
    items = Array.isArray(items) ? items : [];
    const supabase = getAdminSupabaseClient();

    if (items.length === 0) {
      throw new Error("El carrito está vacío o no se pudieron leer los productos del pedido.");
    }

    // 0. Validación de Esquema (Anti-Inyección y Datos Corruptos)
    const validation = CheckoutSchema.safeParse(formData);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Datos inválidos: ${errorMsg}`);
    }

    const validatedData = validation.data;

    let tenantId = validatedData.tenantId;
    const tenantSlug = validatedData.tenantSlug;

    // 0.1 Chequeo de Idempotencia (Evitar duplicados)
    if (validatedData.idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("idempotency_key", validatedData.idempotencyKey)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existingOrder) {
        return {
          success: true,
          orderId: String(existingOrder.id),
          orderNumber: existingOrder.order_number,
          isDuplicate: true
        };
      }
    }

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("tenant_id, status")
      .eq("tenant_id", tenantId)
      .single();

    if (tenantError || !tenantData) {
      throw new Error(
        `No se pudo validar el tenant del pedido: ${getErrorMessage(tenantError)}`,
      );
    }

    let defaultPhoneCountryCode = String(
      validatedData.customerPhoneCountryCode || "",
    ).replace(/\D/g, "");

    if (defaultPhoneCountryCode !== "57" && defaultPhoneCountryCode !== "58") {
      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("commerce_settings, footer_commerce")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const configuredCode =
        siteSettings?.commerce_settings?.customer_phone_country_code ||
        siteSettings?.footer_commerce?.commerce_settings
          ?.customer_phone_country_code ||
        siteSettings?.footer_commerce?.customer_phone_country_code ||
        "58";

      defaultPhoneCountryCode = String(configuredCode).replace(/\D/g, "");
    }

    if (defaultPhoneCountryCode !== "57" && defaultPhoneCountryCode !== "58") {
      defaultPhoneCountryCode = "58";
    }

    const normalizedCustomerPhone = formatWhatsappContactNumber(
      validatedData.phone,
      defaultPhoneCountryCode,
    );

    // 0.2 Rate Limit basado en DB (Cooldown de 60 segundos por cliente)
    const { data: recentOrder } = await supabase
      .from("orders")
      .select("created_at")
      .or(`customer_id_number.eq.${validatedData.idNumber},customer_phone.eq.${normalizedCustomerPhone}`)
      .eq("tenant_id", tenantId)
      .gt("created_at", new Date(Date.now() - 60000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recentOrder) {
      throw new Error("Has intentado realizar un pedido hace muy poco. Por favor, espera 60 segundos.");
    }

    if (String(tenantData.status || "").toLowerCase() !== "active") {
      throw new Error("La tienda no está activa para procesar pedidos.");
    }

    // 1. Buscar o Crear Cliente
    let clienteId = null;
    let isNewClient = false;

    const { data: existingCustomer, error: searchError } =
      await findExistingCustomer(supabase, formData.idNumber, tenantId);

    if (existingCustomer) {
      clienteId = existingCustomer.id;

      // Actualizar los datos del cliente existente para asegurar que siempre haya email o teléfono actualizado
      const { error: updateCustomerError } = await supabase
        .from(CUSTOMER_TABLE)
        .update({
          full_name: validatedData.name,
          phone: normalizedCustomerPhone,
          ...(validatedData.email ? { email: validatedData.email } : {}),
        })
        .eq("id", clienteId)
        .eq("tenant_id", tenantId);

      if (updateCustomerError) {
        console.warn(
          `Error al actualizar datos del cliente existente (${clienteId}): ${getErrorMessage(updateCustomerError)}`,
        );
      }
    } else if (searchError && isNoRowsError(searchError)) {
      const { data: newCustomer, error: insertCustomerError } =
        await insertCustomer(supabase, {
          tenant_id: tenantId,
          id_number: formData.idNumber,
          full_name: formData.name,
          phone: normalizedCustomerPhone,
          email: formData.email || null,
        });

      if (insertCustomerError) {
        throw new Error(
          `Error al crear cliente en ${CUSTOMER_TABLE}: ${getErrorMessage(insertCustomerError)}`,
        );
      }

      clienteId = newCustomer.id;
      isNewClient = true;

      await logAudit(supabase, {
        tipo: "cliente",
        accion: "crear",
        descripcion: `Nuevo cliente registrado: ${formData.name} (Cédula: ${formData.idNumber})`,
        usuario_nombre: "Sistema (Checkout)",
        meta: {
          customer_table: CUSTOMER_TABLE,
          tenant_id: tenantId,
          cedula: validatedData.idNumber,
          nombre: validatedData.name,
          telefono: validatedData.phone,
          telefono_normalizado: normalizedCustomerPhone,
          email: validatedData.email,
        },
      });
    } else if (searchError && isMissingTableError(searchError)) {
      throw new Error(
        "No se encontró la tabla public.clientes. Verifica que exista y esté en el schema cache.",
      );
    } else if (searchError) {
      throw new Error(
        `Error al buscar cliente en ${CUSTOMER_TABLE}: ${getErrorMessage(searchError)}`,
      );
    }

    // 2. Validar y Descontar Stock (variante y global)
    for (const item of items) {
      if (!item.id) continue;

      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) continue;

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, product_stock(quantity)")
        .eq("id", item.id)
        .eq("tenant_id", tenantId)
        .single();

      if (productError || !productData) {
        throw new Error(
          `No se pudo validar stock para el producto ${item.name || item.title || item.id}.`,
        );
      }

      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("id, attributes, stock_quantity")
        .eq("product_id", item.id)
        .eq("tenant_id", tenantId);

      if (variantsError) {
        throw new Error(
          `Error al validar variantes de ${productData.name}: ${variantsError.message}`,
        );
      }

      const hasVariants =
        Array.isArray(variantsData) && variantsData.length > 0;
      const selectedVariantValue = normalizeVariantValue(item.variant);

      if (hasVariants) {
        if (!selectedVariantValue) {
          throw new Error(
            `El producto ${productData.name} requiere seleccionar una variante.`,
          );
        }

        let matchedVariant = null;

        // 1. Prioridad: Buscar por ID directo (agregado recientemente al carrito)
        if (item.variant_id) {
          matchedVariant = variantsData.find((v) => v.id === item.variant_id);
        }

        // 2. Fallback: Buscar comparando el string (ej: "verde / m")
        if (!matchedVariant) {
          matchedVariant = variantsData.find((v) => {
            if (!v.attributes) return false;
            // Unimos los valores del JSON igual que lo hace ProductView
            const values = Object.values(v.attributes).join(" / ");
            return normalizeVariantValue(values) === selectedVariantValue;
          });
        }

        if (!matchedVariant) {
          throw new Error(
            `La variante "${item.variant}" ya no está disponible para ${productData.name}.`,
          );
        }

        const currentVariantStock = Number(matchedVariant.stock_quantity) || 0;
        
        // SI ES ILIMITADO (>= 999999), NO DESCONTAMOS
        if (currentVariantStock >= 999999) {
          continue; 
        }

        if (currentVariantStock < quantity) {
          throw new Error(
            `Stock insuficiente en ${productData.name} (Variante seleccionada). Disponible: ${currentVariantStock}.`,
          );
        }

        const nextVariantStock = currentVariantStock - quantity;
        const { error: updateVariantError } = await supabase
          .from("product_variants")
          .update({ stock_quantity: nextVariantStock })
          .eq("id", matchedVariant.id)
          .eq("tenant_id", tenantId);

        if (updateVariantError) {
          throw new Error(
            `Error actualizando stock de variante para ${productData.name}: ${updateVariantError.message}`,
          );
        }

        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            tenant_id: tenantId,
            product_id: item.id,
            variant_id: matchedVariant.id,
            movement_type: "sale",
            quantity: quantity,
            reason: "Checkout order",
            reference_type: "checkout",
          });

        if (movementError) {
          throw new Error(
            `Error actualizando stock global de ${productData.name}: ${movementError.message}`,
          );
        }
      } else {
        const stockObj = Array.isArray(productData.product_stock)
          ? productData.product_stock[0]
          : productData.product_stock;
        const currentStock = stockObj ? Number(stockObj.quantity) : 0;

        // SI ES ILIMITADO (>= 999999), NO DESCONTAMOS
        if (currentStock >= 999999) {
          continue;
        }

        if (currentStock < quantity) {
          throw new Error(
            `Stock insuficiente para ${productData.name}. Disponible: ${currentStock}.`,
          );
        }

        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            tenant_id: tenantId,
            product_id: item.id,
            movement_type: "sale",
            quantity: quantity,
            reason: "Checkout order",
            reference_type: "checkout",
          });

        if (movementError) {
          throw new Error(
            `Error actualizando stock de ${productData.name}: ${movementError.message}`,
          );
        }
      }
    }

    // 3. Crear la Orden (Venta)
    const orderPayload = {
      tenant_id: tenantId,
      total,
      estado: "pending",
      customer_name: validatedData.name,
      customer_id_number: validatedData.idNumber,
      customer_phone: normalizedCustomerPhone,
      customer_email: validatedData.email,
      metodo_pago: validatedData.paymentMethod,
      referencia_pago: validatedData.reference,
      items: items.map((i) => ({
        id: i.id,
        name: i.name || i.title,
        quantity: i.quantity,
        price: i.price,
        variant: i.variant || null,
      })),
      notas: validatedData.notes,
      idempotency_key: validatedData.idempotencyKey, // Crítico para evitar duplicados
      shipping_method: validatedData.shippingMethod,
      shipping_provider: validatedData.shippingProvider,
      ...(clienteId ? { customer_id: clienteId } : {}),
    };

    const { data: newOrder, error: orderError } = await createOrderWithFallback(
      supabase,
      orderPayload,
    );

    if (orderError) {
      throw new Error(`Error al crear orden: ${getErrorMessage(orderError)}`);
    }

    // Registrar nueva venta en bitácora
    await logAudit(supabase, {
      tipo: "venta",
      accion: "crear",
      descripcion: `Nueva venta ${isNewClient ? "(cliente nuevo)" : "(cliente existente)"}: ${formData.name} — Total: $${Number(total).toFixed(2)}`,
      usuario_nombre: "Sistema (Checkout)",
      meta: {
        order_id: newOrder.id,
        cliente_id: clienteId,
        cliente_nuevo: isNewClient,
        total,
        payment_method: formData.paymentMethod,
        referencia: formData.reference,
        items: items.map((i) => ({
          id: i.id,
          name: i.name || i.title,
          qty: i.quantity,
          price: i.price,
        })),
      },
    });

    const normalizedOrderId =
      newOrder?.id !== undefined && newOrder?.id !== null
        ? String(newOrder.id)
        : null;

    const orderNumber = newOrder?.order_number || null;

    return {
      success: true,
      orderId: normalizedOrderId,
      orderNumber: orderNumber,
    };
  } catch (error) {
    console.error("Error en processCheckoutOrder:", error);
    return { success: false, error: error.message };
  }
}
