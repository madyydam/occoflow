import { createClient } from "@supabase/supabase-js";

// ── Cloudflare env type ────────────────────────────────────────────
interface CfEnv {
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  [key: string]: string | undefined;
}

// ── Supabase admin client factory (created per-request with CF env) ─
function makeSupabaseAdmin(cfEnv: CfEnv) {
  const url =
    cfEnv["SUPABASE_URL"] ||
    process.env["SUPABASE_URL"] ||
    "";
  const secret =
    cfEnv["SUPABASE_SECRET_KEY"] ||
    process.env["SUPABASE_SECRET_KEY"] ||
    "";
  return createClient(url || "https://placeholder.supabase.co", secret || "dummy_secret_key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── CORS headers ───────────────────────────────────────────────────
const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// ── Plan amounts (paise) ──────────────────────────────────────────
const PLAN_AMOUNT: Record<string, number> = {
  crm_monthly: 99900,       // ₹999
  crm_yearly: 999900,       // ₹9,999
  crm_lifetime: 1499900,    // ₹14,999
  standard_monthly: 99900,  // ₹999
  standard_yearly: 999900,  // ₹9,999
  premium_monthly: 99900,   // ₹999
  premium_yearly: 999900,   // ₹9,999
  lifetime: 1499900,        // ₹14,999
  lifetime_deal: 1499900,   // ₹14,999
};

const PLAN_LABELS: Record<string, string> = {
  crm_monthly: "Occo Flow – Monthly (₹999)",
  crm_yearly: "Occo Flow – Yearly (₹9,999)",
  crm_lifetime: "Occo Flow – Lifetime Access (₹14,999)",
  standard_monthly: "Occo Flow – Monthly (₹999)",
  standard_yearly: "Occo Flow – Yearly (₹9,999)",
  premium_monthly: "Occo Flow – Monthly (₹999)",
  premium_yearly: "Occo Flow – Yearly (₹9,999)",
  lifetime: "Occo Flow – Lifetime Access (₹14,999)",
  lifetime_deal: "Occo Flow – Lifetime Access (₹14,999)",
};

// ── HMAC-SHA256 using Web Crypto (works in CF Workers + browsers) ──
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Main handler (receives CF env object from server.ts) ───────────
export async function handleRazorpayApi(
  request: Request,
  cfEnv: CfEnv = {},
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  // Read Razorpay keys from CF env (set via wrangler secrets) or process.env
  const RAZORPAY_KEY_ID =
    cfEnv["RAZORPAY_KEY_ID"] ||
    process.env["RAZORPAY_KEY_ID"] ||
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.["VITE_RAZORPAY_KEY_ID"] ||
    "";

  const RAZORPAY_KEY_SECRET =
    cfEnv["RAZORPAY_KEY_SECRET"] ||
    process.env["RAZORPAY_KEY_SECRET"] ||
    "";

  const url = new URL(request.url);

  if (url.pathname === "/api/razorpay/create-order") {
    return handleCreateOrder(request, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);
  }

  if (url.pathname === "/api/razorpay/verify-payment") {
    return handleVerifyPayment(request, RAZORPAY_KEY_SECRET, cfEnv);
  }

  return json({ success: false, error: "Unknown route" }, 404);
}

// ── Create Razorpay Order ─────────────────────────────────────────
async function handleCreateOrder(
  request: Request,
  keyId: string,
  keySecret: string,
): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { planId, businessId, userEmail, userName } = body as Record<string, string>;

    if (!planId || !businessId) {
      return json({ success: false, error: "planId and businessId are required" }, 400);
    }

    const amount = PLAN_AMOUNT[planId];
    if (!amount) {
      return json({ success: false, error: `Unknown plan: ${planId}` }, 400);
    }

    const receipt = `rcpt_${businessId.slice(0, 8)}_${Date.now()}`;
    const notes = {
      businessId,
      planId,
      userEmail: userEmail ?? "",
      userName: userName ?? "",
    };

    // Build Basic auth header using btoa (available in CF Workers + all browsers)
    const basicAuth = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
    });

    const responseText = await rzpRes.text();

    if (!rzpRes.ok) {
      console.error("[Razorpay] Create order failed:", rzpRes.status, responseText);
      let errMsg = "Failed to create Razorpay order";
      try {
        const parsed = JSON.parse(responseText) as { error?: { description?: string } };
        if (parsed?.error?.description) errMsg = parsed.error.description;
      } catch { /* ignore */ }
      return json({ success: false, error: errMsg }, 502);
    }

    const order = JSON.parse(responseText);
    return json({ success: true, order, keyId });
  } catch (err) {
    console.error("[Razorpay] Create order error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
}

// ── Verify Payment & Activate Subscription ────────────────────────
async function handleVerifyPayment(
  request: Request,
  keySecret: string,
  cfEnv: CfEnv,
): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      planId,
    } = body as Record<string, string>;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !businessId ||
      !planId
    ) {
      return json({ success: false, error: "Missing required fields" }, 400);
    }

    // ── 1. Verify HMAC signature (Web Crypto — works in CF Workers) ─
    const expectedSig = await hmacSha256Hex(
      keySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );

    if (expectedSig !== razorpay_signature) {
      console.warn("[Razorpay] Signature mismatch");
      return json({ success: false, error: "Payment signature verification failed" }, 400);
    }

    // ── 2. Derive billing cycle ──────────────────────────────────
    const isLifetime = planId.includes("lifetime");
    const billingCycle = isLifetime
      ? "lifetime"
      : planId.endsWith("_yearly")
        ? "yearly"
        : "monthly";

    // ── 3. Activate subscription in Supabase ─────────────────────
    const now = new Date().toISOString();
    const endsAt = isLifetime
      ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() // 100-year lifetime validity
      : billingCycle === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const supabaseAdmin = makeSupabaseAdmin(cfEnv);

    const { error: updateErr } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "subscribed",
        plan: planId,
        billing_cycle: billingCycle,
        subscription_started_at: now,
        subscription_ends_at: endsAt,
        provider_customer_id: razorpay_payment_id,
        provider_subscription_id: razorpay_order_id,
      })
      .eq("business_id", businessId);

    if (updateErr) {
      console.error("[Razorpay] Supabase activate error:", updateErr);
      return json({ success: false, error: "Failed to activate subscription" }, 500);
    }

    // ── 4. Audit log (silently ignored if table missing) ─────────
    try {
      await supabaseAdmin
        .from("payment_logs")
        .insert([{
          business_id: businessId,
          plan_id: planId,
          billing_cycle: billingCycle,
          amount_paise: PLAN_AMOUNT[planId] ?? 0,
          razorpay_order_id,
          razorpay_payment_id,
          status: "paid",
          paid_at: now,
        }]);
    } catch {
      // Ignore if payment_logs table is absent
    }

    return json({
      success: true,
      message: "Subscription activated successfully",
      planLabel: PLAN_LABELS[planId] ?? planId,
    });
  } catch (err) {
    console.error("[Razorpay] Verify payment error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
}
