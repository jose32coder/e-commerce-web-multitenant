"use client";

import { useEffect, useState } from "react";
import {
  createInvitationForTenant,
  getPendingInvitationsByTenantIds,
  getTenants,
} from "@/services/tenants";
import { TenantTable } from "@/components/admin/tenants/TenantTable";
import { NewTenantModal } from "@/components/admin/tenants/NewTenantModal";
import { InvitationLink } from "@/components/admin/tenants/InvitationLink";
import { useRouter } from "next/navigation";
import { createPlatformClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";
import {
  Building2,
  Store,
  Users,
  BarChart3,
  Search,
  PlusCircle,
  LogOut,
  Zap,
  Award,
  Bell,
  Mail,
  Plus,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastInvitation, setLastInvitation] = useState(null);
  const [lastTenantName, setLastTenantName] = useState("");
  const [lastTenantWhatsapp, setLastTenantWhatsapp] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState(new Map());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [actorName, setActorName] = useState("Usuario");
  const [actorRoleLabel, setActorRoleLabel] = useState("Platform Admin");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTenantId, setInviteTenantId] = useState(null);
  const [tenantUserCounts, setTenantUserCounts] = useState({});

  const router = useRouter();
  const supabase = createPlatformClient();

  useEffect(() => {
    const loadActor = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("No se pudo obtener usuario de plataforma:", error.message);
          return;
        }

        const user = data?.user;

        const fullName =
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.email ||
          "Usuario";
        setActorName(String(fullName));

        const accessScope =
          user?.user_metadata?.access_scope || user?.app_metadata?.access_scope;
        setActorRoleLabel(accessScope === "platform" ? "Platform Admin" : "User");
      } catch (error) {
        console.warn("Fallo de red cargando usuario de plataforma:", error?.message);
      }
    };

    loadActor();
  }, [supabase]);

  const handleLogout = () => {
    Swal.fire({
      title: "¿CERRAR SESIÓN?",
      text: "Se finalizará tu sesión actual en este dispositivo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#000000",
      cancelButtonColor: "#f44336",
      confirmButtonText: "SÍ, SALIR",
      cancelButtonText: "CANCELAR",
      reverseButtons: true,
      background: "#ffffff",
      customClass: {
        popup: "rounded-[30px] border border-zinc-100",
        title: "font-black tracking-tighter text-2xl",
        confirmButton:
          "rounded-xl font-bold text-[10px] tracking-[0.2em] px-8 py-3",
        cancelButton:
          "rounded-xl font-bold text-[10px] tracking-[0.2em] px-8 py-3",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        router.push("/platform-access");
        router.refresh();
      }
    });
  };

  const fetchTenants = async () => {
    setLoading(true);
    const data = await getTenants();
    setTenants(data);

    const tenantIds = (data || []).map((t) => t.tenant_id);
    const pending = await getPendingInvitationsByTenantIds(tenantIds);
    setPendingInvitations(pending);

    // Load staff user counts per tenant (platform-only endpoint).
    try {
      const resp = await fetch("/api/platform/tenant-user-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds }),
      });
      const json = await resp.json();
      if (resp.ok) setTenantUserCounts(json.counts || {});
    } catch {
      // Non-blocking: table renders with fallback.
    }

    if (!lastInvitation && pending.size > 0) {
      const [tenantId, invitation] = pending.entries().next().value;
      const tenant = (data || []).find((t) => t.tenant_id === tenantId);
      setLastInvitation(invitation);
      setLastTenantName(tenant?.name || "");
      setLastTenantWhatsapp(tenant?.whatsapp_number || "");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTenantCreated = (newTenant, invitation) => {
    setTenants((prev) => [newTenant, ...prev]);
    setLastInvitation(invitation);
    setLastTenantName(newTenant.name || newTenant.name);
    setLastTenantWhatsapp(newTenant.whatsapp_number || "");
    setPendingInvitations((prev) => {
      const next = new Map(prev);
      next.set(newTenant.tenant_id, invitation);
      return next;
    });
  };

  const handleTenantUpdated = (updatedTenant) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.tenant_id === updatedTenant.tenant_id ? updatedTenant : t,
      ),
    );
  };

  const filteredTenants = tenants.filter((t) => {
    const nameMatch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Usamos "slug" con protección por si acaso
    const slugMatch = t.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    return nameMatch || slugMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedTenants = filteredTenants.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    // Reset to first page when filter changes.
    setPage(1);
  }, [searchTerm]);

  const ensureInvitationForTenant = async (tenant) => {
    if (!tenant?.tenant_id) return;

    const existing = pendingInvitations.get(tenant.tenant_id);
    if (existing) {
      setLastInvitation(existing);
      setLastTenantName(tenant.name || "");
      setLastTenantWhatsapp(tenant.whatsapp_number || "");
      return;
    }

    try {
      const created = await createInvitationForTenant(tenant.tenant_id);
      setPendingInvitations((prev) => {
        const next = new Map(prev);
        next.set(tenant.tenant_id, created);
        return next;
      });
      setLastInvitation(created);
      setLastTenantName(tenant.name || "");
      setLastTenantWhatsapp(tenant.whatsapp_number || "");

      Swal.fire({
        title: "Invitación creada",
        text: "Se generó un link de registro para el administrador.",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo generar la invitación", "error");
    }
  };

  const openInviteModal = () => {
    const preferredTenantId =
      lastInvitation?.tenant_id || tenants?.[0]?.tenant_id || null;
    setInviteTenantId(preferredTenantId);
    setInviteModalOpen(true);
  };

  const confirmInviteModal = async () => {
    const tenant = tenants?.find((t) => t.tenant_id === inviteTenantId);
    if (!tenant) {
      Swal.fire("Sin tienda", "Selecciona una tienda válida.", "info");
      return;
    }

    setInviteModalOpen(false);
    await ensureInvitationForTenant(tenant);
  };

  useEffect(() => {
    const channel = supabase
      .channel("platform_invitations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invitations" },
        (payload) => {
          const row = payload?.new || payload?.old;
          const tenantId = row?.tenant_id;
          if (!tenantId) return;

          setPendingInvitations((prev) => {
            const next = new Map(prev);
            const eventType = payload?.eventType;
            const isUsed = payload?.new?.used === true;

            if (eventType === "DELETE" || isUsed) {
              next.delete(tenantId);
              if (lastInvitation?.tenant_id === tenantId) {
                setLastInvitation(null);
                setLastTenantName("");
                setLastTenantWhatsapp("");
              }
              return next;
            }

            if (eventType === "INSERT") {
              next.set(tenantId, payload.new);
            }

            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, lastInvitation]);

  const handleInvitationRevoked = (invitation) => {
    const tenantId = invitation?.tenant_id;
    if (!tenantId) return;

    setPendingInvitations((prev) => {
      const next = new Map(prev);
      next.delete(tenantId);
      return next;
    });

    if (lastInvitation?.tenant_id === tenantId) {
      setLastInvitation(null);
      setLastTenantName("");
      setLastTenantWhatsapp("");
    }
  };

  const stats = [
    {
      label: "Total Tiendas",
      value: tenants.length,
      icon: Store,
      tier: "TOTAL",
    },
    {
      label: "Tiendas Activas",
      value: tenants.filter((t) => t.status === "Active").length,
      icon: Zap,
      tier: "STATUS",
    },
    {
      label: "Plan Gold",
      value: tenants.filter((t) => t.plan_type === "Gold").length,
      icon: Award,
      tier: "TIER",
    },
    {
      label: "Usuarios Totales",
      value: Object.values(tenantUserCounts || {}).reduce(
        (acc, n) => acc + Number(n || 0),
        0,
      ),
      icon: Users,
      tier: "IMPACT",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F8] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      {/* Mini Header / Nav */}
      <nav className=" bg-white/80 flex justify-center w-full backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <header className="max-w-7xl w-full flex items-center justify-between px-2 py-4">
          <span className="italic font-serif text-xl tracking-tight text-[#1A1A1A]">
            Tenants Panel
          </span>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-6 cursor-pointer"
              aria-label="Abrir menú de usuario"
            >
              <div className="flex items-center gap-4 ml-4 pl-6">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] font-bold leading-none">
                      {actorName}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">
                      {actorRoleLabel}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-orange-400 to-red-500 border-2 border-white shadow-sm" />
                </div>
              </div>
            </button>

            {userMenuOpen ? (
              <div
                className="absolute right-0 mt-3 w-48 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 cursor-pointer py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600 hover:bg-[#F8F9F8] transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </header>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-2 space-y-12">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-medium tracking-tight text-[#1A1A1A]">
            Gestión de Tenants
          </h1>
          <p className="text-gray-400 font-light max-w-2xl">
            Panel de control centralizado para la administración de instancias y
            comercios.
          </p>
        </div>

        {/* Stats Cards - Look: Minimal border, clean font */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 cursor-pointer hover:scale-105 hover:-translate-y-1 rounded-xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] group hover:border-gray-300 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                    {stat.tier}
                  </p>
                  <p className="text-[13px] font-medium text-gray-500 mt-1">
                    {stat.label}
                  </p>
                </div>
                <div className="p-2 bg-[#F8F9F8] rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                  <stat.icon size={16} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-light mt-4">
                {loading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Listado de tiendas (full width) */}
        {/* 1. Agregamos "flex flex-col" al contenedor principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-100 flex flex-col">
          <div className="p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium">Listado de Tiendas</h2>
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors" />
              <Input
                placeholder="Buscar instancia..."
                className="pl-9 bg-[#F8F9F8] border-none text-sm focus-visible:ring-1 focus-visible:ring-black rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Agregamos "flex-grow" para que esta sección empuje la paginación hacia abajo */}
          <div className="px-2 pb-2 grow">
            <TenantTable
              tenants={pagedTenants}
              loading={loading}
              onTenantUpdated={handleTenantUpdated}
              pendingInvitations={pendingInvitations}
              onInviteTenant={ensureInvitationForTenant}
              tenantUserCounts={tenantUserCounts}
            />
          </div>

          {/* 3. El footer de paginación ahora se quedará al final gracias al flex-grow anterior */}
          <div className="px-8 py-6 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {filteredTenants.length}
              </span>
              <span>tienda(s)</span>
              <span className="text-slate-300">·</span>
              <span>
                Página{" "}
                <span className="font-semibold text-slate-700">{safePage}</span>{" "}
                de{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Anterior
              </button>
              <button
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Bloques inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-6">
                Acciones Rápidas
              </h3>
              <div className="space-y-5">
                <NewTenantModal onTenantCreated={handleTenantCreated} />

                <button
                  onClick={() => {
                    if (!tenants?.length) {
                      Swal.fire(
                        "Sin tiendas",
                        "Crea una tienda primero para poder invitar.",
                        "info",
                      );
                      return;
                    }
                    openInviteModal();
                  }}
                  className="w-full flex items-center cursor-pointer hover:scale-105 justify-between p-4 rounded-xl bg-[#F8F9F8] hover:bg-gray-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-black group-hover:text-white transition-all">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium">
                      Generar Invitación
                    </span>
                  </div>
                  <Plus size={14} className="text-gray-300" />
                </button>

                <button className="w-full flex items-center cursor-pointer hover:scale-105 justify-between p-4 rounded-xl bg-[#F8F9F8] hover:bg-gray-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-black group-hover:text-white transition-all">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-medium">
                      Exportar Reporte
                    </span>
                  </div>
                  <Plus size={14} className="text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <InvitationLink
              invitation={lastInvitation}
              tenantName={lastTenantName}
              tenantWhatsappNumber={lastTenantWhatsapp}
              onRevoked={handleInvitationRevoked}
            />

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-6">
                Actividad Reciente
              </h3>
              <div className="space-y-6">
                {[
                  {
                    title: "Inicio de sesión exitoso",
                    time: "Hace 2 horas",
                    color: "bg-black",
                  },
                  {
                    title: "Actualización v2.4 aplicada",
                    time: "Hace 5 horas",
                    color: "bg-gray-200",
                  },
                  {
                    title: "Reporte de auditoría generado",
                    time: "Ayer, 14:20",
                    color: "bg-gray-200",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.color}`}
                    />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {item.time}
                      </p>
                      <p className="text-[13px] font-medium text-gray-700 mt-1">
                        {item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 pt-6 border-t cursor-pointer border-gray-50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors text-left">
                Ver todo el historial
              </button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-130 rounded-2xl border-none shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Generar invitación
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Elige a cuál tienda deseas generar el enlace de registro.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tienda
            </label>
            <select
              value={inviteTenantId ?? ""}
              onChange={(e) => setInviteTenantId(Number(e.target.value))}
              className="w-full h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {(tenants || []).map((t) => {
                const hasPending = pendingInvitations?.get?.(t.tenant_id);
                return (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {t.name} ({t.slug})
                    {hasPending ? " - INVITACION PENDIENTE" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setInviteModalOpen(false)}
              className="rounded-md cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmInviteModal}
              className="rounded-md bg-slate-900 cursor-pointer text-white hover:bg-slate-800"
            >
              Generar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
