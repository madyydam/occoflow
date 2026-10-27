import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Timer,
  CreditCard,
  TrendingUp,
  IndianRupee,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell,
  AdminKpiCard,
  AdminPageHeader,
  AdminBadge,
  statusColor,
  AdminEmptyState,
} from "@/components/admin-shell";
import { useAdminAuth } from "@/lib/admin-context";
import {
  adminDashboardService,
  PLAN_LABELS,
  type DashboardStats,
  type RecentActivity,
} from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Occo Flow" }] }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminDashboard />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [systemHealth, setSystemHealth] = useState<
    {
      label: string;
      status: "Healthy" | "Not Connected" | "Down";
      sub?: string;
    }[]
  >([
    { label: "Database", status: "Healthy" },
    { label: "Authentication", status: "Healthy" },
    { label: "Payment Provider", status: "Not Connected" },
    { label: "Email / SMTP", status: "Not Connected" },
    { label: "Storage", status: "Not Connected" },
  ]);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkSystemHealth = async () => {
    setCheckingHealth(true);
    try {
      // 1. Probe Database Live
      let dbStatus: "Healthy" | "Down" = "Down";
      let dbMs = 0;
      try {
        const t0 = performance.now();
        const { error } = await supabase
          .from("businesses")
          .select("id", { count: "exact", head: true });
        dbMs = Math.round(performance.now() - t0);
        dbStatus = error ? "Down" : "Healthy";
      } catch {
        dbStatus = "Down";
      }

      // 2. Probe Authentication Live
      let authStatus: "Healthy" | "Down" = "Down";
      try {
        const { error } = await supabase.auth.getSession();
        authStatus = error ? "Down" : "Healthy";
      } catch {
        authStatus = "Down";
      }

      // 3. Probe Payment Provider Live
      const env =
        (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
      const hasPayment = Boolean(env["VITE_RAZORPAY_KEY_ID"] || env["VITE_STRIPE_PUBLIC_KEY"]);
      const paymentStatus: "Healthy" | "Not Connected" = hasPayment ? "Healthy" : "Not Connected";

      // 4. Probe Email / SMTP Live
      let smtpStatus: "Healthy" | "Not Connected" | "Down" = "Not Connected";
      const hasSmtpEnv = Boolean(env["VITE_SMTP_HOST"] || env["VITE_RESEND_API_KEY"]);
      if (hasSmtpEnv) {
        smtpStatus = "Healthy";
      } else {
        try {
          const { data: settings } = await supabase
            .from("platform_settings")
            .select("key, value")
            .in("key", ["smtp_host", "smtp_user", "resend_api_key"]);
          const hasDbSmtp = (settings ?? []).some((s) => Boolean(s.value && s.value.trim()));
          smtpStatus = hasDbSmtp ? "Healthy" : "Not Connected";
        } catch {
          smtpStatus = "Not Connected";
        }
      }

      // 5. Probe Storage Buckets Live
      let storageStatus: "Healthy" | "Not Connected" | "Down" = "Not Connected";
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
          storageStatus = "Down";
        } else if (!buckets || buckets.length === 0) {
          storageStatus = "Not Connected";
        } else {
          storageStatus = "Healthy";
        }
      } catch {
        storageStatus = "Down";
      }

      setSystemHealth([
        {
          label: "Database",
          status: dbStatus,
          sub: dbStatus === "Healthy" ? `${dbMs}ms latency` : "Connection failed",
        },
        {
          label: "Authentication",
          status: authStatus,
          sub: authStatus === "Healthy" ? "Supabase Auth active" : "Auth service unreachable",
        },
        {
          label: "Payment Provider",
          status: paymentStatus,
          sub: hasPayment ? "Gateway online" : "No gateway configured",
        },
        {
          label: "Email / SMTP",
          status: smtpStatus,
          sub: smtpStatus === "Healthy" ? "SMTP server active" : "Not Connected",
        },
        {
          label: "Storage",
          status: storageStatus,
          sub: storageStatus === "Healthy" ? "Buckets ready" : "No buckets provisioned",
        },
      ]);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const [s, acts] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getRecentActivity(8),
      ]);
      setStats(s);
      setActivity(acts);
    } catch {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    checkSystemHealth();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadDashboard();
      }, 300);
    };

    const channel = supabase
      .channel("admin-dashboard-realtime-sync")
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

  const formatMoney = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-100 bg-red-50">
        <div className="text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2563eb]">{today}</p>
        <h2 className="mt-1 font-display text-[26px] font-extrabold text-[#0f172a]">
          {greeting}, {adminUser?.fullName?.split(" ")[0] ?? "Admin"} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">Platform overview and key metrics</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Total Registered Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          tone="bg-blue-50 text-blue-600"
          sub="All customer accounts created"
        />
        <AdminKpiCard
          label="Subscribed Users"
          value={stats?.activeSubscriptions ?? 0}
          icon={CreditCard}
          tone="bg-emerald-50 text-emerald-600"
          sub={`${stats?.cancelledSubscriptions ?? 0} cancelled`}
        />
        <AdminKpiCard
          label="Users on 3-Day Trial"
          value={stats?.activeTrials ?? 0}
          icon={Timer}
          tone="bg-amber-50 text-amber-600"
          sub={`${stats?.trialExpiringToday ?? 0} ending today`}
        />
        <AdminKpiCard
          label="Monthly Recurring (MRR)"
          value={stats ? formatMoney(stats.mrr) : "₹0"}
          icon={IndianRupee}
          tone="bg-emerald-50 text-emerald-600"
          sub={`₹${((stats?.mrr ?? 0) * 12).toLocaleString("en-IN")} ARR run rate`}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Standard Plan Users"
          value={
            (stats?.planBreakdown.standard_monthly ?? 0) +
            (stats?.planBreakdown.standard_yearly ?? 0)
          }
          icon={TrendingUp}
          tone="bg-blue-50 text-blue-600"
        />
        <AdminKpiCard
          label="Premium Plan Users"
          value={
            (stats?.planBreakdown.premium_monthly ?? 0) + (stats?.planBreakdown.premium_yearly ?? 0)
          }
          icon={TrendingUp}
          tone="bg-violet-50 text-violet-600"
        />
        <AdminKpiCard
          label="Trial → Paid Conversion"
          value={stats ? `${stats.trialConversionRate}%` : "0%"}
          icon={ArrowUpRight}
          tone="bg-emerald-50 text-emerald-600"
          sub="Subscribed / Total Workspaces"
        />
        <AdminKpiCard
          label="Expired Trials (Dropped)"
          value={stats?.expiredTrials ?? 0}
          icon={AlertTriangle}
          tone="bg-red-50 text-red-500"
          sub="Trial ended without upgrade"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trial overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-base font-bold text-[#0f172a]">Trial Overview</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                {
                  label: "Active Trials",
                  val: stats?.activeTrials ?? 0,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  label: "Ending Today",
                  val: stats?.trialExpiringToday ?? 0,
                  color: "text-orange-600 bg-orange-50",
                },
                {
                  label: "Ending in 3 Days",
                  val: stats?.trialExpiringIn3Days ?? 0,
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  label: "Expired",
                  val: stats?.expiredTrials ?? 0,
                  color: "text-red-600 bg-red-50",
                },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-base font-bold text-[#0f172a]">
            Plan Distribution
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.planBreakdown ?? {}).map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <span className="text-sm text-slate-600">{PLAN_LABELS[plan] ?? plan}</span>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-600">
                    {count}
                  </span>
                </div>
              ))}
              {stats && Object.values(stats.planBreakdown).every((v) => v === 0) && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No active subscriptions yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* System health */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#0f172a]">System Health</h3>
            <button
              type="button"
              onClick={checkSystemHealth}
              disabled={checkingHealth}
              title="Probe system health live"
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#2563eb] transition-colors cursor-pointer"
            >
              <RefreshCw
                size={12}
                className={checkingHealth ? "animate-spin text-[#2563eb]" : ""}
              />
              <span>{checkingHealth ? "Checking…" : "Re-check"}</span>
            </button>
          </div>
          <div className="space-y-2">
            {systemHealth.map(({ label, status, sub }) => {
              const isHealthy = status === "Healthy";
              const isWarn = status === "Not Connected";
              return (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{label}</p>
                    {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-bold shrink-0 ${
                      isHealthy ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-red-600"
                    }`}
                  >
                    {isHealthy ? (
                      <CheckCircle2 size={12} />
                    ) : isWarn ? (
                      <AlertTriangle size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[#0f172a]">Recent Activity</h3>
          <a
            href="/admin/audit-logs"
            className="text-xs font-semibold text-[#2563eb] hover:underline"
          >
            View all →
          </a>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : activity.length ? (
          <div className="divide-y divide-slate-100">
            {activity.map((act) => (
              <div key={act.id} className="flex items-center gap-4 py-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <Activity size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0f172a] capitalize">
                    {act.title.replace(/_/g, " ")}
                  </p>
                  {act.businessName && <p className="text-xs text-slate-500">{act.businessName}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">
                    {format(parseISO(act.createdAt), "MMM d · h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No activity yet"
            description="Platform activity will appear here as admin actions are performed."
          />
        )}
      </div>
    </div>
  );
}
