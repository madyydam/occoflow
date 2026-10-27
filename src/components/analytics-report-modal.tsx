import { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Copy,
  Calendar,
  Check,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Download,
  Building,
  Users,
  Briefcase,
  IndianRupee,
  Layers,
  Sparkles,
  Share2,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { money, dealStages, leadStatuses } from "@/lib/crm-data";
import { toast } from "sonner";

export type ReportType = "executive" | "leads" | "deals" | "tasks" | "comprehensive";

export type DateRangePreset =
  "all_time" | "today" | "this_week" | "this_month" | "last_30_days" | "this_quarter" | "custom";

export function GenerateAnalyticsReportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { leads, deals, tasks, contacts } = useCRM();
  const { business, profile } = useAuth();

  const [reportType, setReportType] = useState<ReportType>("comprehensive");
  const [dateRange, setDateRange] = useState<DateRangePreset>("this_month");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split("T")[0] || "";
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [includeSources, setIncludeSources] = useState(true);
  const [includePipeline, setIncludePipeline] = useState(true);
  const [includeTopDeals, setIncludeTopDeals] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Filter records based on selected date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;

    if (dateRange === "today") {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRange === "this_week") {
      const day = now.getDay() || 7;
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      filterEnd = new Date();
    } else if (dateRange === "this_month") {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEnd = new Date();
    } else if (dateRange === "last_30_days") {
      filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filterEnd = new Date();
    } else if (dateRange === "this_quarter") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      filterStart = new Date(now.getFullYear(), qMonth, 1);
      filterEnd = new Date();
    } else if (dateRange === "custom") {
      if (startDate) filterStart = new Date(startDate);
      if (endDate) filterEnd = new Date(`${endDate}T23:59:59`);
    }

    const matchesDate = (dateStr?: string | null) => {
      if (!filterStart || !dateStr) return true;
      const d = new Date(dateStr);
      if (filterStart && d < filterStart) return false;
      if (filterEnd && d > filterEnd) return false;
      return true;
    };

    const selLeads =
      dateRange === "all_time" ? leads : leads.filter((l) => matchesDate(l.createdAt));
    const selDeals =
      dateRange === "all_time" ? deals : deals.filter((d) => matchesDate(d.createdAt));
    const selTasks =
      dateRange === "all_time" ? tasks : tasks.filter((t) => matchesDate(t.createdAt));

    // Computations
    const totalLeads = selLeads.length;
    const wonLeads = selLeads.filter((l) => l.status === "Won").length;
    const lostLeads = selLeads.filter((l) => l.status === "Lost").length;
    const activeLeads = totalLeads - wonLeads - lostLeads;
    const leadConversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const leadsPipelineValue = selLeads.reduce((acc, l) => acc + (l.value || 0), 0);

    const totalDeals = selDeals.length;
    const wonDeals = selDeals.filter((d) => d.stage === "Won");
    const wonDealsValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);
    const lostDeals = selDeals.filter((d) => d.stage === "Lost");
    const openDeals = selDeals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
    const openDealsValue = openDeals.reduce((acc, d) => acc + (d.value || 0), 0);
    const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

    const completedTasks = selTasks.filter((t) => t.completed).length;
    const pendingTasks = selTasks.length - completedTasks;

    // Sources breakdown
    const sourcesMap: Record<string, number> = {};
    for (const l of selLeads) {
      const src = l.source || "Website";
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    }

    // Stages breakdown
    const stagesMap: Record<string, { count: number; value: number }> = {};
    for (const s of dealStages) {
      stagesMap[s] = { count: 0, value: 0 };
    }
    for (const d of selDeals) {
      const entry = stagesMap[d.stage];
      if (entry) {
        entry.count++;
        entry.value += d.value || 0;
      }
    }

    return {
      selLeads,
      selDeals,
      selTasks,
      totalLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      leadConversionRate,
      leadsPipelineValue,
      totalDeals,
      wonDeals,
      wonDealsValue,
      lostDeals,
      openDeals,
      openDealsValue,
      winRate,
      completedTasks,
      pendingTasks,
      sourcesMap,
      stagesMap,
    };
  }, [leads, deals, tasks, dateRange, startDate, endDate]);

  const businessName = business?.name || "My Business";
  const reportPeriodLabel =
    dateRange === "all_time"
      ? "All-Time Overview"
      : dateRange === "today"
        ? "Today's Performance"
        : dateRange === "this_week"
          ? "This Week"
          : dateRange === "this_month"
            ? "This Month"
            : dateRange === "last_30_days"
              ? "Last 30 Days"
              : dateRange === "this_quarter"
                ? "This Quarter"
                : `${startDate} to ${endDate}`;

  // ── 1. Export to Excel (.xlsx) ──────────────────────────────────
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Executive KPI Summary
      const summaryRows = [
        { Metric: "Business Name", Value: businessName },
        { Metric: "Report Period", Value: reportPeriodLabel },
        { Metric: "Generated On", Value: new Date().toLocaleString() },
        { Metric: "Generated By", Value: profile?.fullName || "Admin" },
        { Metric: "", Value: "" },
        { Metric: "Total Leads", Value: filteredData.totalLeads },
        { Metric: "Won Leads", Value: filteredData.wonLeads },
        { Metric: "Lead Conversion Rate", Value: `${filteredData.leadConversionRate}%` },
        { Metric: "Total Leads Potential", Value: filteredData.leadsPipelineValue },
        { Metric: "", Value: "" },
        { Metric: "Total Deals", Value: filteredData.totalDeals },
        { Metric: "Won Deals Count", Value: filteredData.wonDeals.length },
        { Metric: "Won Deals Revenue (INR)", Value: filteredData.wonDealsValue },
        { Metric: "Open Pipeline Deals", Value: filteredData.openDeals.length },
        { Metric: "Open Pipeline Value (INR)", Value: filteredData.openDealsValue },
        { Metric: "Deal Win Rate", Value: `${filteredData.winRate}%` },
        { Metric: "", Value: "" },
        { Metric: "Tasks Completed", Value: filteredData.completedTasks },
        { Metric: "Tasks Pending", Value: filteredData.pendingTasks },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "KPI Summary");

      // Sheet 2: Leads Roster
      if (reportType === "leads" || reportType === "comprehensive") {
        const leadRows = filteredData.selLeads.map((l) => ({
          Name: l.name,
          Company: l.company || "",
          Phone: l.phone || "",
          Email: l.email || "",
          Source: l.source || "Website",
          Status: l.status,
          Priority: l.priority,
          "Potential Value (INR)": l.value || 0,
          "Created Date": l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "",
          Notes: l.notes || "",
        }));
        const wsLeads = XLSX.utils.json_to_sheet(
          leadRows.length > 0 ? leadRows : [{ Notice: "No leads in period" }],
        );
        XLSX.utils.book_append_sheet(wb, wsLeads, "Leads");
      }

      // Sheet 3: Deals Pipeline
      if (reportType === "deals" || reportType === "comprehensive") {
        const dealRows = filteredData.selDeals.map((d) => ({
          "Deal Title": d.title,
          Customer: d.customer,
          Stage: d.stage,
          "Value (INR)": d.value,
          "Expected Close Date": d.closeDate || "Not set",
          "Created Date": d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
        }));
        const wsDeals = XLSX.utils.json_to_sheet(
          dealRows.length > 0 ? dealRows : [{ Notice: "No deals in period" }],
        );
        XLSX.utils.book_append_sheet(wb, wsDeals, "Deals");
      }

      // Sheet 4: Tasks List
      if (reportType === "tasks" || reportType === "comprehensive") {
        const taskRows = filteredData.selTasks.map((t) => ({
          Title: t.title,
          Customer: t.customer || "",
          "Due Date": t.dueDate || "",
          Priority: t.priority,
          Status: t.status,
          Completed: t.completed ? "Yes" : "No",
        }));
        const wsTasks = XLSX.utils.json_to_sheet(
          taskRows.length > 0 ? taskRows : [{ Notice: "No tasks in period" }],
        );
        XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");
      }

      const fileName = `${businessName.replace(/\s+/g, "_")}_Analytics_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Excel report downloaded successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel report.");
    }
  };

  // ── 2. Copy Text / WhatsApp Summary ─────────────────────────────
  const handleCopyText = () => {
    const text = `📊 *${businessName} — Business Analytics Report*
