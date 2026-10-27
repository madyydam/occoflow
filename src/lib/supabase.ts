import { createClient } from "@supabase/supabase-js";
import type {
  Profile,
  Business,
  Subscription,
  Lead,
  Contact,
  Deal,
  Task,
  Note,
  FollowUp,
  Activity,
} from "./crm-data";

// ── Client ────────────────────────────────────────────────────────
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl = env["VITE_SUPABASE_URL"] || "";

const supabaseAnonKey = env["VITE_SUPABASE_ANON_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Occo Flow] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined in environment variables. Please check your .env configuration.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_anon_key",
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
);

// ── Row mappers ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProfile = (r: any): Profile => ({
  id: r.id,
  fullName: r.full_name ?? "",
  phone: r.phone ?? "",
  avatarUrl: r.avatar_url ?? "",
  businessId: r.business_id ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBusiness = (r: any): Business => ({
  id: r.id,
  name: r.name,
  industry: r.industry ?? "General",
  phone: r.phone ?? "",
  email: r.email ?? "",
  address: r.address ?? "",
  logoUrl: r.logo_url ?? "",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSubscription = (r: any): Subscription => ({
  id: r.id,
  businessId: r.business_id,
  status: r.status,
  plan: r.plan,
  billingCycle: r.billing_cycle ?? null,
  trialStartedAt: r.trial_started_at,
  trialEndsAt: r.trial_ends_at,
  subscriptionStartedAt: r.subscription_started_at ?? null,
  subscriptionEndsAt: r.subscription_ends_at ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapLead = (r: any): Lead => ({
  id: r.id,
  businessId: r.business_id,
  name: r.name,
  phone: r.phone ?? "",
  email: r.email ?? "",
  company: r.company ?? "",
  source: r.source ?? "Website",
  status: r.status ?? "New",
  priority: r.priority ?? "Medium",
  value: Number(r.value) || 0,
  notes: r.notes ?? "",
  assignedUserId: r.assigned_user_id ?? null,
  archived: Boolean(r.archived),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapContact = (r: any): Contact => ({
  id: r.id,
  businessId: r.business_id,
  name: r.name,
  phone: r.phone ?? "",
  email: r.email ?? "",
  company: r.company ?? "",
  tags: r.tags ?? [],
  notes: r.notes ?? "",
  leadId: r.lead_id ?? null,
  archived: Boolean(r.archived),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDeal = (r: any): Deal => ({
  id: r.id,
  businessId: r.business_id,
  title: r.title,
  customer: r.customer,
  value: Number(r.value) || 0,
  stage: r.stage ?? "New",
  closeDate: r.close_date ?? null,
  description: r.description ?? "",
  leadId: r.lead_id ?? null,
  contactId: r.contact_id ?? null,
  assignedUserId: r.assigned_user_id ?? null,
  archived: Boolean(r.archived),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTask = (r: any): Task => ({
  id: r.id,
  businessId: r.business_id,
  title: r.title,
  description: r.description ?? "",
  dueDate: r.due_date ?? null,
  dueTime: r.due_time ?? "",
  priority: r.priority ?? "Medium",
  status: r.status ?? "Pending",
  relatedLeadId: r.related_lead_id ?? null,
  relatedDealId: r.related_deal_id ?? null,
  assignedUserId: r.assigned_user_id ?? null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapNote = (r: any): Note => ({
  id: r.id,
  businessId: r.business_id,
  userId: r.user_id ?? null,
  leadId: r.lead_id ?? null,
  contactId: r.contact_id ?? null,
  dealId: r.deal_id ?? null,
  content: r.content,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFollowUp = (r: any): FollowUp => ({
  id: r.id,
  businessId: r.business_id,
  leadId: r.lead_id ?? null,
  contactId: r.contact_id ?? null,
  scheduledAt: r.scheduled_at,
  note: r.note ?? "",
  status: r.status ?? "Pending",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapActivity = (r: any): Activity => ({
  id: r.id,
  businessId: r.business_id,
  userId: r.user_id ?? null,
  leadId: r.lead_id ?? null,
  contactId: r.contact_id ?? null,
  dealId: r.deal_id ?? null,
  type: r.type ?? "note",
  title: r.title,
  detail: r.detail ?? "",
  createdAt: r.created_at,
});

// ── Auth ──────────────────────────────────────────────────────────
export const authService = {
  async signUp(email: string, password: string, fullName: string, phone: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
  },

  // Sign in with email + password
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  // Look up email by phone number (for phone-based login)
  async lookupEmailByPhone(phone: string): Promise<string | null> {
    // Normalize: strip spaces/dashes for loose matching
    const normalized = phone.replace(/[\s\-().]/g, "");
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("phone", `%${normalized}%`)
      .limit(1)
      .single();
    if (error || !data) return null;
    // Get email via auth admin is not possible client-side.
    // Instead, fetch from auth.users via a safe RPC or return null (phone login unsupported without backend)
    // For now: return null → show "use email" hint
    return null;
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  // Send OTP to email for password reset
  async sendOtp(email: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
  },

  // Verify OTP token entered by user
  async verifyOtp(email: string, token: string) {
    return supabase.auth.verifyOtp({ email, token, type: "email" });
  },

  // Update password (called after OTP verified — user is now signed in)
  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(cb);
  },
};

// ── Profile ───────────────────────────────────────────────────────
export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error || !data) return null;
    return mapProfile(data);
  },
  async update(
    userId: string,
    patch: Partial<{ fullName: string; phone: string; avatarUrl: string; businessId: string }>,
  ) {
    const payload: Record<string, unknown> = {};
    if (patch.fullName !== undefined) payload["full_name"] = patch.fullName;
    if (patch["phone"] !== undefined) payload["phone"] = patch["phone"];
    if (patch["avatarUrl"] !== undefined) payload["avatar_url"] = patch["avatarUrl"];
    if (patch["businessId"] !== undefined) payload["business_id"] = patch["businessId"];
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    return !error;
  },
};

// ── Business ──────────────────────────────────────────────────────
export const businessService = {
  async create(name: string, industry: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from("businesses")
      .insert([{ name, industry }])
      .select()
      .single();
    if (error || !data) return null;
    return mapBusiness(data);
  },
  async get(businessId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();
    if (error || !data) return null;
    return mapBusiness(data);
  },
  async update(businessId: string, patch: Partial<Business>): Promise<boolean> {
    const payload: Record<string, unknown> = {};
    if (patch["name"] !== undefined) payload["name"] = patch["name"];
    if (patch["industry"] !== undefined) payload["industry"] = patch["industry"];
    if (patch["phone"] !== undefined) payload["phone"] = patch["phone"];
    if (patch["email"] !== undefined) payload["email"] = patch["email"];
    if (patch["address"] !== undefined) payload["address"] = patch["address"];
    if (patch["logoUrl"] !== undefined) payload["logo_url"] = patch["logoUrl"];
    const { error } = await supabase.from("businesses").update(payload).eq("id", businessId);
    return !error;
  },
  async addMember(userId: string, businessId: string, role = "owner"): Promise<boolean> {
    const { error } = await supabase
      .from("memberships")
      .insert([{ user_id: userId, business_id: businessId, role }]);
    return !error;
  },
};

// ── Subscription ──────────────────────────────────────────────────
export const subscriptionService = {
  async create(businessId: string): Promise<Subscription | null> {
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("subscriptions")
      .insert([
        {
          business_id: businessId,
          status: "trial_active",
          plan: "none",
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEndsAt,
        },
      ])
      .select()
      .single();
    if (error || !data) return null;
    return mapSubscription(data);
  },
  async get(businessId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .single();
    if (error || !data) return null;
    // Auto-expire trial if past trial_ends_at
    const sub = mapSubscription(data);
    if (sub.status === "trial_active" && new Date(sub.trialEndsAt) < new Date()) {
      await supabase
        .from("subscriptions")
        .update({ status: "trial_expired" })
        .eq("business_id", businessId);
      return { ...sub, status: "trial_expired" };
    }
    return sub;
  },
  async activate(
    businessId: string,
    plan: string,
    billingCycle: string,
    providerCustomerId = "",
    providerSubscriptionId = "",
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const endsAt =
      billingCycle === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "subscribed",
        plan,
        billing_cycle: billingCycle,
        subscription_started_at: now,
        subscription_ends_at: endsAt,
        provider_customer_id: providerCustomerId,
        provider_subscription_id: providerSubscriptionId,
      })
      .eq("business_id", businessId);
    return !error;
  },
};

// ── Leads ─────────────────────────────────────────────────────────
export const leadService = {
  async list(businessId: string): Promise<Lead[]> {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("business_id", businessId)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapLead);
  },
  async get(id: string): Promise<Lead | null> {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapLead(data);
  },
  async insert(
    businessId: string,
    payload: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">,
  ): Promise<Lead | null> {
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          business_id: businessId,
          name: payload.name || "New Lead",
          phone: payload.phone ?? "",
          email: payload.email ?? "",
          company: payload.company ?? "",
          source: payload.source ?? "Website",
          status: payload.status ?? "New",
          priority: payload.priority ?? "Medium",
          value: Number(payload.value) || 0,
          notes: payload.notes ?? "",
          assigned_user_id: payload.assignedUserId ?? null,
        },
      ])
      .select()
      .single();
    if (error || !data) {
      console.error("[leadService.insert] Error creating lead:", error);
      return null;
    }
    return mapLead(data);
  },
  async insertMany(
    businessId: string,
    payloads: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">[],
  ): Promise<Lead[]> {
    if (!payloads.length) return [];
    const rows = payloads.map((payload) => ({
      business_id: businessId,
      name: payload.name || "New Lead",
      phone: payload.phone ?? "",
      email: payload.email ?? "",
      company: payload.company ?? "",
      source: payload.source ?? "Website",
      status: payload.status ?? "New",
      priority: payload.priority ?? "Medium",
      value: Number(payload.value) || 0,
      notes: payload.notes ?? "",
      assigned_user_id: payload.assignedUserId ?? null,
    }));
    const { data, error } = await supabase.from("leads").insert(rows).select();
    if (error || !data) {
      console.error("[leadService.insertMany] Error bulk creating leads:", error);
      return [];
    }
    return data.map(mapLead);
  },
  async update(id: string, patch: Partial<Lead>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = {};
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.phone !== undefined) p.phone = patch.phone;
    if (patch.email !== undefined) p.email = patch.email;
    if (patch.company !== undefined) p.company = patch.company;
    if (patch.source !== undefined) p.source = patch.source;
    if (patch.status !== undefined) p.status = patch.status;
    if (patch.priority !== undefined) p.priority = patch.priority || "Medium";
    if (patch.value !== undefined) p.value = Number(patch.value) || 0;
    if (patch.notes !== undefined) p.notes = patch.notes;
    if (patch.assignedUserId !== undefined) p.assigned_user_id = patch.assignedUserId;
    const { error } = await supabase.from("leads").update(p).eq("id", id);
    return !error;
  },
  async archive(id: string): Promise<boolean> {
    const { error } = await supabase.from("leads").update({ archived: true }).eq("id", id);
    return !error;
  },
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    return !error;
  },
};

// ── Contacts ──────────────────────────────────────────────────────
export const contactService = {
  async list(businessId: string): Promise<Contact[]> {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("business_id", businessId)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapContact);
  },
  async insert(businessId: string, payload: Partial<Contact>): Promise<Contact | null> {
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          business_id: businessId,
          name: payload.name || "New Contact",
          phone: payload.phone ?? "",
          email: payload.email ?? "",
          company: payload.company ?? "",
          notes: payload.notes ?? "",
          lead_id: payload.leadId ?? null,
          tags: payload.tags ?? [],
        },
      ])
      .select()
      .single();
    if (error || !data) {
      console.error("[contactService.insert] Error creating contact:", error);
      return null;
    }
    return mapContact(data);
  },
  async update(id: string, patch: Partial<Contact>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = {};
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.phone !== undefined) p.phone = patch.phone;
    if (patch.email !== undefined) p.email = patch.email;
    if (patch.company !== undefined) p.company = patch.company;
    if (patch.notes !== undefined) p.notes = patch.notes;
    if (patch.tags !== undefined) p.tags = patch.tags;
    const { error } = await supabase.from("contacts").update(p).eq("id", id);
    return !error;
  },
  async archive(id: string): Promise<boolean> {
    const { error } = await supabase.from("contacts").update({ archived: true }).eq("id", id);
    return !error;
  },
};

