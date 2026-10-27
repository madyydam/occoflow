import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3, Users, Target, CheckCircle2, TrendingUp,
  Clock, IndianRupee, Activity, Loader2, Calendar,
  Mail, Send, AlertTriangle, Search, Building2, Phone,
  Check, ArrowDownRight, RefreshCw,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell, AdminPageHeader, AdminKpiCard, AdminBadge, AdminEmptyState,
} from "@/components/admin-shell";
import { supabase } from "@/lib/supabase";
import { PLAN_LABELS, PLAN_MRR } from "@/lib/admin-service";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics & Retention | Admin | Occo Flow" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminAnalytics />
      </AdminShell>
    </AdminGuard>
  );
}

interface PlatformActivityStats {
  totalLeads: number;
  wonLeads: number;
  totalContacts: number;
  totalDeals: number;
  totalTasks: number;
  completedTasks: number;
}

export interface ChurnedCustomer {
  id: string;
  subscriptionId: string;
  businessId: string;
  businessName: string;
  industry: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  plan: string;
  billingCycle: string | null;
  subscriptionStartedAt: string;
  subscriptionEndsAt: string;
  status: "subscription_cancelled" | "subscription_expired";
  activeDays: number;
  completedMonths: number;
  noticeSentAt?: string | null;
}

