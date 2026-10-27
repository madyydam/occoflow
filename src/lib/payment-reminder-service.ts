import { supabase } from "./supabase";
import * as XLSX from "xlsx";

export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Overdue";
export type PaymentMode = "UPI" | "Bank Transfer" | "Cash" | "Cheque" | "Razorpay" | "Other";
export type ReminderTone = "friendly" | "firm" | "final";
export type RecurringInterval = "none" | "monthly" | "quarterly" | "yearly";

export interface Installment {
  id: string;
  amount: number;
  date: string; // ISO yyyy-MM-dd
  paymentMode: PaymentMode;
  referenceNo?: string | undefined;
  notes?: string | undefined;
  recordedBy?: string | undefined;
}

export interface ReminderLog {
  id: string;
  sentAt: string; // ISO timestamp
  channel: "whatsapp" | "sms" | "email" | "in_app" | "call";
  tone: ReminderTone;
  sentBy: string;
  customerReply?: string | undefined;
  promiseDate?: string | undefined;
}

export interface PaymentRecord {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  invoiceNumber: string;
  dealId?: string | null | undefined;
  leadId?: string | null | undefined;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string; // ISO yyyy-MM-dd
  status: PaymentStatus;
  paymentMode: PaymentMode;
  notes: string;
  upiId: string; // e.g. merchant@upi

  // Recurring
  recurringInterval: RecurringInterval;
  nextRecurringDate?: string | null | undefined;

  // Promise to pay
  promiseToPayDate?: string | null | undefined;
  promiseToPayAmount?: number | null | undefined;
  promiseToPayNote?: string | null | undefined;

  // Late fee
  lateFeeEnabled?: boolean | undefined;
  lateFeeType?: "percentage" | "flat" | undefined;
  lateFeeRate?: number | undefined;
  calculatedLateFee?: number | undefined;

  // History
  installments: Installment[];
  reminderLogs: ReminderLog[];

  lastRemindedAt?: string | null | undefined;
  autoRemindEnabled: boolean;

