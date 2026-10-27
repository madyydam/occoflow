import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Search,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell,
  AdminPageHeader,
  AdminBadge,
  AdminKpiCard,
  AdminEmptyState,
  statusColor,
} from "@/components/admin-shell";
import {
  adminSubscriptionService,
  PLAN_PRICES,
  PLAN_LABELS,
  type AdminSubscription,
} from "@/lib/admin-service";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions | Admin | Occo Flow" }] }),
  component: AdminSubscriptionsPage,
});

function AdminSubscriptionsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminSubscriptions />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminSubscriptions() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "subscribed" | "cancelled">("all");

  const loadSubs = async () => {
    setLoading(true);
    try {
      const data = await adminSubscriptionService.list();
      // Show actual paid or cancelled memberships (not empty trials)
      setSubs(
        data.filter(
          (s) =>
            s.status === "subscribed" ||
            s.status === "subscription_cancelled" ||
            s.status === "subscription_expired",
        ),
      );
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubs();
  }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (filter === "subscribed" && s.status !== "subscribed") return false;
      if (filter === "cancelled" && s.status !== "subscription_cancelled") return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q)
      );
    });
  }, [subs, filter, search]);

  const { activePaid, mrr, arr, churnedCount } = useMemo(() => {
    const paid = subs.filter((s) => s.status === "subscribed");
    const computedMrr = paid.reduce((acc, curr) => {
      if (
        curr.plan === "crm_monthly" ||
        curr.plan === "standard_monthly" ||
        curr.plan === "premium_monthly"
      )
        return acc + 999;
      if (
        curr.plan === "crm_yearly" ||
        curr.plan === "standard_yearly" ||
        curr.plan === "premium_yearly"
      )
        return acc + Math.round(9999 / 12);
      if (curr.plan.includes("lifetime") || curr.billingCycle === "lifetime")
        return acc + Math.round(14999 / 12);
      return acc;
    }, 0);
    const computedArr = computedMrr * 12;
    const churned = subs.filter(
      (s) => s.status === "subscription_cancelled" || s.status === "subscription_expired",
    ).length;

    return {
      activePaid: paid,
      mrr: computedMrr,
      arr: computedArr,
      churnedCount: churned,
    };
  }, [subs]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Subscriptions"
        description="Monitor active customer memberships, recurring billing cycles, and MRR performance."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Monthly Recurring (MRR)"
          value={`₹${mrr.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="bg-emerald-50 text-emerald-600"
        />
        <AdminKpiCard
          label="Annual Run Rate (ARR)"
          value={`₹${arr.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          tone="bg-blue-50 text-blue-600"
        />
        <AdminKpiCard
          label="Active Paid Subscriptions"
          value={activePaid.length}
          icon={CreditCard}
          tone="bg-violet-50 text-violet-600"
        />
        <AdminKpiCard
          label="Churned Subscriptions"
          value={churnedCount}
          icon={AlertCircle}
          tone="bg-red-50 text-red-500"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, owner, or plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {[
            { id: "all", label: "All Records" },
            { id: "subscribed", label: "Active Subscribed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                filter === item.id
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : subs.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              icon={CreditCard}
              title="No paid subscriptions yet"
              description="When workspaces upgrade from their 3-day trial to Standard or Premium billing tiers, their membership records and recurring invoices will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Workspace</th>
                  <th className="px-4 py-3.5">Owner</th>
                  <th className="px-4 py-3.5">Plan & Tier</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Renewal Date</th>
                  <th className="px-4 py-3.5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No subscriptions found matching your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const price = PLAN_PRICES[s.plan] ?? 0;
                    const label = PLAN_LABELS[s.plan] ?? s.plan;

                    return (
                      <tr key={s.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#0f172a]">{s.businessName}</div>
                          <div className="text-[10px] text-slate-400">ID: {s.businessId}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{s.ownerName}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#0f172a]">{label}</span>
                          <span className="block text-[10px] text-slate-400 capitalize">
                            {s.billingCycle || "Standard"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0f172a]">
                          ₹{price.toLocaleString("en-IN")}
                          <span className="text-[10px] font-normal text-slate-400">
                            {s.plan.includes("yearly") ? "/yr" : "/mo"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <AdminBadge
                            label={s.status.replace("_", " ")}
                            color={statusColor(s.status)}
                          />
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {s.subscriptionEndsAt
                            ? format(new Date(s.subscriptionEndsAt), "dd MMM yyyy")
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                            <ArrowUpRight size={12} /> View Receipt
                          </span>
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
  );
}
