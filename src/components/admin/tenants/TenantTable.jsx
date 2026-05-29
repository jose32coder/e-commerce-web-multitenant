import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  Check,
  ExternalLink,
  Power,
  PowerOff,
  Mail,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import {
  getUserLimitForPlan,
  normalizePlanType,
  updateTenant,
} from "@/services/tenants";
import { updateTenantAction } from "@/app/actions/public/tenantActions";
import { EditTenantModal } from "@/components/admin/tenants/EditTenantModal";
import Swal from "sweetalert2";
import { buildClientUrl } from "@/lib/url";

export function TenantTable({
  tenants,
  loading,
  onTenantUpdated,
  pendingInvitations,
  onInviteTenant,
  tenantUserCounts,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [planLoading, setPlanLoading] = useState(null);

  const getTenantUrl = (slug) => {
    return buildClientUrl(`/${slug}`);
  };

  const toggleStatus = async (tenant) => {
    const newStatus = tenant.status === "Active" ? "Inactive" : "Active";
    setStatusLoading(tenant.tenant_id);

    try {
      const updated = await updateTenant(tenant.tenant_id, {
        status: newStatus,
      });
      if (onTenantUpdated) onTenantUpdated(updated);

      Swal.fire({
        title: "Actualizado",
        text: `La tienda ahora está ${newStatus === "Active" ? "Activa" : "Inactiva"}`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo cambiar el estado", "error");
    } finally {
      setStatusLoading(null);
    }
  };

  const updatePlan = async (tenant, nextPlanTypeRaw) => {
    if (!tenant?.tenant_id) return;

    const nextPlanType = normalizePlanType(nextPlanTypeRaw);
    const maxUsers = getUserLimitForPlan(nextPlanType);
    setPlanLoading(tenant.tenant_id);

    try {
      const result = await updateTenantAction(tenant.tenant_id, {
        plan_type: nextPlanType,
      });
      if (!result.success) {
        throw new Error(result.error || "No se pudo actualizar el plan.");
      }
      const updated = result.data;
      onTenantUpdated?.(updated);

      Swal.fire({
        title: "Plan actualizado",
        text: `Plan: ${nextPlanType} | Límite: ${maxUsers} usuario(s)`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el plan", "error");
    } finally {
      setPlanLoading(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-gray-500">No hay tiendas registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">
              Tienda
            </TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">
              Plan
            </TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">
              Usuarios / Límite
            </TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">
              Estado
            </TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow
              key={tenant.tenant_id}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-gray-900">{tenant.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {tenant.slug}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <select
                    value={normalizePlanType(tenant.plan_type)}
                    onChange={(e) => updatePlan(tenant, e.target.value)}
                    disabled={planLoading === tenant.tenant_id}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    title="Cambiar plan"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                  {planLoading === tenant.tenant_id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center">
                  {(() => {
                    const used = Number(
                      tenantUserCounts?.[tenant.tenant_id] ?? 0,
                    );
                    const limit = Number(
                      tenant.max_users || tenant.user_limit || 0,
                    );
                    const pct =
                      limit > 0
                        ? Math.min(100, Math.round((used / limit) * 100))
                        : 0;
                    return (
                      <>
                        <span className="text-sm font-medium">
                          {used} / {limit || "—"}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={tenant.status === "Active" ? "success" : "warning"}
                  className={`rounded-full px-3 ${tenant.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {tenant.status === "Active" ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onInviteTenant?.(tenant)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      pendingInvitations?.get?.(tenant.tenant_id)
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title={
                      pendingInvitations?.get?.(tenant.tenant_id)
                        ? "Invitación pendiente"
                        : "Generar invitación"
                    }
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <EditTenantModal tenant={tenant} onTenantUpdated={onTenantUpdated} />
                  <button
                    onClick={() => toggleStatus(tenant)}
                    disabled={statusLoading === tenant.tenant_id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      tenant.status === "Active"
                        ? "text-red-500 hover:bg-red-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                    title={
                      tenant.status === "Active" ? "Inhabilitar" : "Habilitar"
                    }
                  >
                    {statusLoading === tenant.tenant_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : tenant.status === "Active" ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        getTenantUrl(tenant.slug),
                        tenant.tenant_id,
                      )
                    }
                    className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    title="Copiar URL"
                  >
                    {copiedId === tenant.tenant_id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getTenantUrl(tenant.slug)}
                    target="_blank"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                    title="Ver tienda"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
