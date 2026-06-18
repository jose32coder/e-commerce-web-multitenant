export const STORE_TYPES = /** @type {const} */ ({
  clothing: {
    label: "Ropa",
    badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  },
  restaurant: {
    label: "Restaurante",
    badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  },
  hardware_store: {
    label: "Ferretería",
    badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  },
  florist: {
    label: "Floristería",
    badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  },
  beauty_salon: {
    label: "Salón de Belleza",
    badgeClass: "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200",
  },
  tech_service: {
    label: "Servicio Técnico",
    badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  general_services: {
    label: "Servicios Generales",
    badgeClass: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  },
});

export function getStoreTypeMeta(storeType) {
  if (!storeType) {
    return {
      key: "general",
      label: "General",
      badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
    };
  }

  const meta = STORE_TYPES[storeType];
  if (meta) return { key: storeType, ...meta };

  return {
    key: storeType,
    label: String(storeType)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (m) => m.toUpperCase()),
    badgeClass: "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  };
}

export function getStoreTypeOptions(tenants) {
  const seen = new Set();
  for (const tenant of tenants || []) {
    if (tenant?.store_type) seen.add(tenant.store_type);
  }

  return Array.from(seen)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((key) => ({ key, ...getStoreTypeMeta(key) }));
}
