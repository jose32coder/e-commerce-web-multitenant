"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/useCartStore";
import { useFilterStore } from "@/lib/useFilterStore";
import MiniCart from "./public/cart/MiniCart";
import { motion, AnimatePresence } from "framer-motion";

import { useSiteConfig } from "@/context/SiteConfigContext";
import { DEFAULT_HEADER_MENU, normalizeHeaderMenu } from "@/lib/siteConfig";

export default function Header() {
  const { site_name, header_menu, tenant_slug } = useSiteConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const setPendingCategory = useFilterStore((s) => s.setPendingCategory);

  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";

  const handleCategoryNav = (category) => {
    setPendingCategory(category);
    router.push(`${baseUrl}/products?category=${encodeURIComponent(category)}`);
    setIsMenuOpen(false);
  };

  const handleProductsNav = () => {
    router.push(`${baseUrl}/products`);
    setIsMenuOpen(false);
  };

  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const dynamicMenu = normalizeHeaderMenu(header_menu || DEFAULT_HEADER_MENU);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="border-b border-honey-light bg-paper sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="text-xl font-serif font-bold tracking-tighter text-ink uppercase">
            {site_name}
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="border-b border-honey-light bg-paper/80 backdrop-blur-md sticky top-0 z-50 h-16 w-full">
        <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">
          {/* IZQUIERDA: Burger (mobile) + Logo (desktop) */}
          <div className="flex items-center">
            <button
              className="md:hidden h-10 w-10 flex items-center justify-center hover:text-ink transition-colors text-honey-dark"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

<<<<<<< Updated upstream
            <Link href={`${baseUrl}/`} className="hidden md:block">
              <h1 className="text-xl font-serif font-bold tracking-tighter text-ink uppercase">
                {site_name}
              </h1>
=======
            <Link
              href={`${baseUrl}/`}
              className="hidden lg:flex items-center gap-3"
            >
              {commerce_settings?.logo_url ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  <AdaptiveImage
                    src={commerce_settings.logo_url}
                    alt={site_name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              ) : (
                <h1
                  className={`text-xl font-serif font-bold tracking-tighter uppercase drop-shadow-sm ${ink}`}
                >
                  {site_name}
                </h1>
              )}
>>>>>>> Stashed changes
            </Link>
          </div>

          {/* CENTRO: Navegación Desktop */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-6 text-[12px] font-bold tracking-[0.2em] text-honey-dark">
            {dynamicMenu.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  item.target_id
                    ? handleCategoryNav(item.target_id)
                    : handleProductsNav()
                }
                className="hover:text-ink transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <Link href={`${baseUrl}/products`} className="hover:text-ink transition">
              Colecciones
            </Link>
          </nav>

          {/* DERECHA: MiniCart */}
          <div className="flex items-center text-honey-dark">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative h-10 w-10 flex items-center justify-center hover:text-ink transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-ink text-paper text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

<<<<<<< Updated upstream
          {/* LOGO CENTRADO EN MOBILE */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 w-[calc(100%-7.5rem)] max-w-[320px] text-center">
            <Link href={`${baseUrl}/`} className="block">
              <h1 className="text-base font-serif font-bold tracking-tight text-ink uppercase truncate">
                {site_name}
              </h1>
=======
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 w-[calc(100%-7.5rem)] max-w-[320px] text-center">
            <Link
              href={`${baseUrl}/`}
              className="flex items-center justify-center gap-2"
            >
              {commerce_settings?.logo_url ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-md">
                  <AdaptiveImage
                    src={commerce_settings.logo_url}
                    alt={site_name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              ) : (
                <h1
                  className={`text-base font-serif font-bold tracking-tight uppercase truncate drop-shadow-sm ${ink}`}
                >
                  {site_name}
                </h1>
              )}
>>>>>>> Stashed changes
            </Link>
          </div>
        </div>

        {/* Menú Móvil */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-paper border-b border-honey-light absolute w-full left-0 z-40"
            >
              <nav className="flex flex-col p-6 space-y-4 text-xs font-bold tracking-widest text-honey-dark">
                {dynamicMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      item.target_id
                        ? handleCategoryNav(item.target_id)
                        : handleProductsNav()
                    }
                    className="text-left hover:text-ink transition"
                  >
                    {item.label}
                  </button>
                ))}
                <Link href={`${baseUrl}/products`} onClick={() => setIsMenuOpen(false)}>
                  Colecciones
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MiniCart open={isCartOpen} setOpen={setIsCartOpen} />
    </>
  );
}
