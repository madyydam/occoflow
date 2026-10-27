import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  ListFilter,
  Building2,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Sparkles,
  TrendingUp,
  CircleDollarSign,
  Layers,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCRM } from "@/lib/crm-context";
import { dealStages, money, type DealStage, type Deal } from "@/lib/crm-data";
import { PageTitle, EmptyState } from "@/components/crm-ui";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { toast } from "sonner";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals Pipeline | Occo Flow" },
      {
        name: "description",
        content: "Visual sales pipeline, stage tracking, and deal conversion metrics.",
      },
      { property: "og:title", content: "Deals Pipeline | Occo Flow" },
      {
        property: "og:description",
        content: "Visual sales pipeline, stage tracking, and deal conversion metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <DealsContent />
      </AppShell>
    </AccessGuard>
  );
}

const STAGE_CONFIG: Record<
  DealStage,
  {
    label: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
    accentBg: string;
  }
> = {
  New: {
    label: "New",
    badgeBg: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200/90",
    dotColor: "bg-sky-500",
    accentBg: "bg-sky-500",
  },
  Qualified: {
    label: "Qualified",
    badgeBg: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200/90",
    dotColor: "bg-indigo-500",
    accentBg: "bg-indigo-500",
  },
  Proposal: {
    label: "Proposal",
    badgeBg: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200/90",
    dotColor: "bg-amber-500",
    accentBg: "bg-amber-500",
  },
  Negotiation: {
    label: "Negotiation",
    badgeBg: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200/90",
    dotColor: "bg-purple-500",
    accentBg: "bg-purple-500",
  },
  Won: {
    label: "Won",
    badgeBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200/90",
    dotColor: "bg-emerald-500",
    accentBg: "bg-emerald-500",
  },
  Lost: {
    label: "Lost",
    badgeBg: "bg-slate-100",
    textColor: "text-slate-700",
    borderColor: "border-slate-200/90",
    dotColor: "bg-slate-400",
    accentBg: "bg-slate-400",
  },
};

