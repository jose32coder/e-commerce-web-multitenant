"use client";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { PLATFORM_BRAND_NAME, PLATFORM_BRAND_HOSTNAME } from "@/lib/siteConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const brand = PLATFORM_BRAND_NAME;
  const hostname = PLATFORM_BRAND_HOSTNAME.replace(/^https?:\/\//, "");
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    let cancelled = false;

    const redirectIfSessionExists = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user || cancelled) return;

      const accessScope =
        user.user_metadata?.access_scope || user.app_metadata?.access_scope;
      const isBlocked =
        user.user_metadata?.blocked_access === true ||
        user.app_metadata?.blocked_access === true;

      if (isBlocked) {
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      if (accessScope === "platform") {
        router.replace("/tenants");
        return;
      }

      const { data: staffProfile } = await supabase
        .from("staff_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (
        staffProfile?.id ||
        accessScope === "admin" ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin"
      ) {
        router.replace("/admin");
      }
    };

    redirectIfSessionExists();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("No se pudo validar el perfil del usuario.");
      }

      const isBlocked =
        data.user?.user_metadata?.blocked_access === true ||
        data.user?.app_metadata?.blocked_access === true;

      if (isBlocked) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("Esta cuenta esta bloqueada.");
      }

      const { data: staffProfile, error: profileError } = await supabase
        .from("staff_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !staffProfile?.id) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error(
          "Esta cuenta no tiene acceso al panel administrativo de tienda.",
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Acceso Denegado",
        text: "Las credenciales no coinciden con nuestros registros.",
        confirmButtonColor: "#0f172a",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl uppercase text-xs tracking-widest px-8",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[480px] z-10">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          {/* Header con gradiente sutil */}
          <div className="bg-slate-50/50 px-10 pt-10 pb-6 border-b border-slate-50 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 mx-auto">
              <ShieldCheck
                className="text-slate-900"
                size={28}
                strokeWidth={1.5}
              />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              {brand}
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="h-px w-4 bg-slate-200"></span>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                Admin Access
              </p>
              <span className="h-px w-4 bg-slate-200"></span>
            </div>
          </div>

          <div className="px-10 py-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1 transition-colors group-focus-within:text-slate-900">
                  Correo
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900">
                    <Mail size={18} strokeWidth={2} />
                  </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent pl-12 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-white outline-none text-sm font-medium transition-all"
                      placeholder={`usuario@${hostname}`}
                    />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1 transition-colors group-focus-within:text-slate-900">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-white outline-none text-sm font-medium transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Entrar al Sistema</span>
                      <LogIn size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-[9px] text-slate-300 font-bold leading-relaxed px-4">
                SISTEMA DE GESTIÓN PRIVADO. <br />
                EL ACCESO NO AUTORIZADO ESTÁ MONITOREADO.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
          © {currentYear} {brand}
        </p>
      </div>
    </div>
  );
}