// ── Deals ─────────────────────────────────────────────────────────
export const dealService = {
  async list(businessId: string): Promise<Deal[]> {
    const { data } = await supabase
      .from("deals")
      .select("*")
      .eq("business_id", businessId)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapDeal);
  },
  async insert(businessId: string, payload: Partial<Deal>): Promise<Deal | null> {
    const rawDate = payload.closeDate;
    const cleanDate =
      rawDate && rawDate !== "Not set" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;

    const { data, error } = await supabase
      .from("deals")
      .insert([
        {
          business_id: businessId,
          title: payload.title || "New Deal",
          customer: payload.customer || "New Customer",
          value: Number(payload.value) || 0,
          stage: payload.stage ?? "New",
          close_date: cleanDate,
          description: payload.description ?? "",
          lead_id: payload.leadId ?? null,
          contact_id: payload.contactId ?? null,
          assigned_user_id: payload.assignedUserId ?? null,
        },
      ])
      .select()
      .single();
    if (error || !data) {
      console.error("[dealService.insert] Error creating deal:", error);
      return null;
    }
    return mapDeal(data);
  },
  async update(id: string, patch: Partial<Deal>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = {};
    if (patch.title !== undefined) p.title = patch.title;
    if (patch.customer !== undefined) p.customer = patch.customer;
    if (patch.value !== undefined) p.value = Number(patch.value) || 0;
    if (patch.stage !== undefined) p.stage = patch.stage;
    if (patch.closeDate !== undefined) {
      p.close_date =
        patch.closeDate &&
        patch.closeDate !== "Not set" &&
        /^\d{4}-\d{2}-\d{2}$/.test(patch.closeDate)
          ? patch.closeDate
          : null;
    }
    if (patch.description !== undefined) p.description = patch.description;
    const { error } = await supabase.from("deals").update(p).eq("id", id);
    return !error;
  },
  async archive(id: string): Promise<boolean> {
    const { error } = await supabase.from("deals").update({ archived: true }).eq("id", id);
    return !error;
  },
};