function DealsContent() {
  const { deals, addDeal, updateDeal, archiveDeal } = useCRM();
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMobileStage, setSelectedMobileStage] = useState<DealStage>("New");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialStage, setAddModalInitialStage] = useState<DealStage>("New");

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalDeals = deals.length;
    const activeDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
    const wonDeals = deals.filter((d) => d.stage === "Won");
    const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
    return { totalDeals, activeDeals: activeDeals.length, pipelineValue, wonValue, winRate };
  }, [deals]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const q = searchQuery.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }, [deals, searchQuery]);

  const openAddModal = (stage: DealStage = "New") => {
    setAddModalInitialStage(stage);
    setIsAddModalOpen(true);
  };

  const handleAdvanceStage = async (deal: Deal, direction: "next" | "prev") => {
    const currentIndex = dealStages.indexOf(deal.stage);
    if (currentIndex === -1) return;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < dealStages.length) {
      const nextStage = dealStages[nextIndex];
      if (nextStage) await updateDeal(deal.id, { stage: nextStage });
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      await archiveDeal(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Page Title */}
      <PageTitle
        title="Deals"
        description={`${metrics.totalDeals} opportunities · ${money(metrics.pipelineValue)} pipeline value`}
        action={
          <Button
            onClick={() => openAddModal("New")}
            className="h-9 rounded-lg px-3 text-xs font-bold sm:flex lg:hidden"
          >
            <Plus size={14} /> Add deal
          </Button>
        }
      />

      {/* Pipeline Summary Bar (Compact, high-density cards) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="grid size-6.5 place-items-center rounded-lg bg-sky-soft text-primary">
              <TrendingUp size={13} />
            </div>
          </div>
          <p className="mt-1.5 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {money(metrics.pipelineValue)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {metrics.activeDeals} deals in progress
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Won Deals</span>
            <div className="grid size-6.5 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <CircleDollarSign size={13} />
            </div>
          </div>
          <p className="mt-1.5 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {money(metrics.wonValue)}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-semibold">
            {deals.filter((d) => d.stage === "Won").length} closed won
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Win Rate</span>
            <div className="grid size-6.5 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <Sparkles size={13} />
            </div>
          </div>
          <p className="mt-1.5 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {metrics.winRate}%
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Historical conversion</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Opportunities
            </span>
            <div className="grid size-6.5 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Layers size={13} />
            </div>
          </div>
          <p className="mt-1.5 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {metrics.totalDeals}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Across all stages</p>
        </div>
      </div>

      {/* Toolbar: Search, View Switch, Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals or customers..."
            className="h-8.5 rounded-lg border-border bg-background pl-8.5 text-xs shadow-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("board")}
              className={`flex h-7.5 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                viewMode === "board"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-7.5 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListFilter size={13} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button
            onClick={() => openAddModal("New")}
            className="h-8.5 rounded-lg px-3 text-xs font-bold shadow-none"
          >
            <Plus size={14} /> <span className="hidden sm:inline">New Deal</span>
          </Button>
        </div>
      </div>

      {/* Mobile Stage Selector (Pill tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {dealStages.map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const count = filteredDeals.filter((d) => d.stage === stage).length;
          const isSelected = selectedMobileStage === stage;
          return (
            <button
              key={stage}
              onClick={() => setSelectedMobileStage(stage)}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
                isSelected
                  ? `${cfg.badgeBg} ${cfg.textColor} border ${cfg.borderColor}`
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`size-1.5 rounded-full ${cfg.dotColor}`} />
              <span>{stage}</span>
              <span className="ml-0.5 opacity-70 text-[11px] font-bold">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Mobile View: Shows active stage cards */}
      <div className="lg:hidden tab-transition">
        {filteredDeals.filter((d) => d.stage === selectedMobileStage).length ? (
          <div className="space-y-2.5">
            {filteredDeals
              .filter((d) => d.stage === selectedMobileStage)
              .map((deal) => (
                <DealCardView
                  key={deal.id}
                  deal={deal}
                  onAdvance={handleAdvanceStage}
                  onDelete={handleDeleteDeal}
                  onUpdateStage={(stage) => updateDeal(deal.id, { stage })}
                />
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto mb-2 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Sparkles size={18} />
            </div>
            <p className="text-xs font-bold text-foreground">
              No {selectedMobileStage.toLowerCase()} deals
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Add your first deal in this stage to start tracking.
            </p>
            <Button
              onClick={() => openAddModal(selectedMobileStage)}
              variant="outline"
              size="sm"
              className="mt-3 h-8 rounded-lg text-xs font-semibold"
            >
              <Plus size={13} /> Add Deal
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Views */}
      <div className="hidden lg:block tab-transition">
        {viewMode === "board" ? (
          /* Kanban Board View */
          <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1">
            {dealStages.map((stage) => {
              const cfg = STAGE_CONFIG[stage];
              const stageDeals = filteredDeals.filter((d) => d.stage === stage);
              const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

              return (
                <div key={stage} className="flex w-[265px] min-w-[265px] flex-col">
                  {/* Column Header */}
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${cfg.dotColor}`} />
                      <span className="font-display text-xs font-bold text-foreground">
                        {stage}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {money(stageTotal)}
                      </span>
                      <button
                        onClick={() => openAddModal(stage)}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title={`Add deal to ${stage}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Column Container */}
                  <div className="flex min-h-[460px] flex-1 flex-col gap-2 rounded-2xl border border-border/80 bg-slate-50/60 p-2.5">
                    {stageDeals.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/90 bg-white/50 p-5 text-center">
                        <div className="mb-1.5 grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-400">
                          <Sparkles size={14} />
                        </div>
                        <p className="text-xs font-semibold text-slate-500">No deals in {stage}</p>
                        <button
                          onClick={() => openAddModal(stage)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          <Plus size={12} /> Add Deal
                        </button>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <DealCardView
                          key={deal.id}
                          deal={deal}
                          onAdvance={handleAdvanceStage}
                          onDelete={handleDeleteDeal}
                          onUpdateStage={(newStage) => updateDeal(deal.id, { stage: newStage })}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table / List View */
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Deal Title</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Expected Close</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No deals match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => {
                      const cfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.New;
                      return (
                        <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-foreground">{deal.title}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400" />
                              <span>{deal.customer}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-foreground">
                            {money(deal.value)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.badgeBg} ${cfg.textColor} border ${cfg.borderColor}`}
                            >
                              <span className={`size-1.5 rounded-full ${cfg.dotColor}`} />
                              {deal.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays size={13} className="text-slate-400" />
                              <span>{deal.closeDate || "Not set"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <select
                                aria-label="Change stage"
                                value={deal.stage}
                                onChange={(e) =>
                                  updateDeal(deal.id, { stage: e.target.value as DealStage })
                                }
                                className="h-7 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground outline-none cursor-pointer"
                              >
                                {dealStages.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDeleteDeal(deal.id)}
                                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                title="Delete deal"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Deal Dialog */}
      <AddDealModal
        open={isAddModalOpen}
        initialStage={addModalInitialStage}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addDeal}
      />
    </div>
  );
}

// ── Deal Card Component ──────────────────────────────────────────
function DealCardView({
  deal,
  onAdvance,
  onDelete,
  onUpdateStage,
}: {
  deal: Deal;
  onAdvance: (deal: Deal, dir: "next" | "prev") => void;
  onDelete: (id: string) => void;
  onUpdateStage: (stage: DealStage) => void;
}) {
  const currentIndex = dealStages.indexOf(deal.stage);
  const canAdvance = currentIndex < dealStages.length - 1;
  const canRewind = currentIndex > 0;
  const cfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.New;

  return (
    <article className="group relative rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-md transition-all">
      {/* Title & Customer */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-bold text-slate-900 group-hover:text-primary transition-colors sm:text-[13px]">
            {deal.title}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Building2 size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{deal.customer}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(deal.id)}
          className="grid size-6 place-items-center rounded text-slate-300 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Delete Deal"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Value & Stage Badge */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="font-display text-sm font-extrabold text-slate-900">
          {money(deal.value)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${cfg.badgeBg} ${cfg.textColor} border ${cfg.borderColor}`}
        >
          <span className={`size-1 rounded-full ${cfg.dotColor}`} />
          {deal.stage}
        </span>
      </div>

      {/* Footer: Date & Quick Stage Mover */}
      <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 text-[10px]">
          <CalendarDays size={11} className="text-slate-400" />
          {deal.closeDate || "No date"}
        </span>

        {/* Quick Stage Controls */}
        <div className="flex items-center gap-1">
          {canRewind && (
            <button
              onClick={() => onAdvance(deal, "prev")}
              title={`Move back to ${dealStages[currentIndex - 1]}`}
              className="grid size-5.5 place-items-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft size={12} />
            </button>
          )}
          {canAdvance && (
            <button
              onClick={() => onAdvance(deal, "next")}
              title={`Advance to ${dealStages[currentIndex + 1]}`}
              className="flex h-5.5 items-center gap-0.5 rounded bg-primary/10 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Add Deal Modal ───────────────────────────────────────────────
function AddDealModal({
  open,
  initialStage,
  onClose,
  onAdd,
}: {
  open: boolean;
  initialStage: DealStage;
  onClose: () => void;
  onAdd: (deal: Partial<Deal>) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<DealStage>(initialStage);
  const [closeDate, setCloseDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a deal title");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        title,
        customer: customer.trim() || "General Customer",
        value: Number(value) || 0,
        stage,
        closeDate: closeDate || null,
      });
      setTitle("");
      setCustomer("");
      setValue("");
      setCloseDate("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="border-b border-border bg-card px-5 py-4">
          <DialogTitle className="font-display text-base font-bold text-foreground">
            Create New Deal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Deal Title *
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Enterprise Software License"
              className="h-9.5 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Customer / Company *
            </label>
            <Input
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Acme Industries Ltd."
              className="h-9.5 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Deal Value (₹)
              </label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="50000"
                className="h-9.5 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="block h-9.5 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {dealStages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Expected Close Date
            </label>
            <Input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="h-9.5 rounded-lg text-xs"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8.5 rounded-lg px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8.5 rounded-lg px-4 text-xs font-bold"
            >
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
