import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

// "/" is the root — redirect based on auth state
function IndexRedirect() {
  const { accessState } = useAuth();

  if (accessState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="Occo Flow"
            className="size-14 rounded-2xl object-contain shadow-md animate-pulse"
          />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (accessState === "unauthenticated") return <Navigate to="/landing" />;
  if (accessState === "trial_expired" || accessState === "sub_expired")
    return <Navigate to="/subscription" />;
  return <Navigate to="/dashboard" />;
}