// ── Tasks ─────────────────────────────────────────────────────────
export const taskService = {
  async list(businessId: string): Promise<Task[]> {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("business_id", businessId)
      .order("due_date", { ascending: true, nullsFirst: false });
    return (data ?? []).map(mapTask);
  },
  async insert(businessId: string, payload: Partial<Task>): Promise<Task | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawDate = payload.dueDate || (payload as any).date;
    const cleanDate =
      rawDate && rawDate !== "Today" && rawDate !== "Not set" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : rawDate === "Today"
          ? new Date().toISOString().split("T")[0]
          : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTime = payload.dueTime || (payload as any).time || "";

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          business_id: businessId,
          title: payload.title || "New Task",
          description: payload.description ?? "",
          due_date: cleanDate,
          due_time: rawTime,
          priority: payload.priority ?? "Medium",
          status: payload.status ?? "Pending",
          related_lead_id: payload.relatedLeadId ?? null,
          related_deal_id: payload.relatedDealId ?? null,
          assigned_user_id: payload.assignedUserId ?? null,
        },
      ])
      .select()
      .single();
    if (error || !data) {
      console.error("[taskService.insert] Error creating task:", error);
      return null;
    }
    return mapTask(data);
  },
  async update(id: string, patch: Partial<Task>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = {};
    if (patch.title !== undefined) p.title = patch.title;
    if (patch.status !== undefined) p.status = patch.status;
    if (patch.priority !== undefined) p.priority = patch.priority;
    if (patch.dueDate !== undefined || (patch as any).date !== undefined) {
      const rawDate = patch.dueDate || (patch as any).date;
      p.due_date =
        rawDate &&
        rawDate !== "Today" &&
        rawDate !== "Not set" &&
        /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
          ? rawDate
          : rawDate === "Today"
            ? new Date().toISOString().split("T")[0]
            : null;
    }
    if (patch.dueTime !== undefined || (patch as any).time !== undefined) {
      p.due_time = patch.dueTime || (patch as any).time || "";
    }
    if (patch.description !== undefined) p.description = patch.description;
    const { error } = await supabase.from("tasks").update(p).eq("id", id);
    return !error;
  },
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    return !error;
  },
};

