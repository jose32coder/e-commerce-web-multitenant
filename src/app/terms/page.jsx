import LegalPageContent from "@/components/public/legal/LegalPageContent";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";

export const metadata = {
  title: "Términos y Condiciones",
};

export default function PlatformTermsPage() {
  const content = `Bienvenido a los Términos y Condiciones de la plataforma. Al utilizar nuestros servicios, aceptas las siguientes reglas.

## 1. Uso del Servicio
La plataforma proporciona la infraestructura para que los comercios operen sus tiendas online. Al acceder, te comprometes a utilizar el sistema de forma responsable y ética.

## 2. Comercios y Responsabilidades
Cada comercio (tienda online) es el único responsable de sus productos, ventas, envíos y de la atención al cliente final. La plataforma funge como proveedor tecnológico, no como parte en las transacciones comerciales.

## 3. Condiciones Financieras
El acceso a la plataforma está sujeto a los planes o suscripciones acordadas. Nos reservamos el derecho de modificar nuestras tarifas previo aviso.

## 4. Disponibilidad del Servicio
Trabajamos para mantener una disponibilidad superior al 99%. Sin embargo, no garantizamos que el servicio estará ininterrumpido en todo momento por razones de mantenimiento o fuerza mayor.

## 5. Cuentas y Accesos
Eres responsable de mantener la seguridad de las credenciales de acceso a tu panel administrativo.`;

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
          type="terms" 
          title="Términos y Condiciones" 
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
