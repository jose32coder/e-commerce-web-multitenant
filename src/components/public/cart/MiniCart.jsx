"use client";

import { useCartStore } from "@/lib/useCartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useSiteConfig } from "@/context/SiteConfigContext";
import AdaptiveImage from "@/components/ui/AdaptiveImage";
import { getOptimizedImage } from "@/lib/getOptimizedImage";

export default function MiniCart({ open, setOpen }) {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const { tenant_slug } = useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";

  const [mounted, setMounted] = useState(
    () => useCartStore.persist?.hasHydrated?.() ?? true,
  );

  useEffect(() => {
    const unsubscribe = useCartStore.persist?.onFinishHydration?.(() =>
      setMounted(true),
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (!mounted) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-honey-light bg-paper">
        {/* Encabezado */}
        <SheetHeader className="p-6 border-b border-honey-light">
          <SheetTitle className="flex items-center gap-2 font-serif text-xl uppercase tracking-tighter text-ink">
            <ShoppingBag size={20} /> Tu Carrito
          </SheetTitle>
        </SheetHeader>

        {/* Cuerpo del Carrito */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center space-y-4 text-center"
              >
                <div className="w-20 h-20 bg-honey-light/30 rounded-full flex items-center justify-center text-honey-dark">
                  <ShoppingBag size={32} />
                </div>
                <p className="text-honey-dark font-medium italic">
                  Tu carrito está vacío
                </p>
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-ink hover:bg-ink hover:text-paper transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
                  >
                    Continuar Comprando
                  </Button>
                </SheetClose>
              </motion.div>
            ) : (
<<<<<<< Updated upstream
              items.map((item) => (
                <motion.div
                  key={`${item.id}-${item.variant}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4"
                >
                  {/* Imagen - Usa el array de strings de Supabase */}
                  <div className="relative w-20 h-24 bg-secondary rounded-lg overflow-hidden shrink-0 border border-honey-light">
                    <AdaptiveImage
                      src={item.images?.[0] || "/placeholder.jpg"}
                      alt={item.name || "Producto"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Información del Producto */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-[13px] font-bold uppercase tracking-tight text-ink line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id, item.variant)}
                          className="text-honey-dark hover:text-ink transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Variante (Talla) */}
                      {item.variant && (
                        <p className="text-[10px] text-honey-dark font-bold uppercase tracking-widest mt-1">
                          Talla:{" "}
                          <span className="text-ink">{item.variant}</span>
                        </p>
                      )}

                      {/* Breve descripción para dar contexto visual */}
                      {item.short_description && (
                        <p className="text-[11px] text-honey-dark/70 line-clamp-1 mt-0.5">
                          {item.short_description}
                        </p>
                      )}

                      <span className="text-[13px] font-bold text-ink mt-1 block">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      {Number(item.price_adjustment) > 0 && (
                        <p className="text-[10px] text-amber-700 font-semibold mt-1">
                          +${Number(item.price_adjustment).toFixed(2)} por
                          variante
                        </p>
                      )}
                    </div>

                    {/* Selector de Cantidad */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-honey-light rounded-full p-0.5">
                        <button
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.variant,
                            )
                          }
                          className="p-1 px-2 text-honey-dark hover:text-ink disabled:opacity-30"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-[11px] font-bold w-6 text-center">
                          {item.quantity}
=======
              items.map((item) => {
                const itemBaseCurrency = item.base_currency || "USD";
                const firstImage = item.images?.[0];
                const itemImage =
                  (typeof firstImage === "string"
                    ? firstImage
                    : firstImage?.url) ||
                  item.image_url ||
                  "/placeholder.jpg";
                const optimizedItemImage = getOptimizedImage(itemImage, 240);
                const itemPriceConverted = convertPrice(
                  (Number(item.price) || 0) + (Number(item.price_adjustment) || 0),
                  itemBaseCurrency,
                  targetCurrency,
                  exchange_rates
                );
                const adjustmentConverted = convertPrice(
                  Number(item.price_adjustment) || 0,
                  itemBaseCurrency,
                  targetCurrency,
                  exchange_rates
                );

                return (
                  <motion.div
                    key={`${item.id}-${item.variant}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4"
                  >
                    {/* Imagen - Usa el array de strings de Supabase */}
                    <div className="product-media-thumb bg-secondary w-20 shrink-0 border border-honey-light">
                      <AdaptiveImage
                        src={optimizedItemImage}
                        alt={item.name || "Producto"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Información del Producto */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-[13px] font-bold uppercase tracking-tight text-ink line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id, item.variant)}
                            className="text-honey-dark hover:text-ink transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Variante (Talla) */}
                        {item.variant && (
                          <p className="text-[10px] text-honey-dark font-bold uppercase tracking-widest mt-1">
                            Variante:{" "}
                            <span className="text-ink">{item.variant}</span>
                          </p>
                        )}

                        {/* Breve descripción para dar contexto visual */}
                        {item.short_description && (
                          <p className="text-[11px] text-honey-dark/70 line-clamp-1 mt-0.5">
                            {item.short_description}
                          </p>
                        )}
                        <span className="text-[13px] font-bold text-ink mt-1 block">
                          {currencySymbol}{itemPriceConverted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
>>>>>>> Stashed changes
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                              item.variant,
                            )
                          }
                          className="p-1 px-2 text-honey-dark hover:text-ink"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer con Totales */}
        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-honey-light sm:flex-col gap-3">
            <div className="w-full space-y-2 mb-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-honey-dark font-medium uppercase tracking-widest text-[10px]">
                  Subtotal
                </span>
                <span className="font-bold text-ink">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
            <div className="w-full grid grid-cols-1 gap-2">
              <Button
                asChild
                onClick={() => setOpen(false)}
                className="w-full bg-ink text-paper hover:bg-ink/90 font-bold uppercase text-[10px] tracking-[0.2em] h-12 shadow-lg shadow-ink/10"
              >
                <Link href={`${baseUrl}/checkout`}>Finalizar Compra</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full border-honey-light hover:border-ink text-honey-dark hover:text-ink font-bold uppercase text-[10px] tracking-[0.2em] h-12 group"
              >
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2"
                >
                  Ver Carrito Completo{" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
