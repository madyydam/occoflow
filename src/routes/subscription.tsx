import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Check,
  LogOut,
  Zap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Crown,
  Building2,
  ArrowRight,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/crm-data";
import { toast } from "sonner";
import { CustomSoftwareModal } from "@/components/custom-software-modal";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
});

// ── Declare Razorpay on window ─────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  subtext: string;
  badge?: string;
  highlight?: boolean;
  isLifetime?: boolean;
  planId: string;
  cta: string;
  features: string[];
}

const tiers: PricingTier[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    price: "₹999",
    period: "/month",
    subtext: "Billed monthly · Cancel anytime",
    highlight: false,
    planId: "crm_monthly",
    cta: "Choose Monthly Plan",
    features: [
      "Unlimited Leads, Contacts & Deals",
      "Kanban Sales Pipeline & Deals",
      "Occo AI Robot Copilot Assistant",
      "Payment Reminders & UPI QR Generator",
      "Team Module & Task Delegation",
      "Bulk Excel Leads Import & Export",
      "Real-time WhatsApp & Email Alerts",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    price: "₹9,999",
    period: "/year",
    subtext: "Billed annually (Effective ~₹833/mo) · Save ₹1,989",
    badge: "Best Value · Save 17%",
    highlight: true,
    planId: "crm_yearly",
    cta: "Choose Yearly Plan",
    features: [
      "All Monthly Plan features included",
      "Save ₹1,989 (2 months free access)",
      "Priority 24/7 Dedicated Support",
      "Annual Business Audit & Analytics Export",
      "Team Workload Tracking & Collaboration",
      "Multi-device Cloud Synchronization",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime Access",
    price: "₹14,999",
    period: "one-time",
    subtext: "Pay once · Own forever · Zero recurring renewals",
    badge: "Lifetime Deal · Pay Once",
    isLifetime: true,
    planId: "crm_lifetime",
    cta: "Get Lifetime Access",
    features: [
      "One-Time Payment — Zero Recurring Fees",
      "Lifetime Access to All Future CRM Upgrades",
      "Unlimited Team Members & Task Assignments",
      "Unlimited Leads, Deals, Tasks & Contacts",
      "Lifetime Occo Robot Bot Assistant",
      "VIP Dedicated WhatsApp Support Line",
    ],
  },
];

// ── Load Razorpay script once ──────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscriptionPage() {
  const { subscription, signOut, accessState, business, profile, user, refreshSubscription } =
    useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [customBuildModalOpen, setCustomBuildModalOpen] = useState(false);

  const isExpired =
    accessState === "trial_expired" ||
    accessState === "sub_expired" ||
    subscription?.status === "trial_expired" ||
    subscription?.status === "subscription_expired" ||
    subscription?.status === "subscription_cancelled";

  // Pre-load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth/login" });
  };

  const handleChoosePlan = async (planId: string) => {
    if (loadingPlan) return;
    setLoadingPlan(planId);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment gateway could not load. Please check your internet connection.");
        setLoadingPlan(null);
        return;
      }

      // 2. Create order on our server
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          businessId: business?.id ?? "",
          userEmail: user?.email ?? "",
          userName: profile?.fullName ?? "",
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success || !orderData.order) {
        toast.error(orderData.error ?? "Failed to create payment order. Please try again.");
        setLoadingPlan(null);
        return;
      }

      const { order, keyId } = orderData;

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: BRAND,
        description: planId.replace(/_/g, " – ").toUpperCase(),
        order_id: order.id,
        prefill: {
          name: profile?.fullName ?? "",
          email: user?.email ?? "",
          contact: profile?.phone ?? "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.");
            setLoadingPlan(null);
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify payment on our server and activate subscription
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                businessId: business?.id ?? "",
                planId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success(
                `🎉 Subscription activated! Welcome to ${verifyData.planLabel ?? planId}.`,
              );
              await refreshSubscription();
              navigate({ to: "/dashboard" });
            } else {
              toast.error(verifyData.error ?? "Payment verification failed. Contact support.");
            }
          } catch {
            toast.error("Network error during payment verification. Contact support.");
          } finally {
            setLoadingPlan(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("[Subscription] Payment error:", err);
      toast.error("Something went wrong with the payment gateway. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f6ff] via-slate-50 to-white px-4 py-10 font-sans sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt={BRAND}
              className="size-9 rounded-xl object-contain shadow-xs"
            />
            <div>
              <span className="font-display text-[17px] font-extrabold text-[#0f172a] block leading-none">
                {BRAND}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Pricing & Plans</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>

        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto">
          {isExpired ? (
            <>
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock size={24} />
              </div>
              <h1 className="font-display text-2xl font-bold text-[#0f172a] sm:text-3xl">
                Your free trial has completed
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Choose a plan below to unlock your workspace, team delegation, automated reminders,
                and sales pipeline.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-[#0f172a] sm:text-3xl">
                Choose Your Occo Flow Plan
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Simple, transparent pricing. No hidden fees or surprise renewal jumps.
              </p>
            </>
          )}
        </div>

        {/* 3 Main Pricing Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const isLoading = loadingPlan === tier.planId;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-2xl p-7 transition-all ${
                  tier.isLifetime
                    ? "border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-sm hover:border-amber-400 hover:shadow-md"
                    : tier.highlight
                      ? "border-2 border-[#2563eb] bg-[#f0f6ff]/70 shadow-md ring-1 ring-blue-200"
                      : "border-2 border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <span
                    className={`absolute right-4 top-4 rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wide ${
                      tier.isLifetime
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-[#2563eb] text-white shadow-xs"
                    }`}
                  >
                    {tier.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-1.5">
                    {tier.isLifetime ? (
                      <Crown size={15} className="text-amber-500" />
                    ) : tier.highlight ? (
                      <Zap size={15} className="text-[#2563eb]" />
                    ) : null}
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${
                        tier.isLifetime
                          ? "text-amber-700"
                          : tier.highlight
                            ? "text-[#2563eb]"
                            : "text-slate-500"
                      }`}
                    >
                      {tier.name}
                    </p>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-[#0f172a]">
                      {tier.price}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      {tier.period === "one-time" ? "one-time" : tier.period}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-medium text-slate-600 sm:text-xs">
                    {tier.subtext}
                  </p>

                  <button
                    id={`btn-plan-${tier.planId}`}
                    onClick={() => handleChoosePlan(tier.planId)}
                    disabled={!!loadingPlan}
                    className={`mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer ${
                      tier.isLifetime
                        ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        : tier.highlight
                          ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm"
                          : "border-2 border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Opening Checkout…
                      </>
                    ) : (
                      tier.cta
                    )}
                  </button>

                  <hr className="my-6 border-slate-100" />

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Everything Included:
                  </p>
                  <ul className="space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <Check
                          size={14}
                          className={`shrink-0 mt-0.5 ${
                            tier.isLifetime
                              ? "text-amber-600"
                              : tier.highlight
                                ? "text-blue-600"
                                : "text-green-500"
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Custom Build / Bespoke Enterprise Option ──────────────── */}
        <div className="mt-8 overflow-hidden rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-yellow-300 backdrop-blur-xs mb-3">
                <Sparkles size={12} className="text-yellow-400" />
                <span>Custom Build &amp; Enterprise Option</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Need a Custom-Built CRM or Bespoke Software Solution?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Have unique workflows, custom fields, ERP/Tally syncing, private cloud hosting, or
                specialized business requirements? Our engineering team builds tailor-made CRM
                modules, WhatsApp bots, and enterprise platforms tailored for your company.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> Tailored CRM &amp; ERP
                  Architecture
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> Custom API &amp; Tally / Payment
                  Integrations
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> Dedicated Solutions Engineer
                  &amp; SLA
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setCustomBuildModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md cursor-pointer"
              >
                <Building2 size={16} className="text-[#2563eb]" />
                Request Custom Build
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={15} className="text-emerald-500" />
          <span>
            Secure transactions powered by{" "}
            <span className="font-semibold text-slate-600">Razorpay</span>. 256-bit SSL encrypted.
          </span>
        </div>
      </div>

      {/* Custom Build Modal */}
      <CustomSoftwareModal open={customBuildModalOpen} onOpenChange={setCustomBuildModalOpen} />
    </div>
  );
}
