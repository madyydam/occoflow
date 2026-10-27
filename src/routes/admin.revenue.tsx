import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  IndianRupee,
  TrendingUp,
  CreditCard,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell,
  AdminPageHeader,
  AdminKpiCard,
  AdminEmptyState,
} from "@/components/admin-shell";
import {
  adminSubscriptionService,
  PLAN_PRICES,
  PLAN_MRR,
  PLAN_LABELS,
  type AdminSubscription,
} from "@/lib/admin-service";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Revenue | Admin | Occo Flow" }] }),
  component: AdminRevenuePage,
});

function AdminRevenuePage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminRevenue />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminRevenue() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await adminSubscriptionService.list();
        setSubs(data.filter((s) => s.status === "subscribed"));
      } catch {
        setSubs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { mrr, arr, arpu, planBreakdown } = useMemo(() => {
    const computedMrr = subs.reduce((sum, s) => sum + (PLAN_MRR[s.plan] ?? 0), 0);
    const computedArr = computedMrr * 12;
    const computedArpu = subs.length > 0 ? Math.round(computedMrr / subs.length) : 0;

    const breakdown = [
      {
        id: "crm_monthly",
        name: "Monthly Plan",
        price: 999,
        mrrShare: 999,
        count: subs.filter(
          (s) =>
            s.plan === "crm_monthly" ||
            s.plan === "standard_monthly" ||
            s.plan === "premium_monthly",
        ).length,
      },
      {
        id: "crm_yearly",
        name: "Yearly Plan",
        price: 9999,
        mrrShare: Math.round(9999 / 12),
        count: subs.filter(
          (s) =>
            s.plan === "crm_yearly" || s.plan === "standard_yearly" || s.plan === "premium_yearly",
        ).length,
      },
      {
        id: "crm_lifetime",
        name: "Lifetime Access",
        price: 14999,
        mrrShare: Math.round(14999 / 12),
        count: subs.filter((s) => s.plan.includes("lifetime") || s.billingCycle === "lifetime")
          .length,
      },
    ];

    return {
      mrr: computedMrr,
      arr: computedArr,
      arpu: computedArpu,
      planBreakdown: breakdown,
    };
  }, [subs]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Revenue & Cashflow"
        description="Comprehensive analysis of recurring SaaS subscription cashflow, plan breakdown, and annual run rate."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Monthly Recurring (MRR)"
          value={`₹${mrr.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="bg-emerald-50 text-emerald-600"
          sub="Live recurring billing"
        />
        <AdminKpiCard
          label="Annual Run Rate (ARR)"
          value={`₹${arr.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          tone="bg-blue-50 text-blue-600"
          sub="Projected annual total"
        />
        <AdminKpiCard
          label="Average Revenue Per User"
          value={`₹${arpu.toLocaleString("en-IN")}`}
          icon={CreditCard}
          tone="bg-violet-50 text-violet-600"
          sub="Across active subscriptions"
        />
        <AdminKpiCard
          label="Paying Customers"
          value={subs.length}
          icon={BarChart3}
          tone="bg-amber-50 text-amber-600"
          sub="Active subscribed tenants"
        />
      </div>

      {/* Breakdown by Tier */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="font-display text-base font-bold text-[#0f172a] mb-4">
          Revenue Breakdown by Plan Tier
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {planBreakdown.map((p) => {
              const tierRevenue = p.count * p.price;
              const tierMrr = p.count * p.mrrShare;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
                >
                  <p className="text-xs font-bold text-[#0f172a]">{p.name}</p>
                  <p className="text-[11px] text-slate-400">₹{p.price} per cycle</p>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-[#0f172a]">{p.count}</p>
                      <p className="text-[10px] text-slate-400">Subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        ₹{tierMrr.toLocaleString("en-IN")}/mo
                      </p>
                      <p className="text-[10px] text-slate-400">MRR contribution</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
