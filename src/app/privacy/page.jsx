import LegalPageContent from "@/components/public/legal/LegalPageContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";

export const metadata = {
  title: "Privacidad",
};

export default function PlatformPrivacyPage() {
  const content = `Bienvenido a la Política de Privacidad de la plataforma. Aquí te explicamos cómo protegemos tu información y la de las tiendas.

## 1. Recopilación de Información
Recopilamos información al registrarte como comercio o realizar transacciones dentro de la plataforma. Esto incluye datos básicos de contacto, información del comercio y datos técnicos de navegación.

## 2. Uso de la Información
Tus datos son utilizados exclusivamente para:
- Proveer y mejorar el servicio de la plataforma.
- Procesar el acceso y gestión de tu tienda online.
- Enviar notificaciones críticas del sistema.

## 3. Protección de Datos
Implementamos las mejores prácticas y medidas de seguridad estándar de la industria para mantener segura toda la información. No compartimos tus datos con terceros sin consentimiento, salvo obligación legal.

## 4. Contacto
Si tienes alguna duda o requerimiento sobre tus datos, por favor contáctanos al equipo de soporte de la plataforma.`;

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-700 overflow-x-hidden flex flex-col">
      <header className="border-b border-zinc-200/80 bg-slate-50/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-14 md:h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl md:text-2xl tracking-tight text-zinc-700 truncate mr-4">
            {PLATFORM_BRAND_NAME}
          </Link>
          <Link
            href="/access"
            className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-all shrink-0"
          >
            <UserRound size={16} />
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <LegalPageContent 
          type="privacy" 
          title="Política de Privacidad" 
          content={content} 
        />
      </div>

      <footer className="border-t border-zinc-200 py-8 md:py-12 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <span className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-400 text-center md:text-left">
            © {new Date().getFullYear()} {PLATFORM_BRAND_NAME}{" "}
            <span className="hidden sm:inline">·</span>{" "}
            <br className="sm:hidden" /> Todos los derechos reservados
          </span>
          <div className="flex gap-6 items-center">
            <Link href="/privacy" className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-800 transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-800 transition-colors">
              Términos
            </Link>
            <span className="text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-zinc-500 font-medium">
              Desarrollado por <span className="text-zinc-800">Deploy</span>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
