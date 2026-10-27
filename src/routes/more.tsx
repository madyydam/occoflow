import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ContactRound,
  CalendarDays,
  ChartNoAxesCombined,
  Settings2,
  CreditCard,
  ChevronRight,
  MessageSquarePlus,
  IndianRupee,
  Users,
} from "lucide-react";
import { PageTitle } from "@/components/crm-ui";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More | Occo Flow" },
      {
        name: "description",
        content: "Explore contacts, calendar, analytics and workspace settings.",
      },
      { property: "og:title", content: "More | Occo Flow" },
      {
        property: "og:description",
        content: "Explore contacts, calendar, analytics and workspace settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  return (
    <AccessGuard>
      <AppShell>
        <MoreContent />
      </AppShell>
    </AccessGuard>
  );
}

const links = [
  { label: "Team & Workload", icon: Users, to: "/team" as const },
  { label: "Payment Reminders", icon: IndianRupee, to: "/payments" as const },
  { label: "Problems & Suggestions", icon: MessageSquarePlus, to: "/feedback" as const },
  { label: "Contacts", icon: ContactRound, to: "/contacts" as const },
  { label: "Calendar", icon: CalendarDays, to: "/calendar" as const },
  { label: "Analytics", icon: ChartNoAxesCombined, to: "/analytics" as const },
  { label: "Settings", icon: Settings2, to: "/settings" as const },
  { label: "Subscription", icon: CreditCard, to: "/subscription" as const },
];

function MoreContent() {
  const { profile, business, accessState } = useAuth();
  const initials =
    (profile?.fullName || "User")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      <PageTitle title="More" description="The rest of your workspace." />
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid size-12 place-items-center rounded-full bg-violet-soft font-bold text-violet text-sm">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {profile?.fullName || "Business Owner"}
          </p>
          <p className="text-xs text-muted-foreground">
            {business?.name || "Workspace"} ·{" "}
            {accessState === "subscribed" ? "Subscribed" : "Free Trial"}
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {links.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="flex h-16 items-center gap-4 border-b border-border px-4 last:border-0 hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-sky-soft text-primary">
              <Icon size={18} />
            </span>
            <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
            <ChevronRight size={17} className="text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}
