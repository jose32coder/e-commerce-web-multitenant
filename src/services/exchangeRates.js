import { createClient } from "@supabase/supabase-js";

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || "8d8eda43d62673bd2fadb0d8";
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
const CACHE_KEY = "exchange_rates_cache";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas en milisegundos

let pendingRequest = null; // Deduplicación de peticiones concurrentes

/**
 * Obtener tasas de cambio con caching multi-nivel:
 * 1. localStorage (cliente, 12 horas)
 * 2. Supabase DB (servidor, 12 horas)
 * 3. API externo (si ambos anteriores expiraron)
 */
export async function getExchangeRates(supabaseClient) {
  try {
    const now = new Date().getTime();

    // 1. Intentar leer localStorage (más rápido)
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { rates, timestamp } = JSON.parse(cached);
          if (now - timestamp < CACHE_TTL) {
            return rates;
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    // 2. Si hay petición pendiente, esperar a que termine (deduplicación)
    if (pendingRequest) {
      return await pendingRequest;
    }

    // 3. Intentar leer de Supabase DB
    const { data: cached, error: dbError } = await supabaseClient
      .from("exchange_rates")
      .select("*")
      .eq("id", "current_rates")
      .maybeSingle();

    if (cached && cached.rates) {
      const lastUpdate = new Date(cached.last_update).getTime();
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 12) {
        // Guardar en localStorage para próxima vez
        if (typeof window !== "undefined") {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rates: cached.rates, timestamp: now }),
          );
        }
        return cached.rates;
      }
    }

    // 4. Si no hay caché o es vieja, pedir al API (con deduplicación)
    pendingRequest = (async () => {
      try {
        const response = await fetch(BASE_URL);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from API");
        }

        const data = await response.json();

        if (data.result === "success") {
          const rates = data.conversion_rates;
          const nextUpdate = data.time_next_update_unix
            ? new Date(data.time_next_update_unix * 1000)
            : null;

          // 5. Guardar en Supabase DB
          await supabaseClient.from("exchange_rates").upsert({
            id: "current_rates",
            rates: rates,
            last_update: new Date().toISOString(),
            next_update: nextUpdate ? nextUpdate.toISOString() : null,
          });

          // 6. Guardar en localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ rates, timestamp: now }),
            );
          }

          return rates;
        }

        return cached?.rates || null;
      } catch (err) {
        console.warn("[Exchange] Nota: No se pudo actualizar desde el API (usando backup):", err.message);
        return cached?.rates || null;
      } finally {
        pendingRequest = null; // Limpiar pendingRequest
      }
    })();

    return await pendingRequest;
  } catch (error) {
    console.error("[Exchange] Error obteniendo tasas:", error);
    return null;
  }
}

/**
 * Formatea un precio basándose en la configuración del tenant.
 */
export function formatCurrency(amount, currencyCode = "USD") {
  const locales = {
    USD: "en-US",
    VES: "es-VE",
  };

  const formatter = new Intl.NumberFormat(locales[currencyCode] || "en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Convierte un monto de una moneda base a una moneda destino usando las tasas proporcionadas.
 * @param {number} amount - El monto a convertir.
 * @param {string} baseCurrency - Moneda original del producto (ej: 'USD').
 * @param {string} targetCurrency - Moneda actual de la tienda (ej: 'COP').
 * @param {object} exchangeRates - Objeto con las tasas de cambio (ej: { COP: 4000, VES: 38 }).
 * @returns {number} El monto convertido.
 */
export function convertPrice(amount, baseCurrency = "USD", targetCurrency = "USD", exchangeRates = null) {
  if (!amount || isNaN(amount)) return 0;
  if (baseCurrency === targetCurrency || !exchangeRates) return Number(amount);

  const amountNum = Number(amount);

  // Si la moneda base es USD, solo multiplicamos por la tasa destino
  if (baseCurrency === "USD") {
    const rateTo = exchangeRates[targetCurrency] || 1;
    return amountNum * rateTo;
  }

  // Si queremos llevar a USD desde otra moneda
  if (targetCurrency === "USD") {
    const rateFrom = exchangeRates[baseCurrency] || 1;
    return amountNum / rateFrom;
  }

  // Conversión cruzada (ej. de COP a VES)
  const rateFrom = exchangeRates[baseCurrency] || 1;
  const rateTo = exchangeRates[targetCurrency] || 1;

  // Llevamos a USD y luego a la moneda destino
  return (amountNum / rateFrom) * rateTo;
}
