"use client";

import { useEffect, useMemo, useState } from "react";
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
  Activity,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Moon,
  RefreshCw,
  Save,
  Search,
  ShieldOff,
  Store,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuditFilters } from "@/components/admin/bitacora/AuditFilters";
import { AuditTable } from "@/components/admin/bitacora/AuditTable";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "stores",
    label: "Tiendas",
    icon: Store,
  },
  {
    id: "invitations",
    label: "Invitaciones",
    icon: Mail,
  },
  {
    id: "users",
    label: "Usuarios",
    icon: UserCog,
  },
  {
    id: "history",
    label: "Historial",
    icon: Activity,
  },
];

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
  const [actorName, setActorName] = useState("Usuario");
  const [actorRoleLabel, setActorRoleLabel] = useState("Platform Admin");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTenantId, setInviteTenantId] = useState(null);
  const [tenantUserCounts, setTenantUserCounts] = useState({});
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
        setActorRoleLabel(
          accessScope === "platform" ? "Super Admin" : "Platform User",
        );
      } catch (error) {
        console.warn("Fallo de red cargando usuario de plataforma:", error?.message);
      }
    };

    loadActor();
  }, [supabase]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
  }, [isMobileOpen]);

  const handleLogout = () => {
    Swal.fire({
      title: "¿CERRAR SESION?",
      text: "Se finalizara tu sesion actual en este dispositivo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#000000",
      cancelButtonColor: "#f44336",
      confirmButtonText: "SI, SALIR",
      cancelButtonText: "CANCELAR",
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
    setActiveSection("stores");
  };

  const handleTenantUpdated = async (updatedTenant) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.tenant_id === updatedTenant.tenant_id ? updatedTenant : t,
      ),
    );
    await fetchTenants();
  };

  const filteredTenants = tenants.filter((t) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const nameMatch = t.name?.toLowerCase().includes(normalizedSearch);
    const slugMatch = t.slug?.toLowerCase().includes(normalizedSearch);

    return nameMatch || slugMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedTenants = filteredTenants.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const ensureInvitationForTenant = async (tenant) => {
    if (!tenant?.tenant_id) return;

    const existing = pendingInvitations.get(tenant.tenant_id);
    if (existing) {
      setLastInvitation(existing);
      setLastTenantName(tenant.name || "");
      setLastTenantWhatsapp(tenant.whatsapp_number || "");
      setActiveSection("invitations");
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
      setActiveSection("invitations");

      Swal.fire({
        title: "Invitacion creada",
        text: "Se genero un link de registro para el administrador.",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo generar la invitacion", "error");
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
      Swal.fire("Sin tienda", "Selecciona una tienda valida.", "info");
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
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditTipo, setAuditTipo] = useState("todos");
  const [auditAccion, setAuditAccion] = useState("todas");

  const fetchAuditEntries = async () => {
    setAuditLoading(true);
    setAuditError("");
    try {
      const response = await fetch("/api/platform/audit-logs?limit=500");
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "No se pudo cargar la bitácora.");
      setAuditEntries(json.entries ?? []);
    } catch (err) {
      setAuditError(err.message);
      setAuditEntries([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEntries();
    const channel = supabase
      .channel("audit_logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          setAuditEntries((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAudit = useMemo(() => {
    return auditEntries.filter((e) => {
      const matchTipo = auditTipo === "todos" || e.module === auditTipo;
      const matchAccion = auditAccion === "todas" || e.action === auditAccion;
      const q = auditSearch.toLowerCase();
      const matchSearch = !q || e.details?.description?.toLowerCase().includes(q) || e.details?.user_name?.toLowerCase().includes(q);
      return matchTipo && matchAccion && matchSearch;
    });
  }, [auditEntries, auditSearch, auditTipo, auditAccion]);

  const HistoryView = () => (
    <>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              Bitácora
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Registro completo de todas las acciones del sistema.
            </p>
          </div>
          <button onClick={fetchAuditEntries} className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest shadow-lg dark:shadow-none cursor-pointer shrink-0">
            <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </header>
        <AuditFilters
          search={auditSearch}
          setSearch={setAuditSearch}
          tipo={auditTipo}
          setTipo={setAuditTipo}
          accion={auditAccion}
          setAccion={setAuditAccion}
        />
        {auditError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
            {auditError}
          </div>
        )}
        <AuditTable entries={filteredAudit} loading={auditLoading} />
      </div>
    </>
  );

  const stats = useMemo(() => {
    const totalUsers = Object.values(tenantUserCounts || {}).reduce(
      (acc, n) => acc + Number(n || 0),
      0,
    );
    const activeStores = tenants.filter((t) => t.status === "Active").length;
    const inactiveStores = tenants.filter((t) => t.status !== "Active").length;
    const usedSlots = tenants.reduce(
      (acc, tenant) => acc + Number(tenantUserCounts?.[tenant.tenant_id] || 0),
      0,
    );
    const availableSlots = tenants.reduce(
      (acc, tenant) =>
        acc + Number(tenant.max_users || tenant.user_limit || 0),
      0,
    );

    return [
      {
        label: "Tiendas Totales",
        value: tenants.length,
        trend: `${activeStores} activas`,
        icon: Store,
        color: "bg-emerald-500",
      },
      {
        label: "Usuarios Totales",
        value: totalUsers,
        trend: `${usedSlots}/${availableSlots || 0} cupos`,
        icon: Users,
        color: "bg-slate-900",
      },
      {
        label: "Invitaciones",
        value: pendingInvitations.size,
        trend: "Pendientes",
        icon: UserPlus,
        color: "bg-blue-500",
      },
      {
        label: "Alertas",
        value: inactiveStores,
        trend: "Inactivas",
        icon: Bell,
        color: inactiveStores > 0 ? "bg-orange-500" : "bg-slate-300",
      },
    ];
  }, [pendingInvitations.size, tenantUserCounts, tenants]);

  const planSummary = useMemo(
    () =>
      ["Gold", "Silver", "Bronze"].map((plan) => ({
        plan,
        count: tenants.filter((tenant) => tenant.plan_type === plan).length,
      })),
    [tenants],
  );

  const recentTenants = tenants.slice(0, 5);
  const pendingInvitationRows = tenants
    .filter((tenant) => pendingInvitations.get(tenant.tenant_id))
    .slice(0, 5);

  const pageTitle =
    activeSection === "stores"
      ? "Tiendas"
      : activeSection === "invitations"
        ? "Invitaciones"
        : activeSection === "users"
          ? "Usuarios"
          : activeSection === "history"
            ? "Bitácora"
            : "Dashboard";

  const selectSection = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-sans">
      <PlatformSidebar
        activeSection={activeSection}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleCollapsed={() => setIsCollapsed((value) => !value)}
        onSelectSection={selectSection}
        onLogout={handleLogout}
      />

      <PlatformHeader
        actorName={actorName}
        actorRoleLabel={actorRoleLabel}
        isCollapsed={isCollapsed}
        pageTitle={pageTitle}
        onOpenMobile={() => setIsMobileOpen(true)}
      />

      {isMobileOpen ? (
        <button
          aria-label="Cerrar menu"
          className="fixed inset-0 z-60 bg-slate-950/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <main
        className={`min-h-screen p-4 pt-24 pb-16 transition-all duration-500 lg:p-6 lg:pt-24 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="w-full space-y-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                {activeSection === "stores"
                  ? "Gestion de Tiendas"
                  : activeSection === "invitations"
                    ? "Centro de Invitaciones"
                    : activeSection === "users"
                      ? "Usuarios del Sistema"
                      : activeSection === "history"
                        ? "Bitácora del Sistema"
                        : "Resumen General"}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {activeSection === "stores"
                  ? "Consulta, anexa y edita tiendas desde una vista operativa."
                  : activeSection === "invitations"
                    ? "Controla enlaces de registro y activacion para administradores."
                    : activeSection === "users"
                      ? "Consulta usuarios, cambia acceso y revisa a que tienda pertenecen."
                      : activeSection === "history"
                        ? "Revisa el historial de auditoría de todas las acciones."
                        : "Actividad relevante de la plataforma y salud de las tiendas."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={openInviteModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm transition-all hover:border-slate-900"
              >
                <Mail size={16} />
                Invitar Admin
              </button>
              <div className="min-w-48">
                <NewTenantModal onTenantCreated={handleTenantCreated} />
              </div>
            </div>
          </section>

          {activeSection === "dashboard" ? (
            <DashboardView
              loading={loading}
              stats={stats}
              planSummary={planSummary}
              recentTenants={recentTenants}
              pendingInvitationRows={pendingInvitationRows}
              tenantUserCounts={tenantUserCounts}
              onStoresClick={() => selectSection("stores")}
              onInvitationsClick={() => selectSection("invitations")}
              onInviteTenant={ensureInvitationForTenant}
            />
          ) : null}

          {activeSection === "stores" ? (
            <StoresView
              filteredTenants={filteredTenants}
              loading={loading}
              pagedTenants={pagedTenants}
              pendingInvitations={pendingInvitations}
              safePage={safePage}
              searchTerm={searchTerm}
              tenantUserCounts={tenantUserCounts}
              totalPages={totalPages}
              onInviteTenant={ensureInvitationForTenant}
              onSearchChange={setSearchTerm}
              onTenantUpdated={handleTenantUpdated}
              setPage={setPage}
            />
          ) : null}

          {activeSection === "invitations" ? (
            <InvitationsView
              lastInvitation={lastInvitation}
              lastTenantName={lastTenantName}
              lastTenantWhatsapp={lastTenantWhatsapp}
              pendingInvitationRows={pendingInvitationRows}
              pendingInvitations={pendingInvitations}
              tenants={tenants}
              onInviteTenant={ensureInvitationForTenant}
              onInvitationRevoked={handleInvitationRevoked}
            />
          ) : null}

          {activeSection === "users" ? <UsersView tenants={tenants} /> : null}
          {activeSection === "history" ? <HistoryView /> : null}
        </div>
      </main>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-130 rounded-2xl border-none shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Generar invitacion
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Elige a cual tienda deseas generar el enlace de registro.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tienda
            </label>
            <select
              value={inviteTenantId ?? ""}
              onChange={(e) => setInviteTenantId(Number(e.target.value))}
              className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
              onClick={confirmInviteModal}
              className="cursor-pointer rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Generar
            </Button>
            <Button
              variant="outline"
              onClick={() => setInviteModalOpen(false)}
              className="cursor-pointer rounded-md"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformSidebar({
  activeSection,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  onSelectSection,
  onToggleCollapsed,
}) {
  return (
    <aside
      className={`fixed z-70 flex h-full flex-col border-r border-slate-900 bg-slate-950 shadow-2xl shadow-slate-900/20 transition-all duration-500 ease-in-out ${
        isMobileOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
    >
      <button
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-18 z-50 hidden rounded-full border-2 border-slate-950 bg-slate-800 p-1.5 text-white shadow-xl transition-transform hover:scale-110 lg:flex"
        aria-label="Contraer menu"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <button
        onClick={onCloseMobile}
        className="absolute right-4 top-4 text-slate-500 transition-colors hover:text-white lg:hidden"
        aria-label="Cerrar menu"
      >
        <X size={24} />
      </button>

      <div className="flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden pr-1">
        <div
          className={`flex h-24 items-center px-6 transition-all duration-300 ${
            isCollapsed ? "lg:justify-center lg:px-0" : "lg:px-6"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden lg:px-1">
            <div className="flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white text-xl font-black text-slate-900 shadow-lg">
              <Building2 size={21} strokeWidth={2.5} />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black uppercase tracking-tighter text-white">
                  SmartTech
                </h2>
                <p className="truncate text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Tenants
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-4 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`group flex h-12 w-full items-center rounded-xl transition-all duration-300 ${
                activeSection === item.id
                  ? "bg-white text-slate-950 shadow-lg"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              } ${isCollapsed && !isMobileOpen ? "justify-center px-0" : "gap-4 px-4"}`}
            >
              <item.icon size={20} strokeWidth={2.2} />
              {(!isCollapsed || isMobileOpen) && (
                <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800/50 p-4">
          <button
            type="button"
            onClick={onLogout}
            className={`group flex w-full cursor-pointer items-center rounded-xl bg-red-500/10 p-2 text-red-500 transition-all hover:bg-red-500/15 hover:text-red-400 ${
              isCollapsed && !isMobileOpen ? "justify-center" : "gap-4 px-3"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 transition-colors group-hover:bg-red-500/20">
              <LogOut size={20} strokeWidth={2} />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="whitespace-nowrap text-sm font-semibold tracking-wide">
                Cerrar Sesion
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function PlatformHeader({
  actorName,
  actorRoleLabel,
  isCollapsed,
  onOpenMobile,
  pageTitle,
}) {
  return (
    <header
      className={`fixed right-0 top-0 z-40 flex h-20 items-center justify-between border-b border-zinc-100 bg-white/95 px-4 backdrop-blur-md transition-all duration-500 ${
        isCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"
      }`}
    >
      <div className="flex w-1/3 items-center gap-4">
        <button
          onClick={onOpenMobile}
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Database size={16} />
          </div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Plataforma / <span className="text-slate-900">{pageTitle}</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-1 justify-center lg:hidden">
        <span className="truncate text-sm font-black uppercase tracking-tighter text-slate-900">
          Tenants Console
        </span>
      </div>

      <div className="flex w-1/3 items-center justify-end gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shadow-sm"
          aria-label="Tema claro"
        >
          <Moon size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end text-right sm:flex">
            <p className="mb-1 text-xs font-black uppercase leading-none tracking-tighter">
              {actorName}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              {actorRoleLabel}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-xs font-black text-white shadow-lg shadow-slate-100">
            {actorName?.charAt(0)?.toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardView({
  loading,
  onInviteTenant,
  onInvitationsClick,
  onStoresClick,
  pendingInvitationRows,
  planSummary,
  recentTenants,
  stats,
  tenantUserCounts,
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Plataforma sincronizada
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <PlatformStatCard key={stat.label} loading={loading} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-100 bg-white shadow-sm xl:col-span-2">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
                Tiendas Recientes
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Ultimas instancias anexadas a la plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={onStoresClick}
              className="rounded-xl border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
            >
              Ver tiendas
            </button>
          </header>
          <div className="p-4">
            {recentTenants.length ? (
              <div className="space-y-2">
                {recentTenants.map((tenant) => {
                  const used = Number(tenantUserCounts?.[tenant.tenant_id] || 0);
                  const limit = Number(
                    tenant.max_users || tenant.user_limit || 0,
                  );

                  return (
                    <div
                      key={tenant.tenant_id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800">
                          {tenant.name}
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-slate-400">
                          /{tenant.slug}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {tenant.plan_type || "Bronze"}
                        </span>
                        <span className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {used}/{limit || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No hay tiendas registradas todavia." />
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <header className="border-b border-slate-100 p-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
              Planes
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Distribucion comercial actual.
            </p>
          </header>
          <div className="space-y-4 p-6">
            {planSummary.map((item) => (
              <div key={item.plan}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-black uppercase tracking-widest text-slate-700">
                    {item.plan}
                  </span>
                  <span className="font-bold text-slate-400">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{
                      width: `${Math.min(100, item.count * 20)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <QuickPanel
          title="Acciones Rapidas"
          subtitle="Operaciones frecuentes de plataforma"
          items={[
            {
              title: "Ver y editar tiendas",
              description: "Abrir listado con acciones de administracion.",
              icon: Store,
              onClick: onStoresClick,
            },
            {
              title: "Generar invitaciones",
              description: "Crear enlaces de registro para administradores.",
              icon: Mail,
              onClick: onInvitationsClick,
            },
            {
              title: "Revisar actividad",
              description: "Consultar estados e invitaciones pendientes.",
              icon: Activity,
              onClick: onInvitationsClick,
            },
          ]}
        />

        <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
                Invitaciones Pendientes
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Administradores aun por activar.
              </p>
            </div>
            <UserPlus className="text-slate-300" size={20} />
          </header>
          <div className="p-4">
            {pendingInvitationRows.length ? (
              <div className="space-y-2">
                {pendingInvitationRows.map((tenant) => (
                  <button
                    key={tenant.tenant_id}
                    type="button"
                    onClick={() => onInviteTenant(tenant)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-800">
                        {tenant.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        Link de registro disponible
                      </p>
                    </div>
                    <Copy size={16} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="No hay invitaciones pendientes." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StoresView({
  filteredTenants,
  loading,
  onInviteTenant,
  onSearchChange,
  onTenantUpdated,
  pagedTenants,
  pendingInvitations,
  safePage,
  searchTerm,
  setPage,
  tenantUserCounts,
  totalPages,
}) {
  return (
    <section className="flex min-h-100 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
            Listado de Tiendas
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Crea tiendas nuevas, edita informacion, planes, estados e
            invitaciones.
          </p>
        </div>
        <div className="relative w-full group sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" />
          <Input
            placeholder="Buscar tienda o slug..."
            className="rounded-xl border-slate-100 bg-slate-50 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grow px-2 pb-2">
        <TenantTable
          tenants={pagedTenants}
          loading={loading}
          onTenantUpdated={onTenantUpdated}
          pendingInvitations={pendingInvitations}
          onInviteTenant={onInviteTenant}
          tenantUserCounts={tenantUserCounts}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">
            {filteredTenants.length}
          </span>
          <span>tienda(s)</span>
          <span className="text-slate-300">-</span>
          <span>
            Pagina <span className="font-semibold text-slate-700">{safePage}</span>{" "}
            de{" "}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            Anterior
          </button>
          <button
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}

function UsersView({ tenants }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    tenant_id: "",
    password: "",
    blocked: false,
  });

  const formatDateTime = (value) => {
    if (!value) return "Nunca";
    return new Date(value).toLocaleString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (value) => {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/platform/users");
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "No se pudo cargar usuarios.");
      setUsers(json.users || []);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const normalizedSearch = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(normalizedSearch) ||
      user.email?.toLowerCase().includes(normalizedSearch) ||
      user.tenant_name?.toLowerCase().includes(normalizedSearch) ||
      user.tenant_slug?.toLowerCase().includes(normalizedSearch)
    );
  });

  const openUserModal = (user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      tenant_id: user.tenant_id || "",
      password: "",
      blocked: user.blocked === true,
    });
  };

  const usageStats = useMemo(() => {
    const activeUsers = users.filter((user) => !user.blocked).length;
    const loggedUsers = users.filter((user) => user.last_sign_in_at).length;
    const flowUsers = users.filter((user) => user.has_usage_flow).length;
    const totalActivity = users.reduce(
      (total, user) => total + Number(user.activity_count || 0),
      0,
    );

    return [
      {
        label: "Usuarios",
        value: users.length,
        trend: `${activeUsers} activos`,
        icon: Users,
        color: "bg-slate-900",
      },
      {
        label: "Con login",
        value: loggedUsers,
        trend: "Ingresaron",
        icon: KeyRound,
        color: "bg-emerald-500",
      },
      {
        label: "Con flujo",
        value: flowUsers,
        trend: "Uso detectado",
        icon: Activity,
        color: "bg-blue-500",
      },
      {
        label: "Eventos",
        value: totalActivity,
        trend: "Bitacora",
        icon: Database,
        color: "bg-orange-500",
      },
    ];
  }, [users]);

  const saveUser = async (event) => {
    event.preventDefault();
    if (!selectedUser?.id) return;

    setSaving(true);
    try {
      const response = await fetch("/api/platform/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...formData,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "No se pudo actualizar usuario.");

      Swal.fire({
        icon: "success",
        title: "Usuario actualizado",
        timer: 1600,
        showConfirmButton: false,
      });
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (user) => {
    const nextBlocked = !user.blocked;
    const result = await Swal.fire({
      title: nextBlocked ? "Bloquear acceso" : "Restaurar acceso",
      text: nextBlocked
        ? "El usuario no podra entrar al sistema."
        : "El usuario podra volver a iniciar sesion.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextBlocked ? "BLOQUEAR" : "RESTAURAR",
      cancelButtonText: "CANCELAR",
      confirmButtonColor: "#0f172a",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch("/api/platform/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: user.full_name,
          email: user.email,
          tenant_id: user.tenant_id,
          blocked: nextBlocked,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "No se pudo actualizar acceso.");
      await fetchUsers();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {usageStats.map((stat) => (
          <PlatformStatCard key={stat.label} loading={loading} {...stat} />
        ))}
      </div>

      <div className="flex min-h-100 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
            Usuarios y Accesos
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Las claves estan protegidas; desde aqui puedes asignar una nueva.
          </p>
        </div>
        <div className="relative w-full group xl:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" />
          <Input
            placeholder="Buscar usuario, correo o tienda..."
            className="rounded-xl border-slate-100 bg-slate-50 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="grow overflow-x-auto px-2 pb-2">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Usuario
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Clave
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tienda enlazada
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Inicio
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Ultimo login
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Flujo
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                  <Loader2 className="mr-2 inline animate-spin" size={18} />
                  Cargando usuarios...
                </td>
              </tr>
            ) : filteredUsers.length ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                        {(user.full_name || user.email || "US")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">
                          {user.full_name || "Usuario sin nombre"}
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <KeyRound size={14} />
                      Protegida
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800">{user.tenant_name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {user.tenant_slug ? `/${user.tenant_slug}` : "Sin slug"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600">
                      {formatDate(user.created_at)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600">
                      {formatDateTime(user.last_sign_in_at)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                          user.has_usage_flow
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {user.has_usage_flow ? "Con flujo" : "Sin flujo"}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {Number(user.activity_count || 0)} evento
                        {Number(user.activity_count || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                        user.blocked
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {user.blocked ? "Bloqueado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openUserModal(user)}
                        className="rounded-xl border border-slate-100 p-2 text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
                        title="Editar usuario"
                      >
                        <UserCog size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBlocked(user)}
                        className={`rounded-xl border p-2 transition-colors ${
                          user.blocked
                            ? "border-emerald-100 text-emerald-600 hover:border-emerald-400"
                            : "border-red-100 text-red-500 hover:border-red-400"
                        }`}
                        title={user.blocked ? "Restaurar acceso" : "Bloquear acceso"}
                      >
                        <ShieldOff size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-150 rounded-2xl border-none shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Editar usuario
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Actualiza usuario, tienda, clave nueva o bloqueo de acceso.
            </p>
          </DialogHeader>

          <form onSubmit={saveUser} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nombre
                </label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(event) =>
                    setFormData({ ...formData, full_name: event.target.value })
                  }
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Usuario / correo
                </label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tienda enlazada
                </label>
                <select
                  required
                  value={formData.tenant_id}
                  onChange={(event) =>
                    setFormData({ ...formData, tenant_id: event.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Selecciona una tienda</option>
                  {(tenants || []).map((tenant) => (
                    <option key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nueva clave
                </label>
                <Input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                  placeholder="Dejar vacio para conservar"
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Inicio
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {formatDate(selectedUser?.created_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ultimo login
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {formatDateTime(selectedUser?.last_sign_in_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Flujo
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {Number(selectedUser?.activity_count || 0)} eventos
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-black text-slate-900">
                  Bloquear acceso al sistema
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Impide que este usuario pueda iniciar sesion en el panel.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.blocked}
                onChange={(event) =>
                  setFormData({ ...formData, blocked: event.target.checked })
                }
                className="h-5 w-5 accent-slate-900"
              />
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                {saving ? (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                ) : (
                  <Save className="mr-2" size={16} />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function InvitationsView({
  lastInvitation,
  lastTenantName,
  lastTenantWhatsapp,
  onInvitationRevoked,
  onInviteTenant,
  pendingInvitationRows,
  pendingInvitations,
  tenants,
}) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
            Link Activo
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Ultima invitacion seleccionada o generada.
          </p>
        </div>
        {lastInvitation ? (
          <InvitationLink
            invitation={lastInvitation}
            tenantName={lastTenantName}
            tenantWhatsappNumber={lastTenantWhatsapp}
            onRevoked={onInvitationRevoked}
          />
        ) : (
          <EmptyState text="Selecciona una tienda para generar o ver una invitacion." />
        )}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <header className="border-b border-slate-100 p-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
            Tiendas para Invitar
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Puedes crear o reutilizar invitaciones pendientes.
          </p>
        </header>
        <div className="max-h-[560px] overflow-y-auto p-4">
          {tenants.length ? (
            <div className="space-y-2">
              {tenants.map((tenant) => {
                const hasPending = pendingInvitations.get(tenant.tenant_id);
                const isHighlighted = pendingInvitationRows.some(
                  (row) => row.tenant_id === tenant.tenant_id,
                );

                return (
                  <button
                    key={tenant.tenant_id}
                    type="button"
                    onClick={() => onInviteTenant(tenant)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
                      isHighlighted
                        ? "border-blue-100 bg-blue-50/60"
                        : "border-slate-100 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-800">
                        {tenant.name}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-slate-400">
                        /{tenant.slug}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                        hasPending
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {hasPending ? "Pendiente" : "Generar"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState text="No hay tiendas registradas." />
          )}
        </div>
      </section>
    </div>
  );
}

function PlatformStatCard({ color, icon: Icon, label, loading, trend, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-6 flex items-start justify-between">
        <div className={`rounded-2xl p-3 text-white ${color}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">
          {trend}
        </span>
      </div>
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <h3 className="text-4xl font-black leading-none tracking-tighter text-slate-900">
        {loading ? "-" : value}
      </h3>
    </div>
  );
}

function QuickPanel({ items, subtitle, title }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
      </header>
      <div className="space-y-3 p-4">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={item.onClick}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-slate-900 hover:bg-white"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                <item.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-800">
                  {item.title}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-400">
      {text}
    </div>
  );
}
