import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

const PLATFORM_STORAGE_KEY = "sb-platform-auth";

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isPlatformAdminEmail = (email) => {
  if (!email || PLATFORM_ADMIN_EMAILS.length === 0) return false;
  return PLATFORM_ADMIN_EMAILS.includes(String(email).toLowerCase());
};

const hasPlatformScopeInMetadata = (user) => {
  const scopeFromUserMetadata = user?.user_metadata?.access_scope;
  const scopeFromAppMetadata = user?.app_metadata?.access_scope;
  return (
    scopeFromUserMetadata === "platform" || scopeFromAppMetadata === "platform"
  );
};

async function requirePlatformUser(req) {
  let res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
      auth: { storageKey: PLATFORM_STORAGE_KEY },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!hasPlatformScopeInMetadata(user) && !isPlatformAdminEmail(user.email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function GET(req) {
  const auth = await requirePlatformUser(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 500), 1000);

    const admin = getAdminSupabaseClient();

    const { data, error } = await admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Table may not exist yet
      const missingTable =
        error?.code === "PGRST205" ||
        /Could not find the table 'public\.audit_logs'/i.test(error.message || "");

      if (missingTable) {
        return NextResponse.json({ entries: [] });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
