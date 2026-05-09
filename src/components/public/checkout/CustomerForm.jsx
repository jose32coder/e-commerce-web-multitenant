import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getValidationError } from "@/lib/checkoutValidation";
import { Select } from "@/components/ui/select";

const CUSTOMER_TABLE = "customers";

export function CustomerForm({
  formData,
  setFormData,
  onCustomerFound,
  errors = {},
  setErrors,
  idType,
  setIdType,
}) {
  const { tenant_id: tenantId } = useSiteConfig();
  const [isSearching, setIsSearching] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [customerLocked, setCustomerLocked] = useState(false);
  const lookupCacheRef = useRef(new Map());

  // Búsqueda manual inteligente
  const handleCustomerLookup = async () => {
    if (formData.idNumber.length < 6) return;
    if (!tenantId) return;

    try {
      setLookupMessage("");
      setIsSearching(true);

      const fullId = `${idType}${formData.idNumber}`;
      const rawId = String(formData.idNumber || "").replace(/\D/g, "");
      const lookupKey = `${tenantId}:${fullId}`;
      const cachedCustomer = lookupCacheRef.current.get(lookupKey);

      if (cachedCustomer) {
        onCustomerFound(cachedCustomer);
        setCustomerLocked(true);
        setLookupMessage("✓ Cliente encontrado.");
        return;
      }

      const supabase = createClient();
      // Búsqueda inteligente: con prefijo O sin prefijo
      const { data, error } = await supabase
        .from(CUSTOMER_TABLE)
        .select("*")
        .or(`id_number.eq.${fullId},id_number.eq.${rawId}`)
        .eq("tenant_id", tenantId)
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        lookupCacheRef.current.set(lookupKey, data);
        onCustomerFound(data);
        setCustomerLocked(true);
        setLookupMessage("✓ Cliente encontrado y datos autocompletados.");
      } else {
        setCustomerLocked(false);
        setLookupMessage("Nuevo cliente detectado.");
      }
    } catch (error) {
      setCustomerLocked(false);
      setLookupMessage("Error en la búsqueda. Intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Si cambia la identidad, reseteamos el bloqueo y el mensaje
    if (field === "idNumber") {
      setCustomerLocked(false);
      setLookupMessage("");
    }

    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    const error = getValidationError(field, value, idType);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleIdTypeChange = (newType) => {
    setIdType(newType);
    setCustomerLocked(false);
    setLookupMessage("");
    const error = getValidationError("idNumber", formData.idNumber, newType);
    setErrors((prev) => ({ ...prev, idNumber: error }));
  };

  const handleEnableManualEdit = () => {
    setCustomerLocked(false);
    setLookupMessage("Edición manual activada.");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink px-1">
            Tipo de Identificación <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <Select
              value={idType}
              onChange={(e) => handleIdTypeChange(e.target.value)}
              className="w-20 h-14 bg-[#F3F4F6] border-none rounded-md focus:ring-ink/10 font-bold text-ink cursor-pointer"
            >
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
              <option value="G">G</option>
              <option value="P">P</option>
            </Select>
            <div className="flex-1 space-y-1">
              <Input
                type="text"
                value={formData.idNumber}
                onChange={(e) => handleInputChange("idNumber", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCustomerLookup();
                  }
                }}
                className={`rounded-md border-none bg-[#F3F4F6] focus-visible:ring-ink/10 h-14 text-sm placeholder:text-zinc-400 ${errors.idNumber ? "ring-2 ring-rose-500/50" : ""}`}
                placeholder="00000000"
              />
            </div>
          </div>
          {errors.idNumber ? (
            <p className="text-[10px] font-bold text-rose-500 px-1">
              {errors.idNumber}
            </p>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCustomerLookup}
                disabled={
                  isSearching || !tenantId || formData.idNumber.length < 6
                }
                className="h-9 px-4 rounded-md text-[9px] font-black uppercase tracking-widest bg-ink text-paper disabled:opacity-30 transition-all cursor-pointer hover:bg-ink/90"
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
              {customerLocked ? (
                <button
                  type="button"
                  onClick={handleEnableManualEdit}
                  className="h-9 px-4 rounded-md text-[9px] font-black uppercase tracking-widest border border-ink/10 text-ink/60 cursor-pointer hover:bg-zinc-50 transition-all"
                >
                  Editar
                </button>
              ) : null}
            </div>
          )}
          {lookupMessage ? (
            <p className="text-[9px] font-bold text-zinc-400 px-1">
              {lookupMessage}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink px-1">
            Nombre Completo <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={customerLocked}
            className={`rounded-md border-none bg-[#F3F4F6] focus-visible:ring-ink/10 h-14 text-sm placeholder:text-zinc-400 ${errors.name ? "ring-2 ring-rose-500/50" : ""}`}
            placeholder="Ej: Juan Pérez"
          />
          {errors.name && (
            <p className="text-[10px] font-bold text-rose-500 px-1">
              {errors.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink px-1">
            Teléfono (WhatsApp) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            disabled={customerLocked}
            className={`rounded-md border-none bg-[#F3F4F6] focus-visible:ring-ink/10 h-14 text-sm placeholder:text-zinc-400 ${errors.phone ? "ring-2 ring-rose-500/50" : ""}`}
            placeholder="Ej: 04121234567"
          />
          {errors.phone && (
            <p className="text-[10px] font-bold text-rose-500 px-1">
              {errors.phone}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink px-1">
            Correo Electrónico
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={customerLocked}
            className={`rounded-md border-none bg-[#F3F4F6] focus-visible:ring-ink/10 h-14 text-sm placeholder:text-zinc-400 ${errors.email ? "ring-2 ring-rose-500/50" : ""}`}
            placeholder="Ej: correo@ejemplo.com"
          />
          {errors.email && (
            <p className="text-[10px] font-bold text-rose-500 px-1">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 px-1">
        Los campos marcados con <span className="text-rose-500">*</span> son
        obligatorios
      </p>
    </div>
  );
}
