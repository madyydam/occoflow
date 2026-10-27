import { supabase } from "./supabase";

export type CustomSoftwareStatus = "new" | "contacted" | "in_process" | "closed" | "cancelled";

export interface CustomSoftwareInquiry {
  id: string;
  inquiryNumber: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  preferredContactMethod: "email" | "phone" | "whatsapp";
  projectType: string;
  budgetRange: string;
  timeline: string;
  requirements: string;
  status: CustomSoftwareStatus;
  adminNotes: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitCustomSoftwareInquiryPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  preferredContactMethod?: "email" | "phone" | "whatsapp";
  projectType: string;
  budgetRange: string;
  timeline: string;
  requirements: string;
}

export interface InquiriesFilterParams {
  search?: string;
  status?: string;
  projectType?: string;
  sortBy?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapCustomInquiry = (r: any): CustomSoftwareInquiry => ({
  id: r.id,
  inquiryNumber:
    r.inquiry_number ||
    `CS-${String(r.id || "")
      .substring(0, 6)
      .toUpperCase()}`,
  fullName: r.full_name ?? "",
  companyName: r.company_name ?? "",
  email: r.email ?? "",
  phone: r.phone ?? "",
  preferredContactMethod: r.preferred_contact_method ?? "email",
  projectType: r.project_type ?? "crm_erp",
  budgetRange: r.budget_range ?? "",
  timeline: r.timeline ?? "",
  requirements: r.requirements ?? "",
  status: (r.status as CustomSoftwareStatus) ?? "new",
  adminNotes: r.admin_notes ?? "",
  assignedTo: r.assigned_to ?? null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  crm_erp: "Custom CRM & ERP",
  mobile_app: "Mobile App (iOS/Android)",
  web_platform: "Web Platform & SaaS",
  ai_automation: "AI & Workflow Automation",
  api_integration: "API & Integrations",
  other: "Other Bespoke Software",
};

export const STATUS_LABELS: Record<
  CustomSoftwareStatus,
  { label: string; color: "blue" | "green" | "amber" | "violet" | "slate" }
> = {
  new: { label: "New", color: "blue" },
  contacted: { label: "Contacted", color: "amber" },
  in_process: { label: "In Process", color: "violet" },
  closed: { label: "Closed / Won", color: "green" },
  cancelled: { label: "Cancelled", color: "slate" },
};

export const customSoftwareService = {
  /**
   * Submit a new custom software inquiry from the landing page.
   * Performs client validation, attempts API call, falls back to direct Supabase insert.
   */
  async submitInquiry(payload: SubmitCustomSoftwareInquiryPayload): Promise<{
    success: boolean;
    data?: CustomSoftwareInquiry;
    error?: string;
  }> {
    // 1. Client-side validation
    const fullName = payload.fullName?.trim();
    const companyName = payload.companyName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const requirements = payload.requirements?.trim();
    const projectType = payload.projectType?.trim();
    const budgetRange = payload.budgetRange?.trim();
    const timeline = payload.timeline?.trim();
    const preferredContactMethod = payload.preferredContactMethod || "email";

    if (!fullName || fullName.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }
    if (!companyName) {
      return { success: false, error: "Please enter your company or business name." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!phone || phone.length < 7) {
      return { success: false, error: "Please enter a valid phone number (minimum 7 digits)." };
    }
    if (!requirements || requirements.length < 15) {
      return {
        success: false,
        error: "Please provide a detailed requirement description (at least 15 characters).",
      };
    }

    const sanitizedPayload = {
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
    };

    // 2. Try POST /api/custom-software endpoint first
    try {
      const res = await fetch("/api/custom-software", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.inquiry) {
          return { success: true, data: json.inquiry };
        }
      }
    } catch {
      // In local dev or environments without API handler, fall back smoothly to direct Supabase client
    }

    // 3. Fallback: Direct Supabase insert
    try {
      const { data, error } = await supabase
        .from("custom_software_inquiries")
        .insert([sanitizedPayload])
        .select()
        .single();

      if (error || !data) {
        console.error("[customSoftwareService] Direct DB insert failed:", error);
        return {
          success: false,
          error:
            error?.message ||
            "Failed to submit your inquiry. Please try again or contact us directly.",
        };
      }

      return { success: true, data: mapCustomInquiry(data) };
    } catch (err) {
      console.error("[customSoftwareService] Unexpected error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      };
    }
  },

  /**
   * Admin: List all inquiries with filtering, search, sorting and pagination.
   */
  async adminList(params: InquiriesFilterParams = {}): Promise<{
    inquiries: CustomSoftwareInquiry[];
    totalCount: number;
    metrics: {
      total: number;
      newCount: number;
      contactedCount: number;
      inProcessCount: number;
      closedCount: number;
    };
  }> {
    try {
      let query = supabase.from("custom_software_inquiries").select("*", { count: "exact" });

      // Status filter
      if (params.status && params.status !== "all") {
        query = query.eq("status", params.status);
      }

      // Project type filter
      if (params.projectType && params.projectType !== "all") {
        query = query.eq("project_type", params.projectType);
      }

      // Search filter across name, company, email, phone, inquiry_number, requirements
      if (params.search?.trim()) {
        const s = params.search.trim();
        query = query.or(
          `full_name.ilike.%${s}%,company_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,inquiry_number.ilike.%${s}%,requirements.ilike.%${s}%`,
        );
      }

      // Sorting
      const isAsc = params.sortBy === "oldest";
      query = query.order("created_at", { ascending: isAsc });

      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("[customSoftwareService] adminList error:", error);
        return {
          inquiries: [],
          totalCount: 0,
          metrics: { total: 0, newCount: 0, contactedCount: 0, inProcessCount: 0, closedCount: 0 },
        };
      }

      const inquiries = (data ?? []).map(mapCustomInquiry);

      // Compute status counts from all records
      const { data: allRows } = await supabase.from("custom_software_inquiries").select("status");

      const rows = allRows ?? [];
      const metrics = {
        total: rows.length,
        newCount: rows.filter((r) => r.status === "new").length,
        contactedCount: rows.filter((r) => r.status === "contacted").length,
        inProcessCount: rows.filter((r) => r.status === "in_process").length,
        closedCount: rows.filter((r) => r.status === "closed").length,
      };

      return {
        inquiries,
        totalCount: count ?? inquiries.length,
        metrics,
      };
    } catch (err) {
      console.error("[customSoftwareService] adminList exception:", err);
      return {
        inquiries: [],
        totalCount: 0,
        metrics: { total: 0, newCount: 0, contactedCount: 0, inProcessCount: 0, closedCount: 0 },
      };
    }
  },

  /**
   * Admin: Fetch full single inquiry by ID.
   */
  async adminGet(id: string): Promise<CustomSoftwareInquiry | null> {
    try {
      const { data, error } = await supabase
        .from("custom_software_inquiries")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return null;
      return mapCustomInquiry(data);
    } catch {
      return null;
    }
  },

  /**
   * Admin: Update inquiry status and optionally notes.
   */
  async adminUpdateStatus(
    id: string,
    status: CustomSoftwareStatus,
    adminNotes?: string,
  ): Promise<boolean> {
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (adminNotes !== undefined) {
        updates["admin_notes"] = adminNotes;
      }

      const { error } = await supabase
        .from("custom_software_inquiries")
        .update(updates)
        .eq("id", id);

      return !error;
    } catch (err) {
      console.error("[customSoftwareService] updateStatus failed:", err);
      return false;
    }
  },

  /**
   * Admin: Update internal admin notes.
   */
  async adminUpdateNotes(id: string, notes: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("custom_software_inquiries")
        .update({
          admin_notes: notes.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return !error;
    } catch (err) {
      console.error("[customSoftwareService] updateNotes failed:", err);
      return false;
    }
  },

  /**
   * Admin: Delete inquiry permanently.
   */
  async adminDelete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("custom_software_inquiries").delete().eq("id", id);

      return !error;
    } catch (err) {
      console.error("[customSoftwareService] delete failed:", err);
      return false;
    }
  },
};
