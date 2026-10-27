import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SlidersHorizontal,
  Plus,
  Download,
  Upload,
  LayoutGrid,
  List,
  Trash2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import { leadStatuses, money, type LeadStatus, type Lead } from "@/lib/crm-data";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import {
  PageTitle,
  SearchBar,
  LeadCard,
  EmptyState,
  QuickForm,
  StatusBadge,
  Avatar,
} from "@/components/crm-ui";
import { LeadsImportModal, exportLeadsToExcel } from "@/components/leads-import-export-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads | Occo Flow" },
      {
        name: "description",
        content: "Manage leads, follow-ups and customer enquiries in one place.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <LeadsContent />
      </AppShell>
    </AccessGuard>
  );
}

function LeadsContent() {
  const { leads, isLoading, deleteLead } = useCRM();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | LeadStatus>("All");
  const [sort, setSort] = useState(false);
  const [form, setForm] = useState<"lead" | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // View Format: Grid vs List (persisted in localStorage)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("occo_leads_view_mode") ||
        localStorage.getItem("futora_leads_view_mode");
      if (saved === "grid" || saved === "list") return saved;
    }
    return "grid";
  });

  const handleSetViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("occo_leads_view_mode", mode);
    }
  };

  // Lead deletion state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeadToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = leads.filter(
      (x) =>
        (status === "All" || x.status === status) &&
        (!q || `${x.name} ${x.phone} ${x.company} ${x.email}`.toLowerCase().includes(q)),
    );
    return sort ? [...list].sort((a, b) => (b.value || 0) - (a.value || 0)) : list;
  }, [leads, query, status, sort]);

  return (
    <>
      <PageTitle
        title="Leads"
        description={`${leads.length} ${leads.length === 1 ? "lead" : "leads"} in your pipeline`}
      />

      {/* Action bar with Search, Import, Export, Grid/List Toggle & Add Lead */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 min-w-[200px]">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search name, phone, email or company..."
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="h-10 rounded-lg border-border bg-card text-xs font-semibold shadow-none hover:bg-sky-50 hover:text-sky-700"
            title="Bulk import leads from Excel or CSV"
          >
            <Upload size={14} className="mr-1.5 text-sky-600" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToExcel(filtered.length > 0 ? filtered : leads)}
            disabled={leads.length === 0}
            className="h-10 rounded-lg border-border bg-card text-xs font-semibold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
            title="Export leads to Excel report (.xlsx)"
          >
            <Download size={14} className="mr-1.5 text-emerald-600" /> Export
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Sort by value"
            onClick={() => setSort(!sort)}
            className={`size-10 shrink-0 rounded-lg border-border shadow-none ${sort ? "bg-accent text-primary" : ""}`}
            title="Sort by highest value"
          >
            <SlidersHorizontal size={16} />
          </Button>

          {/* Grid vs List View Format Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-none">
            <button
              type="button"
              onClick={() => handleSetViewMode("grid")}
              className={`flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Grid format"
              aria-label="Grid format"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("list")}
              className={`flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="List format"
              aria-label="List format"
            >
              <List size={15} />
            </button>
          </div>

          <Button
            onClick={() => setForm("lead")}
            className="h-10 shrink-0 rounded-lg px-3.5 text-xs font-bold gap-1.5 shadow-none"
          >
            <Plus size={16} /> Add lead
          </Button>
        </div>
      </div>

      {/* Status filters */}
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8">
        {(["All", ...leadStatuses] as const).map((item) => (
          <Button
            key={item}
            variant={status === item ? "default" : "outline"}
            onClick={() => setStatus(item as typeof status)}
            className={`h-9 shrink-0 rounded-lg px-4 text-xs shadow-none ${
              status !== item ? "border-border bg-card text-muted-foreground" : ""
            }`}
          >
            {item}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading leads…</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            {filtered.length > 0 ? (
              <p className="text-xs font-medium text-muted-foreground">
                Showing {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
              </p>
            ) : (
              <span />
            )}

            {filtered.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Format:</span>
                <span className="font-semibold text-foreground capitalize">{viewMode} view</span>
              </div>
            )}
          </div>

          {filtered.length ? (
            viewMode === "grid" ? (
              /* Grid Format View */
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onDelete={(l) => setLeadToDelete(l)} />
                ))}
              </div>
            ) : (
              /* List Format View */
              <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Lead</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Follow-up</th>
                        <th className="py-3 px-4">Potential Value</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((lead) => (
                        <tr key={lead.id} className="group hover:bg-muted/30 transition-colors">
                          {/* Lead Name & Company */}
                          <td className="py-3 px-4">
                            <Link
                              to="/leads/$leadId"
                              params={{ leadId: lead.id }}
                              className="flex items-center gap-2.5 min-w-[160px]"
                            >
                              <Avatar name={lead.name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {lead.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {lead.company || "No company"}
                                </p>
                              </div>
                            </Link>
                          </td>

                          {/* Contact: Phone & Email */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">{lead.phone || "—"}</div>
                            {lead.email && (
                              <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                {lead.email}
                              </div>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {lead.source}
                            </span>
                          </td>

                          {/* Follow-up */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-primary text-[11px]">
                              {lead.followUp || "Not scheduled"}
                            </span>
                          </td>

                          {/* Potential Value */}
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                            {money(lead.value)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={lead.status} />
                          </td>

                          {/* Priority */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                lead.priority === "High"
                                  ? "bg-rose-100 text-rose-700"
                                  : lead.priority === "Medium"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {lead.priority || "Medium"}
                            </span>
                          </td>

                          {/* Actions: Call, Message, and Delete */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {lead.phone && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8 rounded-lg border-border shadow-none"
                                  title={`Call ${lead.phone}`}
                                  onClick={() => toast.info(`Call ${lead.phone} using your phone`)}
                                >
                                  <Phone size={13} />
                                </Button>
                              )}
                              {lead.phone && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8 rounded-lg border-border shadow-none"
                                  title={`Message ${lead.phone}`}
                                  onClick={() =>
                                    toast.info(`Message ${lead.phone} using your messaging app`)
                                  }
                                >
                                  <MessageCircle size={13} />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-lg border-border text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive shadow-none transition-colors cursor-pointer"
                                title="Delete lead"
                                onClick={() => setLeadToDelete(lead)}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <EmptyState
              title={query || status !== "All" ? "No matching leads" : "No leads yet"}
              description={
                query || status !== "All"
                  ? "Try a different search or status filter."
                  : "Add your first lead or import from an Excel sheet to start managing your pipeline."
              }
              onAdd={() => setForm("lead")}
              action="Add Lead"
            />
          )}
        </>
      )}

      {/* Delete Lead Confirmation Dialog */}
      <AlertDialog
        open={Boolean(leadToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setLeadToDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-[420px] rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <Trash2 size={18} /> Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{leadToDelete?.name}"</span>? This
              lead will be permanently deleted from your CRM database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setLeadToDelete(null)}
              className="h-9 rounded-lg text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDeleteLead}
              className="h-9 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <QuickForm kind={form} onClose={() => setForm(null)} />
      <LeadsImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
