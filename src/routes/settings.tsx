import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  UserRound,
  Bell,
  SlidersHorizontal,
  Tags,
  Workflow,
  CreditCard,
  ShieldCheck,
  CircleHelp,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/crm-ui";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Occo Flow" },
      { name: "description", content: "Manage your business, profile and CRM preferences." },
      { property: "og:title", content: "Settings | Occo Flow" },
      { property: "og:description", content: "Manage your business, profile and CRM preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </AccessGuard>
  );
}

const items = [
  { name: "Business Profile", description: "Business name and details", icon: Building2 },
  { name: "User Profile", description: "Your personal information", icon: UserRound },
  {
    name: "Subscription & Billing",
    description: "Your active plan, trial & invoices",
    icon: CreditCard,
  },
  { name: "Notifications", description: "Choose what reminders you receive", icon: Bell },
  { name: "CRM Preferences", description: "Pipeline settings & defaults", icon: SlidersHorizontal },
  { name: "Lead Statuses", description: "Manage customer pipeline stages", icon: Tags },
  { name: "Deal Stages", description: "Customize your deal stages", icon: Workflow },
  {
    name: "Security & Privacy",
    description: "Keep your workspace safe & GDPR/DPDP",
    icon: ShieldCheck,
  },
  { name: "Help & Feedback", description: "Report problems or suggest features", icon: CircleHelp },
];

function SettingsContent() {
  const { profile, business, subscription, accessState } = useAuth();
  const [active, setActive] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);

  const planLabel =
    accessState === "subscribed"
      ? subscription?.plan?.includes("lifetime") || subscription?.billingCycle === "lifetime"
        ? "Lifetime Access (₹14,999)"
        : subscription?.billingCycle === "yearly"
          ? "Annual Plan (₹9,999/yr)"
          : "Monthly Plan (₹999/mo)"
      : accessState === "trial_active"
        ? "3-Day Free Trial"
        : "Free / Expired";

  return (
    <>
      <PageTitle title="Settings" description="Make your workspace work for you." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {items.map(({ name, description, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors last:border-0 hover:bg-muted cursor-pointer ${
                active === name ? "bg-accent" : ""
              }`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-soft text-primary">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold text-foreground">
            {active || "Your workspace"}
          </h2>

          {!active ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you need to manage your CRM, all in one place.
              </p>
              <div className="mt-6 space-y-3.5 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Workspace</span>
                  <strong className="text-foreground">{business?.name || "My Business"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <strong className="text-foreground">
                    {profile?.fullName || "Business Owner"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <strong className="text-foreground">{profile?.phone || "Not set"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan Status</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-primary border border-blue-200">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {planLabel}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link to="/subscription">
                    <CreditCard size={15} className="mr-2" /> Manage Subscription
                  </Link>
                </Button>
              </div>
            </>
          ) : active === "Subscription & Billing" ? (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Manage your active subscription plan, upgrades, and billing cycle.
              </p>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Current Plan</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {planLabel}
                  </span>
                </div>
                {subscription?.trialEndsAt && accessState === "trial_active" && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Trial valid until {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button asChild className="w-full">
                <Link to="/subscription">
                  View Plans &amp; Pricing <ExternalLink size={14} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          ) : active === "Notifications" ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Reminders</p>
                <p className="text-xs text-muted-foreground">Show follow-up reminders</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {items.find((x) => x.name === active)?.description}
              </p>
              <div className="mt-5 rounded-lg bg-muted p-4 text-xs text-muted-foreground leading-relaxed">
                {active === "User Profile"
                  ? `${profile?.fullName || "Owner"} · ${profile?.phone || ""}`
                  : active === "Business Profile"
                    ? `${business?.name || "Workspace"} · Industry: ${business?.industry || "General"}`
                    : active === "Lead Statuses"
                      ? "New · Contacted · Qualified · Follow-up · Won · Lost"
                      : active === "Deal Stages"
                        ? "New · Qualified · Proposal · Negotiation · Won · Lost"
                        : active === "Help & Feedback"
                          ? "Report bugs or request new features directly via the Problems & Suggestions tab in your sidebar."
                          : `${active} settings are configured for your workspace.`}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
