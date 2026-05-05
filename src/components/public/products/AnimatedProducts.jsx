"use client";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/public/products/ProductCard";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFilterStore } from "@/lib/useFilterStore";
import ProductFilters from "./ProductFilters";
import Link from "next/link";
import { useSiteConfig } from "@/context/SiteConfigContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
  },
};

const normalizeCategoryText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const resolveCategorySelection = (selection, categories = []) => {
  if (!selection) return "all";
  if (selection === "all") return "all";

  const normalizedSelection = normalizeCategoryText(selection);
  if (normalizedSelection === "all" || normalizedSelection === "todo") {
    return "all";
  }

  // Direct match by id if value already comes as category UUID.
  const byId = categories.find((cat) => cat.id === selection);
  if (byId) return byId.id;

  // Flexible match for name/slug variants (hombre, hombres, mujer, mujeres...).
  const byNameOrSlug = categories.find((cat) => {
    const normalizedName = normalizeCategoryText(cat.name);
    const normalizedSlug = normalizeCategoryText(cat.slug || "");
    const singularName = normalizedName.endsWith("s")
      ? normalizedName.slice(0, -1)
      : normalizedName;
    const singularSelection = normalizedSelection.endsWith("s")
      ? normalizedSelection.slice(0, -1)
      : normalizedSelection;

    return (
      normalizedName === normalizedSelection ||
      normalizedSlug === normalizedSelection ||
      singularName === singularSelection
    );
  });

  return byNameOrSlug?.id || "all";
};

export default function AnimatedProducts({ products, categories }) {
  const hasCategoryFilter = Array.isArray(categories) && categories.length > 0;
  const searchParams = useSearchParams();
  const { tenant_slug } = useSiteConfig();
  const pendingCategory = useFilterStore((s) => s.pendingCategory);
  const clearPendingCategory = useFilterStore((s) => s.clearPendingCategory);

  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";

  // Prioridad: store (viene del Header) > URL param > "all"
  const initialCategory =
    pendingCategory || searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState(() =>
    hasCategoryFilter
      ? resolveCategorySelection(initialCategory, categories)
      : "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' o 'gallery'
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Limpia el store una vez que lo hemos leído
  useEffect(() => {
    if (!hasCategoryFilter) return;
    if (pendingCategory) {
      setActiveCategory(resolveCategorySelection(pendingCategory, categories));
      clearPendingCategory();
    }
  }, [pendingCategory, clearPendingCategory, categories, hasCategoryFilter]);

  useEffect(() => {
    if (!hasCategoryFilter) return;
    const catFromUrl = searchParams.get("category");
    if (catFromUrl) {
      setActiveCategory(resolveCategorySelection(catFromUrl, categories));
    }
  }, [searchParams, categories, hasCategoryFilter]);

  useEffect(() => {
    let result = products;

    // 1. Filtrado por Categoría (Soporte Multi-categoría)
    if (hasCategoryFilter && activeCategory !== "all") {
      result = result.filter((product) => {
        const categoryIds = [...(product.category_ids || [])];

        if (product.category_id) categoryIds.push(product.category_id);
        if (product.subcategory_id) categoryIds.push(product.subcategory_id);
        if (product.category?.id) categoryIds.push(product.category.id);

        return categoryIds.includes(activeCategory);
      });
    }

    // 2. Filtrado por Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const descriptionMatch = product.description
          ?.toLowerCase()
          .includes(query);
        return nameMatch || descriptionMatch;
      });
    }

    setFilteredProducts(result);
  }, [activeCategory, searchQuery, products, hasCategoryFilter]);

  return (
    <div className="space-y-12">
      {categories && categories.length > 0 && (
        <ProductFilters
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      )}

      {filteredProducts.length > 0 ? (
        <motion.div
          key={activeCategory + searchQuery + viewMode}
          className={`grid gap-x-6 gap-y-16 transition-all duration-500 ${
            viewMode === "grid"
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
          }`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                layout
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div
                  className={
                    viewMode === "gallery"
                      ? "scale-[1.02] transition-transform duration-500"
                      : ""
                  }
                >
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    activeCategoryId={activeCategory}
                    allCategories={categories}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center space-y-6"
        >
          <p className="text-honey-dark font-serif italic text-lg max-w-md mx-auto">
            {categories
              ? "No se han encontrado piezas con esta selección..."
              : "Parece que aún no tenemos piezas destacadas preparadas. ¡Pero esto es solo el principio!"}
          </p>

          {categories ? (
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink border-b border-ink pb-1 hover:text-honey-dark hover:border-honey-dark transition-all"
            >
              Descubrir todo
            </button>
          ) : (
            <div className="pt-4">
              <Link
                href={`${baseUrl}/products`}
                prefetch={false}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-ink border-b-2 border-ink pb-2 hover:text-honey-dark hover:border-honey-dark transition-all"
              >
                Explorar Colección Completa
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
