import { useMemo, useState, useEffect } from "react";
import { Users, TrendingUp, Phone, Briefcase, Plus, CalendarDays, Clock } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import {
  KpiCard,
  SectionHeading,
  LeadCard,
  TaskCard,
  EmptyState,
  QuickForm,
} from "@/components/crm-ui";
import { money } from "@/lib/crm-data";
import { format, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CircleUserRound } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Occo Flow" },
      {
        name: "description",
        content: "Your CRM overview — leads, follow-ups, deals and tasks at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AccessGuard>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </AccessGuard>
  );
}

function LiveDateTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const rawHours = time.getHours();
  const hours12 = rawHours % 12 || 12;
  const hoursFormatted = hours12.toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const ampm = rawHours >= 12 ? "PM" : "AM";

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-medium">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>{formattedDate}</span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <div className="inline-flex items-center text-slate-800 dark:text-slate-200 font-semibold tracking-tight">
        <span>{hoursFormatted}:</span>
        <span className="relative inline-flex h-[1.3em] w-[1.45em] overflow-hidden align-middle">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={minutes}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center font-semibold"
            >
              {minutes}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {ampm}
        </span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { leads, deals, tasks, activities, followUps, isLoading } = useCRM();
  const { profile, business } = useAuth();
  const [form, setForm] = useState<"lead" | null>(null);

  const kpis = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "New").length;
    const todayFollowUps = followUps.filter(
      (f) => f.status === "Pending" && isToday(parseISO(f.scheduledAt)),
    ).length;
    const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost").length;
    return { totalLeads, newLeads, todayFollowUps, openDeals };
  }, [leads, deals, followUps]);

  const recentLeads = useMemo(() => leads.slice(0, 4), [leads]);
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate && isToday(parseISO(t.dueDate)) && t.status !== "Completed")
        .slice(0, 4),
    [tasks],
  );
  const recentActivity = useMemo(() => activities.slice(0, 5), [activities]);

  if (isLoading) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center text-center">
        <div className="relative flex size-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-primary/35 animate-spin-slow" />
          <div className="absolute inset-2.5 rounded-full border-[1.5px] border-transparent border-t-indigo-500 border-b-sky-400 animate-spin-reverse" />
          <div className="absolute inset-5 rounded-full border-[1.5px] border-slate-200 border-r-primary/70 animate-spin duration-[2000ms]" />
          <img
            src="/logo.png"
            alt="Occo Flow"
            className="relative size-12 object-contain select-none pointer-events-none drop-shadow-sm"
          />
        </div>
        <p className="mt-4 font-display text-sm font-bold text-foreground">Occo Flow</p>
      </div>
    );
  }

  return (
    <>
      {/* Greeting */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          {business?.name ?? "Workspace"}
        </p>
        <h2 className="font-display text-base sm:text-lg font-bold leading-snug text-foreground">
          Here's what's happening in your business today.
        </h2>
        <LiveDateTime />
      </div>

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard
          label="Total Leads"
          value={kpis.totalLeads}
          icon={Users}
          tone="bg-sky-soft text-primary"
        />
        <KpiCard
          label="New Leads"
          value={kpis.newLeads}
          icon={CircleUserRound}
          tone="bg-violet-soft text-violet"
        />
        <KpiCard
          label="Follow-ups Today"
          value={kpis.todayFollowUps}
          icon={Phone}
          tone="bg-warning-soft text-warning"
        />
        <KpiCard
          label="Open Deals"
          value={kpis.openDeals}
          icon={Briefcase}
          tone="bg-success-soft text-success"
        />
      </div>

      <div className="grid gap-4.5 lg:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Recent Leads */}
          <section>
            <SectionHeading title="Recent Leads" link="/leads" />
            {recentLeads.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {recentLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} compact />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No leads yet"
                description="Add your first lead to start tracking your customer pipeline."
                onAdd={() => setForm("lead")}
                action="Add Lead"
              />
            )}
          </section>

          {/* Today's tasks */}
          {todayTasks.length > 0 && (
            <section>
              <SectionHeading title="Today's Tasks" link="/tasks" />
              <div className="grid gap-2.5">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
            <p className="mb-2.5 text-xs font-bold text-foreground">Quick Actions</p>
            <div className="flex flex-col gap-1.5">
              <Button
                onClick={() => setForm("lead")}
                className="h-8.5 w-full justify-start rounded-lg text-xs font-semibold"
              >
                <Plus size={14} /> Add Lead
              </Button>
              <Link
                to="/leads"
                className="flex h-8.5 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent text-foreground"
              >
                <Users size={14} /> View All Leads
              </Link>
              <Link
                to="/deals"
                className="flex h-8.5 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent text-foreground"
              >
                <TrendingUp size={14} /> View Pipeline
              </Link>
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
            <p className="mb-2.5 text-xs font-bold text-foreground">Recent Activity</p>
            {recentActivity.length ? (
              <div className="space-y-2.5">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-primary">
                      <Clock size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{act.title}</p>
                      {act.detail && (
                        <p className="text-[11px] text-muted-foreground">{act.detail}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {format(parseISO(act.createdAt), "MMM d · h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Activity will appear here as you use the CRM.
              </p>
            )}
          </div>

          {/* Pipeline value */}
          {deals.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="mb-1 text-sm font-bold">Pipeline Value</p>
              <p className="font-display text-2xl font-extrabold text-foreground">
                {money(deals.filter((d) => d.stage !== "Lost").reduce((s, d) => s + d.value, 0))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost").length} active deals
              </p>
            </div>
          )}
        </div>
      </div>

      <QuickForm kind={form} onClose={() => setForm(null)} />
    </>
  );
}
