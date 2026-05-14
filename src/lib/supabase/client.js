import { createBrowserClient } from "@supabase/ssr";

const globalForSupabase = globalThis;
const ADMIN_STORAGE_KEY = "sb-admin-auth";
const PLATFORM_STORAGE_KEY = "sb-platform-auth";

const isInvalidRefreshTokenError = (error) => {
  const message = error?.message || error?.description || "";
  return /Invalid Refresh Token|Refresh Token Not Found|session_not_found/i.test(message);
};

const ensureValidSession = (client) => {
  if (typeof window === "undefined") return;
  
  // Timeout para evitar colisiones durante la hidratación rápida de Turbopack
  setTimeout(() => {
    client.auth
      .getSession()
      .then(async ({ error }) => {
        if (error && isInvalidRefreshTokenError(error)) {
          await client.auth.signOut({ scope: "local" });
        }
      })
      .catch(async (error) => {
        if (isInvalidRefreshTokenError(error)) {
          await client.auth.signOut({ scope: "local" });
        }
      });
  }, 100);
};

export function createAdminClient() {
  if (globalForSupabase.__supabaseAdminBrowserClient) {
    return globalForSupabase.__supabaseAdminBrowserClient;
  }

  globalForSupabase.__supabaseAdminBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { storageKey: ADMIN_STORAGE_KEY } },
  );

  ensureValidSession(globalForSupabase.__supabaseAdminBrowserClient);
  return globalForSupabase.__supabaseAdminBrowserClient;
}

export function createPlatformClient() {
  if (globalForSupabase.__supabasePlatformBrowserClient) {
    return globalForSupabase.__supabasePlatformBrowserClient;
  }

  globalForSupabase.__supabasePlatformBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { storageKey: PLATFORM_STORAGE_KEY } },
  );

  ensureValidSession(globalForSupabase.__supabasePlatformBrowserClient);
  return globalForSupabase.__supabasePlatformBrowserClient;
}

// Backwards compatible default: admin/store session.
export function createClient() {
  return createAdminClient();
}
