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

async function listAllAuthUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

const isBlockedUser = (authUser) => {
  if (authUser?.app_metadata?.blocked_access === true) return true;
  if (authUser?.user_metadata?.blocked_access === true) return true;
  if (!authUser?.banned_until) return false;
  return new Date(authUser.banned_until).getTime() > Date.now();
};

async function loadActivityByUser(admin, tenantIds = []) {
  if (!tenantIds.length) return new Map();

  const activityByUser = new Map();
  const { data, error } = await admin
    .from("audit_logs")
    .select("tenant_id, user_id, created_at, module, action, details")
    .in("tenant_id", tenantIds)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    const message = error?.message || "";
    const missingTable =
      error?.code === "PGRST205" ||
      /Could not find the table 'public\.audit_logs'/i.test(message);
    if (missingTable) return activityByUser;
    throw error;
  }

  for (const entry of data || []) {
    const keys = [
      entry.user_id,
      entry.details?.user_name,
      entry.details?.email,
      entry.details?.user_email,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    for (const key of keys) {
      const current = activityByUser.get(key) || {
        count: 0,
        last_activity_at: null,
      };

      current.count += 1;
      if (
        !current.last_activity_at ||
        new Date(entry.created_at) > new Date(current.last_activity_at)
      ) {
        current.last_activity_at = entry.created_at;
      }

      activityByUser.set(key, current);
    }
  }

  return activityByUser;
}

export async function GET(req) {
  const auth = await requirePlatformUser(req);
  if (auth.error) return auth.error;

  try {
    const admin = getAdminSupabaseClient();

    const [{ data: staff, error: staffError }, { data: tenants, error: tenantsError }, authUsers] =
      await Promise.all([
        admin
          .from("staff_profiles")
          .select("id, full_name, email, role, permissions, tenant_id")
          .order("full_name"),
        admin.from("tenants").select("tenant_id, name, slug").order("name"),
        listAllAuthUsers(admin),
      ]);

    if (staffError) throw staffError;
    if (tenantsError) throw tenantsError;

    const authById = new Map((authUsers || []).map((user) => [user.id, user]));
    const tenantById = new Map(
      (tenants || []).map((tenant) => [Number(tenant.tenant_id), tenant]),
    );
    const tenantIds = [
      ...new Set((staff || []).map((profile) => Number(profile.tenant_id)).filter(Number.isFinite)),
    ];
    const activityByUser = await loadActivityByUser(admin, tenantIds);

    const users = (staff || []).map((profile) => {
      const authUser = authById.get(profile.id);
      const tenant = tenantById.get(Number(profile.tenant_id));
      const activity =
        activityByUser.get(String(profile.id).toLowerCase()) ||
        activityByUser.get(String(authUser?.email || profile.email || "").toLowerCase()) ||
        activityByUser.get(String(profile.full_name || "").toLowerCase()) ||
        { count: 0, last_activity_at: null };

      return {
        id: profile.id,
        full_name: profile.full_name || authUser?.user_metadata?.full_name || "",
        email: authUser?.email || profile.email || "",
        role: profile.role || "viewer",
        permissions: profile.permissions || [],
        tenant_id: profile.tenant_id,
        tenant_name: tenant?.name || "Sin tienda",
        tenant_slug: tenant?.slug || "",
        blocked: isBlockedUser(authUser),
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: authUser?.created_at || null,
        activity_count: activity.count,
        last_activity_at: activity.last_activity_at,
        has_usage_flow: Boolean(authUser?.last_sign_in_at || activity.count > 0),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requirePlatformUser(req);
  if (auth.error) return auth.error;

  try {
    const {
      userId,
      email,
      full_name,
      tenant_id,
      password,
      blocked,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const tenantId = Number(tenant_id);
    if (!Number.isFinite(tenantId)) {
      return NextResponse.json({ error: "tenant_id invalido" }, { status: 400 });
    }

    const admin = getAdminSupabaseClient();
    const { data: currentAuth, error: getUserError } =
      await admin.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    const appMetadata = {
      ...(currentAuth?.user?.app_metadata || {}),
      access_scope: "admin",
      blocked_access: blocked === true,
    };

    const userMetadata = {
      ...(currentAuth?.user?.user_metadata || {}),
      full_name,
      access_scope: "admin",
      blocked_access: blocked === true,
    };

    const authUpdate = {
      email,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
      ban_duration: blocked === true ? "876000h" : "none",
    };

    if (password) {
      authUpdate.password = password;
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      userId,
      authUpdate,
    );
    if (authError) throw authError;

    const { error: profileError } = await admin
      .from("staff_profiles")
      .update({
        email,
        full_name,
        tenant_id: tenantId,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    return NextResponse.json({
      message: blocked ? "Usuario bloqueado" : "Usuario actualizado",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
