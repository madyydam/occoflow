import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  MessageSquarePlus, Search, MessageSquare, CheckCircle2,
  Clock, AlertCircle, Eye, ShieldCheck, Loader2, Star,
  Lightbulb, Filter, Send, XCircle, RefreshCw, UserCheck
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell, AdminPageHeader, AdminBadge,
  AdminKpiCard, AdminEmptyState
} from "@/components/admin-shell";
import { useAdminAuth } from "@/lib/admin-context";
import { adminSupportService, type AdminSupportTicket } from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, isToday, subDays, parseISO } from "date-fns";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Problems & Suggestions | Admin | Occo Flow" }] }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminSupport />
      </AdminShell>
    </AdminGuard>
  );
}

const statusBadgeColors: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200",
  open: "bg-sky-50 text-sky-700 border-sky-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusDisplayLabels: Record<string, string> = {
  new: "New",
  open: "New",
  under_review: "Under Review",
  waiting: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function AdminSupport() {
  const { adminUser } = useAdminAuth();
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Selected ticket for modal details & response
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [targetStatus, setTargetStatus] = useState<string>("new");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await adminSupportService.list();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadTickets();
      }, 300);
    };

    // Supabase Realtime for instant incoming tickets
    const channel = supabase
      .channel("admin-support-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        debouncedReload
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync modal state when opening ticket
  useEffect(() => {
    if (selectedTicket) {
      setReplyText(selectedTicket.adminResponse || "");
      setTargetStatus(selectedTicket.status || "new");
    }
  }, [selectedTicket]);

  // Filtered tickets
  const filtered = useMemo(() => {
    const now = new Date();
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "new" && t.status !== "new" && t.status !== "open") return false;
        if (statusFilter === "under_review" && t.status !== "under_review" && t.status !== "waiting") return false;
        if (statusFilter === "in_progress" && t.status !== "in_progress") return false;
        if (statusFilter === "resolved" && t.status !== "resolved") return false;
        if (statusFilter === "closed" && t.status !== "closed") return false;
      }

      // Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) return false;

      // Rating filter
      if (ratingFilter === "with_rating" && !t.rating) return false;
      if (ratingFilter === "5" && t.rating !== 5) return false;
      if (ratingFilter === "4" && t.rating !== 4) return false;
      if (ratingFilter === "3" && t.rating !== 3) return false;
      if (ratingFilter === "1-2" && (!t.rating || t.rating > 2)) return false;

      // Date filter
      if (dateFilter !== "all") {
        const itemDate = new Date(t.createdAt);
        if (dateFilter === "today" && !isToday(itemDate)) return false;
        if (dateFilter === "7d" && itemDate < subDays(now, 7)) return false;
        if (dateFilter === "30d" && itemDate < subDays(now, 30)) return false;
      }

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.businessName && t.businessName.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, typeFilter, ratingFilter, dateFilter, search]);

  // Metrics
  const newCount = tickets.filter((t) => t.status === "new" || t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "under_review" || t.status === "in_progress" || t.status === "waiting"
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  const ratedTickets = tickets.filter((t) => t.rating !== null && t.rating !== undefined && t.rating > 0);
  const avgRating =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          ratedTickets.length
        ).toFixed(1)
      : "5.0";

  // Actions
  const handleSaveResponseAndStatus = async () => {
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      const ok = await adminSupportService.updateTicket(selectedTicket.id, {
        status: targetStatus,
        adminResponse: replyText.trim(),
        adminRespondedById: adminUser?.id || null,
      });

      if (ok) {
        toast.success("Submission updated and reply sent to user.");
        setSelectedTicket({
          ...selectedTicket,
          status: targetStatus,
          adminResponse: replyText.trim(),
          adminRespondedAt: new Date().toISOString(),
          adminRespondedById: adminUser?.id || null,
        });
        loadTickets();
      } else {
        toast.error("Failed to update submission.");
      }
    } catch {
      toast.error("Error communicating with server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      const ok = await adminSupportService.updateTicket(selectedTicket.id, {
        status: newStatus,
        adminRespondedById: adminUser?.id || null,
      });

      if (ok) {
        toast.success(`Marked as ${statusDisplayLabels[newStatus] || newStatus}.`);
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus,
        });
        setTargetStatus(newStatus);
        loadTickets();
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Error updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Problems & Suggestions"
        description="Centralized inbox for customer problem reports, feature suggestions, feedback, and CRM ratings."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="New Submissions"
          value={newCount}
          icon={AlertCircle}
          tone="bg-sky-50 text-sky-600"
          sub="Requires staff inspection"
        />
        <AdminKpiCard
          label="Under Review / In Progress"
          value={inProgressCount}
          icon={Clock}
          tone="bg-amber-50 text-amber-600"
          sub="Being investigated"
        />
        <AdminKpiCard
          label="Resolved & Closed"
          value={resolvedCount}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
          sub="Addressed & completed"
        />
        <AdminKpiCard
          label="Average CRM Rating"
          value={`${avgRating} ★`}
          icon={Star}
          tone="bg-amber-50 text-amber-500"
          sub={`Based on ${ratedTickets.length} user reviews`}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Top search & refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, description, user, workspace, or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadTickets}
            className="h-10 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Filter chips / dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/70 p-1">
            {[
              { id: "all", label: "All" },
              { id: "new", label: "New" },
              { id: "under_review", label: "Under Review" },
              { id: "in_progress", label: "In Progress" },
              { id: "resolved", label: "Resolved" },
              { id: "closed", label: "Closed" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#2563eb] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563eb]"
          >
            <option value="all">All Types</option>
            <option value="problem">Problems / Bugs</option>
            <option value="suggestion">Suggestions</option>
            <option value="feedback">Feedback</option>
          </select>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563eb]"
          >
            <option value="all">All Ratings</option>
            <option value="with_rating">Has CRM Rating</option>
            <option value="5">5 Stars ★</option>
            <option value="4">4 Stars ★</option>
            <option value="3">3 Stars ★</option>
            <option value="1-2">1-2 Stars ★</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563eb]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {(statusFilter !== "all" || typeFilter !== "all" || ratingFilter !== "all" || dateFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setRatingFilter("all");
                setDateFilter("all");
                setSearch("");
              }}
              className="text-xs font-semibold text-red-600 hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Inbox Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              icon={MessageSquarePlus}
              title="No customer submissions yet"
              description="When business users report a problem, suggest a feature, or submit feedback through their CRM, they will appear here in real time."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Submission & Subject</th>
                  <th className="px-4 py-3.5">Customer & Workspace</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">CRM Rating</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No submissions match your active search or filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const ticketIdFormatted = `#TKT-${t.id.slice(0, 8).toUpperCase()}`;
                    const hasAdminResponse = Boolean(t.adminResponse && t.adminResponse.trim());

                    return (
                      <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                        {/* Subject & snippet */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {ticketIdFormatted}
                            </span>
                            {hasAdminResponse && (
                              <span
                                title="Responded by support"
                                className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200"
                              >
                                Replied
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-[#0f172a] mt-0.5 truncate">{t.subject}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
                        </td>

                        {/* Customer & Workspace */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{t.userName || "Customer"}</div>
                          <div className="text-[11px] text-slate-500">{t.businessName || "Workspace"}</div>
                          {t.userEmail && <div className="text-[10px] text-slate-400 truncate">{t.userEmail}</div>}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              t.type === "problem"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : t.type === "suggestion"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {t.type === "problem" ? (
                              <AlertCircle size={10} />
                            ) : t.type === "suggestion" ? (
                              <Lightbulb size={10} />
                            ) : (
                              <MessageSquare size={10} />
                            )}
                            {t.type}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3.5">
                          {t.rating ? (
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star size={13} className="fill-amber-400" />
                              <span>{t.rating}/5</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              statusBadgeColors[t.status] || statusBadgeColors["new"]
                            }`}
                          >
                            {statusDisplayLabels[t.status] || t.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-500">
                          {format(new Date(t.createdAt), "dd MMM yyyy, h:mm a")}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(t)}
                            className="h-8 text-xs font-semibold border-slate-200 hover:bg-blue-50 hover:text-[#2563eb]"
                          >
                            <Eye size={13} className="mr-1" />
                            View & Reply
                          </Button>
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

      {/* Ticket Details & Response Modal */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(v) => {
          if (!v) setSelectedTicket(null);
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold text-[#0f172a]">
              <div className="flex items-center gap-2">
                <MessageSquarePlus size={18} className="text-[#2563eb]" />
                <span>Ticket Details & Management</span>
              </div>
              {selectedTicket && (
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  #TKT-{selectedTicket.id.slice(0, 8).toUpperCase()}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-5 text-xs pt-2">
              {/* Customer Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">User</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.userName || "Customer"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Workspace</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.businessName || "Workspace"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email / Contact</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedTicket.userEmail || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted</span>
                  <span className="font-semibold text-slate-800">
                    {format(new Date(selectedTicket.createdAt), "dd MMM, h:mm a")}
                  </span>
                </div>
              </div>

              {/* Subject & Description Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectedTicket.type === "problem"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : selectedTicket.type === "suggestion"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {selectedTicket.type}
                  </span>

                  {selectedTicket.rating && (
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Star size={12} className="fill-amber-400" /> {selectedTicket.rating} / 5 Stars
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-[#0f172a]">{selectedTicket.subject}</h4>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>

                {selectedTicket.ratingComment && (
                  <div className="mt-2 rounded-lg bg-amber-50/60 border border-amber-200 p-2.5 text-amber-900">
                    <span className="font-bold text-[11px] block">Rating Comment:</span>
                    <span className="italic">{selectedTicket.ratingComment}</span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Change Status:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: "new", label: "New" },
                    { id: "under_review", label: "Under Review" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "resolved", label: "Resolved" },
                    { id: "closed", label: "Closed" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTargetStatus(s.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        targetStatus === s.id
                          ? "bg-[#2563eb] text-white border-[#2563eb] shadow-xs font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Reply Composer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#2563eb]" />
                    Write / Update Reply to User:
                  </label>
                  {selectedTicket.adminRespondedAt && (
                    <span className="text-[10px] text-slate-400">
                      Last replied: {format(new Date(selectedTicket.adminRespondedAt), "dd MMM yyyy, h:mm a")}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder="Type an official response. The user will see this directly in their CRM under this ticket..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[10px] text-slate-400">
                  Tip: When you save, the user's CRM view updates immediately via live database synchronization.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatus("resolved")}
                    className="h-9 font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle2 size={13} className="mr-1.5" />
                    Quick Resolve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatus("closed")}
                    className="h-9 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
                  >
                    <XCircle size={13} className="mr-1.5" />
                    Close
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                    className="h-9 text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleSaveResponseAndStatus}
                    className="h-9 bg-[#2563eb] hover:bg-blue-700 text-white font-bold px-4"
                  >
                    {isUpdating ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="size-3.5 mr-1.5" />
                    )}
                    Save & Send Response
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
