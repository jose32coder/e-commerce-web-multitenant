import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const RATE_LIMIT_BLOCK_SECONDS = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
const ADMIN_LOGIN_PATH = "/access";
const PLATFORM_LOGIN_PATH = "/platform-access";
const ADMIN_STORAGE_KEY = "sb-admin-auth";
const PLATFORM_STORAGE_KEY = "sb-platform-auth";

const globalForRateLimit = globalThis;
if (!globalForRateLimit.__tenantRateLimitStore) {
  globalForRateLimit.__tenantRateLimitStore = new Map();
}
const rateLimitStore = globalForRateLimit.__tenantRateLimitStore;

const RESERVED_PREFIXES = new Set([
  "admin",
  "api",
  "access",
  "platform-access",
  "_next",
  "register",
  "tenants",
]);

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const getClientIp = (req) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
};

const resolveTenantScope = (pathname) => {
  if (!pathname || pathname === "/") return "root";
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (!firstSegment) return "root";
  if (RESERVED_PREFIXES.has(firstSegment)) return firstSegment;
  return `tenant:${firstSegment}`;
};

const shouldRateLimitPath = (pathname) =>
  pathname.startsWith("/api") ||
  pathname.startsWith("/admin") ||
  pathname.startsWith("/tenants") ||
  pathname.includes("/checkout");

const hasPlatformScopeInMetadata = (user) => {
  const scopeFromUserMetadata = user?.user_metadata?.access_scope;
  const scopeFromAppMetadata = user?.app_metadata?.access_scope;
  return (
    scopeFromUserMetadata === "platform" || scopeFromAppMetadata === "platform"
  );
};

const isPlatformAdminEmail = (email) => {
  if (!email || PLATFORM_ADMIN_EMAILS.length === 0) return false;
  return PLATFORM_ADMIN_EMAILS.includes(String(email).toLowerCase());
};

const isAuthPath = (pathname) =>
  pathname === ADMIN_LOGIN_PATH || pathname === PLATFORM_LOGIN_PATH;

const isAdminAreaPath = (pathname) =>
  pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH;

const isPlatformAreaPath = (pathname) =>
  pathname.startsWith("/tenants") && pathname !== PLATFORM_LOGIN_PATH;

const resolveStorageKeyForPath = (pathname) => {
  if (pathname === PLATFORM_LOGIN_PATH) return PLATFORM_STORAGE_KEY;
  if (pathname === ADMIN_LOGIN_PATH) return ADMIN_STORAGE_KEY;
  if (isPlatformAreaPath(pathname)) return PLATFORM_STORAGE_KEY;
  return ADMIN_STORAGE_KEY;
};

const getPortalContext = async (supabase, session) => {
  if (!session?.user?.id) return { type: "anonymous", hasStaffProfile: false };
  const { data: staffProfile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();
  if (profileError) return { type: "unknown", hasStaffProfile: false };
  if (staffProfile?.id) return { type: "admin", hasStaffProfile: true };
  const email = session.user.email;
  if (hasPlatformScopeInMetadata(session.user) || isPlatformAdminEmail(email)) {
    return { type: "platform", hasStaffProfile: false };
  }
  return { type: "unknown", hasStaffProfile: false };
};

const applyRateLimit = (req) => {
  const pathname = req.nextUrl.pathname;
  if (!shouldRateLimitPath(pathname)) return null;
  const now = Date.now();
  const ip = getClientIp(req);
  const tenantScope = resolveTenantScope(pathname);
  const key = `${tenantScope}:${ip}`;
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    const response = NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos." },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(RATE_LIMIT_BLOCK_SECONDS));
    return response;
  }
  return null;
};

export async function middleware(req) {
  const rateLimitedResponse = applyRateLimit(req);
  if (rateLimitedResponse) return rateLimitedResponse;

  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const pathname = req.nextUrl.pathname;
  const storageKey = resolveStorageKeyForPath(pathname);

  // 1. CREACIÓN GLOBAL DEL CLIENTE (Para que las Actions funcionen en cualquier ruta)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
      auth: { storageKey },
    },
  );

  // 2. LÓGICA DE PROTECCIÓN Y REDIRECCIONES
  if (
    isAdminAreaPath(pathname) ||
    isPlatformAreaPath(pathname) ||
    isAuthPath(pathname)
  ) {
    // REFRESCAR SESIÓN SOLO AQUÍ PARA AHORRAR EDGE REQUESTS
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      if (isAuthPath(pathname)) return res;
      const loginTarget = isPlatformAreaPath(pathname)
        ? PLATFORM_LOGIN_PATH
        : ADMIN_LOGIN_PATH;
      return NextResponse.redirect(new URL(loginTarget, req.url));
    }

    const portalContext = await getPortalContext(supabase, session);

    if (pathname === ADMIN_LOGIN_PATH) {
      if (portalContext.type === "admin")
        return NextResponse.redirect(new URL("/admin", req.url));
      if (portalContext.type === "platform")
        return NextResponse.redirect(new URL("/tenants", req.url));
      return res;
    }

    if (pathname === PLATFORM_LOGIN_PATH) {
      if (portalContext.type === "platform")
        return NextResponse.redirect(new URL("/tenants", req.url));
      if (portalContext.type === "admin")
        return NextResponse.redirect(new URL("/admin", req.url));
      return res;
    }

    if (isAdminAreaPath(pathname) && portalContext.type !== "admin") {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
    }

    if (isPlatformAreaPath(pathname) && portalContext.type !== "platform") {
      if (portalContext.type === "admin")
        return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.redirect(new URL(PLATFORM_LOGIN_PATH, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que empiezan por:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt, etc.
     */
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|mp4|webm|csv)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
