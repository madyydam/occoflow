import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { AdminPublicGuard } from "@/components/admin-guard";
import { useAdminAuth } from "@/lib/admin-context";
import { BRAND } from "@/lib/crm-data";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Portal Sign In | Occo Flow" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <AdminPublicGuard>
      <AdminLoginForm />
    </AdminPublicGuard>
  );
}

function AdminLoginForm() {
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(
        err.includes("Invalid login credentials")
          ? "Incorrect email or password."
          : err.includes("not_admin") || err.includes("administrator privileges")
          ? "Access Denied: This account is not registered with administrator privileges."
          : err,
      );
      return;
    }
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-slate-50 to-white px-4 py-12 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5">
            <img src="/logo.png" alt={BRAND} className="size-11 rounded-xl object-contain shadow-sm" />
            <div className="text-left">
              <h1 className="font-display text-xl font-extrabold text-[#0f172a]">{BRAND}</h1>
              <p className="text-[11px] font-semibold text-slate-500">Super Admin Portal</p>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <ShieldCheck size={13} className="text-[#2563eb]" /> Restricted Super Admin Portal
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#0f172a]">Admin Sign In</h2>
          <p className="mt-1 text-xs text-slate-500">Confidential platform administration access only</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="admin@heyocco.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-10 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white transition-all hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {loading ? "Verifying Credentials…" : "Authenticate & Enter"}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              🔒 256-bit encrypted authentication • All sessions logged and audited
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Not a platform admin?{" "}
          <a href="/auth/login" className="font-semibold text-[#2563eb] hover:underline">
            Go to Customer CRM Login
          </a>
        </p>
      </div>
    </div>
  );
}
