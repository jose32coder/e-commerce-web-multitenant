import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { updateTenantAction } from "@/app/actions/public/tenantActions";
import Swal from "sweetalert2";

export function EditTenantModal({ tenant, onTenantUpdated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan: "Bronze",
    whatsapp_number: "",
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name ?? "",
        slug: tenant.slug ?? "",
        plan: tenant.plan_type ?? "Bronze",
        whatsapp_number: tenant.whatsapp_number ?? "",
      });
    }
  }, [tenant]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        plan_type: formData.plan,
        whatsapp_number: formData.whatsapp_number,
      };
      const result = await updateTenantAction(tenant.tenant_id, payload);
      if (!result.success) {
        throw new Error(result.error || "No se pudo actualizar la tienda.");
      }

      const updatedTenant = result.data;
      onTenantUpdated?.(updatedTenant);
      setOpen(false);
      Swal.fire({
        title: "¡Actualizado!",
        text: `La tienda "${updatedTenant.name}" ahora tiene el plan ${updatedTenant.plan_type}.`,
        icon: "success",
        confirmButtonColor: "#0F172A",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo actualizar la tienda.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Editar Tienda">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] px-8 py-12 rounded-2xl border-none shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-3xl font-serif text-center text-[#0F172A]">
            Editar Tienda
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Nombre de la Tienda
              </label>
              <Input
                placeholder="Ej. Mi Tienda"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white h-12 rounded-lg"
              />
            </div>
            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Slug (URL)
              </label>
              <Input
                placeholder="mi-tienda"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white h-12 rounded-lg"
              />
            </div>
            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Número de WhatsApp
              </label>
              <Input
                placeholder="58412..."
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="bg-slate-50 border-slate-200 focus:bg-white h-12 rounded-lg"
              />
            </div>
            {/* Plan */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Plan de Suscripción
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              >
                <option value="Bronze">Bronze (Básico)</option>
                <option value="Silver">Silver (Pro)</option>
                <option value="Gold">Gold (Enterprise)</option>
              </select>
            </div>
          </div>
          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button type="submit" disabled={loading} className="bg-[#0F172A] text-white h-10 px-6 rounded-lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Cambios"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
