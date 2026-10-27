import { type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { trialDaysLeft } from "@/lib/crm-data";

// ── Loading Screen ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center">
        {/* Spinner Assembly: 3 fine concentric spinners around logo */}
        <div className="relative flex size-36 sm:size-40 items-center justify-center">
          {/* Spinner 1: Outer fine rotating dashed orbit */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-primary/35 animate-spin-slow" />

          {/* Spinner 2: Middle fine reverse-rotating colored arc */}
          <div className="absolute inset-2.5 sm:inset-3 rounded-full border-[1.5px] border-transparent border-t-indigo-500 border-b-sky-400 animate-spin-reverse" />

          {/* Spinner 3: Inner fine smooth glow ring */}
          <div className="absolute inset-5 sm:inset-6 rounded-full border-[1.5px] border-slate-200 border-r-primary/70 animate-spin duration-[2000ms]" />

          {/* Logo floating freely in middle without any box */}
          <img
            src="/logo.png"
            alt="Occo Flow"
            className="relative size-14 sm:size-16 object-contain select-none pointer-events-none drop-shadow-sm"
          />
        </div>

        {/* Text */}
        <h2 className="mt-5 font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
          Occo Flow
        </h2>
      </div>
    </div>
  );
}

// ── Protected CRM Routes Guard ─────────────────────────────────────
// Wraps any CRM route. Blocks access if trial expired or not subscribed.
export function AccessGuard({ children }: { children: ReactNode }) {
  const { accessState } = useAuth();
  const location = useLocation();

  // Always show loading screen — never briefly flash CRM to expired users
  if (accessState === "loading") return <LoadingScreen />;

  // Not logged in → send to login
  if (accessState === "unauthenticated") {
    return <Navigate to="/auth/login" search={{ redirect: location.pathname }} />;
  }

  // Trial expired or subscription ended → lock them to /subscription
  if (accessState === "trial_expired" || accessState === "sub_expired") {
    return <Navigate to="/subscription" />;
  }

  // Trial active or subscribed → allow access
  return <>{children}</>;
}

// ── Public Auth Guard ──────────────────────────────────────────────
// For login/signup pages — redirect to CRM if already logged in
export function PublicGuard({ children }: { children: ReactNode }) {
  const { accessState, session, isLoading } = useAuth();

  if (isLoading && !session) return <LoadingScreen />;

  if (session && (accessState === "trial_active" || accessState === "subscribed")) {
    return <Navigate to="/dashboard" />;
  }

  if (session && (accessState === "trial_expired" || accessState === "sub_expired")) {
    return <Navigate to="/subscription" />;
  }

  return <>{children}</>;
}

// ── Trial Banner ───────────────────────────────────────────────────
export function TrialBanner() {
  const { accessState, subscription } = useAuth();
  if (accessState !== "trial_active" || !subscription) return null;

  const days = trialDaysLeft(subscription.trialEndsAt);

  const urgency = days === 0 ? "today" : days === 1 ? "tomorrow" : `${days} day${days === 1 ? "" : "s"}`;
  const isUrgent = days <= 1;
  const text = days === 0
    ? "Your free trial ends today."
    : days === 1
      ? "Your free trial ends tomorrow."
      : `Free Trial — ${days} days remaining`;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium transition-colors ${
        isUrgent
          ? "bg-orange-50 text-orange-800 border-b border-orange-200"
          : "bg-blue-50 text-blue-800 border-b border-blue-100"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${isUrgent ? "bg-orange-500" : "bg-blue-500"}`} />
        {text}
      </span>
      <a
        href="/subscription"
        className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
          isUrgent
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        Choose a plan
      </a>
    </div>
  );
}
