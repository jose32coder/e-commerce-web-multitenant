export async function shareProduct({ name, tenantSlug, slug }) {
  if (typeof window === "undefined") return { ok: false, method: "none" };

  const safeTenant = tenantSlug ? `/${tenantSlug}` : "";
  const safeSlug = slug ? `/products/${slug}` : "";
  const url = `${window.location.origin}${safeTenant}${safeSlug}`;
  const text = `Mira este producto: ${name || "Producto"}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: name || "Producto", text, url });
      return { ok: true, method: "native", url };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, method: "cancelled", url };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, method: "clipboard", url };
  } catch (_error) {
    const waText = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
    return { ok: true, method: "whatsapp", url };
  }
}
