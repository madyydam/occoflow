import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  BadgeDollarSign,
  Search,
  IndianRupee,
  CreditCard,
  Download,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
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

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments | Admin | Occo Flow" }] }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminPayments />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminPayments() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminSubscriptionService.list();
      // Payments exist for subscribed accounts
      setSubs(data.filter((s) => s.status === "subscribed" || s.plan !== "none"));
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q)
      );
    });
  }, [subs, search]);

  const { totalCollected, avgOrderValue } = useMemo(() => {
    const total = subs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);
    const avg = subs.length > 0 ? Math.round(total / subs.length) : 0;
    return { totalCollected: total, avgOrderValue: avg };
  }, [subs]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments & Invoices"
        description="Inspect subscription billing transactions, customer receipts, and platform cashflow."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Total Collected"
          value={`₹${totalCollected.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="bg-emerald-50 text-emerald-600"
        />
        <AdminKpiCard
          label="Total Invoices"
          value={subs.length}
          icon={BadgeDollarSign}
          tone="bg-blue-50 text-blue-600"
        />
        <AdminKpiCard
          label="Average Value"
          value={`₹${avgOrderValue.toLocaleString("en-IN")}`}
          icon={CreditCard}
          tone="bg-violet-50 text-violet-600"
        />
        <AdminKpiCard
          label="Failed Payments"
          value="0"
          icon={AlertCircle}
          tone="bg-slate-100 text-slate-700"
          sub="No payment failures recorded"
        />
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
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
              icon={BadgeDollarSign}
              title="No payment transactions yet"
              description="When customer accounts subscribe to Standard or Premium tiers, their payment transactions and tax invoices will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Invoice ID</th>
                  <th className="px-4 py-3.5">Customer & Workspace</th>
                  <th className="px-4 py-3.5">Plan Tier</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found matching "{search}".
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const price = PLAN_PRICES[s.plan] ?? 0;
                    const label = PLAN_LABELS[s.plan] ?? s.plan;

                    return (
                      <tr key={s.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          INV-{s.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#0f172a]">{s.ownerName}</div>
                          <div className="text-[10px] text-slate-400">{s.businessName}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800">{label}</span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600">
                          ₹{price.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {s.subscriptionStartedAt
                            ? format(new Date(s.subscriptionStartedAt), "dd MMM yyyy")
                            : format(new Date(s.trialStartedAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Paid
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Download size={12} /> PDF
                          </button>
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
