import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Pencil, Phone, Mail, Building2, Globe2,
  CircleDollarSign, CalendarDays, Plus, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { leadStatuses, money } from "@/lib/crm-data";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { Avatar, QuickActions, StatusBadge, QuickForm, EmptyState } from "@/components/crm-ui";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead Details | Occo Flow" },
      { name: "description", content: "View customer details, pipeline stage, follow-ups and activity." },
    ],
  }),
  component: LeadDetailsPage,
});

function LeadDetailsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <LeadDetailsContent />
      </AppShell>
    </AccessGuard>
  );
}

function LeadDetailsContent() {
  const { leadId } = Route.useParams();
  const { leads, updateLead, deleteLead, activities, addNote, addFollowUp, convertLeadToContact, convertLeadToDeal } = useCRM();
  const { user } = useAuth();
  const lead = leads.find((x) => x.id === leadId);

  const [editOpen, setEditOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [converting, setConverting] = useState(false);

  if (!lead) {
    return (
      <EmptyState
        title="Lead not found"
        description="This lead may have been removed or archived."
      />
    );
  }

  const timeline = activities.filter((x) => x.leadId === lead.id)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNote(noteText, { leadId: lead.id });
    setNoteText("");
    setShowNoteForm(false);
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;
    await addFollowUp({ leadId: lead.id, scheduledAt: new Date(followUpDate).toISOString(), note: followUpNote });
    setFollowUpDate("");
    setFollowUpNote("");
    setShowFollowUpForm(false);
  };

  const handleConvertToContact = async () => {
    setConverting(true);
    await convertLeadToContact(lead);
    setConverting(false);
  };

  const handleConvertToDeal = async () => {
    await convertLeadToDeal(lead, `Deal from ${lead.name}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    await deleteLead(lead.id);
  };

  return (
    <>
      {/* Back */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/leads" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Leads</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)} className="h-9 border-border shadow-none">
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="outline" onClick={handleDelete} className="h-9 border-destructive/30 text-destructive shadow-none hover:bg-destructive/5">
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        {/* Left */}
        <div className="min-w-0 space-y-5">
          {/* Profile card */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-4">
              <Avatar name={lead.name} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-extrabold sm:text-2xl">{lead.name}</h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">{lead.company || "No company"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={lead.status} />
                  <StatusBadge status={lead.priority} />
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-1 border-t border-border pt-4 text-sm text-muted-foreground">
              {lead.phone && <p className="flex items-center gap-2"><Phone size={15} />{lead.phone}</p>}
              {lead.email && <p className="flex items-center gap-2"><Mail size={15} />{lead.email}</p>}
            </div>
            <div className="mt-5">
              <QuickActions phone={lead.phone} email={lead.email} />
            </div>
          </section>

          {/* Pipeline stage */}
          <section>
            <h2 className="mb-3 font-display text-base font-bold">Pipeline Stage</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {leadStatuses.map((stage) => (
                <Button
                  key={stage}
                  variant={lead.status === stage ? "default" : "outline"}
                  onClick={() => updateLead(lead.id, { status: stage })}
                  className={`h-11 min-w-0 rounded-lg px-1 text-[10px] shadow-none sm:text-xs ${lead.status !== stage ? "border-border bg-card text-muted-foreground" : ""}`}
                >
                  {stage}
                </Button>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-5 font-display text-base font-bold">Lead Information</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              <Info icon={Phone} label="Phone" value={lead.phone || "—"} />
              <Info icon={Mail} label="Email" value={lead.email || "—"} />
              <Info icon={Building2} label="Company" value={lead.company || "—"} />
              <Info icon={Globe2} label="Source" value={lead.source} />
              <Info icon={CircleDollarSign} label="Potential Value" value={money(lead.value)} />
              <Info icon={CalendarDays} label="Added" value={format(parseISO(lead.createdAt), "MMM d, yyyy")} />
            </div>
          </section>

          {/* Conversions */}
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-sm font-bold text-muted-foreground uppercase tracking-wide">Convert</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleConvertToContact} disabled={converting} className="border-border shadow-none">
                → Contact
              </Button>
              <Button variant="outline" size="sm" onClick={handleConvertToDeal} className="border-border shadow-none">
                → Deal
              </Button>
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="min-w-0 space-y-5">
          {/* Follow-up */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Follow-up</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFollowUpForm(!showFollowUpForm)} className="text-primary">
                <Plus size={15} /> Schedule
              </Button>
            </div>
            {showFollowUpForm && (
              <form onSubmit={handleAddFollowUp} className="mt-4 space-y-2">
                <input
                  type="datetime-local" required
                  value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Note (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="sm" className="w-full">Schedule Follow-up</Button>
              </form>
            )}
            {lead.notes && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Notes</p>
                {lead.notes}
              </div>
            )}
          </section>

          {/* Notes & Activity */}
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Notes & Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNoteForm(!showNoteForm)} className="text-primary">
                <Plus size={15} /> Note
              </Button>
            </div>
            {showNoteForm && (
              <form onSubmit={handleAddNote} className="mt-4">
                <textarea
                  value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note…"
                  className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
                <Button type="submit" size="sm" className="mt-2">Add Note</Button>
              </form>
            )}
            <div className="mt-5 border-l border-border pl-4">
              {timeline.length ? (
                timeline.map((x) => (
                  <div key={x.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                    <p className="flex items-center gap-1.5 text-xs font-bold">
                      <Clock size={11} className="text-muted-foreground" />
                      {x.title}
                    </p>
                    {x.detail && <p className="mt-1 text-xs text-muted-foreground">{x.detail}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {format(parseISO(x.createdAt), "MMM d · h:mm a")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Activity will appear here as you interact with this lead.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <QuickForm kind={editOpen ? "lead" : null} initialLead={lead} onClose={() => setEditOpen(false)} />
    </>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon size={14} />{label}</p>
      <p className="mt-1.5 break-words font-semibold">{value}</p>
    </div>
  );
}
