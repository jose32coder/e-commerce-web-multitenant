"use client";
import React, { useState, useEffect } from "react";
import {
  Camera,
  Mail,
  Phone,
  Briefcase,
  User,
  Edit2,
  Save,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";
import { useSiteConfig } from "@/context/SiteConfigContext";

const MODULE_DESCRIPTIONS = {
  Panel: "Acceso al Dashboard Principal",
  Producto: "Gestión de Productos y Stock",
  Categorías: "Administración de Categorías",
  Ventas: "Monitoreo de Órdenes y Pedidos",
  Clientes: "Base de Datos de Compradores",
  Bitácora: "Registro de Actividad (Historial)",
  Ajustes: "Configuraciones y Gestión de Staff",
};

const ROLE_PERMISSIONS = {
  super_admin: [
    "Panel",
    "Producto",
    "Categorías",
    "Ventas",
    "Clientes",
    "Bitácora",
    "Ajustes",
  ],
  editor: ["Panel", "Producto", "Categorías", "Ventas"],
  viewer: ["Panel", "Ventas"],
};

const InfoField = ({
  icon: Icon,
  label,
  value,
  isEditing,
  onChange,
  name,
  readOnly = false,
  placeholder,
}) => (
  <div
    className={`p-4 rounded-xl border transition-all duration-300 ${
      isEditing && !readOnly
        ? "bg-white dark:bg-slate-800 border-slate-900 dark:border-white ring-4 ring-slate-50 dark:ring-slate-800/50"
        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 shadow-sm"
    } ${readOnly ? "bg-slate-50/50 dark:bg-slate-900/50" : ""}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500">
        <Icon size={14} />
      </div>
      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">
        {label}
      </p>
    </div>
    {isEditing && !readOnly ? (
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-2 px-3 focus:ring-0 text-sm font-bold text-slate-900 dark:text-white"
      />
    ) : (
      <p
        className={`text-sm font-bold ml-1 truncate ${value ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"}`}
      >
        {value || "No asignado"}
      </p>
    )}
  </div>
);

const Profile = () => {
  const supabase = createClient();
  const { site_name, commerce_settings } = useSiteConfig();
  const logoUrl = commerce_settings?.logo_url;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    email: "",
    role: "",
    phone: "",
    avatar_url: "",
  });
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.warn("No se pudo obtener sesión de usuario:", authError.message);
        return;
      }
      if (!user) return;

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      const fullData = { ...data, email: user.email };
      setProfile(fullData);
      setFormData(fullData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);

      Swal.fire({
        icon: "success",
        title: "Perfil Actualizado",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire("Error", error.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const getEffectivePermissions = () => {
    if (
      profile.permissions &&
      Array.isArray(profile.permissions) &&
      profile.permissions.length > 0
    ) {
      return profile.permissions;
    }
    return ROLE_PERMISSIONS[profile.role] || [];
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-slate-900" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* HEADER PERFIL */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Store Logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <User size={40} className="text-slate-600" />
              )}
            </div>
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 p-2 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
              {profile.full_name || "Mi Usuario"}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-500/20">
                Online
              </span>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                ID: {profile.id?.substring(0, 8)}
              </span>

            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-slate-900 px-5 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
              >
                <Edit2 size={12} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...profile });
                  }}
                  className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : (
                    <Save size={12} />
                  )}
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETALLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoField
          icon={User}
          label="Nombre Completo"
          name="full_name"
          value={formData.full_name}
          isEditing={isEditing}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
        />
        <InfoField
          icon={Phone}
          label="Teléfono"
          name="phone"
          value={formData.phone}
          isEditing={isEditing}
          placeholder="+00 000 0000"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <InfoField icon={Mail} label="Email" value={profile.email} readOnly />
      </div>

      {/* ROL / PERMISOS ACCESO */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nivel de Seguridad
            </p>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {profile.role?.replace("_", " ")}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {getEffectivePermissions().map((perm) => (
            <div
              key={perm}
              className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700/50 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {perm}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {MODULE_DESCRIPTIONS[perm] || "Acceso al módulo"}
                </span>
              </div>
            </div>
          ))}
          {getEffectivePermissions().length === 0 && (
            <div className="col-span-2 py-4 text-center">
              <p className="text-xs text-slate-400 italic">
                No tienes permisos asignados específicamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
