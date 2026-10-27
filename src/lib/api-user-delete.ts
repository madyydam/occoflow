import { createClient } from "@supabase/supabase-js";

interface CfEnv {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  [key: string]: string | undefined;
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

function getSupabaseAdmin(cfEnv: CfEnv = {}) {
  const supabaseUrl =
    cfEnv["SUPABASE_URL"] ||
    process.env["SUPABASE_URL"] ||
    env["VITE_SUPABASE_URL"] ||
    "https://otmasdfjeqaqojfqyfjd.supabase.co";

  const supabaseSecretKey =
    cfEnv["SUPABASE_SECRET_KEY"] ||
    process.env["SUPABASE_SECRET_KEY"] ||
    "";

  return createClient(supabaseUrl, supabaseSecretKey || "dummy_secret_key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function handleUserDeleteApi(
  request: Request,
  cfEnv: CfEnv = {}
): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Use POST." }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON request body." }),
        { status: 400, headers }
      );
    }

    const userId = String(body.userId || body.user_id || "").trim();
    const businessId = String(body.businessId || body.business_id || "").trim();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required." }),
        { status: 400, headers }
      );
    }

    const supabaseAdmin = getSupabaseAdmin(cfEnv);

    // 1. If businessId is provided, delete the business (cascades memberships, subs, leads, deals, tasks, etc.)
    if (businessId) {
      const { error: bizErr } = await supabaseAdmin
        .from("businesses")
        .delete()
        .eq("id", businessId);

      if (bizErr) {
        console.warn("[UserDeleteApi] Warning deleting business:", bizErr.message);
      }
    }

    // 2. Delete any memberships for this user
    await supabaseAdmin
      .from("memberships")
      .delete()
      .eq("user_id", userId);

    // 3. Delete user profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 4. Delete user from auth.users via Supabase Auth Admin
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.warn("[UserDeleteApi] Warning deleting auth user:", authErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User and associated workspace successfully deleted from database.",
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[UserDeleteApi] Uncaught error:", err);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers }
    );
  }
}
