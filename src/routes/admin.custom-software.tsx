import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Code2, Search, Filter, RefreshCw, Eye, Trash2, Mail, Phone,
  Building, Calendar, Clock, DollarSign, Layers, CheckCircle2,
  AlertCircle, MessageSquare, Send, ArrowUpDown, ChevronDown,
  Sparkles, Save, UserCheck, X
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell, AdminEmptyState, AdminBadge
} from "@/components/admin-shell";
import {
  customSoftwareService,
  PROJECT_TYPE_LABELS,
  STATUS_LABELS,
  type CustomSoftwareInquiry,
  type CustomSoftwareStatus
} from "@/lib/custom-software-service";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/custom-software")({
  head: () => ({ meta: [{ title: "Custom Software Inquiries | Admin | Occo Flow" }] }),
  component: AdminCustomSoftwarePage,
});

function AdminCustomSoftwarePage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminCustomSoftware />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminCustomSoftware() {
  const [inquiries, setInquiries] = useState<CustomSoftwareInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    newCount: 0,
    contactedCount: 0,
    inProcessCount: 0,
    closedCount: 0,
  });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Detail Modal & Notes states
  const [selectedInquiry, setSelectedInquiry] = useState<CustomSoftwareInquiry | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customSoftwareService.adminList({
        search,
        status: statusFilter,
        projectType: projectTypeFilter,
        sortBy,
      });
      setInquiries(res.inquiries);
      setMetrics(res.metrics);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, projectTypeFilter, sortBy]);

  useEffect(() => {
    loadData();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 300);
    };

    // Supabase Realtime channel for live customer inquiries
    const channel = supabase
      .channel("admin-custom-software-inquiries-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_software_inquiries" },
        debouncedReload
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Open detail modal and sync notes
  const handleOpenDetail = (item: CustomSoftwareInquiry) => {
    setSelectedInquiry(item);
    setModalNotes(item.adminNotes || "");
  };

  // Change inquiry status directly
  const handleStatusChange = async (id: string, newStatus: CustomSoftwareStatus) => {
    setStatusUpdatingId(id);
    const ok = await customSoftwareService.adminUpdateStatus(id, newStatus);
    setStatusUpdatingId(null);

    if (ok) {
      toast.success(`Inquiry status updated to ${STATUS_LABELS[newStatus]?.label || newStatus}.`);
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Save admin notes inside modal
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    const ok = await customSoftwareService.adminUpdateNotes(selectedInquiry.id, modalNotes);
    setSavingNotes(false);

    if (ok) {
      toast.success("Admin notes saved successfully.");
      setInquiries((prev) =>
        prev.map((item) => (item.id === selectedInquiry.id ? { ...item, adminNotes: modalNotes } : item))
      );
      setSelectedInquiry((prev) => (prev ? { ...prev, adminNotes: modalNotes } : null));
    } else {
      toast.error("Failed to save admin notes.");
    }
  };

  // Delete inquiry
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom software inquiry?")) return;
    const ok = await customSoftwareService.adminDelete(id);
    if (ok) {
      toast.success("Inquiry deleted.");
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      loadData();
    } else {
      toast.error("Failed to delete inquiry.");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Inquiries</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#0f172a]">{metrics.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">All received leads</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-blue-700">New / Unread</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#2563eb]">{metrics.newCount}</p>
          <p className="mt-1 text-[11px] text-blue-600/80">Requires first response</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-purple-700">In Discussion</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-purple-800">
            {metrics.contactedCount + metrics.inProcessCount}
          </p>
          <p className="mt-1 text-[11px] text-purple-600/80">Contacted & in process</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700">Closed / Won</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-emerald-800">{metrics.closedCount}</p>
          <p className="mt-1 text-[11px] text-emerald-600/80">Delivered & converted</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, company, email, phone, or inquiry ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#2563eb] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New ({metrics.newCount})</option>
            <option value="contacted">Contacted ({metrics.contactedCount})</option>
            <option value="in_process">In Process ({metrics.inProcessCount})</option>
            <option value="closed">Closed / Won ({metrics.closedCount})</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Project Type filter */}
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#2563eb] focus:outline-none"
          >
            <option value="all">All Project Types</option>
            <option value="crm_erp">Custom CRM & ERP</option>
            <option value="mobile_app">Mobile App</option>
            <option value="web_platform">Web Platform</option>
            <option value="ai_automation">AI & Automation</option>
            <option value="api_integration">API & Integrations</option>
            <option value="other">Other Bespoke</option>
          </select>

          {/* Sort */}
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown size={13} className="text-slate-400" />
            <span>{sortBy === "newest" ? "Newest" : "Oldest"}</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh inquiries"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#2563eb]" : ""} />
          </button>
        </div>
      </div>

      {/* Inquiries Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading && inquiries.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No custom software inquiries found"
              description={
                search || statusFilter !== "all" || projectTypeFilter !== "all"
                  ? "Try adjusting your search query or filters."
                  : "Inquiries submitted through the landing page Custom Software card will appear here automatically."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Inquiry / Date</th>
                  <th className="px-5 py-3.5">Customer & Company</th>
                  <th className="px-5 py-3.5">Project Scope</th>
                  <th className="px-5 py-3.5">Budget & Timeline</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((item) => {
                  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.new;
                  const projectLabel = PROJECT_TYPE_LABELS[item.projectType] || item.projectType;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* ID and Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#0f172a] block">
                          #{item.inquiryNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy, h:mm a") : "—"}
                        </span>
                      </td>

                      {/* Customer Name & Company */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {item.fullName}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building size={12} className="text-slate-400 shrink-0" />
                          <strong className="text-slate-700">{item.companyName}</strong>
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <a
                            href={`mailto:${item.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#2563eb] flex items-center gap-1"
                          >
                            <Mail size={11} /> {item.email}
                          </a>
                          <span>•</span>
                          <a
                            href={`tel:${item.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#2563eb] flex items-center gap-1"
                          >
                            <Phone size={11} /> {item.phone}
                          </a>
                        </div>
                      </td>

                      {/* Project Type */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563eb]">
                          <Layers size={12} />
                          {projectLabel}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                          {item.requirements}
                        </p>
                      </td>

                      {/* Budget & Timeline */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block text-xs">
                          {item.budgetRange}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize block mt-0.5">
                          Timeline: {item.timeline.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={item.status}
                          disabled={statusUpdatingId === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as CustomSoftwareStatus)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-[#2563eb] focus:outline-none cursor-pointer"
                        >
                          <option value="new">🔵 New</option>
                          <option value="contacted">🟡 Contacted</option>
                          <option value="in_process">🟣 In Process</option>
                          <option value="closed">🟢 Closed / Won</option>
                          <option value="cancelled">⚪ Cancelled</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="View Full Requirements"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL INQUIRY DETAILS MODAL */}
      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedInquiry(null);
        }}
      >
        <DialogContent className="w-[94vw] max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl focus:outline-none">
          {selectedInquiry && (
            <div>
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-white">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 border border-white/20 backdrop-blur-md shadow-inner">
                      <Code2 className="size-6 text-white" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-100 mb-1">
                        <span>Inquiry #{selectedInquiry.inquiryNumber}</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                        {selectedInquiry.companyName}
                      </h3>
                      <p className="mt-0.5 text-xs text-blue-100 flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Submitted on {format(new Date(selectedInquiry.createdAt), "dd MMM yyyy, h:mm a")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value as CustomSoftwareStatus)}
                      className="h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 px-2.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="new" className="text-slate-900">🔵 New</option>
                      <option value="contacted" className="text-slate-900">🟡 Contacted</option>
                      <option value="in_process" className="text-slate-900">🟣 In Process</option>
                      <option value="closed" className="text-slate-900">🟢 Closed / Won</option>
                      <option value="cancelled" className="text-slate-900">⚪ Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 bg-white space-y-6">
                {/* Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Contact Person
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {selectedInquiry.fullName}
                    </span>
                    <span className="text-slate-500 block mt-0.5">{selectedInquiry.companyName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Direct Contact
                    </span>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="font-semibold text-[#2563eb] hover:underline block flex items-center gap-1"
                    >
                      <Mail size={12} /> {selectedInquiry.email}
                    </a>
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="text-slate-700 hover:text-[#2563eb] block mt-0.5 flex items-center gap-1 font-medium"
                    >
                      <Phone size={12} /> {selectedInquiry.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Software / Project Type
                    </span>
                    <span className="font-bold text-slate-800">
                      {PROJECT_TYPE_LABELS[selectedInquiry.projectType] || selectedInquiry.projectType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Budget & Timeline
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedInquiry.budgetRange}
                    </span>
                    <span className="text-slate-500 block capitalize">
                      Timeline: {selectedInquiry.timeline.replace(/_/g, " ")} · Method: {selectedInquiry.preferredContactMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Requirements Description Block */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-[#2563eb]" />
                    Customer Requirements & Project Scope
                  </h4>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4.5 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-normal max-h-64 overflow-y-auto shadow-inner">
                    {selectedInquiry.requirements}
                  </div>
                </div>

                {/* Admin Internal Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" />
                      Admin Internal Notes
                    </h4>
                    <span className="text-[11px] text-slate-400">Visible to administrators only</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Add internal notes about phone conversations, quotes sent, follow-up dates, or developer assignees..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      disabled={savingNotes}
                      onClick={handleSaveNotes}
                      className="h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Save size={13} />
                      <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
                    </Button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Inquiry</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${selectedInquiry.email}?subject=Occo%20Flow%20-%20Custom%20Software%20Requirements%20Inquiry%20%23${selectedInquiry.inquiryNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Mail size={13} /> Email Customer
                    </a>
                    <Button
                      type="button"
                      onClick={() => setSelectedInquiry(null)}
                      className="rounded-xl bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
