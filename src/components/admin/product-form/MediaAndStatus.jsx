import React, { useMemo, useState } from "react";
import {
  Upload,
  Loader2,
  Trash2,
  Tag,
  Layers,
  Share2,
  Star,
  Search,
  Lock,
  ChevronDown,
} from "lucide-react";
import { CLOUDINARY_CONFIG } from "./config";
import Swal from "sweetalert2";

const MediaAndStatus = ({
  formData,
  setFormData,
  categories,
  uploading,
  handleImageUpload,
  removeImage,
  handleCategoryChange,
  readOnly = false,
}) => {
  const [categorySearch, setCategorySearch] = useState("");
  const [showPhotoTips, setShowPhotoTips] = useState(false);

  const imageLimit = 999; // Unlimited
  const currentImages = formData.images?.length || 0;
  const categoryLimit = 999; // Unlimited
  const currentCategories = formData.category_ids?.length || 0;

  const flatCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    /** @type {{id:any,name:string,slug?:string,parentName?:string}[]} */
    const out = [];

    const walk = (nodes = [], parentName = null) => {
      for (const node of nodes || []) {
        if (!node) continue;
        out.push({
          id: node.id,
          name: String(node.name || ""),
          slug: node.slug,
          parentName: parentName || null,
        });
        if (
          Array.isArray(node.subcategories) &&
          node.subcategories.length > 0
        ) {
          walk(node.subcategories, String(node.name || parentName || ""));
        }
      }
    };

    walk(categories, null);
    return out;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = String(categorySearch || "")
      .trim()
      .toLowerCase();
    if (!q) return flatCategories;
    return flatCategories.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const parent = String(c.parentName || "").toLowerCase();
      return name.includes(q) || parent.includes(q);
    });
  }, [flatCategories, categorySearch]);

  const visibleCategories = useMemo(() => {
    return filteredCategories;
  }, [filteredCategories]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
      {/* Galería de Fotos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Upload size={12} /> Galería de Fotos
          </label>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {currentImages} {currentImages === 1 ? "Imagen" : "Imágenes"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(formData.images || []).map((img, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <img
                src={img}
                className="w-full h-full object-cover"
                alt={`Product ${idx}`}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <label
              className={`aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                uploading
                  ? "pointer-events-none opacity-50 bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800"
                  : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              title="Añadir imagen"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-slate-400" />
              ) : currentImages >= imageLimit ? (
                <>
                  <Lock size={18} className="text-slate-300" />
                  <span className="text-[8px] font-black uppercase text-slate-300">
                    Lleno
                  </span>
                </>
              ) : (
                <>
                  <Upload
                    size={18}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500">
                    Añadir
                  </span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        {!readOnly && (
          <div className="rounded-md border border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-500/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPhotoTips((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300"
            >
              <span>Como lograr que la foto se vea bien?</span>
              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform ${showPhotoTips ? "rotate-180" : ""}`}
              />
            </button>

            {showPhotoTips && (
              <div className="px-4 pb-4 space-y-3 text-[11px] leading-relaxed text-emerald-950 dark:text-emerald-100">
                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">
                    Tamaño recomendado
                  </p>
                  <p>
                    1080 x 1080 px, formato cuadrado. Mínimo aceptable: 600 x
                    600 px. Las imágenes más pequeñas se ven pixeladas en
                    pantallas grandes.
                  </p>
                </div>

                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">
                    Formato y peso
                  </p>
                  <p>
                    JPG para mejor relación calidad/tamaño o WEBP. PNG solo si
                    el producto necesita fondo transparente. Peso máximo: 3MB.
                    Si pesa más, usa una herramienta como TinyPNG para reducir.
                  </p>
                </div>

                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">
                    Como tomar la foto
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Luz natural, cerca de una ventana y sin flash.</li>
                    <li>Fondo limpio: pared blanca, mesa de madera o tela lisa.</li>
                    <li>El producto debe ocupar el 70-80% del cuadro.</li>
                    <li>Toma cuadrada 1:1, no vertical ni horizontal.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">
                    Desde el celular
                  </p>
                  <p>
                    Cualquier celular sirve. Activa la cuadrícula 3x3 en la
                    cámara para encuadrar mejor. Después recorta a cuadrado
                    antes de subirla.
                  </p>
                </div>

                <div>
                  <p className="font-black text-red-600 dark:text-red-300">
                    Lo que NO funciona
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Capturas de pantalla de WhatsApp.</li>
                    <li>Fotos con marcas de agua de otros sitios.</li>
                    <li>Múltiples productos en una sola foto.</li>
                    <li>Texto encima de la foto.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categorización */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md space-y-4 border border-slate-100 dark:border-slate-700/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Tag size={12} /> Categorías (Multi-selección)
            </label>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              {currentCategories} Seleccionada(s)
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Buscar categoría..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>
            </div>

            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {formData.category_ids?.length || 0} seleccionada(s) ·{" "}
              {filteredCategories.length} disponible(s)
            </p>

            <div className="h-48 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {/* 1. CASO: Todavía no han llegado los datos (Loading) */}
                {categories === null ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2
                      size={12}
                      className="animate-spin text-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      Cargando categorías...
                    </span>
                  </div>
                ) : Array.isArray(categories) && categories.length > 0 ? (
                  // 2. CASO: Hay categorías cargadas
                  visibleCategories.map((cat) => {
                    const isSelected = formData.category_ids?.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (readOnly) return;

                          handleCategoryChange(cat.id);
                        }}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${
                          isSelected
                            ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-lg scale-105"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                        } ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
                        title={
                          cat.parentName
                            ? `${cat.name} (${cat.parentName})`
                            : cat.name
                        }
                      >
                        {cat.parentName
                          ? `${cat.name} · ${cat.parentName}`
                          : cat.name}
                      </button>
                    );
                  })
                ) : (
                  // 3. CASO: La API respondió pero el array está vacío realmente
                  <p className="text-[10px] text-slate-400 italic py-2">
                    No hay categorías disponibles...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estado y Destacado */}
      <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-md space-y-6 text-white shadow-xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">
              Visibilidad
            </span>
            <div
              className={`flex bg-slate-800 dark:bg-slate-900/80 p-1 rounded-xl ${readOnly ? "opacity-50 pointer-events-none" : ""}`}
            >
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-[9px] cursor-pointer font-black uppercase transition-all ${formData.status === "draft" ? "bg-white text-slate-900" : "text-white/50 hover:text-white"}`}
                onClick={() =>
                  !readOnly && setFormData({ ...formData, status: "draft" })
                }
              >
                Borrador
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-[9px] cursor-pointer font-black uppercase transition-all ${formData.status === "published" ? "bg-white text-slate-900" : "text-white/50 hover:text-white"}`}
                onClick={() =>
                  !readOnly && setFormData({ ...formData, status: "published" })
                }
              >
                Publicado
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              !readOnly &&
              setFormData({ ...formData, featured: !formData.featured })
            }
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.featured ? "bg-amber-400 text-slate-900 rotate-12 scale-110" : "bg-slate-800 dark:bg-slate-900/80 text-white/20"} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          >
            <Star
              size={20}
              fill={formData.featured ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaAndStatus;
