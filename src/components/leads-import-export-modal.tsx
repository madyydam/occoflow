import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useCRM } from "@/lib/crm-context";
import type { Lead, LeadPriority, LeadStatus } from "@/lib/crm-data";

interface ParsedLeadRow {
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  value: number;
  notes: string;
  isValid: boolean;
  error?: string | undefined;
}

// ── Export leads to an Excel workbook ──────────────────────────────
export function exportLeadsToExcel(leads: Lead[], filenamePrefix = "Occo_Flow_Leads") {
  if (!leads || leads.length === 0) {
    toast.error("No leads available to export.");
    return;
  }

  try {
    const data = leads.map((l, index) => ({
      "Sr No": index + 1,
      "Customer Name": l.name || "",
      Phone: l.phone || "",
      Email: l.email || "",
      Company: l.company || "",
      "Lead Source": l.source || "Website",
      Status: l.status || "New",
      Priority: l.priority || "Medium",
      "Potential Value (INR)": l.value || 0,
      "Next Follow-up": l.followUp || "",
      Notes: l.notes || "",
      "Created Date": l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const columnWidths = [
      { wch: 8 }, // Sr No
      { wch: 24 }, // Customer Name
      { wch: 18 }, // Phone
      { wch: 26 }, // Email
      { wch: 22 }, // Company
      { wch: 16 }, // Lead Source
      { wch: 14 }, // Status
      { wch: 12 }, // Priority
      { wch: 22 }, // Potential Value
      { wch: 20 }, // Next Follow-up
      { wch: 32 }, // Notes
      { wch: 16 }, // Created Date
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Pipeline");

    const today = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${today}.xlsx`;

    XLSX.writeFile(workbook, filename);
    toast.success(
      `Exported ${leads.length} ${leads.length === 1 ? "lead" : "leads"} to Excel (${filename})!`,
    );
  } catch (err) {
    console.error("[Export Excel] Failed:", err);
    toast.error("Failed to generate Excel report. Please try again.");
  }
}

// ── Download standard sample template ──────────────────────────────
export function downloadSampleTemplate() {
  try {
    const sampleRows = [
      {
        "Customer Name": "Rajesh Sharma",
        Phone: "+91 9876543210",
        Email: "rajesh@example.com",
        Company: "Sharma Logistics Ltd",
        "Lead Source": "Referral",
        Status: "New",
        Priority: "High",
        "Potential Value (INR)": 85000,
        Notes: "Interested in corporate annual fleet contract. Call after 2 PM.",
      },
      {
        "Customer Name": "Pooja Mehta",
        Phone: "+91 9822012345",
        Email: "pooja.mehta@techbiz.in",
        Company: "TechBiz Solutions",
        "Lead Source": "Google",
        Status: "Contacted",
        Priority: "Medium",
        "Potential Value (INR)": 45000,
        Notes: "Requested product demo presentation on Thursday.",
      },
      {
        "Customer Name": "Amit Deshmukh",
        Phone: "+91 9765432109",
        Email: "amit@deshmukhindustries.com",
        Company: "Deshmukh Industries",
        "Lead Source": "Website",
        Status: "Qualified",
        Priority: "Low",
        "Potential Value (INR)": 25000,
        Notes: "Exploring CRM integration for manufacturing unit.",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 28 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
      { wch: 38 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Import Template");

    XLSX.writeFile(workbook, "Occo_Flow_Leads_Import_Template.xlsx");
    toast.success("Sample Excel template downloaded! Fill your data and import.");
  } catch (err) {
    console.error("[Download Template] Failed:", err);
    toast.error("Failed to download template.");
  }
}

// ── Column Normalization Helper ────────────────────────────────────
function normalizeColumnKey(rawKey: string): string {
  const k = rawKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (k.includes("name") || k === "customer" || k === "client" || k === "person") return "name";
  if (k.includes("phone") || k.includes("mobile") || k.includes("contact") || k.includes("cell"))
    return "phone";
  if (k.includes("email") || k.includes("mail")) return "email";
  if (k.includes("comp") || k.includes("org") || k.includes("firm") || k.includes("business"))
    return "company";
  if (k.includes("source") || k.includes("channel") || k.includes("origin")) return "source";
  if (k.includes("status") || k.includes("stage")) return "status";
  if (k.includes("priority")) return "priority";
  if (
    k.includes("val") ||
    k.includes("amount") ||
    k.includes("deal") ||
    k.includes("price") ||
    k.includes("budget") ||
    k.includes("cost")
  )
    return "value";
  if (k.includes("note") || k.includes("remark") || k.includes("comment") || k.includes("desc"))
    return "notes";
  return k;
}

function normalizeStatus(s: string): LeadStatus {
  const val = (s || "").trim().toLowerCase();
  if (val.includes("contact")) return "Contacted";
  if (val.includes("qualif")) return "Qualified";
  if (val.includes("follow") || val.includes("next")) return "Follow-up";
  if (val.includes("won") || val.includes("closed") || val.includes("done")) return "Won";
  if (val.includes("lost") || val.includes("drop") || val.includes("cancel")) return "Lost";
  return "New";
}

function normalizePriority(p: string): LeadPriority {
  const val = (p || "").trim().toLowerCase();
  if (val.includes("high") || val.includes("urgent")) return "High";
  if (val.includes("low")) return "Low";
  return "Medium";
}

// ── Bulk Import Modal Component ────────────────────────────────────
export function LeadsImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { business } = useAuth();
  const { refresh } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls" && ext !== "csv") {
      toast.error("Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)");
      return;
    }

    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        toast.error("The spreadsheet is empty.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        toast.error("Could not read spreadsheet sheet.");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      if (rawData.length === 0) {
        toast.error("No data rows found in the spreadsheet.");
        return;
      }

      const results: ParsedLeadRow[] = rawData.map((row, idx) => {
        // Normalize row keys
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(row)) {
          const normKey = normalizeColumnKey(key);
          mapped[normKey] = String(val ?? "").trim();
        }

        const name = mapped["name"] || "";
        const phone = mapped["phone"] || "";
        const email = mapped["email"] || "";
        const company = mapped["company"] || "";
        const source = mapped["source"] || "Import";
        const status = normalizeStatus(mapped["status"] || "New");
        const priority = normalizePriority(mapped["priority"] || "Medium");
        const rawValue = mapped["value"]?.replace(/[^0-9.]/g, "");
        const value = Number(rawValue) || 0;
        const notes = mapped["notes"] || "";

        const isValid = Boolean(name && name.length >= 2);
        const error = !isValid ? `Row ${idx + 2}: Name is missing` : undefined;

        return {
          name,
          phone,
          email,
          company,
          source,
          status,
          priority,
          value,
          notes,
          isValid,
          error,
        };
      });

      setParsedRows(results);
      toast.success(`Found ${results.length} rows in ${file.name}.`);
    } catch (err) {
      console.error("[Parse File] Error:", err);
      toast.error("Could not read file. Make sure it's a valid Excel or CSV spreadsheet.");
    }
  };

  const handleImport = async () => {
    if (!business?.id) {
      toast.error("Business workspace not found. Please refresh.");
      return;
    }

    if (validRows.length === 0) {
      toast.error("No valid rows with a customer name found to import.");
      return;
    }

    setImporting(true);
    try {
      const recordsToInsert = validRows.map((r) => ({
        business_id: business.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        company: r.company,
        source: r.source || "Bulk Import",
        status: r.status || "New",
        priority: r.priority || "Medium",
        value: r.value || 0,
        notes: r.notes || "",
        archived: false,
      }));

      // Insert in chunks of 50 to avoid request size limits
      const chunkSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
        const chunk = recordsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("leads").insert(chunk);
        if (error) {
          console.error("[Bulk Import] Insert chunk error:", error);
          throw error;
        }
        insertedCount += chunk.length;
      }

      toast.success(`🎉 Successfully imported ${insertedCount} leads into your pipeline!`);
      await refresh();
      handleClose();
    } catch (err) {
      console.error("[Bulk Import] Failed:", err);
      toast.error("Failed to import some rows. Please verify database connection.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (importing) return;
    setFileName("");
    setParsedRows([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-h-[92dvh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl p-0 shadow-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <DialogTitle className="font-display text-base font-bold sm:text-lg">
                  Bulk Import Leads
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Import multiple leads at once from Excel (.xlsx, .xls) or CSV file.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleTemplate}
              className="h-8.5 rounded-lg border-border text-xs font-semibold shadow-none text-primary hover:bg-sky-50"
            >
              <Download size={14} className="mr-1.5" /> Sample Format
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Format Explanation Card */}
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
            <div className="flex items-start gap-2.5">
              <Info size={17} className="mt-0.5 shrink-0 text-sky-600" />
              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Supported Column Headers:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  <span className="font-medium text-emerald-700">
                    ✓ Customer Name{" "}
                    <span className="text-[10px] uppercase font-bold text-emerald-800">
                      (Required)
                    </span>
                  </span>
                  <span>• Phone / Mobile</span>
                  <span>• Email Address</span>
                  <span>• Company / Business</span>
                  <span>• Lead Source</span>
                  <span>• Status (New, Won, etc.)</span>
                  <span>• Priority (Low/Med/High)</span>
                  <span>• Potential Value (INR)</span>
                  <span>• Notes / Remarks</span>
                </div>
                <p className="pt-1 text-[11px] text-slate-500">
                  Tip: Column order doesn't matter. Click{" "}
                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="font-bold text-primary underline cursor-pointer"
                  >
                    Download Sample Format
                  </button>{" "}
                  for a ready-made template.
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Drop Zone */}
          {!fileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-primary bg-sky-50/70"
                  : "border-border bg-slate-50/60 hover:border-primary/50 hover:bg-sky-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="mb-3 grid size-13 place-items-center rounded-2xl bg-white shadow-xs text-primary">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-foreground">
                Drop your Excel (.xlsx, .xls) or CSV file here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse from your device
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedRows.length} total rows detected •{" "}
                    <span className="font-semibold text-emerald-600">{validRows.length} valid</span>
                    {invalidRows.length > 0 && (
                      <span className="font-semibold text-amber-600">
                        {" "}
                        • {invalidRows.length} skipped (no name)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFileName("");
                  setParsedRows([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </Button>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data Preview (First {Math.min(parsedRows.length, 5)} of {parsedRows.length} rows)
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700"
                  >
                    <CheckCircle2 size={11} className="mr-1" /> {validRows.length} Ready
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700"
                    >
                      <AlertTriangle size={11} className="mr-1" /> {invalidRows.length} Skipped
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-52 overflow-x-auto overflow-y-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/70 text-[11px] font-bold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2 text-right">Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.isValid ? "hover:bg-muted/40" : "bg-amber-50/40 text-muted-foreground"
                        }
                      >
                        <td className="px-3 py-2 font-medium">
                          {row.name || (
                            <span className="italic text-amber-600">(Missing name)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{row.phone || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.company || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[11px] font-medium">{row.priority}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {row.value ? `₹${row.value.toLocaleString("en-IN")}` : "₹0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={importing}
            className="h-10 rounded-xl border-border px-4 text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className="h-10 rounded-xl px-5 text-xs font-bold gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Importing {validRows.length} Leads...
              </>
            ) : (
              <>
                Import {validRows.length > 0 ? `${validRows.length} Leads` : "Leads"}
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
