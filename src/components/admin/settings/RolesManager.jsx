"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  User,
  Shield,
  Key,
  Mail,
  X,
  Loader2,
  Edit2,
  Trash2,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Swal from "sweetalert2";

const AVAILABLE_MODULES = [
  "Panel",
  "Productos",
  "Categorías",
  "Ventas",
  "Clientes",
  "Bitácora",
  "Ajustes",
];

const PRESET_PERMISSIONS = {
  super_admin: AVAILABLE_MODULES,
  editor: ["Panel", "Productos", "Categorías", "Ventas"],
  viewer: ["Panel", "Ventas"],
  custom: [],
};

const RolesManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { tenant_id: tenantId } = useSiteConfig();
  const supabase = createClient();
  
  const [effectiveTenantId, setEffectiveTenantId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "editor",
    permissions: PRESET_PERMISSIONS.editor,
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const scopedTenantId = effectiveTenantId ?? tenantId ?? null;

      let staffQuery = supabase
        .from("staff_profiles")
        .select("*")
        .order("full_name");
      if (scopedTenantId)
        staffQuery = staffQuery.eq("tenant_id", scopedTenantId);

      const { data, error } = await staffQuery;

      setStaff(data || []);
    } catch (error) {
      console.error("Error cargando staff:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const {
          data: auth,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.warn("No se pudo obtener usuario actual:", authError.message);
          fetchStaff();
          return;
        }

        const user = auth?.user;
        setCurrentUser(user || null);

        if (!user?.id) {
          fetchStaff();
          return;
        }

        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .maybeSingle();

        const scopedTenantId = profile?.tenant_id ?? tenantId ?? null;
        setEffectiveTenantId(scopedTenantId);
      } catch (error) {
        console.warn("Error cargando contexto de roles:", error?.message);
      } finally {
        fetchStaff();
      }
    };

    bootstrap();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setIsResetMode(false);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: "editor",
      permissions: PRESET_PERMISSIONS.editor,
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    setIsResetMode(false);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      password: "",
      role: member.role || "custom",
      permissions: member.permissions || PRESET_PERMISSIONS[member.role] || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (isResetMode) {
        const response = await fetch("/api/admin/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editingId,
            newPassword: formData.password,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        Swal.fire("Éxito", "Contraseña actualizada", "success");
      } else if (editingId) {
        const targetMember = staff.find((s) => s.id === editingId);
        const response = await fetch("/api/admin/update-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editingId,
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions,
            actor_name: currentUser?.email ?? "Admin",
            target_name: targetMember?.full_name ?? formData.email,
            tenant_id: targetMember?.tenant_id || tenantId,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        Swal.fire({
          icon: "success",
          title: "Actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const response = await fetch("/api/admin/create-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            actor_name: currentUser?.email ?? "Admin",
            tenant_id: tenantId,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        Swal.fire({
          icon: "success",
          title: "Creado",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setShowModal(false);
      fetchStaff();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = (user) => {
    setEditingId(user.id);
    setIsResetMode(true);
    setFormData({ ...formData, password: "" });
    setShowModal(true);
  };

  const handleRoleChange = (newRole) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: PRESET_PERMISSIONS[newRole] || [],
    });
  };

  const togglePermission = (perm) => {
    const current = [...formData.permissions];
    if (current.includes(perm)) {
      setFormData({
        ...formData,
        permissions: current.filter((p) => p !== perm),
      });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  const handleDelete = async (id) => {
    // Evitar que el usuario se auto-elimine
    if (currentUser && id === currentUser.id) {
      return Swal.fire({
        title: "Operación no permitida",
        text: "No puedes eliminar tu propia cuenta mientras estás logueado por razones de seguridad.",
        icon: "error",
        confirmButtonColor: "#1e293b",
        confirmButtonText: "ENTENDIDO",
        customClass: {
          popup: "rounded-xl border-none shadow-2xl font-sans",
          confirmButton:
            "rounded-lg bg-slate-900 px-6 py-3 font-black uppercase text-[10px] tracking-widest text-white cursor-pointer",
        },
        buttonsStyling: false,
      });
    }

    const result = await Swal.fire({
      title: "¿Eliminar permanentemente?",
      text: "Se borrará del acceso y del sistema de login.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1e293b",
      cancelButtonColor: "#f1f5f9",
      confirmButtonText: "SÍ, ELIMINAR",
      cancelButtonText: "CANCELAR",
      customClass: {
        popup: "rounded-xl border-none shadow-2xl",
        confirmButton:
          "rounded-lg bg-slate-900 px-6 py-3 font-black uppercase text-[10px] tracking-widest",
        cancelButton:
          "rounded-lg bg-slate-100 text-slate-500 px-6 py-3 font-black uppercase text-[10px] tracking-widest ml-2",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        const targetMember = staff.find((s) => s.id === id);
        const actorName = encodeURIComponent(currentUser?.email ?? "Admin");
        const targetName = encodeURIComponent(targetMember?.full_name ?? id);
        const response = await fetch(
          `/api/admin/delete-staff?id=${id}&actor=${actorName}&name=${targetName}`,
          { method: "DELETE" },
        );
        const resJson = await response.json();
        if (!response.ok) throw new Error(resJson.error);

        Swal.fire("Eliminado", "El usuario ya no tiene acceso.", "success");
        fetchStaff();
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Roles y Acceso
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administración de permisos y personal de la plataforma.
          </p>
        </div>
        {loading ? (
          <button
            disabled
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed"
            title="Sincronizando..."
          >
            <Loader2 className="animate-spin" size={16} />
            CARGANDO...
          </button>
        ) : (
          <button
            onClick={openCreateModal}
            className="flex cursor-pointer items-center gap-2 bg-slate-900 dark:bg-white text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-white dark:text-slate-900 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
          >
            <Plus size={16} />
            CREAR USUARIO
          </button>
        )}
      </header>

      {/* Tabla Estándar con scroll responsive */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Usuario
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Rol
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic"
                >
                  <Loader2
                    className="animate-spin inline mr-2 text-slate-300 dark:text-slate-600"
                    size={20}
                  />
                  Sincronizando equipo...
                </td>
              </tr>
            ) : staff.length > 0 ? (
              staff.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-black border border-slate-800 dark:border-slate-600">
                        {user.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-sm">
                          {user.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium lowercase italic">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`
      inline-flex items-center justify-center
      px-3 py-1.5 rounded-lg
      text-[9px] font-black uppercase tracking-widest
      whitespace-nowrap min-w-20
      ${
        user.role === "super_admin"
          ? "bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-sm dark:shadow-none"
          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
      }
    `}
                      >
                        {user.role?.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 text-slate-400 dark:text-slate-500">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 cursor-pointer hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all"
                        title="Reiniciar Clave"
                      >
                        <KeyRound size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 cursor-pointer hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold"
                >
                  No hay miembros registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 min-h-screen bg-slate-900/60 backdrop-blur-md z-150 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-4xl p-6 md:p-10 shadow-2xl relative border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                {isResetMode
                  ? "Seguridad"
                  : editingId
                    ? "Configurar Perfil"
                    : "Nuevo Miembro"}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1">
                {isResetMode
                  ? "Actualiza las credenciales de acceso."
                  : "Define la identidad y alcances del usuario."}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* SECCIÓN: DATOS DE IDENTIDAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingId && !isResetMode && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        size={16}
                      />
                      <input
                        required
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white outline-none text-sm text-slate-900 dark:text-white font-medium transition-all"
                        placeholder="Ej. Juan Perez"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {!isResetMode && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        size={16}
                      />
                      <input
                        required
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white dark:focus:bg-slate-900 outline-none text-sm text-slate-900 dark:text-white font-medium transition-all"
                        placeholder="email@tienda.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {(!editingId || isResetMode) && (
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                      Contraseña de Acceso
                    </label>
                    <div className="relative">
                      <Key
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        size={16}
                      />
                      <input
                        required
                        type="password"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white dark:focus:bg-slate-900 outline-none text-sm text-slate-900 dark:text-white font-medium transition-all font-mono"
                        placeholder="••••••••"
                        minLength={6}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {!isResetMode && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                      Rol Administrativo
                    </label>
                    <div className="relative">
                      <Shield
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        size={16}
                      />
                      <select
                        className={`w-full pl-10 pr-10 py-3 border border-transparent dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none text-sm font-bold appearance-none transition-all uppercase tracking-tighter ${
                          editingId && formData.role !== "custom"
                            ? "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                            : "bg-slate-50 dark:bg-slate-800 cursor-pointer"
                        }`}
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={editingId && formData.role !== "custom"}
                      >
                        <option value="editor">Editor</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="viewer">Viewer</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN: PERMISOS */}
              {!isResetMode && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      Módulos y Privilegios
                    </p>
                    {formData.role !== "custom" && (
                      <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                        Predefinido por Rol
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {AVAILABLE_MODULES.map((mod) => (
                      <label
                        key={mod}
                        className={`flex items-center justify-center p-3 rounded-xl border transition-all text-center ${
                          formData.role !== "custom"
                            ? "cursor-not-allowed opacity-80"
                            : "cursor-pointer"
                        } ${
                          formData.permissions.includes(mod)
                            ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-md shadow-slate-200 dark:shadow-none"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.permissions.includes(mod)}
                          onChange={() => togglePermission(mod)}
                          disabled={formData.role !== "custom"}
                        />
                        <span className="text-[10px] font-black uppercase tracking-tighter truncate">
                          {mod}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2rem] hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2rem] hover:bg-slate-800 dark:hover:bg-white cursor-pointer transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "CONFIRMAR CAMBIOS"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManager;