  createdById?: string | null | undefined;
  createdByName?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface AgingBucketSummary {
  bucket: "not_due" | "1_30" | "31_60" | "61_90" | "90_plus";
  label: string;
  count: number;
  amount: number;
  records: PaymentRecord[];
}

export interface AgingReport {
  notDue: AgingBucketSummary;
  days1To30: AgingBucketSummary;
  days31To60: AgingBucketSummary;
  days61To90: AgingBucketSummary;
  days90Plus: AgingBucketSummary;
  totalOutstanding: number;
}

// ── Helpers ────────────────────────────────────────────────────────
export function getDaysDifference(targetDate: string): number {
  if (!targetDate) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - target.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function computeRecordStatus(record: {
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
}): PaymentStatus {
  const balance = Math.max(0, record.totalAmount - record.paidAmount);
  if (balance <= 0) return "Paid";
  const overdueDays = getDaysDifference(record.dueDate);
  if (overdueDays > 0) return "Overdue";
  if (record.paidAmount > 0) return "Partial";
  return "Unpaid";
}

// ── UPI URL Generator ──────────────────────────────────────────────
export function generateUpiUrl(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNo: string;
}): string {
  const cleanUpi = (params.upiId || "").trim();
  const name = encodeURIComponent((params.payeeName || "Business").trim());
  const note = encodeURIComponent(`Payment for ${params.invoiceNo}`);
  const amt = params.amount > 0 ? params.amount.toFixed(2) : "";

  if (!cleanUpi) {
    return "";
  }
  return `upi://pay?pa=${cleanUpi}&pn=${name}&am=${amt}&tn=${note}&cu=INR`;
}

export function getUpiQrCodeUrl(upiUrl: string): string {
  if (!upiUrl) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
}

// ── Smart Message Templates for Indian SMBs ────────────────────────
export function generateReminderMessage(params: {
  tone: ReminderTone;
  record: PaymentRecord;
  businessName: string;
  businessPhone?: string;
  customUpiUrl?: string;
}): string {
  const { tone, record, businessName, businessPhone, customUpiUrl } = params;
  const balance = record.balanceAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
  const invoice = record.invoiceNumber;
  const due = new Date(record.dueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const upiLink = customUpiUrl || (record.upiId ? `UPI: ${record.upiId}` : "");

  switch (tone) {
    case "friendly":
      return `Namaste ${record.customerName},\n\nThis is a gentle reminder from *${businessName}* regarding Invoice #${invoice} for *${balance}*, which is due on *${due}*.\n\n${upiLink ? `💳 Pay instantly via UPI:\n${upiLink}\n\n` : ""}If you have already paid, please ignore this message. Thank you for your business! 🙏\n\n— ${businessName}`;

    case "firm":
      return `Dear ${record.customerName},\n\nYour payment of *${balance}* for Invoice #${invoice} from *${businessName}* was due on *${due}* and is currently *OVERDUE*.\n\nPlease clear the outstanding balance today to avoid service interruption or late fees.\n\n${upiLink ? `💳 Click here to pay immediately:\n${upiLink}\n\n` : ""}Kindly share the payment screenshot once done.${businessPhone ? `\nContact: ${businessPhone}` : ""}\n\n— Accounts Team, ${businessName}`;

    case "final":
      return `⚠️ *FINAL PAYMENT NOTICE* ⚠️\n\nDear ${record.customerName},\n\nDespite repeated reminders, Invoice #${invoice} for *${balance}* remains unpaid and is severely overdue since *${due}*.\n\nPlease treat this as a final notice to settle the balance within 24 hours:\n${upiLink ? `💳 Pay Now: ${upiLink}\n\n` : ""}Failure to respond may lead to account suspension and further escalation.${businessPhone ? `\nHelpline: ${businessPhone}` : ""}\n\n— Accounts & Finance, ${businessName}`;
  }
}

// ── Local Storage Cache Fallback ───────────────────────────────────
function getLocalPayments(businessId: string): PaymentRecord[] {
  try {
    const raw =
      localStorage.getItem(`occo_payment_records_${businessId}`) ||
      localStorage.getItem(`futora_payment_records_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalPayments(businessId: string, records: PaymentRecord[]) {
  try {
    localStorage.setItem(`occo_payment_records_${businessId}`, JSON.stringify(records));
  } catch (e) {
    console.warn("[PaymentService] Local storage save error:", e);
  }
}

// ── Service Implementation ─────────────────────────────────────────
export const paymentReminderService = {
  // Fetch all payment records for current business
  async list(businessId: string): Promise<PaymentRecord[]> {
    if (!businessId) return [];

    let fetchedRecords: PaymentRecord[] = [];
    let hasDedicatedTable = true;

    // 1. Try dedicated table first
    try {
      const { data, error } = await supabase
        .from("payment_records")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205" || error.message.includes("does not exist")) {
          hasDedicatedTable = false;
        } else {
          console.warn("[PaymentService] dedicated table query error:", error.message);
          hasDedicatedTable = false;
        }
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchedRecords = data.map((r: any) => ({
          id: r.id,
          businessId: r.business_id,
          customerName: r.customer_name,
          customerPhone: r.customer_phone || "",
          customerEmail: r.customer_email || "",
          invoiceNumber: r.invoice_number,
          dealId: r.deal_id || null,
          leadId: r.lead_id || null,
          totalAmount: Number(r.total_amount) || 0,
          paidAmount: Number(r.paid_amount) || 0,
          balanceAmount: Number(r.balance_amount) || 0,
          dueDate: r.due_date,
          status: computeRecordStatus({
            dueDate: r.due_date,
            totalAmount: Number(r.total_amount) || 0,
            paidAmount: Number(r.paid_amount) || 0,
          }),
          paymentMode: r.payment_mode || "UPI",
          notes: r.notes || "",
          upiId: r.upi_id || "",
          recurringInterval: r.recurring_interval || "none",
          nextRecurringDate: r.next_recurring_date || null,
          promiseToPayDate: r.promise_to_pay_date || null,
          promiseToPayAmount: r.promise_to_pay_amount ? Number(r.promise_to_pay_amount) : null,
          promiseToPayNote: r.promise_to_pay_note || "",
          lateFeeEnabled: Boolean(r.late_fee_enabled),
          lateFeeType: r.late_fee_type || "percentage",
          lateFeeRate: Number(r.late_fee_rate) || 0,
          calculatedLateFee: Number(r.calculated_late_fee) || 0,
          installments: Array.isArray(r.installments) ? r.installments : [],
          reminderLogs: Array.isArray(r.reminder_logs) ? r.reminder_logs : [],
          lastRemindedAt: r.last_reminded_at || null,
          autoRemindEnabled: r.auto_remind_enabled !== false,
          createdById: r.created_by_id || null,
          createdByName: r.created_by_name || "",
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch {
      hasDedicatedTable = false;
    }

    // 2. Fallback to Supabase `activities` table with `type: 'payment_record'`
    if (!hasDedicatedTable || fetchedRecords.length === 0) {
      try {
        const { data: actData, error: actError } = await supabase
          .from("activities")
          .select("*")
          .eq("business_id", businessId)
          .eq("type", "payment_record")
          .order("created_at", { ascending: false });

        if (!actError && actData && actData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actRecords: PaymentRecord[] = actData.map((act: any) => {
            let parsed: Partial<PaymentRecord> = {};
            try {
              parsed = JSON.parse(act.detail || "{}");
            } catch {
              parsed = {};
            }
            const total = Number(parsed.totalAmount) || 0;
            const paid = Number(parsed.paidAmount) || 0;
            const dueDate = parsed.dueDate || act.created_at.split("T")[0];

            return {
              id: act.id,
              businessId: act.business_id,
              customerName: parsed.customerName || act.title || "Customer",
              customerPhone: parsed.customerPhone || "",
              customerEmail: parsed.customerEmail || "",
              invoiceNumber: parsed.invoiceNumber || act.title || "INV-001",
              dealId: act.deal_id || parsed.dealId || null,
              leadId: act.lead_id || parsed.leadId || null,
              totalAmount: total,
              paidAmount: paid,
              balanceAmount: Math.max(0, total - paid),
              dueDate,
              status: computeRecordStatus({ dueDate, totalAmount: total, paidAmount: paid }),
              paymentMode: (parsed.paymentMode as PaymentMode) || "UPI",
              notes: parsed.notes || "",
              upiId: parsed.upiId || "",
              recurringInterval: parsed.recurringInterval || "none",
              nextRecurringDate: parsed.nextRecurringDate || null,
              promiseToPayDate: parsed.promiseToPayDate || null,
              promiseToPayAmount: parsed.promiseToPayAmount || null,
              promiseToPayNote: parsed.promiseToPayNote || "",
              lateFeeEnabled: parsed.lateFeeEnabled || false,
              lateFeeType: parsed.lateFeeType || "percentage",
              lateFeeRate: parsed.lateFeeRate || 0,
              calculatedLateFee: parsed.calculatedLateFee || 0,
              installments: Array.isArray(parsed.installments) ? parsed.installments : [],
              reminderLogs: Array.isArray(parsed.reminderLogs) ? parsed.reminderLogs : [],
              lastRemindedAt: parsed.lastRemindedAt || null,
              autoRemindEnabled: parsed.autoRemindEnabled !== false,
              createdById: act.user_id || null,
              createdByName: parsed.createdByName || "",
              createdAt: act.created_at,
              updatedAt: parsed.updatedAt || act.created_at,
            };
          });

          if (actRecords.length > 0) {
            fetchedRecords = actRecords;
          }
        }
      } catch (err) {
        console.warn("[PaymentService] activities fallback query error:", err);
      }
    }

    // Merge with local storage if remote returned empty but local has items
    const local = getLocalPayments(businessId);
    if (fetchedRecords.length === 0 && local.length > 0) {
      fetchedRecords = local;
    } else if (fetchedRecords.length > 0) {
      setLocalPayments(businessId, fetchedRecords);
    }

    return fetchedRecords;
  },

  // Create a new invoice / payment record
  async create(
    record: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<PaymentRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const balance = Math.max(0, record.totalAmount - record.paidAmount);
    const status = computeRecordStatus({
      dueDate: record.dueDate,
      totalAmount: record.totalAmount,
      paidAmount: record.paidAmount,
    });

    const newRecord: PaymentRecord = {
      ...record,
      id,
      balanceAmount: balance,
      status,
      installments: record.installments || [],
      reminderLogs: record.reminderLogs || [],
      createdAt: now,
      updatedAt: now,
    };

    // 1. Try dedicated table in Supabase
    try {
      await supabase.from("payment_records").insert([
        {
          id: newRecord.id,
          business_id: newRecord.businessId,
          customer_name: newRecord.customerName,
          customer_phone: newRecord.customerPhone,
          customer_email: newRecord.customerEmail,
          invoice_number: newRecord.invoiceNumber,
          deal_id: newRecord.dealId || null,
          lead_id: newRecord.leadId || null,
          total_amount: newRecord.totalAmount,
          paid_amount: newRecord.paidAmount,
          balance_amount: newRecord.balanceAmount,
          due_date: newRecord.dueDate,
          status: newRecord.status,
          payment_mode: newRecord.paymentMode,
          notes: newRecord.notes,
          upi_id: newRecord.upiId,
          recurring_interval: newRecord.recurringInterval,
          next_recurring_date: newRecord.nextRecurringDate || null,
          promise_to_pay_date: newRecord.promiseToPayDate || null,
          promise_to_pay_amount: newRecord.promiseToPayAmount || null,
          promise_to_pay_note: newRecord.promiseToPayNote || "",
          late_fee_enabled: newRecord.lateFeeEnabled || false,
          late_fee_type: newRecord.lateFeeType || "percentage",
          late_fee_rate: newRecord.lateFeeRate || 0,
          calculated_late_fee: newRecord.calculatedLateFee || 0,
          installments: newRecord.installments,
          reminder_logs: newRecord.reminderLogs,
          last_reminded_at: newRecord.lastRemindedAt || null,
          auto_remind_enabled: newRecord.autoRemindEnabled,
          created_by_id: newRecord.createdById || null,
          created_by_name: newRecord.createdByName || "",
        },
      ]);
    } catch {
      // Ignored if table not created
    }

    // 2. Persist to Supabase `activities` table (guaranteed cloud storage)
    try {
      await supabase.from("activities").insert([
        {
          id: newRecord.id,
          business_id: newRecord.businessId,
          lead_id: newRecord.leadId || null,
          deal_id: newRecord.dealId || null,
          type: "payment_record",
          title: newRecord.invoiceNumber,
          detail: JSON.stringify(newRecord),
        },
      ]);
    } catch (e) {
      console.warn("[PaymentService] failed to save to activities:", e);
    }

    // 3. Update local cache
    const existing = getLocalPayments(record.businessId);
    setLocalPayments(record.businessId, [newRecord, ...existing]);

    return newRecord;
  },

  // Record an installment / partial payment
  async recordInstallment(
    paymentId: string,
    installment: Omit<Installment, "id">,
    businessId: string,
  ): Promise<PaymentRecord | null> {
    const list = await this.list(businessId);
    const target = list.find((r) => r.id === paymentId);
    if (!target) return null;

    const newInst: Installment = {
      ...installment,
      id: crypto.randomUUID(),
    };

    const newPaidAmount = target.paidAmount + installment.amount;
    const newBalance = Math.max(0, target.totalAmount - newPaidAmount);
    const newStatus = computeRecordStatus({
      dueDate: target.dueDate,
      totalAmount: target.totalAmount,
      paidAmount: newPaidAmount,
    });

    const updated: PaymentRecord = {
      ...target,
      paidAmount: newPaidAmount,
      balanceAmount: newBalance,
      status: newStatus,
      installments: [newInst, ...target.installments],
      updatedAt: new Date().toISOString(),
    };

    // Update in Supabase
    try {
      await supabase
        .from("payment_records")
        .update({
          paid_amount: updated.paidAmount,
          balance_amount: updated.balanceAmount,
          status: updated.status,
          installments: updated.installments,
          updated_at: updated.updatedAt,
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    try {
      await supabase
        .from("activities")
        .update({
          detail: JSON.stringify(updated),
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    // Update local storage
    const updatedList = list.map((r) => (r.id === paymentId ? updated : r));
    setLocalPayments(businessId, updatedList);

    return updated;
  },

  // Log a reminder sent to customer
  async logReminder(
    paymentId: string,
    log: Omit<ReminderLog, "id" | "sentAt">,
    businessId: string,
  ): Promise<PaymentRecord | null> {
    const list = await this.list(businessId);
    const target = list.find((r) => r.id === paymentId);
    if (!target) return null;

    const now = new Date().toISOString();
    const newLog: ReminderLog = {
      ...log,
      id: crypto.randomUUID(),
      sentAt: now,
    };

    const updated: PaymentRecord = {
      ...target,
      lastRemindedAt: now,
      reminderLogs: [newLog, ...target.reminderLogs],
      updatedAt: now,
    };

    try {
      await supabase
        .from("payment_records")
        .update({
          last_reminded_at: now,
          reminder_logs: updated.reminderLogs,
          updated_at: now,
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    try {
      await supabase
        .from("activities")
        .update({
          detail: JSON.stringify(updated),
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    const updatedList = list.map((r) => (r.id === paymentId ? updated : r));
    setLocalPayments(businessId, updatedList);

    return updated;
  },

  // Set Promise to Pay (PTP) date and committed amount
  async setPromiseToPay(
    paymentId: string,
    ptpDate: string,
    ptpAmount: number,
    ptpNote: string,
    businessId: string,
  ): Promise<PaymentRecord | null> {
    const list = await this.list(businessId);
    const target = list.find((r) => r.id === paymentId);
    if (!target) return null;

    const now = new Date().toISOString();
    const updated: PaymentRecord = {
      ...target,
      promiseToPayDate: ptpDate,
      promiseToPayAmount: ptpAmount,
      promiseToPayNote: ptpNote,
      updatedAt: now,
    };

    try {
      await supabase
        .from("payment_records")
        .update({
          promise_to_pay_date: ptpDate,
          promise_to_pay_amount: ptpAmount,
          promise_to_pay_note: ptpNote,
          updated_at: now,
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    try {
      await supabase
        .from("activities")
        .update({
          detail: JSON.stringify(updated),
        })
        .eq("id", paymentId);
    } catch {
      // ignore
    }

    const updatedList = list.map((r) => (r.id === paymentId ? updated : r));
    setLocalPayments(businessId, updatedList);

    return updated;
  },

  // Delete payment record
  async delete(paymentId: string, businessId: string): Promise<boolean> {
    try {
      await supabase.from("payment_records").delete().eq("id", paymentId);
    } catch {
      // ignore
    }
    try {
      await supabase.from("activities").delete().eq("id", paymentId);
    } catch {
      // ignore
    }

    const list = getLocalPayments(businessId);
    setLocalPayments(
      businessId,
      list.filter((r) => r.id !== paymentId),
    );
    return true;
  },

  // Calculate Aging Buckets (0-30, 31-60, 61-90, 90+ days)
  calculateAging(records: PaymentRecord[]): AgingReport {
    const notDue: AgingBucketSummary = {
      bucket: "not_due",
      label: "Not Due (Current)",
      count: 0,
      amount: 0,
      records: [],
    };
    const days1To30: AgingBucketSummary = {
      bucket: "1_30",
      label: "1 - 30 Days Overdue",
      count: 0,
      amount: 0,
      records: [],
    };
    const days31To60: AgingBucketSummary = {
      bucket: "31_60",
      label: "31 - 60 Days Overdue",
      count: 0,
      amount: 0,
      records: [],
    };
    const days61To90: AgingBucketSummary = {
      bucket: "61_90",
      label: "61 - 90 Days Overdue",
      count: 0,
      amount: 0,
      records: [],
    };
    const days90Plus: AgingBucketSummary = {
      bucket: "90_plus",
      label: "90+ Days Overdue (High Risk)",
      count: 0,
      amount: 0,
      records: [],
    };

    let totalOutstanding = 0;

    for (const r of records) {
      if (r.status === "Paid" || r.balanceAmount <= 0) continue;

      totalOutstanding += r.balanceAmount;
      const overdueDays = getDaysDifference(r.dueDate);

      if (overdueDays <= 0) {
        notDue.count++;
        notDue.amount += r.balanceAmount;
        notDue.records.push(r);
      } else if (overdueDays <= 30) {
        days1To30.count++;
        days1To30.amount += r.balanceAmount;
        days1To30.records.push(r);
      } else if (overdueDays <= 60) {
        days31To60.count++;
        days31To60.amount += r.balanceAmount;
        days31To60.records.push(r);
      } else if (overdueDays <= 90) {
        days61To90.count++;
        days61To90.amount += r.balanceAmount;
        days61To90.records.push(r);
      } else {
        days90Plus.count++;
        days90Plus.amount += r.balanceAmount;
        days90Plus.records.push(r);
      }
    }

    return {
      notDue,
      days1To30,
      days31To60,
      days61To90,
      days90Plus,
      totalOutstanding,
    };
  },

  // Export full payment records & ledger to Excel
  exportToExcel(records: PaymentRecord[], businessName: string): void {
    const rows = records.map((r) => {
      const days = getDaysDifference(r.dueDate);
      const agingTag =
        r.status === "Paid"
          ? "Paid"
          : days <= 0
            ? "Current (Not Due)"
            : days <= 30
              ? "1-30 Days"
              : days <= 60
                ? "31-60 Days"
                : days <= 90
                  ? "61-90 Days"
                  : "90+ Days Overdue";

      return {
        "Invoice No.": r.invoiceNumber,
        "Customer Name": r.customerName,
        "Customer Phone": r.customerPhone,
        "Customer Email": r.customerEmail || "",
        "Total Amount (INR)": r.totalAmount,
        "Paid Amount (INR)": r.paidAmount,
        "Balance Outstanding (INR)": r.balanceAmount,
        "Due Date": r.dueDate,
        Status: r.status,
        "Aging Bucket": agingTag,
        "Payment Mode": r.paymentMode,
        "Promise-to-Pay Date": r.promiseToPayDate || "",
        "PTP Amount": r.promiseToPayAmount || "",
        "Last Reminded": r.lastRemindedAt
          ? new Date(r.lastRemindedAt).toLocaleDateString()
          : "Never",
        "Total Installments": r.installments.length,
        Notes: r.notes || "",
        "Created Date": new Date(r.createdAt).toLocaleDateString(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Reminders");

    const fileName = `${(businessName || "Occo_Flow").replace(/\s+/g, "_")}_Payment_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },
};
