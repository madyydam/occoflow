import { supabase } from "./supabase";

export async function handleCustomSoftwareApi(request: Request): Promise<Response> {
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

    const fullName = String(body.full_name || body.fullName || "").trim();
    const companyName = String(body.company_name || body.companyName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const requirements = String(body.requirements || "").trim();
    const projectType = String(body.project_type || body.projectType || "crm_erp").trim();
    const budgetRange = String(body.budget_range || body.budgetRange || "").trim();
    const timeline = String(body.timeline || "").trim();
    const preferredContactMethod = String(
      body.preferred_contact_method || body.preferredContactMethod || "email"
    ).trim();

    // Backend Validation
    if (!fullName || fullName.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Full name is required (minimum 2 characters)." }),
        { status: 400, headers }
      );
    }
    if (!companyName) {
      return new Response(
        JSON.stringify({ success: false, error: "Company or business name is required." }),
        { status: 400, headers }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email address is required." }),
        { status: 400, headers }
      );
    }
    if (!phone || phone.length < 7) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid phone number is required (minimum 7 digits)." }),
        { status: 400, headers }
      );
    }
    if (!requirements || requirements.length < 15) {
      return new Response(
        JSON.stringify({ success: false, error: "Please provide a detailed requirement description (minimum 15 characters)." }),
        { status: 400, headers }
      );
    }

    // Extract IP & User Agent
    const ipAddress =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const { data, error } = await supabase
      .from("custom_software_inquiries")
      .insert([
        {
          full_name: fullName,
          company_name: companyName,
          email,
          phone,
          preferred_contact_method: preferredContactMethod,
          project_type: projectType,
          budget_range: budgetRange,
          timeline,
          requirements,
          status: "new",
          admin_notes: "",
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("[CustomSoftwareApi] Supabase insert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error?.message || "Failed to store inquiry in database." }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your custom software inquiry has been submitted successfully.",
        inquiry: {
          id: data.id,
          inquiryNumber: data.inquiry_number || `CS-${data.id.substring(0, 6).toUpperCase()}`,
          fullName: data.full_name,
          companyName: data.company_name,
          email: data.email,
          status: data.status,
          createdAt: data.created_at,
        },
      }),
      { status: 201, headers }
    );
  } catch (err: any) {
    console.error("[CustomSoftwareApi] Internal server error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error." }),
      { status: 500, headers }
    );
  }
}
