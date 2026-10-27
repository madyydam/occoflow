import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────
export type AdminRole = "super_admin" | "admin" | "support_admin" | "finance_admin";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminBusiness {
  id: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
  isSuspended: boolean;
  suspensionReason: string;
  suspendedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  trialEndsAt: string | null;
  leadCount?: number;
  contactCount?: number;
  dealCount?: number;
  taskCount?: number;
}

export interface AdminSubscription {
  id: string;
  businessId: string;
  businessName: string;
  ownerName: string;
  status: string;
  plan: string;
  billingCycle: string | null;
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  businessId: string | null;
  userId: string | null;
  type: "problem" | "suggestion" | "feedback";
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedAdminId: string | null;
  adminResponse: string;
  adminRespondedAt: string | null;
  adminRespondedById: string | null;
  rating: number | null;
  ratingComment: string;
  createdAt: string;
  updatedAt: string;
  businessName?: string;
  userName?: string;
  userEmail?: string;
}

export interface PlatformSetting {
  key: string;
  value: string;
  label: string;
  description: string;
}

export interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  activeTrials: number;
  trialExpiringToday: number;
  trialExpiringIn3Days: number;
  expiredTrials: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  mrr: number;
  arr: number;
  totalRevenueEstimate: number;
  trialConversionRate: number;
  planBreakdown: {
    standard_monthly: number;
    standard_yearly: number;
    premium_monthly: number;
    premium_yearly: number;
    lifetime?: number;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  businessName: string;
  createdAt: string;
}

// ── Plan pricing config ────────────────────────────────────────────
export const PLAN_PRICES: Record<string, number> = {
  crm_monthly: 999,
  crm_yearly: 9999,
  crm_lifetime: 14999,
  standard_monthly: 999,
  standard_yearly: 9999,
  premium_monthly: 999,
  premium_yearly: 9999,
  lifetime: 14999,
  lifetime_deal: 14999,
};

export const PLAN_MRR: Record<string, number> = {
  crm_monthly: 999,
  crm_yearly: Math.round(9999 / 12),
  crm_lifetime: Math.round(14999 / 12),
  standard_monthly: 999,
  standard_yearly: Math.round(9999 / 12),
  premium_monthly: 999,
  premium_yearly: Math.round(9999 / 12),
  lifetime: Math.round(14999 / 12),
  lifetime_deal: Math.round(14999 / 12),
};

export const PLAN_LABELS: Record<string, string> = {
  crm_monthly: "Monthly Plan (₹999)",
  crm_yearly: "Yearly Plan (₹9,999)",
  crm_lifetime: "Lifetime Access (₹14,999)",
  standard_monthly: "Monthly Plan (₹999)",
  standard_yearly: "Yearly Plan (₹9,999)",
  premium_monthly: "Monthly Plan (₹999)",
  premium_yearly: "Yearly Plan (₹9,999)",
  lifetime: "Lifetime Access (₹14,999)",
  lifetime_deal: "Lifetime Access (₹14,999)",
  none: "Trial / No Plan",
};

