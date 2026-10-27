import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  Plus,
  Send,
  QrCode,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  MessageCircle,
  MoreVertical,
  Printer,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Phone,
  ArrowUpDown,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { PageTitle, EmptyState } from "@/components/crm-ui";
import { useAuth } from "@/lib/auth-context";
import {
  type PaymentRecord,
  type PaymentStatus,
  paymentReminderService,
  getDaysDifference,
} from "@/lib/payment-reminder-service";
import {
  NewPaymentModal,
  RecordInstallmentModal,
  UpiQrModal,
  SendReminderModal,
  PromiseToPayModal,
  BatchAutoRemindModal,
  InvoiceStatementModal,
} from "@/components/payment-reminders-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payment Reminders & Invoices | Occo Flow" },
      {
        name: "description",
        content:
          "Track customer dues, automated WhatsApp reminders, and collect payments via UPI QR.",
      },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <PaymentsContent />
      </AppShell>
    </AccessGuard>
  );
}

function PaymentsContent() {
  const { business, profile } = useAuth();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus | "PTP">("All");
  const [agingFilter, setAgingFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"dueDate" | "amount" | "aging">("dueDate");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [activeInstallmentRecord, setActiveInstallmentRecord] = useState<PaymentRecord | null>(
    null,
  );
  const [activeUpiRecord, setActiveUpiRecord] = useState<PaymentRecord | null>(null);
  const [activeReminderRecord, setActiveReminderRecord] = useState<PaymentRecord | null>(null);
  const [activePtpRecord, setActivePtpRecord] = useState<PaymentRecord | null>(null);
  const [activeStatementRecord, setActiveStatementRecord] = useState<PaymentRecord | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Load records from Supabase
  const loadData = useCallback(async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const data = await paymentReminderService.list(business.id);
      setRecords(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment records.");
    } finally {
      setIsLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dues Dashboard Metrics
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let dueToday = 0;
    let dueTodayCount = 0;
    let overdue = 0;
    let overdueCount = 0;
    let upcoming7Days = 0;
    let upcoming7Count = 0;
    let collectedThisMonth = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (const r of records) {
      // Outstanding
      if (r.status !== "Paid") {
        totalOutstanding += r.balanceAmount;
        const days = getDaysDifference(r.dueDate);

        if (r.dueDate === todayStr) {
          dueToday += r.balanceAmount;
          dueTodayCount++;
        } else if (days > 0) {
          overdue += r.balanceAmount;
          overdueCount++;
        } else if (days >= -7 && days < 0) {
          upcoming7Days += r.balanceAmount;
          upcoming7Count++;
        }
      }

      // Collected this month from installments
      for (const inst of r.installments || []) {
        if (!inst?.date) continue;
        const d = new Date(inst.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          collectedThisMonth += Number(inst.amount) || 0;
        }
      }
    }

    return {
      totalOutstanding,
      dueToday,
      dueTodayCount,
      overdue,
      overdueCount,
      upcoming7Days,
      upcoming7Count,
      collectedThisMonth,
    };
  }, [records]);

  // Aging Analysis
  const aging = useMemo(() => paymentReminderService.calculateAging(records), [records]);

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Search
        const matchesQuery =
          searchQuery === "" ||
          `${r.customerName} ${r.customerPhone} ${r.invoiceNumber} ${r.notes}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        // Status
        let matchesStatus = true;
        if (statusFilter === "PTP") {
          matchesStatus = Boolean(r.promiseToPayDate);
        } else if (statusFilter !== "All") {
          matchesStatus = r.status === statusFilter;
        }

        // Aging
        let matchesAging = true;
        if (agingFilter !== "All" && r.status !== "Paid") {
          const days = getDaysDifference(r.dueDate);
          if (agingFilter === "not_due") matchesAging = days <= 0;
          else if (agingFilter === "1_30") matchesAging = days > 0 && days <= 30;
          else if (agingFilter === "31_60") matchesAging = days > 30 && days <= 60;
          else if (agingFilter === "61_90") matchesAging = days > 60 && days <= 90;
          else if (agingFilter === "90_plus") matchesAging = days > 90;
        }

        return matchesQuery && matchesStatus && matchesAging;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "dueDate") {
          diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (sortBy === "amount") {
          diff = a.balanceAmount - b.balanceAmount;
        } else if (sortBy === "aging") {
          diff = getDaysDifference(b.dueDate) - getDaysDifference(a.dueDate);
        }
        return sortAsc ? diff : -diff;
      });
  }, [records, searchQuery, statusFilter, agingFilter, sortBy, sortAsc]);

  // Actions
  const handleRecordCreated = (newRecord: PaymentRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleRecordUpdated = (updated: PaymentRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDeleteRecord = async (id: string, invNo: string) => {
    if (!window.confirm(`Are you sure you want to delete Invoice #${invNo}?`)) return;
    try {
      await paymentReminderService.delete(id, business?.id || "");
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success("Payment record deleted.");
    } catch {
      toast.error("Failed to delete record.");
    }
  };

  const handleExport = () => {
    paymentReminderService.exportToExcel(records, business?.name || "Business");
    toast.success("Payment ledger exported to Excel!");
  };

  return (
    <>
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <PageTitle
            title="Payment Reminders & Dues"
            description="Automate WhatsApp reminders, track aging invoices, and collect payments via UPI QR."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            title="Refresh database"
            className="h-9 px-3 rounded-xl border-slate-200 text-xs text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-600" : ""} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100/70 text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <Send size={13} /> Auto-Remind Scheduler
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Export Excel
          </Button>

          <Button
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> New Invoice / Due
          </Button>
        </div>
      </div>

      {/* ── 1. Dues Dashboard Metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total Outstanding */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <IndianRupee size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            ₹{metrics.totalOutstanding.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Pending from customers</span>
        </div>

        {/* Due Today */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Due Today</span>
            <div className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            ₹{metrics.dueToday.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">
            {metrics.dueTodayCount} bills due today
          </span>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Dues</span>
            <div className="grid size-7 place-items-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-700 leading-tight">
            ₹{metrics.overdue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-rose-600 font-semibold">
            {metrics.overdueCount} bills past due date
          </span>
        </div>

        {/* Upcoming 7 Days */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Upcoming (7d)</span>
            <div className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Calendar size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            ₹{metrics.upcoming7Days.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500">{metrics.upcoming7Count} due this week</span>
        </div>

        {/* Collected This Month */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Collected Month</span>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 leading-tight">
            ₹{metrics.collectedThisMonth.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Realized payments</span>
        </div>
      </div>

      {/* ── 2. Aging Bucket Breakdown (Indian SMB Aging Report) ─────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">📊 Aging Ledger Report</span>
            <span className="text-[11px] text-slate-400">Click any bucket to filter bills</span>
          </div>
          {agingFilter !== "All" && (
            <button
              onClick={() => setAgingFilter("All")}
              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Clear Aging Filter ({agingFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* Current / Not Due */}
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === "not_due" ? "All" : "not_due")}
            className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
              agingFilter === "not_due"
                ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20"
                : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold text-slate-500">
              Current (Not Due)
            </span>
            <span className="text-sm font-extrabold text-slate-800 block my-0.5">
              ₹{aging.notDue.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-400">{aging.notDue.count} bills</span>
          </button>

          {/* 1 - 30 Days */}
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === "1_30" ? "All" : "1_30")}
            className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
              agingFilter === "1_30"
                ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20"
                : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold text-amber-700">
              1 - 30 Days
            </span>
            <span className="text-sm font-extrabold text-amber-800 block my-0.5">
              ₹{aging.days1To30.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-amber-600">{aging.days1To30.count} bills</span>
          </button>

          {/* 31 - 60 Days */}
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === "31_60" ? "All" : "31_60")}
            className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
              agingFilter === "31_60"
                ? "border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20"
                : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold text-orange-700">
              31 - 60 Days
            </span>
            <span className="text-sm font-extrabold text-orange-800 block my-0.5">
              ₹{aging.days31To60.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-orange-600">{aging.days31To60.count} bills</span>
          </button>

          {/* 61 - 90 Days */}
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === "61_90" ? "All" : "61_90")}
            className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
              agingFilter === "61_90"
                ? "border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20"
                : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold text-rose-700">
              61 - 90 Days
            </span>
            <span className="text-sm font-extrabold text-rose-800 block my-0.5">
              ₹{aging.days61To90.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-rose-600">{aging.days61To90.count} bills</span>
          </button>

          {/* 90+ Days (Severe Overdue) */}
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === "90_plus" ? "All" : "90_plus")}
            className={`col-span-2 sm:col-span-1 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
              agingFilter === "90_plus"
                ? "border-red-600 bg-red-100/80 ring-2 ring-red-600/20"
                : "border-red-200/80 bg-red-50/40 hover:bg-red-50/80"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold text-red-700">
              90+ Days (Critical)
            </span>
            <span className="text-sm font-extrabold text-red-900 block my-0.5">
              ₹{aging.days90Plus.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-red-700 font-medium">
              {aging.days90Plus.count} bills overdue
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search customer, phone, or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs rounded-xl border-slate-200 bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["All", "Overdue", "Unpaid", "Partial", "Paid", "PTP"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === s
                  ? s === "Overdue"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : s === "Paid"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : s === "PTP"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "PTP" ? "🤝 Has PTP" : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Payment Records Table / Cards ──────────────────────────── */}
      {filteredRecords.length === 0 ? (
        records.length === 0 ? (
          <EmptyState
            title="No payment dues recorded yet"
            description="Start by adding your first invoice or customer receivable to automate collections."
            action="Create First Invoice"
            onAdd={() => setNewModalOpen(true)}
          />
        ) : (
          <EmptyState
            title="No matching payment records found"
            description="Try adjusting your search query, status, or aging bucket filter."
          />
        )
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice & Customer</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Due Date & Aging</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Quick Collections</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredRecords.map((r) => {
                  const days = getDaysDifference(r.dueDate);
                  const isOverdue = days > 0 && r.status !== "Paid";
                  const isDueToday = days === 0 && r.status !== "Paid";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer & Invoice */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {r.customerName}
                              </span>
                              {r.recurringInterval !== "none" && (
                                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[9px] px-1 py-0">
                                  {r.recurringInterval}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-600 font-semibold">
                                {r.invoiceNumber}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Phone size={11} /> {r.customerPhone}
                              </span>
                            </div>
                            {r.promiseToPayDate && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                                <span>
                                  🤝 PTP: {new Date(r.promiseToPayDate).toLocaleDateString()}
                                </span>
                                {r.promiseToPayAmount && <span>(₹{r.promiseToPayAmount})</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        ₹{r.totalAmount.toLocaleString("en-IN")}
                        {r.notes && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {r.notes}
                          </p>
                        )}
                      </td>

                      {/* Paid & Balance */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900 text-sm">
                            ₹{r.balanceAmount.toLocaleString("en-IN")}
                            <span className="text-[10px] font-normal text-slate-400 ml-1">due</span>
                          </p>
                          <p className="text-[11px] text-emerald-600 font-medium">
                            ₹{r.paidAmount.toLocaleString("en-IN")} paid ({r.installments.length}{" "}
                            receipts)
                          </p>
                        </div>
                      </td>

                      {/* Due Date & Aging */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{r.dueDate}</p>
                          {r.status === "Paid" ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Settled
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                              <AlertTriangle size={11} /> {days} days overdue
                            </span>
                          ) : isDueToday ? (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                              <Clock size={11} /> Due Today!
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              in {Math.abs(days)} days
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            r.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "Partial"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : r.status === "Overdue"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Quick Collections (WhatsApp & UPI QR) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-click WhatsApp */}
                          <Button
                            size="sm"
                            onClick={() => setActiveReminderRecord(r)}
                            title="Send WhatsApp Reminder"
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-none flex items-center gap-1"
                          >
                            <MessageCircle size={13} /> Remind
                          </Button>

                          {/* Instant UPI QR */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveUpiRecord(r)}
                            title="Show UPI QR Code"
                            className="h-8 px-2.5 rounded-lg border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 text-[11px] font-semibold shadow-none flex items-center gap-1"
                          >
                            <QrCode size={13} /> UPI QR
                          </Button>

                          {/* Record Payment */}
                          {r.balanceAmount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveInstallmentRecord(r)}
                              title="Record payment received"
                              className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold shadow-none"
                            >
                              + Pay
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                              <MoreVertical size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 text-xs">
                            <DropdownMenuItem onClick={() => setActiveStatementRecord(r)}>
                              <Printer size={13} className="mr-2" /> Print Statement Slip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActivePtpRecord(r)}>
                              <Calendar size={13} className="mr-2" /> Set Promise to Pay
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveInstallmentRecord(r)}>
                              <Plus size={13} className="mr-2" /> Record Installment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRecord(r.id, r.invoiceNumber)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={13} className="mr-2" /> Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <NewPaymentModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={handleRecordCreated}
      />

      <RecordInstallmentModal
        open={Boolean(activeInstallmentRecord)}
        record={activeInstallmentRecord}
        onClose={() => setActiveInstallmentRecord(null)}
        onSaved={handleRecordUpdated}
      />

      <UpiQrModal
        open={Boolean(activeUpiRecord)}
        record={activeUpiRecord}
        onClose={() => setActiveUpiRecord(null)}
        onMarkPaid={() => {
          if (activeUpiRecord) setActiveInstallmentRecord(activeUpiRecord);
        }}
      />

      <SendReminderModal
        open={Boolean(activeReminderRecord)}
        record={activeReminderRecord}
        onClose={() => setActiveReminderRecord(null)}
        onLogged={handleRecordUpdated}
      />

      <PromiseToPayModal
        open={Boolean(activePtpRecord)}
        record={activePtpRecord}
        onClose={() => setActivePtpRecord(null)}
        onSaved={handleRecordUpdated}
      />

      <BatchAutoRemindModal
        open={batchModalOpen}
        records={records}
        onClose={() => setBatchModalOpen(false)}
        onBatchProcessed={loadData}
      />

      <InvoiceStatementModal
        open={Boolean(activeStatementRecord)}
        record={activeStatementRecord}
        onClose={() => setActiveStatementRecord(null)}
      />
    </>
  );
}
