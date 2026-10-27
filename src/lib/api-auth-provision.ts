import { createClient } from "@supabase/supabase-js";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl =
  env["VITE_SUPABASE_URL"] ||
  process.env["SUPABASE_URL"] ||
  "";

const supabaseSecretKey =
  process.env["SUPABASE_SECRET_KEY"] ||
  "";

// Server-side service-role client that bypasses RLS safely
const supabaseAdmin = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseSecretKey || "dummy_secret_key", {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function handleAuthProvisionApi(request: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const rawBusinessName = String(body.businessName || body.business_name || "").trim();
    const fullName = String(body.fullName || body.full_name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required." }),
        { status: 400, headers }
      );
    }

    const businessName = rawBusinessName || `${fullName || "My"} Workspace`;

    // 1. Check if user already has a membership / business
    const { data: existingMemberships } = await supabaseAdmin
      .from("memberships")
      .select("business_id")
      .eq("user_id", userId)
      .limit(1);

    let businessId = existingMemberships?.[0]?.business_id;

    if (!businessId) {
      // Check profile
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("business_id")
        .eq("id", userId)
        .maybeSingle();

      businessId = prof?.business_id;
    }

    let bizRecord = null;
    let subRecord = null;

    if (businessId) {
      // Fetch existing business and subscription
      const [bizRes, subRes] = await Promise.all([
        supabaseAdmin.from("businesses").select("*").eq("id", businessId).single(),
        supabaseAdmin.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle(),
      ]);
      bizRecord = bizRes.data;
      subRecord = subRes.data;
    } else {
      // 2. Create business
      const { data: newBiz, error: bizErr } = await supabaseAdmin
        .from("businesses")
        .insert([{
          name: businessName,
          industry: "General",
        }])
        .select()
        .single();

      if (bizErr || !newBiz) {
        console.error("[ProvisionApi] Error creating business:", bizErr);
        return new Response(
          JSON.stringify({ success: false, error: bizErr?.message || "Failed to create business" }),
          { status: 500, headers }
        );
      }
      bizRecord = newBiz;
      businessId = newBiz.id;

      // 3. Create membership as owner
      const { error: memErr } = await supabaseAdmin
        .from("memberships")
        .insert([{
          user_id: userId,
          business_id: businessId,
          role: "owner",
        }]);

      if (memErr) {
        console.warn("[ProvisionApi] Error adding membership:", memErr);
      }

      // 4. Update profile
      const profileUpdates: Record<string, unknown> = { business_id: businessId };
      if (fullName) profileUpdates["full_name"] = fullName;
      if (phone) profileUpdates["phone"] = phone;

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        ...profileUpdates,
      });
    }

    // 5. Ensure subscription exists (3-day free trial)
    if (!subRecord && businessId) {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const { data: newSub, error: subErr } = await supabaseAdmin
        .from("subscriptions")
        .upsert([{
          business_id: businessId,
          status: "trial_active",
          plan: "none",
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEndsAt,
        }], { onConflict: "business_id" })
        .select()
        .single();

      if (subErr) {
        console.warn("[ProvisionApi] Error creating subscription:", subErr);
      } else {
        subRecord = newSub;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        business: bizRecord,
        subscription: subRecord,
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[ProvisionApi] Uncaught error:", err);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers }
    );
  }
}