📅 Period: ${reportPeriodLabel}
Generated: ${new Date().toLocaleDateString("en-IN")}

📈 *Lead Performance:*
• Total Enquiries: ${filteredData.totalLeads}
• Won Customers: ${filteredData.wonLeads} (${filteredData.leadConversionRate}% Conversion)
• Active Pipeline: ${filteredData.activeLeads} leads
• Pipeline Potential: ${money(filteredData.leadsPipelineValue)}

💼 *Sales & Revenue:*
• Deals Closed: ${filteredData.wonDeals.length} Won
• Revenue Realized: ${money(filteredData.wonDealsValue)}
• Open Deals: ${filteredData.openDeals.length} (${money(filteredData.openDealsValue)} volume)
• Win Rate: ${filteredData.winRate}%

⏰ *Team Tasks:*
• Completed: ${filteredData.completedTasks}
• Pending: ${filteredData.pendingTasks}

— Generated via Occo Flow`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Report summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 3. Print / Save as PDF ──────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 print:p-0 print:border-0 print:shadow-none">
        {/* Header */}
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-700 font-bold">
                <BarChart3 size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Generate Analytics Report
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Create customized business intelligence summaries, Excel workbooks, or printable
                  PDFs.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-8 text-xs text-blue-600 font-semibold"
            >
              {previewMode ? "⚙️ Edit Settings" : "👁️ Preview Report"}
            </Button>
          </div>
        </DialogHeader>

        {/* ── Settings Form ── */}
        {!previewMode ? (
          <div className="mt-4 space-y-4 text-xs print:hidden">
            {/* 1. Report Type */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Report Scope / Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "comprehensive",
                    label: "📑 Master 360° Report",
                    desc: "All KPIs, Leads, Deals & Tasks",
                  },
                  {
                    id: "executive",
                    label: "📊 Executive Summary",
                    desc: "High-level revenues & win rates",
                  },
                  {
                    id: "leads",
                    label: "👥 Leads & Enquiries",
                    desc: "Conversion rates & sources",
                  },
                  {
                    id: "deals",
                    label: "💼 Sales & Pipeline",
                    desc: "Stages, volume & closed revenue",
                  },
                  { id: "tasks", label: "⏰ Productivity Log", desc: "Follow-up tasks completion" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReportType(item.id as ReportType)}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      reportType === item.id
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Date Range Presets */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Time Period / Date Range
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "this_month", label: "This Month" },
                  { id: "this_week", label: "This Week" },
                  { id: "last_30_days", label: "Last 30 Days" },
                  { id: "this_quarter", label: "This Quarter" },
                  { id: "all_time", label: "All Time" },
                  { id: "custom", label: "Custom Dates" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateRange(item.id as DateRangePreset)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      dateRange === item.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">
                      From Date
                    </span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">
                      To Date
                    </span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Included Breakdown Checkboxes */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Include Additional Analytics Sections:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSources}
                    onChange={(e) => setIncludeSources(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 text-xs">Lead Sources Funnel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePipeline}
                    onChange={(e) => setIncludePipeline(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 text-xs">Deal Pipeline Funnel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTopDeals}
                    onChange={(e) => setIncludeTopDeals(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 text-xs">Top Won Deals Ledger</span>
                </label>
              </div>
            </div>

            {/* Snapshot Metrics Bar */}
            <div className="rounded-xl bg-blue-50/50 border border-blue-200/60 p-3 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Report Scope</span>
                <span className="font-bold text-slate-800">{reportPeriodLabel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Leads</span>
                <span className="font-bold text-blue-700">{filteredData.totalLeads}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Won Revenue</span>
                <span className="font-bold text-emerald-700">
                  {money(filteredData.wonDealsValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Win Rate</span>
                <span className="font-bold text-slate-800">{filteredData.winRate}%</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="rounded-xl h-9 text-xs flex items-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Summary"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(true)}
                  className="rounded-xl h-9 text-xs flex items-center gap-1.5 text-slate-700"
                >
                  <Printer size={14} /> Print / PDF Slip
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportExcel}
                  className="rounded-xl h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet size={15} /> Download Excel (.xlsx)
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Printable Report Preview Canvas ── */
          <div className="mt-2 space-y-4 text-xs">
            <div className="flex justify-between items-center print:hidden border-b pb-2">
              <span className="font-semibold text-slate-600">Executive Document Preview</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="rounded-lg h-8 text-xs flex items-center gap-1"
                >
                  <Printer size={13} /> Print / Save as PDF
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportExcel}
                  className="rounded-lg h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1"
                >
                  <FileSpreadsheet size={13} /> Export Excel
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 print:border-0 print:p-2">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{businessName}</h2>
                  <p className="text-[11px] text-slate-500">
                    Business Analytics & Growth Intelligence Report
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Generated on {new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                    {reportPeriodLabel}
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    By: {profile?.fullName || "Administrator"}
                  </p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    TOTAL LEADS
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {filteredData.totalLeads}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    {filteredData.wonLeads} won
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    CONVERSION RATE
                  </span>
                  <span className="text-lg font-black text-blue-700">
                    {filteredData.leadConversionRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {filteredData.activeLeads} in progress
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    WON REVENUE
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {money(filteredData.wonDealsValue)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    {filteredData.wonDeals.length} deals closed
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    OPEN PIPELINE
                  </span>
                  <span className="text-lg font-black text-amber-700">
                    {money(filteredData.openDealsValue)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {filteredData.openDeals.length} deals open
                  </span>
                </div>
              </div>

              {/* Pipeline Funnel */}
              {includePipeline && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">
                    Deal Pipeline Distribution
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    {dealStages.map((stg) => (
                      <div key={stg} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">{stg}:</span>
                        <span className="font-bold text-slate-800">
                          {filteredData.stagesMap[stg]?.count || 0} (
                          {money(filteredData.stagesMap[stg]?.value || 0)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lead Sources */}
              {includeSources && Object.keys(filteredData.sourcesMap).length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Lead Sources Breakdown</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filteredData.sourcesMap).map(([src, count]) => (
                      <div
                        key={src}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      >
                        <span className="text-slate-500">{src}: </span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Deals List */}
              {includeTopDeals && filteredData.wonDeals.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Recent Won Deals</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                        <tr>
                          <th className="p-2.5">Deal</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {filteredData.wonDeals.slice(0, 5).map((d) => (
                          <tr key={d.id}>
                            <td className="p-2.5 font-semibold text-slate-800">{d.title}</td>
                            <td className="p-2.5 text-slate-600">{d.customer}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              {money(d.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t text-[10px] text-slate-400 flex justify-between items-center">
                <span>Occo Flow · Confidential</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
