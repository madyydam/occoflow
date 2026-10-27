import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/crm-data";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

// 3-step OTP password reset flow:
// Step 1 → Enter email → OTP sent
// Step 2 → Enter 6-digit OTP from email
// Step 3 → Set new password
type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const { resetPassword, verifyOtp, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);
    if (err) {
      // Supabase returns an error if email doesn't exist — handle gracefully
      if (err.toLowerCase().includes("user not found") || err.toLowerCase().includes("no user")) {
        setError("No account found with that email address.");
      } else {
        setError(err);
      }
      return;
    }
    setStep("otp");
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = otp.replace(/\s/g, "");
    if (trimmed.length !== 6 || !/^\d+$/.test(trimmed)) {
      setError("Please enter the 6-digit OTP from your email.");
      return;
    }
    setLoading(true);
    const { error: err } = await verifyOtp(email, trimmed);
    setLoading(false);
    if (err) {
      if (err.toLowerCase().includes("token") || err.toLowerCase().includes("otp")) {
        setError("Invalid or expired OTP. Please check your email or request a new code.");
      } else {
        setError(err);
      }
      return;
    }
    setStep("password");
  };

  // ── Step 3: Set New Password ──────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(newPassword);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setStep("done");
  };

  // ── Step indicators ───────────────────────────────────────────
  const steps: { id: Step; label: string }[] = [
    { id: "email", label: "Email" },
    { id: "otp", label: "OTP" },
    { id: "password", label: "New Password" },
  ];

  const activeStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f6ff] to-white px-4 py-12 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link to="/landing" className="inline-flex items-center gap-2.5 no-underline">
            <img src="/logo.png" alt={BRAND} className="size-10 rounded-xl object-contain shadow" />
            <span className="font-display text-xl font-extrabold text-[#0f172a]">{BRAND}</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#0f172a]">Reset password</h1>
          {step !== "done" && (
            <p className="mt-1.5 text-sm text-slate-500">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && `Enter the 6-digit code sent to ${email}`}
              {step === "password" && "Set your new password"}
            </p>
          )}
        </div>

        {/* Step progress (not shown on done) */}
        {step !== "done" && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i <= activeStepIndex ? "bg-[#2563eb] text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < activeStepIndex ? "✓" : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-8 ${i < activeStepIndex ? "bg-[#2563eb]" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── STEP 1: Email ─────────────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {loading ? "Sending code…" : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  6-digit OTP
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
                  />
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-center text-xl font-bold tracking-[0.3em] placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Check your inbox at <span className="font-semibold text-slate-700">{email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setOtp("");
                  setStep("email");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Resend code or change email
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ──────────────────────────── */}
          {step === "password" && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {loading ? "Saving…" : "Set New Password"}
              </button>
            </form>
          )}

          {/* ── DONE ─────────────────────────────────────────── */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 size={48} className="text-green-500" />
              <div>
                <p className="text-base font-bold text-[#0f172a]">Password updated!</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  Your password has been reset successfully. You can now log in.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/auth/login" })}
                className="mt-2 h-11 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white hover:bg-[#1d4ed8]"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <Link
            to="/auth/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={15} /> Back to Login
          </Link>
        )}
      </div>
    </div>
  );
}