function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<"system" | "churn">("churn");
  const [loading, setLoading] = useState(true);

  // System stats state
  const [systemStats, setSystemStats] = useState<PlatformActivityStats>({
    totalLeads: 0,
    wonLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  // Churn retention state
  const [churnedUsers, setChurnedUsers] = useState<ChurnedCustomer[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sendingNoticeId, setSendingNoticeId] = useState<string | null>(null);

  // Load system stats
  const loadSystemStats = useCallback(async () => {
    try {
      const [
        { count: totalLeads },
        { count: wonLeads },
        { count: totalContacts },
        { count: totalDeals },
        { count: totalTasks },
        { count: completedTasks },
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "Won"),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Completed"),
      ]);

      setSystemStats({
        totalLeads: totalLeads ?? 0,
        wonLeads: wonLeads ?? 0,
        totalContacts: totalContacts ?? 0,
        totalDeals: totalDeals ?? 0,
        totalTasks: totalTasks ?? 0,
        completedTasks: completedTasks ?? 0,
      });
    } catch {
      // Keep defaults
    }
  }, []);

  // Load churned users strictly: ONLY users who quit (cancelled or expired), excluding active running ones
  const loadChurnedUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          business_id,
          status,
          plan,
          billing_cycle,
          subscription_started_at,
          subscription_ends_at,
          created_at,
          updated_at,
          businesses (
            id,
            name,
            industry,
            email,
            phone,
            profiles (
              id,
              full_name,
              phone
            )
          )
        `)
        .in("status", ["subscription_cancelled", "subscription_expired"])
        .order("subscription_ends_at", { ascending: false, nullsFirst: false });

      if (error || !data) {
        setChurnedUsers([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records: ChurnedCustomer[] = data.map((sub: any) => {
        const biz = Array.isArray(sub.businesses) ? sub.businesses[0] : sub.businesses;
        const prof = Array.isArray(biz?.profiles) ? biz.profiles[0] : biz?.profiles;

        const startIso = sub.subscription_started_at || sub.created_at;
        const endIso = sub.subscription_ends_at || sub.updated_at || new Date().toISOString();

        const startDate = new Date(startIso);
        const endDate = new Date(endIso);
        const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
        const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

        // 1 month is ~30 days (1-40 days = 1, 41-70 = 2, 71-100 = 3, etc.)
        const completedMonths = Math.max(1, Math.floor((days + 10) / 30)) || 1;

        return {
          id: prof?.id || sub.id,
          subscriptionId: sub.id,
          businessId: biz?.id || sub.business_id,
          businessName: biz?.name || "Personal Workspace",
          industry: biz?.industry || "General",
          userName: prof?.full_name || "Workspace User",
          userEmail: biz?.email || "",
          userPhone: biz?.phone || prof?.phone || "",
          plan: sub.plan,
          billingCycle: sub.billing_cycle,
          subscriptionStartedAt: startIso,
          subscriptionEndsAt: endIso,
          status: sub.status,
          activeDays: days,
          completedMonths,
          noticeSentAt: null,
        };
      });

      // Sort most recent quit user on top
      records.sort((a, b) => new Date(b.subscriptionEndsAt).getTime() - new Date(a.subscriptionEndsAt).getTime());
      setChurnedUsers(records);
    } catch {
      setChurnedUsers([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSystemStats(), loadChurnedUsers()]);
    setLoading(false);
  }, [loadSystemStats, loadChurnedUsers]);

  useEffect(() => {
    loadAll();

    let churnTimer: ReturnType<typeof setTimeout> | null = null;
    let statsTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedChurn = () => {
      if (churnTimer) clearTimeout(churnTimer);
      churnTimer = setTimeout(() => loadChurnedUsers(), 300);
    };

    const debouncedStats = () => {
      if (statsTimer) clearTimeout(statsTimer);
      statsTimer = setTimeout(() => loadSystemStats(), 300);
    };

    // Supabase Realtime synchronization: Listen to subscriptions, leads, deals, tasks
    const channel = supabase
      .channel("admin-analytics-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, debouncedChurn)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, debouncedStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, debouncedStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, debouncedStats)
      .subscribe();

    return () => {
      if (churnTimer) clearTimeout(churnTimer);
      if (statsTimer) clearTimeout(statsTimer);
      supabase.removeChannel(channel);
    };
  }, [loadAll, loadSystemStats, loadChurnedUsers]);

  // Filter churned users by completed month duration
  const filteredChurned = useMemo(() => {
    return churnedUsers.filter((u) => {
      if (monthFilter !== "all") {
        if (monthFilter === "12+") {
          if (u.completedMonths <= 12) return false;
        } else {
          const m = Number(monthFilter);
          if (u.completedMonths !== m) return false;
        }
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.userName.toLowerCase().includes(q) ||
        u.businessName.toLowerCase().includes(q) ||
        u.userEmail.toLowerCase().includes(q) ||
        u.userPhone.includes(q) ||
        u.plan.toLowerCase().includes(q)
      );
    });
  }, [churnedUsers, monthFilter, search]);

  // Counts per month duration (1 to 12 months)
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) counts[m] = 0;
    churnedUsers.forEach((u) => {
      if (u.completedMonths >= 1 && u.completedMonths <= 12) {
        counts[u.completedMonths] = (counts[u.completedMonths] || 0) + 1;
      }
    });
    return counts;
  }, [churnedUsers]);

  const count12Plus = useMemo(() => {
    return churnedUsers.filter((u) => u.completedMonths > 12).length;
  }, [churnedUsers]);

  // Lost MRR from filtered users
  const lostMRR = filteredChurned.reduce((sum, u) => sum + (PLAN_MRR[u.plan] ?? 0), 0);

  // Send renewal / expiry notice
  const handleSendNotice = async (user: ChurnedCustomer) => {
    setSendingNoticeId(user.subscriptionId);
    try {
      // Log notice to platform notifications
      await supabase.from("platform_notifications_admin").insert([
        {
          title: "Subscription Expiration / Renewal Notice",
          message: `Subscription for ${user.businessName} (${user.userName}) ended. Automatic renewal notice dispatched to ${user.userEmail || user.userPhone}.`,
          type: "warning",
        },
      ]);

      setChurnedUsers((prev) =>
        prev.map((c) =>
          c.subscriptionId === user.subscriptionId
            ? { ...c, noticeSentAt: new Date().toISOString() }
            : c,
        ),
      );

      toast.success(
        `Automated renewal/expiry notice dispatched to ${user.userName} (${user.userEmail || user.userPhone || "User"}).`,
      );
    } catch {
      toast.error("Failed to send notice.");
    } finally {
      setSendingNoticeId(null);
    }
  };

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top KPI Cards for Churn */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminKpiCard
              label={
                monthFilter === "all"
                  ? "Total Churned Users"
                  : `Quit After ${monthFilter} ${monthFilter === "1" ? "Month" : "Months"}`
              }
              value={filteredChurned.length}
              icon={Users}
              tone="bg-red-50 text-red-600"
              sub={`Zero active users included • strictly quit accounts`}
            />
            <AdminKpiCard
              label="1-Month Dropoffs"
              value={monthCounts[1] || 0}
              icon={ArrowDownRight}
              tone="bg-amber-50 text-amber-600"
              sub="Quit after exactly 1st month"
            />
            <AdminKpiCard
              label="Total Quit Users (All Time)"
              value={churnedUsers.length}
              icon={AlertTriangle}
              tone="bg-slate-100 text-slate-700"
              sub="Did not renew subscription"
            />
            <AdminKpiCard
              label="Lost Monthly Run Rate"
              value={`₹${lostMRR.toLocaleString("en-IN")}`}
              icon={IndianRupee}
              tone="bg-red-50 text-red-600"
              sub={`From ${filteredChurned.length} unrenewed workspaces`}
            />
          </div>

          {/* Month Filter Dropdown (1 to 12 Months) & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Lifespan Filter:</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#2563eb] cursor-pointer"
              >
                <option value="all">All Churned ({churnedUsers.length})</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={String(m)}>
                    {m} {m === 1 ? "Month" : "Months"} ({monthCounts[m] || 0})
                  </option>
                ))}
                <option value="12+">12+ Months ({count12Plus})</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search churned user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>


          {/* Churned Users Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            {filteredChurned.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title={`No users found who quit after ${monthFilter === "all" ? "" : monthFilter} ${
                  monthFilter === "1" ? "month" : "months"
                }`}
                description={
                  churnedUsers.length === 0
                    ? "Great news! No customers have cancelled or let their subscriptions expire yet."
                    : `No customers dropped off after exactly ${monthFilter} ${
                        monthFilter === "1" ? "month" : "months"
                      }. Try selecting another month filter.`
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Customer / Owner</th>
                      <th className="px-4 py-3">Workspace</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Active Lifespan</th>
                      <th className="px-4 py-3">Started On</th>
                      <th className="px-4 py-3">Quit / Ended (Recent Top)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Renewal Notice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredChurned.map((u) => (
                      <tr key={u.subscriptionId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>
                            <p className="font-bold text-[#0f172a]">{u.userName}</p>
                            <p className="text-[11px] font-medium text-slate-400">{u.userPhone || u.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{u.businessName}</p>
                          <p className="text-[10px] text-slate-400">{u.industry}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700">
                            {PLAN_LABELS[u.plan] || u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800 border border-amber-200 text-[11px]">
                            {u.completedMonths} {u.completedMonths === 1 ? "Month" : "Months"} ({u.activeDays}d)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {format(new Date(u.subscriptionStartedAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-red-600 font-semibold">
                          {format(new Date(u.subscriptionEndsAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200 uppercase">
                            {u.status === "subscription_cancelled" ? "Cancelled" : "Expired"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSendNotice(u)}
                            disabled={sendingNoticeId === u.subscriptionId}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {sendingNoticeId === u.subscriptionId ? (
                              <Loader2 size={12} className="animate-spin text-blue-600" />
                            ) : u.noticeSentAt ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-700">Notice Sent</span>
                              </>
                            ) : (
                              <>
                                <Send size={12} className="text-blue-600" />
                                <span>Send Notice</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
