"use client";

import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { createTenant } from "@/services/tenants";
import Swal from "sweetalert2";

export function NewTenantModal({ onTenantCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan: "Bronze",
    whatsapp_number: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { tenant, invitation } = await createTenant(formData);
      onTenantCreated(tenant, invitation);
      setOpen(false);
      setFormData({ name: "", slug: "", plan: "Bronze", whatsapp_number: "" });

      Swal.fire({
        title: "¡Éxito!",
        text: `La tienda "${tenant.name || formData.name}" ha sido creada.`,
        icon: "success",
        confirmButtonColor: "#0F172A",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo crear la tienda.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setFormData({ ...formData, name, slug });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-[#0F172A] cursor-pointer hover:bg-black text-white rounded-xl py-6 flex items-center justify-between px-6 transition-all group">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4" />
            <span className="font-medium">Nueva Tienda</span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] px-8 py-12 rounded-2xl border-none shadow-2xl ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:slide-in-from-top-12">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-3xl font-serif text-center text-[#0F172A]">
            Registrar Nueva Tienda
          </DialogTitle>
          <p className="text-sm text-slate-500 text-center px-4">
            Configura los datos básicos para el nuevo ecosistema de ecommerce.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-6">
          <div className="space-y-4">
            {/* Nombre de la tienda */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Nombre de la Tienda
              </label>
              <Input
                placeholder="Ej. Mi Tienda Increíble"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white h-12 rounded-lg"
              />
            </div>

            {/* Slug URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Slug (URL)
              </label>
              <div className="relative">
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="bg-slate-50 border-slate-200 focus:bg-white h-12 rounded-lg pl-5 text-slate-400 text-sm"
                  placeholder="mi-tienda"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                  /
                </span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Número de WhatsApp
              </label>
              <Input
                placeholder="58412..."
                value={formData.whatsapp_number}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp_number: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, plan: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all appearance-none"
              >
                <option value="Bronze">Bronze (Básico)</option>
                <option value="Silver">Silver (Pro)</option>
                <option value="Gold">Gold (Enterprise)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            {/* Confirm button (left) */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] cursor-pointer hover:bg-black text-white h-12 rounded-lg font-semibold transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Finalizar Registro"
              )}
            </Button>
            {/* Cancel button (right) */}
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="ml-2"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
