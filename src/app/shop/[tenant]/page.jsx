// src/app/page.js

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import AnimatedHeader from "@/components/AnimatedHeader";
import AnimatedProducts from "@/components/public/products/AnimatedProducts";
import HomeHero from "@/components/public/home-hero/HomeHero";
import PromoDivider from "@/components/PromoDivider";
import { getHomeProducts } from "@/services/products";
import { getTenantIdBySlugCached } from "@/lib/siteConfig.server";

export const revalidate = 3600;

export default async function HomePage({ params }) {
  const { tenant } = await params;

  // Usa caché directa en memoria sin Cookies (¡ISR puro!)
  const tenantId = await getTenantIdBySlugCached(tenant);

  const products = await getHomeProducts(tenantId);

  const baseUrl = `/${tenant}`;

  return (
    <>
      <HomeHero baseUrl={baseUrl} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <section className="py-24 min-h-screen" id="products-section">
          <AnimatedHeader />

          <AnimatedProducts products={products} />

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
        </section>
      </div>
    </>
  );
}