// ── Row mappers ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAdminUser = (r: any): AdminUser => ({
  id: r.id,
  email: r.email ?? "",
  fullName: r.full_name ?? "",
  role: r.role ?? "admin",
  isActive: Boolean(r.is_active),
  lastLoginAt: r.last_login_at ?? null,
  createdAt: r.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAdminSub = (r: any): AdminSubscription => ({
  id: r.id,
  businessId: r.business_id,
  businessName: r.businesses?.name ?? "",
  ownerName: Array.isArray(r.businesses?.profiles)
    ? (r.businesses.profiles[0]?.full_name ?? "Workspace Owner")
    : (r.businesses?.profiles?.full_name ?? "Workspace Owner"),
  status: r.status,
  plan: r.plan,
  billingCycle: r.billing_cycle ?? null,
  trialStartedAt: r.trial_started_at,
  trialEndsAt: r.trial_ends_at,
  subscriptionStartedAt: r.subscription_started_at ?? null,
  subscriptionEndsAt: r.subscription_ends_at ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAuditLog = (r: any): AdminAuditLog => ({
  id: r.id,
  adminId: r.admin_id ?? null,
  adminEmail: r.admin_email ?? "",
  action: r.action,
  entityType: r.entity_type,
  entityId: r.entity_id ?? null,
  entityName: r.entity_name ?? "",
  oldValue: r.old_value ?? {},
  newValue: r.new_value ?? {},
  metadata: r.metadata ?? {},
  ipAddress: r.ip_address ?? "",
  createdAt: r.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTicket = (r: any): AdminSupportTicket => ({
  id: r.id,
  businessId: r.business_id ?? null,
  userId: r.user_id ?? null,
  type: (r.type as AdminSupportTicket["type"]) || "problem",
  subject: r.subject || "",
  description: r.description ?? "",
  priority: r.priority || "medium",
  status: r.status || "new",
  assignedAdminId: r.assigned_admin_id ?? null,
  adminResponse: r.admin_response ?? "",
  adminRespondedAt: r.admin_responded_at ?? null,
  adminRespondedById: r.admin_responded_by_id ?? null,
  rating: r.rating !== null && r.rating !== undefined ? Number(r.rating) : null,
  ratingComment: r.rating_comment ?? "",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  businessName: r.businesses?.name ?? "",
  userName: r.profiles?.full_name ?? "",
  userEmail: r.businesses?.email || r.profiles?.phone || "",
});

// ── Admin Auth ─────────────────────────────────────────────────────
export const adminAuthService = {
  /** Check if current Supabase user is an admin */
  async getAdminUser(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .single();
    if (error || !data) return null;
    return mapAdminUser(data);
  },

  /** Touch last_login_at */
  async touchLogin(userId: string): Promise<void> {
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);
  },
};

// ── Dashboard Stats ────────────────────────────────────────────────
export const adminDashboardService = {
  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [
      { count: totalBusinesses },
      { count: activeBusinesses },
      { count: suspendedBusinesses },
      { data: subs },
    ] = await Promise.all([
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", false),
      supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", true),
      supabase
        .from("subscriptions")
        .select("status, plan, billing_cycle, trial_ends_at, subscription_started_at"),
    ]);

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const allSubs = subs ?? [];
    const activeTrials = allSubs.filter((s) => s.status === "trial_active").length;
    const trialExpiringToday = allSubs.filter((s) => {
      if (s.status !== "trial_active") return false;
      const end = new Date(s.trial_ends_at);
      return end >= now && end <= todayEnd;
    }).length;
    const trialExpiringIn3Days = allSubs.filter((s) => {
      if (s.status !== "trial_active") return false;
      const end = new Date(s.trial_ends_at);
      return end >= now && end <= in3Days;
    }).length;
    const expiredTrials = allSubs.filter((s) => s.status === "trial_expired").length;
    const activeSubscriptions = allSubs.filter((s) => s.status === "subscribed").length;
    const cancelledSubscriptions = allSubs.filter(
      (s) => s.status === "subscription_cancelled" || s.status === "subscription_expired",
    ).length;

    // Plan breakdown
    const planBreakdown = {
      standard_monthly: allSubs.filter(
        (s) =>
          s.status === "subscribed" && (s.plan === "standard_monthly" || s.plan === "crm_monthly"),
      ).length,
      standard_yearly: allSubs.filter(
        (s) =>
          s.status === "subscribed" && (s.plan === "standard_yearly" || s.plan === "crm_yearly"),
      ).length,
      premium_monthly: allSubs.filter(
        (s) => s.status === "subscribed" && s.plan === "premium_monthly",
      ).length,
      premium_yearly: allSubs.filter(
        (s) => s.status === "subscribed" && s.plan === "premium_yearly",
      ).length,
      lifetime: allSubs.filter(
        (s) =>
          s.status === "subscribed" &&
          (Boolean(s.plan && s.plan.includes("lifetime")) || s.billing_cycle === "lifetime"),
      ).length,
    };

    // MRR
    const mrr = allSubs
      .filter((s) => s.status === "subscribed")
      .reduce((sum, s) => sum + (PLAN_MRR[s.plan] ?? 0), 0);
    const arr = mrr * 12;

    // Total revenue estimate from subscriptions
    const totalRevenueEstimate = allSubs
      .filter((s) => s.status === "subscribed" && s.subscription_started_at)
      .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

    // Conversion rate
    const totalTrialStarted = activeTrials + expiredTrials + activeSubscriptions;
    const trialConversionRate =
      totalTrialStarted > 0 ? Math.round((activeSubscriptions / totalTrialStarted) * 100) : 0;

    return {
      totalBusinesses: totalBusinesses ?? 0,
      activeBusinesses: activeBusinesses ?? 0,
      suspendedBusinesses: suspendedBusinesses ?? 0,
      totalUsers: totalUsers ?? 0,
      activeTrials,
      trialExpiringToday,
      trialExpiringIn3Days,
      expiredTrials,
      activeSubscriptions,
      cancelledSubscriptions,
      mrr,
      arr,
      totalRevenueEstimate,
      trialConversionRate,
      planBreakdown,
    };
  },

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const { data } = await supabase
      .from("admin_audit_logs")
      .select("id, action, entity_name, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => ({
      id: r.id,
      type: r.action,
      title: r.action.replace(/_/g, " "),
      businessName: (r.metadata as { businessName?: string })?.businessName ?? r.entity_name ?? "",
      createdAt: r.created_at,
    }));
  },
};

