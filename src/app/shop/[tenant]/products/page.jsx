import AnimatedHeaderProducts from "@/components/public/products/AnimatedHeaderProduct";
import AnimatedProducts from "@/components/public/products/AnimatedProducts";
import { getPublicCategoriesFlat } from "@/services/categories";
import { getProducts } from "@/services/products";
import { DEFAULT_SITE_NAME, getSiteConfig } from "@/lib/siteConfig";
import { getTenantIdBySlugCached } from "@/lib/siteConfig.server";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { tenant } = await params;
  const { site_name } = await getSiteConfig({ tenantSlug: tenant });
  const brand = site_name || DEFAULT_SITE_NAME;

  return {
    title: `Catálogo | ${brand}`,
    description: "Explora nuestro set de piezas esenciales.",
  };
}

export default async function ProductsPage({ params }) {
  const { tenant } = await params;

  // ISR: Usamos el caché seguro de server sin cookies
  const tenantId = await getTenantIdBySlugCached(tenant);

  // 2. Ejecutamos ambas peticiones en paralelo para mayor velocidad
  const [productsRaw, categories] = await Promise.all([
    getProducts(tenantId),
    getPublicCategoriesFlat(tenantId),
  ]);

  // 3. Mapeo de categorías en el servidor para evitar joins ambiguos en Supabase
  const products = productsRaw.map((product) => ({
    ...product,
    category: categories.find((cat) => cat.id === product.category_id) || null,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <section className="py-24">
        <AnimatedHeaderProducts />

        {/* 3. Pasamos las categorías al componente cliente */}
        <AnimatedProducts products={products} categories={categories} />
      </section>
    </div>
  );
}
