import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// --- CONFIGURACIÓN DE RATE LIMIT ---
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

// --- UTILIDADES ---
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
  if (pathname === PLATFORM_LOGIN_PATH || isPlatformAreaPath(pathname))
    return PLATFORM_STORAGE_KEY;
  return ADMIN_STORAGE_KEY;
};

const getPortalContext = async (supabase, session) => {
  if (!session?.user?.id) {
    return { type: "anonymous", hasStaffProfile: false, tenantId: null };
  }

  const userMeta = session.user.user_metadata || {};
  const appMeta = session.user.app_metadata || {};
  const email = session.user.email;

  const accessScope = userMeta.access_scope || appMeta.access_scope;
  const role = userMeta.role || appMeta.role;

  if (accessScope === "platform" || isPlatformAdminEmail(email)) {
    return { type: "platform", hasStaffProfile: false, tenantId: null };
  }

  if (accessScope === "admin" || role === "admin" || appMeta.role === "admin") {
    let tenantId = userMeta.tenant_id || appMeta.tenant_id || null;

    if (!tenantId) {
      const { data: staffProfile } = await supabase
        .from("staff_profiles")
        .select("tenant_id")
        .eq("id", session.user.id)
        .maybeSingle();

      tenantId = staffProfile?.tenant_id || null;
    }

    return { type: "admin", hasStaffProfile: true, tenantId };
  }

  return { type: "unknown", hasStaffProfile: false, tenantId: null };
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

// --- PROXY / MIDDLEWARE ---
export async function proxy(req) {
  const rateLimitedResponse = applyRateLimit(req);
  if (rateLimitedResponse) return rateLimitedResponse;

  const requestHeaders = new Headers(req.headers);
  // Nunca confíes en un x-tenant-id enviado por el cliente.
  requestHeaders.delete("x-tenant-id");
  const responseCookies = new Map();
  const responseHeaders = new Map();

  const buildNextResponse = () => {
    const nextResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });

    responseCookies.forEach(({ value, options }, name) => {
      nextResponse.cookies.set(name, value, options);
    });

    responseHeaders.forEach((value, key) => {
      nextResponse.headers.set(key, value);
    });

    return nextResponse;
  };

  const pathname = req.nextUrl.pathname;
  const requiresAuthGuard =
    isAdminAreaPath(pathname) ||
    isPlatformAreaPath(pathname) ||
    isAuthPath(pathname);

  // Evita inicializar Supabase en rutas públicas: reduce overhead y previene
  // efectos secundarios de cookies en rutas multisegmento.
  if (!requiresAuthGuard) {
    return buildNextResponse();
  }

  let res = buildNextResponse();

  const storageKey = resolveStorageKeyForPath(pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet, headersToSet = {}) => {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );

          cookiesToSet.forEach(({ name, value, options }) => {
            responseCookies.set(name, { value, options });
          });

          Object.entries(headersToSet).forEach(([key, value]) => {
            if (typeof value === "string") {
              responseHeaders.set(key, value);
            }
          });

          res = buildNextResponse();
        },
      },
      auth: { storageKey },
    },
  );

  // Validamos el usuario directamente contra Supabase
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (isAuthPath(pathname)) return res;

    const loginTarget = isPlatformAreaPath(pathname)
      ? PLATFORM_LOGIN_PATH
      : ADMIN_LOGIN_PATH;
    const redirectRes = NextResponse.redirect(new URL(loginTarget, req.url));

    // Borramos la cookie corrupta para solucionar el error de Refresh Token
    redirectRes.cookies.delete(storageKey);
    return redirectRes;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const portalContext = await getPortalContext(supabase, session);

  // Redirecciones si ya hay sesión
  if (pathname === ADMIN_LOGIN_PATH) {
    if (portalContext.type === "admin")
      return NextResponse.redirect(new URL("/admin", req.url));
    if (portalContext.type === "platform")
      return NextResponse.redirect(new URL("/tenants", req.url));
  }

  if (pathname === PLATFORM_LOGIN_PATH) {
    if (portalContext.type === "platform")
      return NextResponse.redirect(new URL("/tenants", req.url));
    if (portalContext.type === "admin")
      return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Seguridad de rutas por rol
  if (isAdminAreaPath(pathname) && portalContext.type !== "admin") {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
  }

  if (isPlatformAreaPath(pathname) && portalContext.type !== "platform") {
    const fallback =
      portalContext.type === "admin" ? "/admin" : PLATFORM_LOGIN_PATH;
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  if (isAdminAreaPath(pathname) && portalContext.type === "admin") {
    if (
      portalContext.tenantId !== null &&
      portalContext.tenantId !== undefined &&
      portalContext.tenantId !== ""
    ) {
      requestHeaders.set("x-tenant-id", String(portalContext.tenantId));
    } else {
      requestHeaders.delete("x-tenant-id");
    }
    res = buildNextResponse();
  }

  return res;
}

export const config = {
  matcher: [
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
