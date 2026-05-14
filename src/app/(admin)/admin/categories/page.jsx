"use client";
import React, { useState, useEffect } from "react";
import {
  Tags,
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Wrench,
  Utensils,
  CheckCircle2,
  LayoutGrid,
  List,
  Store,
  X,
  Flower2,
  Plus,
  Save,
  Heart,
  Computer,
  Info,
} from "lucide-react";
import {
  getTenantConfig,
  updateTenantStoreType,
} from "@/app/actions/public/tenantActions";

// Tipos de tienda predefinidos que coinciden con tu SQL
const STORE_TYPES = [
  {
    id: "clothing",
    name: "Tienda de Ropa",
    icon: <ShoppingBag size={20} />,
    color: "bg-slate-500",
  },
  {
    id: "restaurant",
    name: "Restaurante / Comida",
    icon: <Utensils size={20} />,
    color: "bg-red-500",
  },
  {
    id: "florist",
    name: "Floristería",
    icon: <Flower2 size={20} />,
    color: "bg-green-500",
  },
  {
    id: "medical_center",
    name: "Salud",
    icon: <Heart size={20} />,
    color: "bg-red-500",
  },
  {
    id: "tech_store",
    name: "Tecnologia",
    icon: <Computer size={20} />,
    color: "bg-blue-500",
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedType, setSelectedType] = useState(""); // Estado para el nicho seleccionado
  const [sortMode, setSortMode] = useState("A-Z"); // A-Z | Z-A
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isStoreTypeModalOpen, setIsStoreTypeModalOpen] = useState(false);
  const [storeTypeSearchTerm, setStoreTypeSearchTerm] = useState("");
  const [storeTypeViewMode, setStoreTypeViewMode] = useState("grid"); // "grid" o "list"

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");

  const slugify = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const selectedStoreTypeLabel =
    STORE_TYPES.find((t) => t.id === selectedType)?.name ||
    (selectedType ? selectedType : "—");

  // ... dentro de CategoriesPage
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const result = await getTenantConfig();

        console.log("Configuración cargada:", result); // <--- REVISA ESTO EN LA CONSOLA

        if (result.success && result.data) {
          // Guardamos el ID en el estado local
          setTenantId(result.data.tenant_id);
          setSelectedType(result.data.store_type);

          if (result.data.store_type) {
            await fetchCategories(result.data.store_type);
          }
        }
      } catch (e) {
        console.error("Error cargando configuración:", e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleTypeSelection = async (typeId) => {
    // Si salta esta alerta, es porque result.data.tenant_id llegó vacío en el useEffect
    if (!tenantId) {
      alert("Error: No se encontró el ID de la tienda en el estado local.");
      return;
    }

    try {
      setLoading(true);
      // Pasamos ambos valores a la Server Action
      const result = await updateTenantStoreType(typeId, tenantId);

      if (!result.success) throw new Error(result.error);

      setSelectedType(typeId);
      await fetchCategories(typeId);
      setIsStoreTypeModalOpen(false);
    } catch (error) {
      alert("No se pudo guardar la preferencia");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtrado por store_type (Catálogo Maestro)
  const fetchCategories = async (type) => {
    if (!type) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/categories?store_type=${type}`);
      const result = await response.json();

      console.log("Datos recibidos de la API:", result); // <--- AÑADE ESTO

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al cargar catálogo");
      }
      setCategories(result.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStoreTypes = STORE_TYPES.filter((type) =>
    type.name.toLowerCase().includes(storeTypeSearchTerm.toLowerCase()),
  );

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedType, pageSize, sortMode, categories.length]);

  useEffect(() => {
    if (isCreateCategoryModalOpen || isStoreTypeModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isCreateCategoryModalOpen, isStoreTypeModalOpen]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const sortDir = sortMode === "Z-A" ? -1 : 1;
  const sortTreeByName = (nodes = []) => {
    const sorted = [...(nodes || [])].sort(
      (a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || "")) * sortDir,
    );
    return sorted.map((node) => ({
      ...node,
      subcategories: node?.subcategories
        ? sortTreeByName(node.subcategories)
        : node?.subcategories,
    }));
  };
  const sortedCategories = sortTreeByName(filteredCategories);

  const totalItems = sortedCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = sortedCategories.slice(
    startIndex,
    startIndex + pageSize,
  );

  const toggleExpand = (id) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateCategoryModal = () => {
    if (!selectedType) return;
    setNewCategoryName("");
    setNewCategorySlug("");
    setIsCreateCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!tenantId || !selectedType) return;

    const name = String(newCategoryName || "").trim();
    const slug = String(newCategorySlug || "").trim();
    if (!name || !slug) return;

    try {
      setCreatingCategory(true);
      const resp = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          tenant_id: tenantId,
          store_type: selectedType,
        }),
      });
      const resJson = await resp.json();
      if (!resp.ok || !resJson?.success) {
        throw new Error(resJson?.error || "No se pudo crear la categoría");
      }

      setIsCreateCategoryModalOpen(false);
      await fetchCategories(selectedType);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo crear la categoría");
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Categorías
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Revisa las categorías predeterminadas o cambia el nicho principal.
          </p>
        </div>
        <div className="w-fit sm:w-full md:w-fit">
          <div className="flex flex-col sm:flex-row md:flex-col items-start gap-3 w-full">
            <button
              onClick={openCreateCategoryModal}
              disabled={!selectedType || !tenantId || loading}
              className="flex items-center cursor-pointer justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all font-black text-xs uppercase tracking-widest shadow-sm disabled:opacity-40 disabled:cursor-not-allowed w-full"
              title={
                !selectedType
                  ? "Selecciona un nicho para poder crear categorías"
                  : !tenantId
                    ? "No se pudo resolver el tenant"
                    : "Crear categoría customizada"
              }
            >
              <Plus size={16} />
              Agregar Categoría
            </button>

            <button
              onClick={() => setIsStoreTypeModalOpen(true)}
              className="flex cursor-pointer items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none w-full"
            >
              <Store size={16} />
              {selectedType ? "Cambiar Nicho" : "Elegir Nicho"}
            </button>
          </div>
        </div>
      </header>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative w-full flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar en el catálogo seleccionado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-sm transition-all"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Orden
              </span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                <option value="A-Z">A-Z</option>
                <option value="Z-A">Z-A</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Mostrar
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados (Solo Lectura) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Categoría / Estructura
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">
                  Estado del Sistema
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        className="animate-spin text-slate-400"
                        size={32}
                      />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Sincronizando Catálogo...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleExpand(category.id)}
                            className="p-1 text-slate-400 hover:text-slate-900"
                            disabled={!category.subcategories?.length}
                            style={{
                              opacity: category.subcategories?.length ? 1 : 0.2,
                            }}
                          >
                            {expandedCategories[category.id] ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-black text-slate-900 dark:text-white">
                            {category.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-200 text-sm">
                              {category.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              /{category.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {category.tenant_id ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-500/20">
                            <Tags size={10} /> Custom
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <Tags size={10} /> Oficial
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Subcategorías */}
                    {expandedCategories[category.id] &&
                      category.subcategories?.map((sub) => (
                        <tr
                          key={sub.id}
                          className="bg-slate-50/30 dark:bg-slate-800/20"
                        >
                          <td className="px-6 py-3 pl-20" colSpan={2}>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div>
                                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                                  {sub.name}
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  /{sub.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Tags
                        size={20}
                        className="text-slate-300 dark:text-slate-600"
                      />
                      <span>
                        {selectedType
                          ? "No hay categorías en este nicho."
                          : "Haz clic en 'Elegir Nicho' para ver el catálogo."}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación (debajo de la tabla) */}
      {!loading && filteredCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[10px] font-black uppercase text-center tracking-widest text-slate-400">
              Mostrando{" "}
              <span className="text-slate-700 dark:text-slate-200">
                {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              de{" "}
              <span className="text-slate-700 dark:text-slate-200">
                {totalItems}
              </span>
            </p>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || currentPage <= 1}
                className="h-10 px-4 rounded-xl border cursor-pointer border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Anterior
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || currentPage >= totalPages}
                className="h-10 px-4 rounded-xl border cursor-pointer border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Categoría Custom */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-md transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-md sm:rounded-xl shadow-2xl relative border border-white/20 dark:border-slate-700/50 flex flex-col max-h-[85vh] sm:max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-5 sm:p-8 pb-4 sm:pb-6 border-b border-slate-50 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-500/20">
                  <Tags size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                    Nueva Categoría
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-[0.2em]">
                    Se agregará a tu tienda (custom)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateCategoryModalOpen(false)}
                className="rounded-xl p-2 sm:p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                disabled={creatingCategory}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCategory}
              className="p-5 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nicho (store_type)
                  </label>
                  <input
                    value={selectedStoreTypeLabel}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Slug
                  </label>
                  <input
                    value={newCategorySlug}
                    readOnly
                    placeholder="slug-categoria"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-slate-900 dark:focus:border-white outline-none font-black text-sm transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-bold">
                    El slug es generado automáticamente y se usará como URL:{" "}
                    <span className="font-black">
                      /{newCategorySlug || "slug"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nombre de la categoría
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewCategoryName(next);
                    setNewCategorySlug(slugify(next));
                  }}
                  placeholder="Ropa, Comida, Tecnología, etc..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-slate-900 dark:focus:border-white outline-none font-black text-sm transition-all"
                />
                <div className="flex gap-1 mt-2">
                  <Info size={12} className="text-amber-500" />
                  <span className="text-[9.5px] text-amber-500 font-bold">
                    Nota: Verifica el nombre antes de guardar, las categorias no
                    se pueden editar luego
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                  className="h-11 px-6 rounded-md cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-100 transition-all duration-150 text-xs font-black uppercase tracking-widest w-full sm:w-auto"
                  disabled={creatingCategory}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    creatingCategory ||
                    !tenantId ||
                    !selectedType ||
                    !newCategoryName.trim() ||
                    !newCategorySlug.trim()
                  }
                  className="h-11 px-6 rounded-md cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs hover:bg-slate-800 hover:text-slate-100 transition-all duration-150 font-black uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {creatingCategory ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Guardar categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Elegir Nicho */}
      {isStoreTypeModalOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-md transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-md sm:rounded-xl shadow-2xl relative border border-white/20 dark:border-slate-700/50 flex flex-col max-h-[85vh] sm:max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header de la Modal */}
            <div className="p-5 sm:p-8 pb-4 sm:pb-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-500/20">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                    Elegir Tipo de Tienda
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-[0.2em]">
                    Selecciona tu nicho para ver el catálogo
                  </p>
                </div>
              </div>

              {/* Botón Cerrar y Vistas */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setStoreTypeViewMode("grid")}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      storeTypeViewMode === "grid"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setStoreTypeViewMode("list")}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      storeTypeViewMode === "list"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    }`}
                  >
                    <List size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setIsStoreTypeModalOpen(false)}
                  className="rounded-lg p-2 sm:p-3 sm:ml-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Buscador dentro de la modal */}
            <div className="px-8 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar tipo de tienda..."
                  value={storeTypeSearchTerm}
                  onChange={(e) => setStoreTypeSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-slate-900 dark:focus:border-slate-900 focus:ring-0 outline-none font-bold text-sm transition-all"
                />
              </div>
            </div>

            {/* Listado de Nichos */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
              {filteredStoreTypes.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-sm font-bold text-slate-400 uppercase">
                    No se encontraron tipos de tienda.
                  </span>
                </div>
              ) : (
                <div
                  className={
                    storeTypeViewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
                      : "flex flex-col gap-3 sm:gap-4"
                  }
                >
                  {filteredStoreTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelection(type.id)}
                      className={
                        storeTypeViewMode === "grid"
                          ? `relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col items-center gap-2 sm:gap-4 cursor-pointer group ${
                              selectedType === type.id
                                ? "border-slate-900 bg-slate-50 dark:bg-slate-500/10 text-slate-900 dark:text-slate-400 shadow-xl shadow-slate-500/10"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700/50 hover:shadow-lg"
                            }`
                          : `relative p-3 sm:p-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-row items-center gap-3 sm:gap-4 cursor-pointer group ${
                              selectedType === type.id
                                ? "border-slate-900 bg-slate-50 dark:bg-slate-500/10 text-slate-900 dark:text-slate-400 shadow-xl shadow-slate-500/10"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700/50 hover:shadow-lg"
                            }`
                      }
                    >
                      {selectedType === type.id && (
                        <CheckCircle2
                          className={
                            storeTypeViewMode === "grid"
                              ? "absolute top-2 right-2 sm:top-4 sm:right-4 text-slate-900 dark:text-slate-400"
                              : "absolute right-4 sm:right-6 text-slate-900 dark:text-slate-400"
                          }
                          size={14}
                        />
                      )}
                      <div
                        className={`p-3 sm:p-4 rounded-lg sm:rounded-[1.25rem] ${
                          selectedType === type.id
                            ? "bg-slate-200 dark:bg-slate-500/20 text-slate-900 dark:text-slate-400"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700"
                        }`}
                      >
                        {React.cloneElement(type.icon, {
                          size: storeTypeViewMode === "grid" ? 18 : 16,
                        })}
                      </div>
                      <span
                        className={
                          storeTypeViewMode === "grid"
                            ? "font-black text-[9px] sm:text-xs uppercase tracking-widest text-center"
                            : "font-black text-[11px] sm:text-sm uppercase tracking-widest"
                        }
                      >
                        {type.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
