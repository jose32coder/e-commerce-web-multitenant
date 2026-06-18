import React from "react";
import { Package, AlignLeft, FileText, Clock, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const MainInfo = ({ formData, setFormData, readOnly = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSlug = (value) => {
    const source = value ?? formData.name;
    if (!source) return;
    const slug = source
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, name: value }));
    generateSlug(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Nombre del Producto */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-2">
          <Package size={12} /> Nombre del Producto
        </label>
        <Input
          required
          name="name"
          placeholder="Ropa, Herramientas, Juguetes, etc..."
          className="h-14 px-6 rounded-md border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-bold text-base"
          value={formData.name}
          onChange={handleNameChange}
          disabled={readOnly}
        />
      </div>

      {/* Slug */}
      <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-2">
          URL (Slug)
        </label>
        <input
          name="slug"
          placeholder="url-del-producto"
          className="w-full px-6 py-2 bg-transparent border-b border-slate-100 dark:border-slate-700 transition-all outline-none font-mono text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
          value={formData.slug}
          readOnly
          disabled
        />
      </div>

      {/* Descripción Corta */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-2">
          <AlignLeft size={12} /> Descripción corta (Resumen)
        </label>
        <Input
          name="short_description"
          placeholder="Resumen para catálogos y búsquedas..."
          className="h-12 px-6 rounded-md border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-medium text-sm"
          value={formData.short_description}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>

      {/* Descripción Completa */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-2">
          <FileText size={12} /> Descripción Completa
        </label>
        <textarea
          name="description"
          rows={5}
          placeholder="Describe las características principales..."
          className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none font-medium text-sm resize-none"
          value={formData.description}
          onChange={handleChange}
          disabled={readOnly}
        ></textarea>
      </div>

      {/* --- CAMPOS ESPECÍFICOS DE SERVICIO --- */}
      {formData.item_type === "service" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Duración */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 ml-1 flex items-center gap-2">
              <Clock size={12} /> Duración Estimada
            </label>
            <Input
              name="service_duration"
              placeholder="Ej: 1 hora, 30 minutos..."
              className="h-12 px-6 rounded-md border-violet-100 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-900/10 focus:ring-2 focus:ring-violet-500 transition-all font-medium text-sm"
              value={formData.service_duration}
              onChange={handleChange}
              disabled={readOnly}
            />
          </div>

          {/* Modalidad de Reserva */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 ml-1 flex items-center gap-2">
              <Settings2 size={12} /> Modalidad de Reserva
            </label>
            <select
              name="service_booking_mode"
              value={formData.service_booking_mode || "whatsapp"}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full h-12 px-6 rounded-md border-violet-100 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-900/10 focus:ring-2 focus:ring-violet-500 transition-all font-medium text-sm appearance-none outline-none"
            >
              <option value="whatsapp">Vía WhatsApp (Cotización/Cita)</option>
              <option value="cart">Carrito de Compras (Pago directo)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainInfo;
