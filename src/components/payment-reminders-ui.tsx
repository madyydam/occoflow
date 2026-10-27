import { useState } from "react";
import {
  X,
  Plus,
  Send,
  QrCode,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Phone,
  Mail,
  Copy,
  Printer,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Building,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type PaymentRecord,
  type PaymentMode,
  type ReminderTone,
  type RecurringInterval,
  paymentReminderService,
  generateUpiUrl,
  getUpiQrCodeUrl,
  generateReminderMessage,
  getDaysDifference,
} from "@/lib/payment-reminder-service";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

// ── 1. Create New Payment Record Modal ──────────────────────────────
export function NewPaymentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (record: PaymentRecord) => void;
}) {
  const { leads, deals } = useCRM();
  const { business, profile } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [totalAmount, setTotalAmount] = useState("");
  const [initialPaid, setInitialPaid] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [upiId, setUpiId] = useState("");
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>("none");
  const [notes, setNotes] = useState("");
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeRate, setLateFeeRate] = useState("2"); // 2% per month
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick link to Lead / Deal
  const handleSelectLead = (leadId: string) => {
    const found = leads.find((l) => l.id === leadId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email);
      if (found.value > 0) setTotalAmount(String(found.value));
    }
  };

  const handleSelectDeal = (dealId: string) => {
    const found = deals.find((d) => d.id === dealId);
    if (found) {
      setCustomerName(found.customer);
      if (found.value > 0) setTotalAmount(String(found.value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !totalAmount.trim()) {
      toast.error("Please fill Customer Name, Phone number, and Amount.");
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(initialPaid) || 0;

    if (total <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const installments =
        paid > 0
          ? [
              {
                id: crypto.randomUUID(),
                amount: paid,
                date: new Date().toISOString().split("T")[0] || "",
                paymentMode,
                referenceNo: "Initial Advance",
                notes: "Advance payment during bill creation",
                recordedBy: profile?.fullName || "Staff",
              },
            ]
          : [];

      const created = await paymentReminderService.create({
        businessId: business?.id || "",
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        invoiceNumber: invoiceNumber.trim(),
        totalAmount: total,
        paidAmount: paid,
        balanceAmount: Math.max(0, total - paid),
        dueDate: dueDate || new Date().toISOString().split("T")[0] || "",
        status: paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid",
        paymentMode,
        notes: notes.trim(),
        upiId: upiId.trim(),
        recurringInterval,
        lateFeeEnabled,
        lateFeeType: "percentage",
        lateFeeRate: parseFloat(lateFeeRate) || 0,
        calculatedLateFee: 0,
        installments,
        reminderLogs: [],
        autoRemindEnabled: true,
        createdById: profile?.id || null,
        createdByName: profile?.fullName || "Staff",
      });

      toast.success(`Invoice ${created.invoiceNumber} created successfully!`);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save payment record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <IndianRupee size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Create Invoice / Payment Due
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Log an invoice or client receivable to track payments and automated reminders.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Quick autofill from Leads / Deals */}
          {(leads.length > 0 || deals.length > 0) && (
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                ⚡ Autofill from CRM (Optional):
              </span>
              <div className="flex flex-wrap gap-2">
                {leads.slice(0, 3).map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => handleSelectLead(l.id)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    👤 {l.name}
                  </button>
                ))}
                {deals.slice(0, 2).map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => handleSelectDeal(d.id)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    💼 {d.customer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Customer / Client Name *
              </label>
              <Input
                required
                placeholder="e.g. Ramesh Patel"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                WhatsApp / Phone Number *
              </label>
              <Input
                required
                placeholder="e.g. 9820011223"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email (Optional)</label>
              <Input
                type="email"
                placeholder="client@company.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Invoice / Bill Number *
              </label>
              <Input
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9 text-xs rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Total Bill Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">₹</span>
                <Input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="25000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="h-9 pl-6 text-xs rounded-xl font-bold"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Advance Received (₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={initialPaid}
                  onChange={(e) => setInitialPaid(e.target.value)}
                  className="h-9 pl-6 text-xs rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Due Date *</label>
              <Input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Payment Mode & UPI ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Preferred Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Razorpay">Razorpay / Online Link</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Your Business UPI ID (for QR code)
              </label>
              <Input
                placeholder="e.g. business@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Recurring & Late Fee Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Recurring Billing Schedule
              </label>
              <select
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value as RecurringInterval)}
                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs"
              >
                <option value="none">One-time Invoice (No recurring)</option>
                <option value="monthly">Monthly Recurring Dues</option>
                <option value="quarterly">Quarterly Dues</option>
                <option value="yearly">Annual Recurring</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="lateFeeCheck"
                  checked={lateFeeEnabled}
                  onChange={(e) => setLateFeeEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="lateFeeCheck"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Enable Overdue Late Fee
                </label>
              </div>
              {lateFeeEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={lateFeeRate}
                    onChange={(e) => setLateFeeRate(e.target.value)}
                    className="h-8 w-24 text-xs rounded-lg"
                  />
                  <span className="text-slate-500 text-[11px]">% per month on overdue balance</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Notes / Terms (Optional)
            </label>
            <Input
              placeholder="e.g. 50% milestone payment for Phase 1 delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? "Saving..." : "Create Payment Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── 2. Record Partial Payment / Installment Modal ───────────────────
export function RecordInstallmentModal({
  open,
  record,
  onClose,
  onSaved,
}: {
  open: boolean;
  record: PaymentRecord | null;
  onClose: () => void;
  onSaved: (updated: PaymentRecord) => void;
}) {
  const { profile, business } = useAuth();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<PaymentMode>("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (payAmt > record.balanceAmount) {
      const confirmOverpay = window.confirm(
        `Entered amount ₹${payAmt} is greater than remaining balance ₹${record.balanceAmount}. Proceed?`,
      );
      if (!confirmOverpay) return;
    }

    setIsSubmitting(true);
    try {
      const updated = await paymentReminderService.recordInstallment(
        record.id,
        {
          amount: payAmt,
          date: date || new Date().toISOString().split("T")[0] || "",
          paymentMode: mode,
          referenceNo: referenceNo.trim() || undefined,
          notes: notes.trim() || undefined,
          recordedBy: profile?.fullName || "Staff",
        },
        business?.id || "",
      );

      if (updated) {
        toast.success(`Received ₹${payAmt.toLocaleString()} for Invoice ${record.invoiceNumber}`);
        onSaved(updated);
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to record installment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Record Payment Received
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Invoice:{" "}
            <span className="font-mono font-semibold text-slate-800">{record.invoiceNumber}</span> ·{" "}
            {record.customerName}
          </DialogDescription>
        </DialogHeader>

        {/* Current status banner */}
        <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-500 block text-[11px]">Total Invoice</span>
            <span className="font-bold text-slate-800">
              ₹{record.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Paid so far</span>
            <span className="font-bold text-emerald-600">
              ₹{record.paidAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Outstanding Due</span>
            <span className="font-bold text-rose-600 text-sm">
              ₹{record.balanceAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Amount Received (₹) *</label>
              <button
                type="button"
                onClick={() => setAmount(String(record.balanceAmount))}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Clear Full Balance (₹{record.balanceAmount.toLocaleString("en-IN")})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <Input
                required
                type="number"
                min="1"
                step="any"
                placeholder={String(record.balanceAmount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 pl-7 text-sm font-bold rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PaymentMode)}
                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Razorpay">Razorpay Online</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              UTR / Ref No. / Cheque No. (Optional)
            </label>
            <Input
              placeholder="e.g. UPI Ref: 312349887712"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Remarks / Note (Optional)
            </label>
            <Input
              placeholder="e.g. Received via PhonePe QR scanner"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? "Recording..." : "Save Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── 3. Indian UPI QR Code & Instant Pay Modal ───────────────────────
export function UpiQrModal({
  open,
  record,
  onClose,
  onMarkPaid,
}: {
  open: boolean;
  record: PaymentRecord | null;
  onClose: () => void;
  onMarkPaid: () => void;
}) {
  const { business } = useAuth();
  const [copied, setCopied] = useState(false);
  const [customUpi, setCustomUpi] = useState(
    record?.upiId || (business && business.phone ? `${business.phone}@upi` : ""),
  );

  if (!record) return null;

  const upiIdToUse = record.upiId || customUpi || "payments@upi";
  const upiUrl = generateUpiUrl({
    upiId: upiIdToUse,
    payeeName: business?.name || "Occo Business",
    amount: record.balanceAmount,
    invoiceNo: record.invoiceNumber,
  });

  const qrImageUrl = getUpiQrCodeUrl(upiUrl);

  const handleCopyLink = () => {
    if (upiUrl) {
      navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      toast.success("UPI payment link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${record.customerName},\n\nPlease find the instant UPI Payment link for Invoice #${record.invoiceNumber} of ₹${record.balanceAmount.toLocaleString("en-IN")}:\n\n${upiUrl}\n\nYou can pay via Google Pay, PhonePe, Paytm, or BHIM. Thank you!\n— ${business?.name || "Accounts"}`,
    );
    const cleanPhone = record.customerPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-6 text-center">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Instant UPI Payment QR
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex flex-col items-center">
          <div className="relative p-3 rounded-2xl border-2 border-dashed border-sky-300 bg-white shadow-md">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="UPI Payment QR Code"
                className="size-48 object-contain rounded-xl"
              />
            ) : (
              <div className="size-48 grid place-items-center text-slate-400">QR Unavailable</div>
            )}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
              BHIM UPI
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-xl font-extrabold text-slate-900">
              ₹{record.balanceAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs font-semibold text-slate-600">
              Invoice #{record.invoiceNumber} · {record.customerName}
            </p>
            <p className="text-[11px] font-mono text-slate-500">{upiIdToUse}</p>
          </div>

          {/* Quick actions */}
          <div className="mt-5 w-full space-y-2">
            <Button
              onClick={handleShareWhatsApp}
              className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <MessageCircle size={15} /> Send UPI QR on WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-8.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onMarkPaid();
                }}
                className="h-8.5 rounded-xl text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 4. Multi-Channel Send Reminder Modal ───────────────────────────
export function SendReminderModal({
  open,
  record,
  onClose,
  onLogged,
}: {
  open: boolean;
  record: PaymentRecord | null;
  onClose: () => void;
  onLogged: (updated: PaymentRecord) => void;
}) {
  const { business, profile } = useAuth();
  const [tone, setTone] = useState<ReminderTone>("friendly");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [editedMessage, setEditedMessage] = useState("");

  if (!record) return null;

  const daysOverdue = getDaysDifference(record.dueDate);
  const suggestedTone: ReminderTone =
    daysOverdue > 14 ? "final" : daysOverdue > 1 ? "firm" : "friendly";

  // Regenerate message on tone change
  const currentMessage =
    editedMessage ||
    generateReminderMessage({
      tone,
      record,
      businessName: business?.name || "Our Company",
      businessPhone: business?.phone || "",
    });

  const handleToneChange = (t: ReminderTone) => {
    setTone(t);
    setEditedMessage(
      generateReminderMessage({
        tone: t,
        record,
        businessName: business?.name || "Our Company",
        businessPhone: business?.phone || "",
      }),
    );
  };

  const handleSend = async () => {
    const cleanPhone = record.customerPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(currentMessage);

    if (channel === "whatsapp") {
      window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, "_blank");
    } else if (channel === "sms") {
      window.open(`sms:${record.customerPhone}?body=${encodedText}`, "_blank");
    } else if (channel === "email") {
      const email = record.customerEmail || "";
      const subject = encodeURIComponent(
        `Payment Reminder: Invoice #${record.invoiceNumber} - ${business?.name || "Occo Flow"}`,
      );
      window.open(`mailto:${email}?subject=${subject}&body=${encodedText}`, "_blank");
    }

    // Log the reminder in database
    const updated = await paymentReminderService.logReminder(
      record.id,
      {
        channel,
        tone,
        sentBy: profile?.fullName || "Staff",
      },
      business?.id || "",
    );

    if (updated) {
      toast.success(`Reminder sent and logged for Invoice ${record.invoiceNumber}`);
      onLogged(updated);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Send Payment Reminder
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Invoice #{record.invoiceNumber} · Due: {record.dueDate} (
            {daysOverdue > 0 ? `${daysOverdue} days overdue` : "Due soon"})
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-4 text-xs">
          {/* Tone Selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Reminder Tone</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleToneChange("friendly")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  tone === "friendly"
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs">😊 Friendly</span>
                <span className="text-[10px] text-slate-500 font-normal">Gentle reminder</span>
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("firm")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  tone === "firm"
                    ? "border-amber-500 bg-amber-50/70 text-amber-900 font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs">⚖️ Firm</span>
                <span className="text-[10px] text-slate-500 font-normal">Overdue notice</span>
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("final")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  tone === "final"
                    ? "border-rose-500 bg-rose-50/70 text-rose-900 font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs">🚨 Final Notice</span>
                <span className="text-[10px] text-slate-500 font-normal">Urgent 24h notice</span>
              </button>
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Delivery Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold ${
                  channel === "whatsapp"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold ${
                  channel === "sms"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Phone size={14} /> SMS
              </button>
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold ${
                  channel === "email"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Mail size={14} /> Email
              </button>
            </div>
          </div>

          {/* Editable Message Preview */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Message Preview</label>
              <span className="text-[10px] text-slate-400">
                Includes customer name, amount, UPI link
              </span>
            </div>
            <textarea
              rows={6}
              value={currentMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className={`rounded-xl h-9 text-xs font-bold text-white flex items-center gap-1.5 ${
                channel === "whatsapp"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send size={14} /> Send on{" "}
              {channel === "whatsapp" ? "WhatsApp" : channel.toUpperCase()} & Log
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 5. Promise to Pay (PTP) Modal ──────────────────────────────────
export function PromiseToPayModal({
  open,
  record,
  onClose,
  onSaved,
}: {
  open: boolean;
  record: PaymentRecord | null;
  onClose: () => void;
  onSaved: (updated: PaymentRecord) => void;
}) {
  const { business } = useAuth();
  const [ptpDate, setPtpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [ptpAmount, setPtpAmount] = useState(record ? String(record.balanceAmount) : "");
  const [ptpNote, setPtpNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptpDate) {
      toast.error("Please pick a promised date");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await paymentReminderService.setPromiseToPay(
        record.id,
        ptpDate,
        parseFloat(ptpAmount) || record.balanceAmount,
        ptpNote.trim(),
        business?.id || "",
      );

      if (updated) {
        toast.success(`Promise to pay recorded for ${ptpDate}`);
        onSaved(updated);
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to set promise to pay");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Log Promise-to-Pay (PTP)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Customer commitment date to follow up on Invoice #{record.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Committed Payment Date *
            </label>
            <Input
              required
              type="date"
              value={ptpDate}
              onChange={(e) => setPtpDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Promised Amount (₹)</label>
            <Input
              type="number"
              value={ptpAmount}
              onChange={(e) => setPtpAmount(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Customer Commitment Remarks
            </label>
            <Input
              placeholder="e.g. Promised to transfer via NEFT after clearance"
              value={ptpNote}
              onChange={(e) => setPtpNote(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Commitment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── 6. Batch Auto-Remind Modal (Indian SMB Daily Scheduler) ─────────
export function BatchAutoRemindModal({
  open,
  records,
  onClose,
  onBatchProcessed,
}: {
  open: boolean;
  records: PaymentRecord[];
  onClose: () => void;
  onBatchProcessed: () => void;
}) {
  const { business, profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Eligible customers (Unpaid or Overdue, autoRemindEnabled)
  const eligible = records.filter((r) => r.status !== "Paid" && r.autoRemindEnabled !== false);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === eligible.length) setSelectedIds([]);
    else setSelectedIds(eligible.map((r) => r.id));
  };

  const handleTriggerSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one record to remind.");
      return;
    }

    const targets = eligible.filter((r) => selectedIds.includes(r.id));
    for (const t of targets) {
      const days = getDaysDifference(t.dueDate);
      const tone: ReminderTone = days > 14 ? "final" : days > 1 ? "firm" : "friendly";
      await paymentReminderService.logReminder(
        t.id,
        {
          channel: "whatsapp",
          tone,
          sentBy: profile?.fullName || "Batch Scheduler",
        },
        business?.id || "",
      );
    }

    toast.success(`Logged automated reminders for ${targets.length} customers!`);
    onBatchProcessed();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>⚡ Daily Auto-Reminder Scheduler</span>
            <Badge className="bg-blue-100 text-blue-700 border-0">{eligible.length} Pending</Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Identifies customers matching reminder rules (3 days before, due today, +2d, +7d, +15d
            overdue).
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={handleSelectAll}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              {selectedIds.length === eligible.length ? "Deselect All" : "Select All Due Customers"}
            </button>
            <span className="text-slate-500 text-[11px]">
              {selectedIds.length} of {eligible.length} selected
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 max-h-72 overflow-y-auto">
            {eligible.map((r) => {
              const days = getDaysDifference(r.dueDate);
              const isSelected = selectedIds.includes(r.id);

              return (
                <div
                  key={r.id}
                  onClick={() => handleToggle(r.id)}
                  className={`flex items-center gap-3 p-3 text-xs transition-colors cursor-pointer ${
                    isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(r.id)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{r.customerName}</p>
                    <p className="text-[11px] text-slate-500">
                      Invoice #{r.invoiceNumber} · {r.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ₹{r.balanceAmount.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        days > 0
                          ? "text-rose-600"
                          : days === 0
                            ? "text-amber-600"
                            : "text-slate-400"
                      }`}
                    >
                      {days > 0
                        ? `${days}d overdue`
                        : days === 0
                          ? "Due today"
                          : `Due ${r.dueDate}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
              Close
            </Button>
            <Button
              onClick={handleTriggerSelected}
              disabled={selectedIds.length === 0}
              className="rounded-xl h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Trigger Reminders ({selectedIds.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 7. Printable Invoice Statement Modal ────────────────────────────
export function InvoiceStatementModal({
  open,
  record,
  onClose,
}: {
  open: boolean;
  record: PaymentRecord | null;
  onClose: () => void;
}) {
  const { business } = useAuth();
  if (!record) return null;

  const upiUrl = generateUpiUrl({
    upiId: record.upiId || (business?.phone ? `${business.phone}@upi` : "business@upi"),
    payeeName: business?.name || "Occo Business",
    amount: record.balanceAmount,
    invoiceNo: record.invoiceNumber,
  });
  const qrUrl = getUpiQrCodeUrl(upiUrl);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 print:p-0 print:border-0 print:shadow-none">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 print:hidden">
          <DialogTitle className="text-sm font-bold text-slate-800">
            Tax Invoice & Statement Slip
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Printer size={14} /> Print / Save PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="mt-3 p-6 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs space-y-6 print:border-0 print:p-2">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {business?.name || "Occo Business"}
              </h2>
              <p className="text-slate-500 text-[11px]">
                {business?.address || "Registered Business Address"}
              </p>
              <p className="text-slate-500 text-[11px]">Phone: {business?.phone || "N/A"}</p>
              <p className="text-slate-500 text-[11px]">
                Email: {business?.email || "billing@business.com"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                PAYMENT INVOICE
              </span>
              <p className="mt-2 text-xs font-bold text-slate-800 font-mono">
                #{record.invoiceNumber}
              </p>
              <p className="text-slate-500 text-[11px]">
                Date: {new Date(record.createdAt).toLocaleDateString("en-IN")}
              </p>
              <p className="text-slate-500 text-[11px]">
                Due Date: {new Date(record.dueDate).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Billed To
              </span>
              <p className="font-bold text-sm text-slate-900">{record.customerName}</p>
              <p className="text-slate-600 text-xs">Phone: {record.customerPhone}</p>
              {record.customerEmail && (
                <p className="text-slate-600 text-xs">Email: {record.customerEmail}</p>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    record.status === "Paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : record.status === "Partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {record.status.toUpperCase()}
                </span>
                <p className="text-[11px] text-slate-500 mt-1.5">Mode: {record.paymentMode}</p>
              </div>
              {record.balanceAmount > 0 && qrUrl && (
                <div className="text-center">
                  <img
                    src={qrUrl}
                    alt="UPI QR"
                    className="size-20 rounded-lg border bg-white p-1"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Scan to Pay UPI</span>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">Invoice #{record.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-500">
                      {record.notes || "Professional products / services rendered."}
                    </p>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    ₹{record.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-600">
                    ₹{record.paidAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-right font-black text-rose-600 text-sm">
                    ₹{record.balanceAmount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Installments History */}
          {record.installments.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Payment Receipt History
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5">Reference / UTR</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {record.installments.map((inst) => (
                      <tr key={inst.id}>
                        <td className="p-2.5">{inst.date}</td>
                        <td className="p-2.5">{inst.paymentMode}</td>
                        <td className="p-2.5 font-mono">{inst.referenceNo || "—"}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">
                          ₹{inst.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
            <p>Thank you for your prompt business! Generated by Occo Flow.</p>
            <p className="font-mono">{new Date().toLocaleString("en-IN")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
