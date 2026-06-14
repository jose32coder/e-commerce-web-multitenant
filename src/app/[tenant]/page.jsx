// src/app/page.js

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import AnimatedHeader from "@/components/AnimatedHeader";
import HomeHero from "@/components/public/home-hero/HomeHero";
import PromoDivider from "@/components/PromoDivider";
import { getProducts } from "@/services/products";
import { getPublicCategoriesFlat } from "@/services/categories";
import { getTenantIdBySlugCached } from "@/lib/siteConfig.server";
import ProductCarouselSection from "@/components/public/products/ProductCarouselSection";

export const revalidate = 3600;

export default async function HomePage({ params }) {
  const { tenant } = await params;

  // Usa caché directa en memoria sin Cookies (¡ISR puro!)
  const tenantId = await getTenantIdBySlugCached(tenant);

  // 1. Obtener todos los productos y las categorías en paralelo
  const [productsRaw, categories] = await Promise.all([
    getProducts(tenantId),
    getPublicCategoriesFlat(tenantId),
  ]);

  // 2. Mapeo de categorías en el servidor para evitar joins ambiguos en Supabase
  const allProducts = productsRaw.map((product) => ({
    ...product,
    category: categories.find((cat) => cat.id === product.category_id) || null,
  }));

  // 3. Clasificación de productos según las reglas de ofertas y destacados
  const hasPromotion = (product) => {
    const isVariantOnlyPricing = product.use_variant_only_pricing === true;
    if (isVariantOnlyPricing) return false;
    const price = Number(product.price) || 0;
    const discountPrice = Number(product.discount_price) || 0;
    return discountPrice > 0 && discountPrice < price;
  };

  const ofertasProducts = allProducts.filter((p) => hasPromotion(p));
  const featuredProducts = allProducts.filter(
    (p) => p.featured && !hasPromotion(p),
  );

  const baseUrl = `/${tenant}`;

  return (
    <>
      <HomeHero baseUrl={baseUrl} />

      <div className="max-w-[1800px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 xl:px-10">
        <section className="py-24 min-h-screen" id="products-section">
          <AnimatedHeader />

          {/* Carrusel de Ofertas (Derecha a Izquierda) */}
          <ProductCarouselSection
            title="Ofertas"
            products={ofertasProducts}
            categories={categories}
            direction="left"
          />

          {/* Carrusel de Destacados (Izquierda a Derecha) */}
          <ProductCarouselSection
            title="Destacados"
            products={featuredProducts}
            categories={categories}
            direction="right"
          />

          {ofertasProducts.length === 0 && featuredProducts.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-honey-dark font-serif italic text-lg max-w-md mx-auto">
                Parece que aún no tenemos piezas destacadas ni en oferta
                preparadas. ¡Pero esto es solo el principio!
              </p>
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <Button
              asChild
              variant="outline"
              className="border-ink text-ink hover:bg-ink hover:text-paper px-8 h-12 font-bold uppercase text-[10px] tracking-[0.2em] transition-all duration-300 group"
            >
              <Link
                href={`${baseUrl}/products`}
                className="flex items-center gap-2"
              >
                Explorar Colección Completa
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </Button>
          </div>
          <PromoDivider />

          {/* Sección Legal Resumida */}
          <div className="mt-24 pt-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <div className="text-center md:text-left max-w-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-2">
                Compromiso y Transparencia
              </h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Nuestra prioridad es ofrecerte una experiencia de compra segura. 
                Conoce más sobre cómo manejamos tus datos y las condiciones de nuestro servicio.
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                href={`${baseUrl}/privacy`}
                className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors border-b border-transparent hover:border-zinc-900 pb-0.5"
              >
                Privacidad
              </Link>
              <Link 
                href={`${baseUrl}/terms`}
                className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors border-b border-transparent hover:border-zinc-900 pb-0.5"
              >
                Términos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