// ── Notes ─────────────────────────────────────────────────────────
export const noteService = {
  async list(
    businessId: string,
    leadId?: string,
    contactId?: string,
    dealId?: string,
  ): Promise<Note[]> {
    let q = supabase.from("notes").select("*").eq("business_id", businessId);
    if (leadId) q = q.eq("lead_id", leadId);
    if (contactId) q = q.eq("contact_id", contactId);
    if (dealId) q = q.eq("deal_id", dealId);
    const { data } = await q.order("created_at", { ascending: false });
    return (data ?? []).map(mapNote);
  },
  async insert(
    businessId: string,
    userId: string,
    content: string,
    opts?: { leadId?: string; contactId?: string; dealId?: string },
  ): Promise<Note | null> {
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          business_id: businessId,
          user_id: userId,
          content,
          lead_id: opts?.leadId ?? null,
          contact_id: opts?.contactId ?? null,
          deal_id: opts?.dealId ?? null,
        },
      ])
      .select()
      .single();
    if (error || !data) return null;
    return mapNote(data);
  },
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    return !error;
  },
};

// ── Follow-ups ────────────────────────────────────────────────────
export const followUpService = {
  async listToday(businessId: string): Promise<FollowUp[]> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const { data } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "Pending")
      .gte("scheduled_at", start)
      .lt("scheduled_at", end)
      .order("scheduled_at");
    return (data ?? []).map(mapFollowUp);
  },
  async list(businessId: string): Promise<FollowUp[]> {
    const { data } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("business_id", businessId)
      .order("scheduled_at", { ascending: true });
    return (data ?? []).map(mapFollowUp);
  },
  async insert(businessId: string, payload: Partial<FollowUp>): Promise<FollowUp | null> {
    const rawTime = payload.scheduledAt;
    const cleanTime = rawTime && !isNaN(Date.parse(rawTime)) ? rawTime : new Date().toISOString();

    const { data, error } = await supabase
      .from("follow_ups")
      .insert([
        {
          business_id: businessId,
          lead_id: payload.leadId ?? null,
          contact_id: payload.contactId ?? null,
          scheduled_at: cleanTime,
          note: payload.note ?? "",
          status: "Pending",
        },
      ])
      .select()
      .single();
    if (error || !data) {
      console.error("[followUpService.insert] Error creating follow-up:", error);
      return null;
    }
    return mapFollowUp(data);
  },
  async complete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("follow_ups")
      .update({ status: "Completed" })
      .eq("id", id);
    return !error;
  },
};

