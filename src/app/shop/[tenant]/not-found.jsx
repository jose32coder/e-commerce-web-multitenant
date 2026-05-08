"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MoveLeft, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function TenantNotFound() {
  const { tenant_slug, site_name } = useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const brand = site_name || "Tienda";

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white border border-honey-light/50 rounded-[3rem] p-8 md:p-14 shadow-2xl shadow-ink/5 text-center relative z-10">
          {/* Badge superior */}
          <div className="flex justify-center mb-8">
            <div className="bg-honey-light/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <Sparkles size={14} className="text-honey-dark" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-honey-dark">
                Contenido no encontrado
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink leading-none tracking-tighter mb-6">
              404
            </h1>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-ink uppercase tracking-tight mb-4">
              {brand} — Pieza no encontrada
            </h2>
            <p className="text-sm text-honey-dark font-medium italic mb-10 max-w-sm mx-auto">
              Esta sección de nuestra tienda no parece estar disponible. Te
              invitamos a explorar nuestras colecciones vigentes.
            </p>

            {/* Acciones principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="h-14 bg-ink text-paper hover:bg-ink/90 shadow-xl shadow-ink/10 font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl group transition-all px-8"
              >
                <Link
                  href={`${baseUrl}/`}
                  className="flex items-center justify-center gap-2"
                >
                  <MoveLeft
                    size={16}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  Inicio de tienda
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-14 border-honey-light text-ink hover:border-ink hover:bg-transparent font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl group transition-all px-8"
              >
                <Link
                  href={`${baseUrl}/products`}
                  className="flex items-center justify-center gap-2"
                >
                  Ver todos los productos
                  <ShoppingBag
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
