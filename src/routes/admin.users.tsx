import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Timer,
  CreditCard,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  CalendarPlus,
  Ban,
  Eye,
  RotateCcw,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell,
  AdminPageHeader,
  AdminBadge,
  AdminKpiCard,
  AdminEmptyState,
  ConfirmDialog,
  statusColor,
} from "@/components/admin-shell";
import { useAdminAuth } from "@/lib/admin-context";
import { adminBusinessService, PLAN_PRICES, PLAN_LABELS } from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours } from "date-fns";

export const Route = createFileRoute("/admin/users")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "",
  }),
  head: () => ({ meta: [{ title: "Users | Admin | Occo Flow" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminUsersManagement />
      </AdminShell>
    </AdminGuard>
  );
}

interface UserRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
  businessId: string;
  businessName: string;
  industry: string;
  isSuspended: boolean;
  suspensionReason: string;
  subscriptionId: string;
  subscriptionStatus:
    | "trial_active"
    | "trial_expired"
    | "subscribed"
    | "subscription_expired"
    | "subscription_cancelled";
  plan: string;
  billingCycle: string | null;
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
}

function AdminUsersManagement() {
  const { adminUser } = useAdminAuth();
  const searchParams = Route.useSearch();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"subscribed" | "trials">(
    searchParams.tab === "trials" ? "trials" : "subscribed",
  );
  const [search, setSearch] = useState("");
  const [trialFilter, setTrialFilter] = useState<"all" | "active" | "expired">("all");

  // Detail Modal State
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);

  // Suspend Modal State
  const [suspendModal, setSuspendModal] = useState<{
    open: boolean;
    user: UserRecord | null;
    action: "suspend" | "reactivate";
  }>({ open: false, user: null, action: "suspend" });
  const [suspendReason, setSuspendReason] = useState("");

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    user: UserRecord | null;
  }>({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const now = useMemo(() => new Date(), []);

  // Load real users directly from Supabase
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          phone,
          created_at,
          businesses (
            id,
            name,
            industry,
            email,
            phone,
            is_suspended,
            suspension_reason,
            subscriptions (
              id,
              status,
              plan,
              billing_cycle,
              trial_started_at,
              trial_ends_at,
              subscription_started_at,
              subscription_ends_at
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error || !data) {
        setUsers([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records: UserRecord[] = data.map((p: any) => {
        const biz = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
        const sub = biz?.subscriptions
          ? Array.isArray(biz.subscriptions)
            ? biz.subscriptions[0]
            : biz.subscriptions
          : null;

        return {
          id: p.id,
          fullName: p.full_name || "Workspace User",
          phone: p.phone || biz?.phone || "",
          email: biz?.email || "",
          createdAt: p.created_at,
          businessId: biz?.id || "",
          businessName: biz?.name || "Personal Workspace",
          industry: biz?.industry || "General",
          isSuspended: Boolean(biz?.is_suspended),
          suspensionReason: biz?.suspension_reason || "",
          subscriptionId: sub?.id || "",
          subscriptionStatus: sub?.status || "trial_active",
          plan: sub?.plan || "none",
          billingCycle: sub?.billing_cycle || null,
          trialStartedAt: sub?.trial_started_at || p.created_at,
          trialEndsAt: sub?.trial_ends_at || new Date(Date.now() + 3 * 86400000).toISOString(),
          subscriptionStartedAt: sub?.subscription_started_at || null,
          subscriptionEndsAt: sub?.subscription_ends_at || null,
        };
      });

      setUsers(records);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadUsers();
      }, 300);
    };

    const channel = supabase
      .channel("admin-users-realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, debouncedReload)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        debouncedReload,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter groups
  const subscribedUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.subscriptionStatus === "subscribed" ||
        u.subscriptionStatus === "subscription_cancelled" ||
        u.subscriptionStatus === "subscription_expired",
    );
  }, [users]);

  const trialUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.subscriptionStatus === "trial_active" ||
        u.subscriptionStatus === "trial_expired" ||
        u.plan === "none",
    );
  }, [users]);

  // Sub-counts
  const activeSubscribedCount = subscribedUsers.filter(
    (u) => u.subscriptionStatus === "subscribed",
  ).length;
  const activeTrialCount = trialUsers.filter((u) => {
    const end = new Date(u.trialEndsAt);
    return u.subscriptionStatus === "trial_active" && end >= now;
  }).length;
  const expiredTrialCount = trialUsers.filter((u) => {
    const end = new Date(u.trialEndsAt);
    return u.subscriptionStatus === "trial_expired" || end < now;
  }).length;

  // Search and filter applied list
  const filteredSubscribed = useMemo(() => {
    return subscribedUsers.filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.businessName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q)
      );
    });
  }, [subscribedUsers, search]);

  const filteredTrials = useMemo(() => {
    return trialUsers.filter((u) => {
      const end = new Date(u.trialEndsAt);
      const isExpired = u.subscriptionStatus === "trial_expired" || end < now;

      if (trialFilter === "active" && isExpired) return false;
      if (trialFilter === "expired" && !isExpired) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.businessName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [trialUsers, trialFilter, search, now]);

  // Handle Suspend / Reactivate Action
  const handleSuspendAction = async () => {
    if (!suspendModal.user || !adminUser) return;
    const u = suspendModal.user;

    if (suspendModal.action === "suspend") {
      await adminBusinessService.suspend(
        u.businessId,
        suspendReason || "Administrative suspension",
        { id: adminUser.id, email: adminUser.email },
      );
      toast.success(`User ${u.fullName}'s account has been suspended.`);
    } else {
      await adminBusinessService.reactivate(u.businessId, {
        id: adminUser.id,
        email: adminUser.email,
      });
      toast.success(`User ${u.fullName}'s account has been reactivated.`);
    }

    setSuspendModal({ open: false, user: null, action: "suspend" });
    setSuspendReason("");
    await loadUsers();
  };

  // Permanently delete user and workspace from database
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);
    try {
      const u = deleteModal.user;
      const res = await adminBusinessService.deletePermanently(
        u.id,
        u.businessId,
        adminUser ? { id: adminUser.id, email: adminUser.email } : undefined,
      );
      if (res.success) {
        toast.success(
          `User "${u.fullName || u.email || "User"}" has been permanently deleted from the database.`,
        );
        setDeleteModal({ open: false, user: null });
        setUsers((prev) => prev.filter((item) => item.id !== u.id));
      } else {
        toast.error(res.error || "Failed to delete user. Please check database permissions.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="CRM Users"
        description="All registered users using Occo Flow — view Subscribed customers and Users on Trial."
      />

      {/* Top 4 Real KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Total Registered Users"
          value={users.length}
          icon={Users}
          tone="bg-blue-50 text-blue-600"
          sub="All customer accounts created"
        />
        <AdminKpiCard
          label="Subscribed Users"
          value={activeSubscribedCount}
          icon={CreditCard}
          tone="bg-emerald-50 text-emerald-600"
          sub="Paying Standard & Premium members"
        />
        <AdminKpiCard
          label="Users on 3-Day Trial"
          value={activeTrialCount}
          icon={Timer}
          tone="bg-amber-50 text-amber-600"
          sub="Currently testing the CRM"
        />
        <AdminKpiCard
          label="Expired Trials (Dropped)"
          value={expiredTrialCount}
          icon={AlertTriangle}
          tone="bg-slate-100 text-slate-700"
          sub="Trial ended without upgrade"
        />
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Two Dedicated Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("subscribed")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "subscribed"
                ? "bg-white text-[#2563eb] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard size={15} />
            <span>Subscribed Users</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                activeTab === "subscribed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {subscribedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trials")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "trials"
                ? "bg-white text-[#2563eb] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Timer size={15} />
            <span>Users on Trial</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                activeTab === "trials" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {trialUsers.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "subscribed" ? "Search subscribed users..." : "Search trial users..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SUBSCRIBED USERS                                      */}
      {/* ============================================================ */}
      {activeTab === "subscribed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              Showing active & renewing subscribed customers paying for Occo Flow
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-[#2563eb]" />
              </div>
            ) : subscribedUsers.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  icon={CreditCard}
                  title="No subscribed users yet"
                  description="When users upgrade from their 3-day trial to Standard or Premium subscriptions, their active customer profile, billing tier, and renewal date will show here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">User</th>
                      <th className="px-4 py-3.5">Workspace</th>
                      <th className="px-4 py-3.5">Contact</th>
                      <th className="px-4 py-3.5">Plan & Billing</th>
                      <th className="px-4 py-3.5">Renewal Date</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscribed.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No subscribed users found matching "{search}".
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribed.map((u) => {
                        const price = PLAN_PRICES[u.plan] ?? 0;
                        const label = PLAN_LABELS[u.plan] ?? u.plan;
                        const initial = u.fullName ? (u.fullName[0]?.toUpperCase() ?? "U") : "U";

                        return (
                          <tr key={u.id} className="transition-colors hover:bg-slate-50/70">
                            {/* User Avatar & Name */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#0f172a] truncate">
                                    {u.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    ID: {u.id.slice(0, 8)}…
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Workspace */}
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-800">{u.businessName}</div>
                              <div className="text-[10px] text-slate-400">{u.industry}</div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3.5">
                              {u.phone && (
                                <div className="flex items-center gap-1 text-slate-700">
                                  <Phone size={11} className="text-slate-400" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                              {u.email && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <Mail size={11} className="text-slate-400" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              {!u.phone && !u.email && <span className="text-slate-400">—</span>}
                            </td>

                            {/* Plan & Price */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[#0f172a]">{label}</div>
                              <div className="text-[10px] font-semibold text-emerald-600">
                                ₹{price.toLocaleString("en-IN")}
                                {u.plan.includes("yearly") ? "/yr" : "/mo"}
                              </div>
                            </td>

                            {/* Renewal */}
                            <td className="px-4 py-3.5 text-slate-500">
                              {u.subscriptionEndsAt
                                ? format(new Date(u.subscriptionEndsAt), "dd MMM yyyy")
                                : "—"}
                            </td>

                            {/* Account Status */}
                            <td className="px-4 py-3.5">
                              {u.isSuspended ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600 border border-red-200">
                                  Suspended
                                </span>
                              ) : (
                                <AdminBadge
                                  label={u.subscriptionStatus.replace("_", " ")}
                                  color={statusColor(u.subscriptionStatus)}
                                />
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailUser(u)}
                                  title="View User Details"
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                >
                                  <Eye size={14} />
                                </button>
                                {u.isSuspended ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSuspendModal({ open: true, user: u, action: "reactivate" })
                                    }
                                    title="Reactivate Account"
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSuspendModal({ open: true, user: u, action: "suspend" })
                                    }
                                    title="Suspend User"
                                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer"
                                  >
                                    <Ban size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ open: true, user: u })}
                                  title="Delete User from Database"
                                  className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: USERS ON TRIAL                                        */}
      {/* ============================================================ */}
      {activeTab === "trials" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              Users currently testing the CRM on 3-day free trial or those whose trial expired
              without upgrade.
            </p>

            {/* Trial Filter Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 self-start sm:self-auto">
              {[
                { id: "all", label: "All Trials" },
                { id: "active", label: "Active 3-Day" },
                { id: "expired", label: "Expired (Left)" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTrialFilter(item.id as typeof trialFilter)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    trialFilter === item.id
                      ? "bg-[#2563eb] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-[#2563eb]" />
              </div>
            ) : trialUsers.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  icon={Timer}
                  title="No users on trial yet"
                  description="When new users sign up on Occo Flow, their 3-day free trial starts automatically. They will appear here for trial extension, monitoring, and conversion tracking."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">User</th>
                      <th className="px-4 py-3.5">Workspace</th>
                      <th className="px-4 py-3.5">Contact</th>
                      <th className="px-4 py-3.5">Trial Started</th>
                      <th className="px-4 py-3.5">Expires</th>
                      <th className="px-4 py-3.5">Trial Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTrials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No trial users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTrials.map((u) => {
                        const end = new Date(u.trialEndsAt);
                        const isExpired = u.subscriptionStatus === "trial_expired" || end < now;
                        const hoursLeft = Math.max(0, differenceInHours(end, now));
                        const daysLeft = Math.max(0, differenceInDays(end, now));
                        const initial = u.fullName ? (u.fullName[0]?.toUpperCase() ?? "U") : "U";

                        return (
                          <tr key={u.id} className="transition-colors hover:bg-slate-50/70">
                            {/* User Avatar & Name */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-xs">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#0f172a] truncate">
                                    {u.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    ID: {u.id.slice(0, 8)}…
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Workspace */}
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-800">{u.businessName}</div>
                              <div className="text-[10px] text-slate-400">{u.industry}</div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3.5">
                              {u.phone && (
                                <div className="flex items-center gap-1 text-slate-700">
                                  <Phone size={11} className="text-slate-400" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                              {u.email && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <Mail size={11} className="text-slate-400" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              {!u.phone && !u.email && <span className="text-slate-400">—</span>}
                            </td>

                            {/* Started */}
                            <td className="px-4 py-3.5 text-slate-500">
                              {format(new Date(u.trialStartedAt), "dd MMM yyyy, h:mm a")}
                            </td>

                            {/* Expires */}
                            <td className="px-4 py-3.5 text-slate-500">
                              {format(end, "dd MMM yyyy, h:mm a")}
                            </td>

                            {/* Trial Status Badge */}
                            <td className="px-4 py-3.5">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                  <Clock size={11} /> Expired (Left without subscribing)
                                </span>
                              ) : hoursLeft <= 24 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  <AlertTriangle size={11} /> {hoursLeft} hours left
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={11} /> {daysLeft} days active trial
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailUser(u)}
                                  title="View User Details"
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                >
                                  <Eye size={14} />
                                </button>
                                {u.isSuspended ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSuspendModal({ open: true, user: u, action: "reactivate" })
                                    }
                                    title="Reactivate Account"
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSuspendModal({ open: true, user: u, action: "suspend" })
                                    }
                                    title="Suspend User"
                                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer"
                                  >
                                    <Ban size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ open: true, user: u })}
                                  title="Delete User from Database"
                                  className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* USER DETAIL MODAL                                            */}
      {/* ============================================================ */}
      <Dialog
        open={!!detailUser}
        onOpenChange={(v) => {
          if (!v) setDetailUser(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
              <Users size={18} className="text-[#2563eb]" />
              User & Workspace Details
            </DialogTitle>
          </DialogHeader>

          {detailUser && (
            <div className="space-y-4 text-xs text-slate-600">
              {/* User Profile Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-xs">
                    {detailUser.fullName ? (detailUser.fullName[0]?.toUpperCase() ?? "U") : "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0f172a]">{detailUser.fullName}</h4>
                    <p className="text-[11px] text-slate-400">User ID: {detailUser.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Phone
                    </span>
                    <span className="font-semibold text-slate-800">
                      {detailUser.phone || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Email
                    </span>
                    <span className="font-semibold text-slate-800">
                      {detailUser.email || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Card */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Building2 size={15} className="text-blue-600" />
                  <span>Workspace / Business: {detailUser.businessName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Industry
                    </span>
                    <span className="font-semibold text-slate-800">{detailUser.industry}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Registration Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {format(new Date(detailUser.createdAt), "dd MMM yyyy, h:mm a")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0f172a]">Membership Plan</span>
                  <AdminBadge
                    label={detailUser.subscriptionStatus.replace("_", " ")}
                    color={statusColor(detailUser.subscriptionStatus)}
                  />
                </div>
                <p className="text-slate-600 font-semibold">
                  Tier: {PLAN_LABELS[detailUser.plan] ?? detailUser.plan}
                </p>
                {detailUser.subscriptionStatus === "subscribed" && (
                  <p className="text-slate-500 text-[11px]">
                    Renews:{" "}
                    {detailUser.subscriptionEndsAt
                      ? format(new Date(detailUser.subscriptionEndsAt), "dd MMM yyyy")
                      : "—"}
                  </p>
                )}
                {detailUser.subscriptionStatus.startsWith("trial") && (
                  <p className="text-slate-500 text-[11px]">
                    Trial Expiry: {format(new Date(detailUser.trialEndsAt), "dd MMM yyyy, h:mm a")}
                  </p>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailUser;
                    setDetailUser(null);
                    setDeleteModal({ open: true, user: target });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  Delete User from Database
                </button>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* SUSPEND / REACTIVATE DIALOG                                  */}
      {/* ============================================================ */}
      <ConfirmDialog
        open={suspendModal.open}
        onClose={() => {
          setSuspendModal({ open: false, user: null, action: "suspend" });
          setSuspendReason("");
        }}
        onConfirm={handleSuspendAction}
        title={
          suspendModal.action === "suspend"
            ? `Suspend user account for ${suspendModal.user?.fullName}?`
            : `Reactivate user account for ${suspendModal.user?.fullName}?`
        }
        description={
          suspendModal.action === "suspend"
            ? `Suspending "${suspendModal.user?.businessName}" will lock login access for this user immediately.`
            : `Reactivating will restore normal CRM access for "${suspendModal.user?.businessName}".`
        }
        confirmLabel={suspendModal.action === "suspend" ? "Suspend Account" : "Reactivate Account"}
        danger={suspendModal.action === "suspend"}
      >
        {suspendModal.action === "suspend" && (
          <div className="mt-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Suspension Reason (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Terms violation, payment dispute"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-[#0f172a] focus:border-red-400 focus:outline-none"
            />
          </div>
        )}
      </ConfirmDialog>

      {/* ============================================================ */}
      {/* PERMANENT DELETE FROM DATABASE DIALOG                        */}
      {/* ============================================================ */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => {
          if (!deleting) setDeleteModal({ open: false, user: null });
        }}
        onConfirm={handleDeleteUser}
        title={`Permanently delete ${deleteModal.user?.fullName || deleteModal.user?.email || "this user"}?`}
        description={`This will permanently delete this user account, their business workspace "${deleteModal.user?.businessName || ""}", all associated CRM records (leads, deals, tasks, payments), and auth login credentials from the database. This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting from Database..." : "Delete Permanently"}
        danger
      />
    </div>
  );
}