// ── Activities ────────────────────────────────────────────────────
export const activityService = {
  async list(businessId: string, leadId?: string): Promise<Activity[]> {
    let q = supabase.from("activities").select("*").eq("business_id", businessId);
    if (leadId) q = q.eq("lead_id", leadId);
    const { data } = await q.order("created_at", { ascending: false }).limit(50);
    return (data ?? []).map(mapActivity);
  },
  async insert(payload: Omit<Activity, "id" | "createdAt">): Promise<Activity | null> {
    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          business_id: payload.businessId,
          user_id: payload.userId ?? null,
          lead_id: payload.leadId ?? null,
          contact_id: payload.contactId ?? null,
          deal_id: payload.dealId ?? null,
          type: payload.type,
          title: payload.title,
          detail: payload.detail,
        },
      ])
      .select()
      .single();
    if (error || !data) return null;
    return mapActivity(data);
  },
};

// ── Problems, Suggestions & Feedback Service ────────────────────────
export interface UserFeedbackItem {
  id: string;
  businessId: string;
  userId: string;
  type: "problem" | "suggestion" | "feedback";
  subject: string;
  description: string;
  priority: string;
  status: "new" | "under_review" | "in_progress" | "resolved" | "closed" | string;
  adminResponse: string;
  adminRespondedAt: string | null;
  rating: number | null;
  ratingComment: string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFeedbackItem = (r: any): UserFeedbackItem => ({
  id: r.id,
  businessId: r.business_id,
  userId: r.user_id,
  type: (r.type as any) || "problem",
  subject: r.subject || "",
  description: r.description || "",
  priority: r.priority || "medium",
  status: r.status || "new",
  adminResponse: r.admin_response || "",
  adminRespondedAt: r.admin_responded_at || null,
  rating: r.rating !== null && r.rating !== undefined ? Number(r.rating) : null,
  ratingComment: r.rating_comment || "",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const feedbackService = {
  async listOwn(businessId: string, userId?: string): Promise<UserFeedbackItem[]> {
    let q = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });

    if (businessId) {
      q = q.eq("business_id", businessId);
    } else if (userId) {
      q = q.eq("user_id", userId);
    }

    const { data, error } = await q;
    if (error) return [];
    return (data ?? []).map(mapFeedbackItem);
  },

  async create(payload: {
    businessId: string;
    userId: string;
    type: "problem" | "suggestion" | "feedback";
    subject: string;
    description: string;
    priority?: string;
    rating?: number;
    ratingComment?: string;
  }): Promise<UserFeedbackItem | null> {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([
        {
          business_id: payload.businessId,
          user_id: payload.userId,
          type: payload.type,
          subject: payload.subject.trim(),
          description: payload.description.trim(),
          priority: payload.priority || "medium",
          status: "new",
          rating: payload.rating ?? null,
          rating_comment: payload.ratingComment?.trim() || "",
        },
      ])
      .select()
      .single();

    if (error || !data) return null;
    return mapFeedbackItem(data);
  },

  async getLatestRating(
    businessId: string,
    userId: string,
  ): Promise<{ rating: number; ratingComment: string; updatedAt: string } | null> {
    let q = supabase
      .from("support_tickets")
      .select("rating, rating_comment, updated_at")
      .not("rating", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (userId) {
      q = q.eq("user_id", userId);
    } else if (businessId) {
      q = q.eq("business_id", businessId);
    }

    const { data, error } = await q;
    if (error || !data || data.length === 0) return null;
    const row = data[0];
    if (!row) return null;
    return {
      rating: Number(row.rating),
      ratingComment: row.rating_comment || "",
      updatedAt: row.updated_at,
    };
  },

  async submitRating(
    businessId: string,
    userId: string,
    rating: number,
    comment: string = "",
  ): Promise<boolean> {
    // Check if there is an existing rating ticket from this user
    const { data: existing } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "feedback")
      .like("subject", "%CRM Experience Rating%")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0 && existing[0]) {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          rating,
          rating_comment: comment.trim(),
          description: comment.trim() || `Rated ${rating} out of 5 stars for CRM experience.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
      return !error;
    }

    const { error } = await supabase.from("support_tickets").insert([
      {
        business_id: businessId,
        user_id: userId,
        type: "feedback",
        subject: `CRM Experience Rating (${rating}/5 Stars)`,
        description: comment.trim() || `Rated ${rating} out of 5 stars for CRM experience.`,
        priority: "medium",
        status: "new",
        rating,
        rating_comment: comment.trim(),
      },
    ]);

    return !error;
  },
};
