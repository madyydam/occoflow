import { useState } from "react";
import {
  Code2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Send,
  Phone,
  Mail,
  Building,
  User,
  Clock,
  DollarSign,
  Layers,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  customSoftwareService,
  PROJECT_TYPE_LABELS,
  type CustomSoftwareInquiry,
} from "@/lib/custom-software-service";

interface CustomSoftwareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomSoftwareModal({ open, onOpenChange }: CustomSoftwareModalProps) {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    "email" | "phone" | "whatsapp"
  >("email");
  const [projectType, setProjectType] = useState("crm_erp");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("1_month");
  const [requirements, setRequirements] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState<CustomSoftwareInquiry | null>(null);

  const resetForm = () => {
    setFullName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setPreferredContactMethod("email");
    setProjectType("crm_erp");
    setBudgetRange("");
    setTimeline("1_month");
    setRequirements("");
    setErrorMessage(null);
    setSubmittedInquiry(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (submittedInquiry) {
        resetForm();
      }
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage(null);

    // Validate inputs
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage("Please enter your company or business name.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (!requirements.trim() || requirements.trim().length < 15) {
      setErrorMessage("Please describe your requirements in more detail (at least 15 characters).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await customSoftwareService.submitInquiry({
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredContactMethod,
        projectType,
        budgetRange,
        timeline,
        requirements: requirements.trim(),
      });

      if (res.success && res.data) {
        setSubmittedInquiry(res.data);
      } else {
        setErrorMessage(res.error || "Failed to submit inquiry. Please try again.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please check your connection.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[94vw] max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl focus:outline-none">
        {/* Header Ribbon */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 sm:p-7 text-white">
          <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-32 rounded-full bg-blue-400/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md shadow-inner">
              <Code2 className="size-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-100 backdrop-blur-xs mb-1.5">
                <Sparkles size={12} className="text-yellow-300" />
                <span>Bespoke Engineering</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                Request Custom Software
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Tell us your vision. We build high-performance CRMs, ERPs, mobile apps, and custom
                platforms tailored to your business.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 bg-white">
          {submittedInquiry ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center py-6 space-y-5">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm animate-in zoom-in-50 duration-300">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#2563eb] mb-2">
                  Inquiry ID: #{submittedInquiry.inquiryNumber}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Thank You, {submittedInquiry.fullName}!
                </h3>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your custom software requirements for{" "}
                  <strong className="text-slate-900">{submittedInquiry.companyName}</strong> have
                  been received and logged into our engineering queue.
                </p>
              </div>

              {/* What happens next box */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left max-w-md mx-auto space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  What Happens Next?
                </p>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-100 text-[#2563eb] font-bold text-[10px]">
                      1
                    </span>
                    <span>
                      A dedicated solution architect will review your project requirements within{" "}
                      <strong>24 business hours</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-100 text-[#2563eb] font-bold text-[10px]">
                      2
                    </span>
                    <span>
                      We will contact you via{" "}
                      <strong>{submittedInquiry.preferredContactMethod.toUpperCase()}</strong> (
                      {submittedInquiry.email}) with initial estimates & timeline.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-100 text-[#2563eb] font-bold text-[10px]">
                      3
                    </span>
                    <span>
                      We schedule a direct discovery call to finalize wireframes and milestone
                      deliverables.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-center">
                <Button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="rounded-xl bg-[#2563eb] px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 animate-in fade-in duration-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Row 1: Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building size={13} className="text-slate-400" />
                    Company / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    Work Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    Phone / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Contact Method, Project Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-slate-400" />
                    Preferred Contact Method
                  </label>
                  <select
                    value={preferredContactMethod}
                    onChange={(e) =>
                      setPreferredContactMethod(e.target.value as typeof preferredContactMethod)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 bg-white focus:border-[#2563eb] focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    Software / Project Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 bg-white focus:border-[#2563eb] focus:outline-none"
                  >
                    <option value="crm_erp">Custom CRM & ERP Solution</option>
                    <option value="mobile_app">Mobile App (iOS & Android)</option>
                    <option value="web_platform">Web Platform & SaaS Product</option>
                    <option value="ai_automation">AI & Workflow Automation</option>
                    <option value="api_integration">API & Integrations</option>
                    <option value="other">Other Bespoke Software</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Budget Range & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={13} className="text-slate-400" />
                    Budget Range
                  </label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    Expected Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 bg-white focus:border-[#2563eb] focus:outline-none"
                  >
                    <option value="urgent">Urgent (&lt; 2 Weeks)</option>
                    <option value="1_month">Within 1 Month</option>
                    <option value="2_3_months">2 to 3 Months</option>
                    <option value="flexible">Flexible / Ongoing</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Detailed Requirements Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Requirements & Project Scope <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {requirements.length}/2000 chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-900 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100 leading-relaxed transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  100% confidential. No spam, ever.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Requirements</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
