"use client";
import { useState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useTenantCart } from "@/lib/useCartStore";
import { useFilterStore } from "@/lib/useFilterStore";
import MiniCart from "./public/cart/MiniCart";
import { motion, AnimatePresence } from "framer-motion";

import { useSiteConfig } from "@/context/SiteConfigContext";
import { useTenantHeroMetrics } from "@/context/TenantHeroMetricsContext";
import AdaptiveImage from "./ui/AdaptiveImage";
import {
  DEFAULT_HEADER_MENU,
  HERO_VARIANT_CINEMATIC,
  HERO_WIDTH_IMMERSIVE,
  normalizeHeaderMenu,
  normalizeHomeIntro,
  PLATFORM_BRAND_HOSTNAME,
} from "@/lib/siteConfig";

const SCROLL_SHOW_TOP = 72;
const SCROLL_HIDE_DELTA = 10;
const SCROLL_SHOW_UP_DELTA = 5;
/** Pixels antes del borde inferior del hero donde pasa a barra sólida */
const HERO_GLASS_END_BUFFER = 40;

export default function Header() {
  const pathname = usePathname();
  const { site_name, header_menu, tenant_slug, home_intro, commerce_settings } =
    useSiteConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const setPendingCategory = useFilterStore((s) => s.setPendingCategory);
  const mobileMenuTitleId = useId();

  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const { heroBottomScrollY } = useTenantHeroMetrics();

  const intro = normalizeHomeIntro(home_intro);
  const isTenantHome =
    !!tenant_slug &&
    (pathname === `/${tenant_slug}` || pathname === `/${tenant_slug}/`);
  const cinematicOnHome =
    isTenantHome && intro.hero_variant === HERO_VARIANT_CINEMATIC;

  const heroEndFallback =
    typeof window !== "undefined" ? window.innerHeight * 0.92 : 1e6;
  const heroDocumentEnd =
    heroBottomScrollY ?? (cinematicOnHome ? heroEndFallback : 0);

  /** Cristal / menú oscuro solo con hero a pantalla completa; en cinematic contenido se usa barra tipo “split”. */
  const immersiveGlass =
    cinematicOnHome &&
    intro.hero_width_mode === HERO_WIDTH_IMMERSIVE &&
    scrollY < heroDocumentEnd - HERO_GLASS_END_BUFFER;

  const handleCategoryNav = (category) => {
    setPendingCategory(category);
    router.push(`${baseUrl}/products?category=${encodeURIComponent(category)}`);
    setIsMenuOpen(false);
  };

  const handleProductsNav = () => {
    router.push(`${baseUrl}/products`);
    setIsMenuOpen(false);
  };

  const { getTotalItems } = useTenantCart(tenant_slug);
  const totalItems = getTotalItems();
  const dynamicMenu = normalizeHeaderMenu(header_menu || DEFAULT_HEADER_MENU);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      setScrollY(y);

      if (isMenuOpen || isCartOpen) {
        setHeaderHidden(false);
        lastScrollY.current = y;
        return;
      }

      if (y < SCROLL_SHOW_TOP) {
        setHeaderHidden(false);
        lastScrollY.current = y;
        return;
      }

      const delta = y - lastScrollY.current;
      if (delta > SCROLL_HIDE_DELTA) {
        setHeaderHidden(true);
      } else if (delta < -SCROLL_SHOW_UP_DELTA) {
        setHeaderHidden(false);
      }
      lastScrollY.current = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, isMenuOpen, isCartOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-honey-light bg-paper">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="text-xl font-serif font-bold tracking-tighter text-ink uppercase">
            {site_name}
          </div>
        </div>
      </header>
    );
  }

  const headerSurface = immersiveGlass
    ? "border-b border-white/15 bg-black/25 backdrop-blur-md supports-[backdrop-filter]:bg-black/20"
    : "border-b border-honey-light bg-paper/80 backdrop-blur-md";

  const ink = immersiveGlass ? "text-white" : "text-ink";
  const honey = immersiveGlass ? "text-white/90" : "text-honey-dark";
  const hoverInk = immersiveGlass ? "hover:text-white" : "hover:text-ink";
  const navHover = immersiveGlass ? "hover:text-white" : "hover:text-ink";

  const mobilePanelSurface = immersiveGlass
    ? "bg-zinc-950/95 border border-white/15 text-white shadow-2xl shadow-black/50"
    : "bg-paper border border-honey-light text-honey-dark shadow-2xl shadow-zinc-900/10";

  const mobileNavItemClass = immersiveGlass
    ? "w-full text-left py-4 px-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase text-white/95 hover:bg-white/10 active:bg-white/15 transition-colors"
    : "w-full text-left py-4 px-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase text-honey-dark hover:bg-honey-light/30 hover:text-ink active:bg-honey-light/40 transition-colors";

  const backdropClass = immersiveGlass
    ? "bg-black/60 backdrop-blur-md"
    : "bg-black/45 backdrop-blur-sm";

  const headerTransform = headerHidden ? "-translate-y-full" : "translate-y-0";

  return (
    <>
      <header
        className={`${headerSurface} fixed top-0 left-0 right-0 z-50 h-16 w-full transition-all duration-300 ease-out ${headerTransform}`}
      >
        <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className={`lg:hidden h-10 w-10 flex items-center justify-center ${hoverInk} transition-colors ${honey} drop-shadow-sm`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-dialog"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              href={`${baseUrl}/`}
              className="hidden lg:flex items-center gap-3"
            >
              {commerce_settings?.logo_url && (
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  <AdaptiveImage
                    src={commerce_settings.logo_url}
                    alt={site_name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h1
                className={`text-xl font-serif font-bold tracking-tighter uppercase drop-shadow-sm ${ink}`}
              >
                {site_name}
              </h1>
            </Link>
          </div>

          <nav
            id="desktop-nav"
            className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center space-x-6 text-[12px] font-bold tracking-[0.2em] drop-shadow-sm ${honey}`}
          >
            {dynamicMenu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.target_id
                    ? handleCategoryNav(item.target_id)
                    : handleProductsNav()
                }
                className={`${navHover} transition cursor-pointer`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className={`flex items-center ${honey}`}>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`relative h-10 w-10 cursor-pointer flex items-center justify-center ${hoverInk} transition-colors drop-shadow-sm`}
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                      immersiveGlass
                        ? "bg-white text-black"
                        : "bg-ink text-paper"
                    }`}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

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
                    fill
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
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            key="mobile-menu-root"
            id="mobile-nav-dialog"
            className="lg:hidden fixed inset-0 z-100 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className={`absolute inset-0 ${backdropClass}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.nav
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileMenuTitleId}
              className={`relative z-10 w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl ${mobilePanelSurface}`}
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between gap-3 p-5 border-b ${
                  immersiveGlass ? "border-white/10" : "border-honey-light/80"
                }`}
              >
                <p
                  id={mobileMenuTitleId}
                  className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                    immersiveGlass ? "text-white/60" : "text-honey-dark"
                  }`}
                >
                  Menú
                </p>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
                    immersiveGlass
                      ? "text-white hover:bg-white/10"
                      : "text-ink hover:bg-honey-light/40"
                  }`}
                  aria-label="Cerrar menú"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col p-3 pb-5 gap-1">
                {dynamicMenu.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      item.target_id
                        ? handleCategoryNav(item.target_id)
                        : handleProductsNav()
                    }
                    className={mobileNavItemClass}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MiniCart open={isCartOpen} setOpen={setIsCartOpen} />

      {/* Botón Flotante Marketplace */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            // Ajustamos la posición para móviles (más cerca del borde)
            className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40"
          >
            <Link
              href="/"
              // Reducimos el padding en móviles para que sea casi circular
              className="flex items-center gap-0 md:gap-3 p-2 md:pl-3 md:pr-6 md:py-3 rounded-full bg-paper/60 backdrop-blur-xl border border-honey-light/50 shadow-2xl shadow-zinc-900/10 hover:bg-paper/80 hover:scale-105 transition-all group"
            >
              {/* Icono: Siempre visible */}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-ink flex items-center justify-center text-paper group-hover:rotate-12 transition-transform">
                <ShoppingBag size={16} className="md:w-5 md:h-5" />
              </div>

              {/* Texto: Oculto en móviles, visible desde tablets (md) en adelante */}
              <div className="hidden md:flex flex-col pr-1">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-honey-dark opacity-60 leading-none mb-1">
                  Volver a
                </span>
                <span className="text-[12px] font-black uppercase tracking-widest text-ink leading-none">
                  DeployShop
                </span>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
