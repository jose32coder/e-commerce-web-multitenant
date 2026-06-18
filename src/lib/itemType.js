/**
 * itemType.js — Centralizes the concept of "item type" (product vs service)
 * across the entire platform. Every UI and API decision about whether something
 * is a physical product or a service should reference these constants.
 */

export const ITEM_TYPE_PRODUCT = "product";
export const ITEM_TYPE_SERVICE = "service";

export const ITEM_TYPES = /** @type {const} */ ({
  [ITEM_TYPE_PRODUCT]: {
    label: "Producto",
    labelPlural: "Productos",
    badgeClass:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700/50",
    icon: "📦",
  },
  [ITEM_TYPE_SERVICE]: {
    label: "Servicio",
    labelPlural: "Servicios",
    badgeClass:
      "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-700/50",
    icon: "🛠️",
  },
});

/** @param {unknown} item */
export const isService = (item) =>
  item?.item_type === ITEM_TYPE_SERVICE;

/** @param {unknown} item */
export const isProduct = (item) =>
  !item?.item_type || item.item_type === ITEM_TYPE_PRODUCT;

/** Returns normalized item_type string (defaults to 'product') */
export const normalizeItemType = (value) =>
  value === ITEM_TYPE_SERVICE ? ITEM_TYPE_SERVICE : ITEM_TYPE_PRODUCT;

/** Returns metadata for a given item_type */
export const getItemTypeMeta = (type) =>
  ITEM_TYPES[normalizeItemType(type)] || ITEM_TYPES[ITEM_TYPE_PRODUCT];

/** Service booking modes */
export const BOOKING_MODE_WHATSAPP = "whatsapp";
export const BOOKING_MODE_CART = "cart";

export const normalizeBookingMode = (value) =>
  value === BOOKING_MODE_CART ? BOOKING_MODE_CART : BOOKING_MODE_WHATSAPP;
