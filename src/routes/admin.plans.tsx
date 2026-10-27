import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Check,
  Sparkles,
  Shield,
  Zap,
  Edit2,
  IndianRupee,
  Users,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminShell, AdminPageHeader, AdminBadge } from "@/components/admin-shell";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Plans & Pricing | Admin | Occo Flow" }] }),
  component: AdminPlansPage,
});

function AdminPlansPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminPlans />
      </AdminShell>
    </AdminGuard>
  );
}

interface PlanTier {
  id: string;
  name: string;
  price: number;
  cycle: "monthly" | "yearly" | "lifetime" | "bespoke";
  activeSubscribers: number;
  highlight?: boolean;
  features: string[];
}

const INITIAL_PLANS: PlanTier[] = [
  {
    id: "crm_monthly",
    name: "Monthly Plan",
    price: 999,
    cycle: "monthly",
    activeSubscribers: 0,
    features: [
      "Full CRM Sales Pipeline & Deals",
      "Occo AI Robot Assistant Copilot",
      "Payment Reminders & UPI QR Generator",
      "Team Module & Task Delegation",
      "Bulk Excel Leads Import & Export",
      "Real-time WhatsApp & Email Alerts",
    ],
  },
  {
    id: "crm_yearly",
    name: "Yearly Plan",
    price: 9999,
    cycle: "yearly",
    highlight: true,
    activeSubscribers: 0,
    features: [
      "All Monthly Plan features included",
      "Save ₹1,989 (2 months free, ~₹833/mo)",
      "Priority 24/7 Dedicated Support",
      "Annual Business Audit & Analytics Export",
      "Custom Workflow & Pipeline Stages",
      "Multi-user Team Workload Tracking",
    ],
  },
  {
    id: "crm_lifetime",
    name: "Lifetime Access",
    price: 14999,
    cycle: "lifetime",
    activeSubscribers: 0,
    features: [
      "Pay Once · Own Forever (Zero Renewals)",
      "Lifetime access to all future updates",
      "Unlimited Leads, Deals, Tasks & Contacts",
      "Lifetime Occo Robot Bot Assistant",
      "VIP Dedicated WhatsApp Support Line",
      "Priority Feature Request Voting",
    ],
  },
  {
    id: "custom_build",
    name: "Custom Build (Bespoke)",
    price: 0,
    cycle: "bespoke",
    activeSubscribers: 0,
    features: [
      "Tailor-made CRM built for your company",
      "Custom ERP, Tally, or WhatsApp API syncing",
      "Private cloud or on-premise deployment",
      "Dedicated senior software engineer",
      "Custom database fields & multi-level roles",
    ],
  },
];

function AdminPlans() {
  const [plans, setPlans] = useState<PlanTier[]>(INITIAL_PLANS);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanTier | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, billing_cycle")
        .eq("status", "subscribed");

      const counts = {
        crm_monthly: 0,
        crm_yearly: 0,
        crm_lifetime: 0,
        custom_build: 0,
      };

      (data ?? []).forEach((row: { plan?: string; status?: string; billing_cycle?: string }) => {
        const p = row.plan ?? "";
        const bc = row.billing_cycle ?? "";
        if (p.includes("lifetime") || bc === "lifetime") {
          counts.crm_lifetime = (counts.crm_lifetime || 0) + 1;
        } else if (
          p === "crm_yearly" ||
          p === "standard_yearly" ||
          p === "premium_yearly" ||
          bc === "yearly"
        ) {
          counts.crm_yearly = (counts.crm_yearly || 0) + 1;
        } else if (
          p === "crm_monthly" ||
          p === "standard_monthly" ||
          p === "premium_monthly" ||
          bc === "monthly"
        ) {
          counts.crm_monthly = (counts.crm_monthly || 0) + 1;
        }
      });

      setPlans((prev) =>
        prev.map((p) => ({
          ...p,
          activeSubscribers: (counts as Record<string, number>)[p.id] ?? 0,
        })),
      );
    } catch {
      // defaults to 0
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadPlans();
      }, 300);
    };

    const channel = supabase
      .channel("admin-plans-realtime-sync")
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

  const handleEditPrice = (plan: PlanTier) => {
    setEditingPlan(plan);
    setNewPrice(plan.price);
  };

  const handleSavePrice = () => {
    if (!editingPlan) return;
    setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? { ...p, price: newPrice } : p)));
    toast.success(`Price updated for "${editingPlan.name}" to ₹${newPrice}.`);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Plans & Pricing"
        description="Configure subscription pricing tiers, feature packages, and billing terms for Occo Flow."
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 bg-white shadow-xs transition-all ${
                p.highlight ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-extrabold text-[#0f172a]">{p.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                    {p.cycle}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  {p.cycle === "bespoke" ? (
                    <span className="font-display text-2xl font-extrabold text-[#0f172a]">
                      Custom Quote
                    </span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-extrabold text-[#0f172a]">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {p.cycle === "lifetime"
                          ? "/ lifetime (one-time)"
                          : p.cycle === "yearly"
                            ? "/ year"
                            : "/ month"}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={13} className="text-[#2563eb]" />
                  <span className="font-semibold text-slate-800">
                    {p.activeSubscribers}
                  </span> active {p.activeSubscribers === 1 ? "workspace" : "workspaces"}
                </div>

                <hr className="my-5 border-slate-100" />

                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Included Features:
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                {p.cycle === "bespoke" ? (
                  <a
                    href="/admin/custom-software"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
                  >
                    View Inquiries
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEditPrice(p)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  >
                    <Edit2 size={13} />
                    Adjust Price
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Price Modal */}
      <Dialog
        open={!!editingPlan}
        onOpenChange={(v) => {
          if (!v) setEditingPlan(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
              <IndianRupee size={18} className="text-[#2563eb]" />
              Adjust Tier Price
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Name</label>
                <p className="font-semibold text-slate-800 text-sm">{editingPlan.name}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Price (INR ₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#0f172a] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Save New Price
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