// ── Businesses ─────────────────────────────────────────────────────
export const adminBusinessService = {
  async list(opts: { search?: string; page?: number; perPage?: number } = {}): Promise<{
    data: AdminBusiness[];
    total: number;
  }> {
    const { search = "", page = 0, perPage = 25 } = opts;
    const from = page * perPage;
    const to = from + perPage - 1;

    let q = supabase
      .from("businesses")
      .select(
        `id, name, industry, email, phone, is_suspended, suspension_reason,
         suspended_at, last_active_at, created_at,
         profiles(id, full_name, phone),
         subscriptions(status, plan, trial_ends_at)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      q = q.ilike("name", `%${search}%`);
    }

    const { data, count, error } = await q;
    if (error) return { data: [], total: 0 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const businesses: AdminBusiness[] = (data ?? []).map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const sub = Array.isArray(r.subscriptions) ? r.subscriptions[0] : r.subscriptions;
      return {
        id: r.id,
        name: r.name,
        industry: r.industry ?? "General",
        email: r.email ?? "",
        phone: r.phone || profile?.phone || "",
        isSuspended: Boolean(r.is_suspended),
        suspensionReason: r.suspension_reason ?? "",
        suspendedAt: r.suspended_at ?? null,
        lastActiveAt: r.last_active_at ?? null,
        createdAt: r.created_at,
        ownerId: profile?.id ?? "",
        ownerName: profile?.full_name ?? "Workspace Owner",
        ownerEmail: r.email ?? "",
        subscriptionStatus: sub?.status ?? "none",
        subscriptionPlan: sub?.plan ?? "none",
        trialEndsAt: sub?.trial_ends_at ?? null,
      };
    });

    return { data: businesses, total: count ?? 0 };
  },

  async getDetail(bizId: string): Promise<AdminBusiness | null> {
    const { data } = await supabase
      .from("businesses")
      .select(
        `id, name, industry, email, phone, is_suspended, suspension_reason,
         suspended_at, last_active_at, created_at,
         profiles(id, full_name, phone),
         subscriptions(status, plan, trial_ends_at, subscription_ends_at)`,
      )
      .eq("id", bizId)
      .maybeSingle();
    if (!data) return null;

    // Get counts
    const [
      { count: leadCount },
      { count: contactCount },
      { count: dealCount },
      { count: taskCount },
    ] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", bizId),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bizId),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("business_id", bizId),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("business_id", bizId),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = data as any;
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const sub = Array.isArray(r.subscriptions) ? r.subscriptions[0] : r.subscriptions;

    return {
      id: r.id,
      name: r.name,
      industry: r.industry ?? "General",
      email: r.email ?? "",
      phone: r.phone || profile?.phone || "",
      isSuspended: Boolean(r.is_suspended),
      suspensionReason: r.suspension_reason ?? "",
      suspendedAt: r.suspended_at ?? null,
      lastActiveAt: r.last_active_at ?? null,
      createdAt: r.created_at,
      ownerId: profile?.id ?? "",
      ownerName: profile?.full_name ?? "Workspace Owner",
      ownerEmail: r.email ?? "",
      subscriptionStatus: sub?.status ?? "none",
      subscriptionPlan: sub?.plan ?? "none",
      trialEndsAt: sub?.trial_ends_at ?? null,
      leadCount: leadCount ?? 0,
      contactCount: contactCount ?? 0,
      dealCount: dealCount ?? 0,
      taskCount: taskCount ?? 0,
    };
  },

  async suspend(
    bizId: string,
    reason: string,
    adminUser: { id: string; email: string },
  ): Promise<boolean> {
    const { error } = await supabase
      .from("businesses")
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", bizId);
    if (!error) {
      await adminAuditService.log({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "business_suspended",
        entityType: "business",
        entityId: bizId,
        newValue: { reason },
      });
    }
    return !error;
  },

  async reactivate(bizId: string, adminUser: { id: string; email: string }): Promise<boolean> {
    const { error } = await supabase
      .from("businesses")
      .update({ is_suspended: false, suspension_reason: "", suspended_at: null })
      .eq("id", bizId);
    if (!error) {
      await adminAuditService.log({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "business_reactivated",
        entityType: "business",
        entityId: bizId,
        newValue: {},
      });
    }
    return !error;
  },

  async deletePermanently(
    userId: string,
    businessId: string,
    adminUser?: { id: string; email: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (adminUser) {
          await adminAuditService.log({
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: "user_deleted",
            entityType: "user",
            entityId: userId,
            newValue: { businessId },
          });
        }
        return { success: true };
      }

      // Direct client fallback if API is unreachable
      if (businessId) {
        await supabase.from("businesses").delete().eq("id", businessId);
      }
      await supabase.from("memberships").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      return { success: true };
    } catch (err: unknown) {
      console.warn("[adminBusinessService.deletePermanently] Direct client fallback:", err);
      try {
        if (businessId) {
          await supabase.from("businesses").delete().eq("id", businessId);
        }
        await supabase.from("memberships").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("id", userId);
        return { success: true };
      } catch (fallbackErr) {
        return {
          success: false,
          error: fallbackErr instanceof Error ? fallbackErr.message : "Failed to delete user",
        };
      }
    }
  },
};

// ── Subscriptions / Trials ─────────────────────────────────────────
export const adminSubscriptionService = {
  async list(filter?: string): Promise<AdminSubscription[]> {
    let q = supabase
      .from("subscriptions")
      .select("*, businesses(name, profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter && filter !== "all") {
      q = q.eq("status", filter);
    }

    const { data } = await q;
    return (data ?? []).map(mapAdminSub);
  },

  async extendTrial(
    subId: string,
    bizId: string,
    daysToAdd: number,
    adminUser: { id: string; email: string },
    bizName: string,
  ): Promise<boolean> {
    // Get current trial end
    const { data } = await supabase
      .from("subscriptions")
      .select("trial_ends_at")
      .eq("id", subId)
      .single();
    if (!data) return false;

    const currentEnd = new Date(data.trial_ends_at);
    const newEnd = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("subscriptions")
      .update({ trial_ends_at: newEnd.toISOString(), status: "trial_active" })
      .eq("id", subId);

    if (!error) {
      await adminAuditService.log({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "trial_extended",
        entityType: "subscription",
        entityId: subId,
        entityName: bizName,
        oldValue: { trial_ends_at: data.trial_ends_at },
        newValue: { trial_ends_at: newEnd.toISOString(), days_added: daysToAdd },
        metadata: { businessId: bizId, businessName: bizName },
      });
    }
    return !error;
  },

  async endTrial(
    subId: string,
    adminUser: { id: string; email: string },
    bizName: string,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "trial_expired", trial_ends_at: new Date().toISOString() })
      .eq("id", subId);
    if (!error) {
      await adminAuditService.log({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "trial_ended",
        entityType: "subscription",
        entityId: subId,
        entityName: bizName,
        newValue: { status: "trial_expired" },
      });
    }
    return !error;
  },
};

// ── Audit Logs ─────────────────────────────────────────────────────
export const adminAuditService = {
  async log(payload: {
    adminId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await supabase.from("admin_audit_logs").insert([
      {
        admin_id: payload.adminId,
        admin_email: payload.adminEmail,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId ?? null,
        entity_name: payload.entityName ?? "",
        old_value: payload.oldValue ?? {},
        new_value: payload.newValue ?? {},
        metadata: payload.metadata ?? {},
      },
    ]);
  },

  async list(page = 0, perPage = 50): Promise<{ data: AdminAuditLog[]; total: number }> {
    const from = page * perPage;
    const to = from + perPage - 1;
    const { data, count } = await supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    return { data: (data ?? []).map(mapAuditLog), total: count ?? 0 };
  },
};

// ── Support Tickets ────────────────────────────────────────────────
export const adminSupportService = {
  async list(): Promise<AdminSupportTicket[]> {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`*, businesses(name, email)`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      console.error("[adminSupportService.list] Error:", error);
      return [];
    }

    const userIds = Array.from(new Set(data.map((r) => r.user_id).filter(Boolean)));
    const profileMap = new Map<string, { fullName: string; phone: string }>();

    if (userIds.length > 0) {
      try {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", userIds);
        (profs ?? []).forEach((p) => {
          profileMap.set(p.id, { fullName: p.full_name || "", phone: p.phone || "" });
        });
      } catch {
        // Safe fallback
      }
    }

    return data.map((r) => {
      const p = profileMap.get(r.user_id);
      return mapTicket({
        ...r,
        profiles: p ? { full_name: p.fullName, phone: p.phone } : null,
      });
    });
  },

  async updateTicket(
    ticketId: string,
    patch: {
      status?: string;
      priority?: string;
      assignedAdminId?: string | null;
      adminResponse?: string;
      adminRespondedById?: string | null;
    },
  ): Promise<boolean> {
    const p: Record<string, unknown> = {};
    if (patch.status) p["status"] = patch.status;
    if (patch.priority) p["priority"] = patch.priority;
    if (patch.assignedAdminId !== undefined) p["assigned_admin_id"] = patch.assignedAdminId;
    if (patch.adminResponse !== undefined) {
      p["admin_response"] = patch.adminResponse;
      p["admin_responded_at"] = new Date().toISOString();
      if (patch.adminRespondedById) {
        p["admin_responded_by_id"] = patch.adminRespondedById;
      }
    }
    if (patch.status === "resolved") {
      p["resolved_at"] = new Date().toISOString();
    }
    p["updated_at"] = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update(p).eq("id", ticketId);
    return !error;
  },
};

// ── Platform Settings ──────────────────────────────────────────────
export const adminSettingsService = {
  async getAll(): Promise<PlatformSetting[]> {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value, label, description")
      .order("key");
    return (data ?? []).map((r) => ({
      key: r.key,
      value: r.value,
      label: r.label ?? r.key,
      description: r.description ?? "",
    }));
  },

  async update(
    key: string,
    value: string,
    adminUser: { id: string; email: string },
  ): Promise<boolean> {
    const { data: old } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .single();

    const { error } = await supabase
      .from("platform_settings")
      .update({ value, updated_by: adminUser.id, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (!error) {
      await adminAuditService.log({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "setting_changed",
        entityType: "platform_setting",
        entityId: key,
        entityName: key,
        oldValue: { value: old?.value },
        newValue: { value },
      });
    }
    return !error;
  },
};

// ── Platform Notifications ─────────────────────────────────────────
export const adminNotificationService = {
  async list() {
    const { data } = await supabase
      .from("platform_notifications_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(payload: any, adminId: string): Promise<boolean> {
    const cleanPayload: Record<string, unknown> = {
      title: payload.title || "Announcement",
      message: payload.message || "",
      type: payload.type || "info",
      audience: payload.audience || payload.target_audience || "all",
      status: payload.status || "sent",
      sent_at: payload.sent_at || new Date().toISOString(),
      created_by: adminId,
    };
    if (payload["scheduled_at"]) cleanPayload["scheduled_at"] = payload["scheduled_at"];
    if (payload["target_plan"]) cleanPayload["target_plan"] = payload["target_plan"];
    if (Array.isArray(payload["target_business_ids"]))
      cleanPayload["target_business_ids"] = payload["target_business_ids"];

    const { error } = await supabase.from("platform_notifications_admin").insert([cleanPayload]);
    if (error) {
      console.error("[adminNotificationService.create] Error:", error);
    }
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("platform_notifications_admin").delete().eq("id", id);
    return !error;
  },
};
