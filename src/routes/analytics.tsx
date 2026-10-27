import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  UsersRound,
  UserRoundPlus,
  CircleCheck,
  Handshake,
  Trophy,
  CircleDollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import { money, dealStages } from "@/lib/crm-data";
import { PageTitle, KpiCard, SectionHeading } from "@/components/crm-ui";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { GenerateAnalyticsReportModal } from "@/components/analytics-report-modal";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Occo Flow" },
      {
        name: "description",
        content: "Simple insights into your leads, conversions and sales pipeline.",
      },
      { property: "og:title", content: "Analytics | Occo Flow" },
      {
        property: "og:description",
        content: "Simple insights into your leads, conversions and sales pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <AnalyticsContent />
      </AppShell>
    </AccessGuard>
  );
}

function AnalyticsContent() {
  const { leads, deals } = useCRM();
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((x) => x.status === "New").length;
    const convertedLeads = leads.filter((x) => x.status === "Won").length;
    const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const wonDeals = deals.filter((x) => x.stage === "Won");
    const wonRevenue = wonDeals.reduce((s, x) => s + (x.value || 0), 0);
    const openDeals = deals.filter((x) => x.stage !== "Won" && x.stage !== "Lost");
    const potentialRevenue = openDeals.reduce((s, x) => s + (x.value || 0), 0);

    const stageCounts: Record<string, number> = {};
    for (const d of deals) {
      stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
    }
    const maxStage = Math.max(1, ...dealStages.map((s) => stageCounts[s] || 0));

    return {
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate,
      wonDealsCount: wonDeals.length,
      wonRevenue,
      openDealsCount: openDeals.length,
      potentialRevenue,
      stageCounts,
      maxStage,
    };
  }, [leads, deals]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <PageTitle title="Analytics" description="A clear view of how your business is doing." />
        <Button
          onClick={() => setReportModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <FileText size={15} /> Generate Report
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total leads"
          value={metrics.totalLeads}
          icon={UsersRound}
          tone="bg-sky-soft text-primary"
        />
        <KpiCard
          label="New leads"
          value={metrics.newLeads}
          icon={UserRoundPlus}
          tone="bg-violet-soft text-violet"
        />
        <KpiCard
          label="Converted"
          value={metrics.convertedLeads}
          icon={CircleCheck}
          tone="bg-success-soft text-success"
        />
        <KpiCard
          label="Open deals"
          value={metrics.openDealsCount}
          icon={Handshake}
          tone="bg-warning-soft text-warning"
        />
        <KpiCard
          label="Won deals"
          value={metrics.wonDealsCount}
          icon={Trophy}
          tone="bg-success-soft text-success"
        />
        <KpiCard
          label="Won revenue"
          value={money(metrics.wonRevenue)}
          icon={CircleDollarSign}
          tone="bg-sky-soft text-primary"
        />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Leads over time" />
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex h-48 items-end justify-between gap-3 border-b border-border pb-1">
              {[2, 4, 3, 5, 4, 6, 7].map((n, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                  <div
                    className="mx-auto w-full max-w-12 rounded-t-md bg-primary/75"
                    style={{ height: `${(n / 7) * 85}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp size={14} className="text-success" /> Lead enquiries this week
            </p>
          </div>
        </section>
        <section>
          <SectionHeading title="Conversion overview" />
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">Lead conversion rate</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-foreground">
              {metrics.conversionRate}%
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-success"
                style={{
                  width: `${metrics.conversionRate}%`,
                }}
              />
            </div>
            <div className="mt-6 flex justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">Potential revenue</span>
              <strong className="text-foreground">{money(metrics.potentialRevenue)}</strong>
            </div>
          </div>
        </section>
        <section className="lg:col-span-2">
          <SectionHeading title="Deal pipeline" />
          <div className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            {dealStages.map((stage) => {
              const count = metrics.stageCounts[stage] || 0;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground">{stage}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(count / metrics.maxStage) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <GenerateAnalyticsReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </>
  );
}
