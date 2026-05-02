"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MoveLeft, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();
  const firstSegment = pathname?.split("/").filter(Boolean)[0] || "";
  const reservedSegments = new Set([
    "admin",
    "access",
    "platform-access",
    "tenants",
    "register",
    "api",
    "_next",
  ]);

  const tenantBase =
    firstSegment && !reservedSegments.has(firstSegment)
      ? `/${firstSegment}`
      : "";
  const homeHref = tenantBase || "/";
  const catalogHref = tenantBase ? `${tenantBase}/products` : "/";

  return (
    <main className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-honey-light/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-honey-light/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white border border-honey-light/50 rounded-[3rem] p-8 md:p-14 shadow-2xl shadow-ink/5 text-center relative z-10 backdrop-blur-sm">
          {/* Badge superior */}
          <div className="flex justify-center mb-8">
            <div className="bg-honey-light/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <Sparkles size={14} className="text-honey-dark" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-honey-dark">
                Página No Encontrada
              </span>
            </div>
          </div>

          {/* Título 404 */}
          <h1 className="text-[120px] md:text-[160px] font-serif font-bold text-ink leading-none tracking-tighter italic opacity-10 absolute left-1/2 -top-10 -translate-x-1/2 select-none pointer-events-none">
            404
          </h1>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink uppercase tracking-tight mb-4">
              Oops... lo sentimos
            </h2>
            <p className="text-sm md:text-base text-honey-dark font-medium italic mb-10 max-w-sm mx-auto">
              Parece que este producto no existe o el enlace ha dejado de
              existir.
            </p>

            {/* Acciones principales */}
            <div className="flex flex-col gap-4 max-w-xs mx-auto mb-4">
              <Button
                asChild
                className="w-full h-14 bg-ink text-paper hover:bg-ink/90 shadow-xl shadow-ink/10 font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl group transition-all"
              >
                <Link
                  href={homeHref}
                  className="flex items-center justify-center gap-2"
                >
                  <MoveLeft
                    size={16}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  Volver al inicio
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full h-14 border-honey-light text-ink hover:border-ink hover:bg-transparent font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl group transition-all"
              >
                <Link
                  href={catalogHref}
                  className="flex items-center justify-center gap-2"
                >
                  Explorar Catálogo
                  <ShoppingBag
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Branding inferior */}
        <p className="text-center mt-10 text-[10px] font-bold uppercase tracking-[0.4em] text-ink/20 italic">
          — Deploy Shop —
        </p>
      </motion.div>
    </main>
  );
}
