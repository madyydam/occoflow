import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { AdminProvider } from "@/lib/admin-context";
import { useAdminAuth } from "@/lib/admin-context";

// ── Loading screen ─────────────────────────────────────────────────
function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/logo.png"
          alt="Admin"
          className="size-14 rounded-2xl object-contain opacity-60 animate-pulse"
        />
        <p className="text-sm font-medium text-white/40">Loading admin panel…</p>
      </div>
    </div>
  );
}

// ── Not authorized screen ──────────────────────────────────────────
function NotAdminScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-6xl">🚫</div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-white/50">
          Your account does not have admin privileges. Contact the platform owner to request access.
        </p>
        <a
          href="/admin/login"
          className="mt-6 inline-block rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8]"
        >
          Back to Admin Login
        </a>
      </div>
    </div>
  );
}

// ── Inner guard (uses context) ─────────────────────────────────────
function AdminGuardInner({ children }: { children: ReactNode }) {
  const { accessState } = useAdminAuth();

  if (accessState === "loading") return <AdminLoadingScreen />;
  if (accessState === "unauthenticated") return <Navigate to="/admin/login" />;
  if (accessState === "not_admin") return <NotAdminScreen />;
  return <>{children}</>;
}

// ── Public admin guard (login page — redirect if already admin) ────
function AdminPublicGuardInner({ children }: { children: ReactNode }) {
  const { accessState } = useAdminAuth();
  if (accessState === "loading") return <AdminLoadingScreen />;
  if (accessState === "authorized") return <Navigate to="/admin" />;
  return <>{children}</>;
}

// ── Exported guards (wrap Provider + inner guard) ──────────────────
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminGuardInner>{children}</AdminGuardInner>
    </AdminProvider>
  );
}

export function AdminPublicGuard({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminPublicGuardInner>{children}</AdminPublicGuardInner>
    </AdminProvider>
  );
}
