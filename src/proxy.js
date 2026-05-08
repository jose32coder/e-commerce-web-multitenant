import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// --- CONFIGURACIÓN Y RESERVADOS ---
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
  "shop",
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
  if (!session?.user?.id) return { type: "anonymous", tenantId: null };
  const userMeta = session.user.user_metadata || {};
  const appMeta = session.user.app_metadata || {};
  const email = session.user.email;

  if (userMeta.access_scope === "platform" || isPlatformAdminEmail(email)) {
    return { type: "platform", tenantId: null };
  }

  if (userMeta.access_scope === "admin" || userMeta.role === "admin") {
    let tenantId = userMeta.tenant_id || appMeta.tenant_id || null;
    if (!tenantId) {
      const { data } = await supabase
        .from("staff_profiles")
        .select("tenant_id")
        .eq("id", session.user.id)
        .maybeSingle();
      tenantId = data?.tenant_id || null;
    }
    return { type: "admin", tenantId };
  }
  return { type: "unknown", tenantId: null };
};

// --- PROXY / MIDDLEWARE ---
export async function proxy(req) {
  const rateLimitedResponse = applyRateLimit(req);
  if (rateLimitedResponse) return rateLimitedResponse;

  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const pathname = url.pathname;

  // --- PREPARACIÓN DE CABECERAS Y RESPUESTA ---
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-tenant-id");
  const responseCookies = new Map();
  const responseHeaders = new Map();

  // Definimos buildNextResponse AQUÍ ARRIBA para que esté disponible abajo
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

  // --- LÓGICA DE SUBDOMINIOS ---
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  // 1. shop.deploy.local
  if (hostname.startsWith("shop.")) {
    // Si es una ruta reservada (/access, /api, etc), NO reescribimos
    if (RESERVED_PREFIXES.has(firstSegment)) {
      return buildNextResponse();
    }
    // Si es contenido normal, rewrite a /shop
    if (!pathname.startsWith("/shop")) {
      return NextResponse.rewrite(new URL(`/shop${pathname}`, req.url));
    }
  }

  // 2. cliente.deploy.local
  const hostParts = hostname.split(".");
  if (hostParts.length >= 3 && !hostname.startsWith("shop.")) {
    const tenantHandle = hostParts[0];
    if (!RESERVED_PREFIXES.has(tenantHandle) && tenantHandle !== "www") {
      return NextResponse.rewrite(
        new URL(`/shop/${tenantHandle}${pathname}`, req.url),
      );
    }
  }

  // --- GUARDIA DE AUTENTICACIÓN ---
  const requiresAuthGuard =
    isAdminAreaPath(pathname) ||
    isPlatformAreaPath(pathname) ||
    isAuthPath(pathname);
  if (!requiresAuthGuard) return buildNextResponse();

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
          cookiesToSet.forEach(({ name, value, options }) =>
            responseCookies.set(name, { value, options }),
          );
          Object.entries(headersToSet).forEach(([key, value]) => {
            if (typeof value === "string") responseHeaders.set(key, value);
          });
          res = buildNextResponse();
        },
      },
      auth: { storageKey },
    },
  );

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
    redirectRes.cookies.delete(storageKey);
    return redirectRes;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const portalContext = await getPortalContext(supabase, session);

  // Redirecciones lógicas de login
  if (pathname === ADMIN_LOGIN_PATH) {
    if (portalContext.type === "admin")
      return NextResponse.redirect(new URL("/admin", req.url));
    if (portalContext.type === "platform")
      return NextResponse.redirect(new URL("/tenants", req.url));
  }

  // Control de acceso a áreas
  if (isAdminAreaPath(pathname) && portalContext.type !== "admin") {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
  }

  if (isAdminAreaPath(pathname) && portalContext.type === "admin") {
    if (portalContext.tenantId)
      requestHeaders.set("x-tenant-id", String(portalContext.tenantId));
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
