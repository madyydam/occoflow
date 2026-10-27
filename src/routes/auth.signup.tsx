import { createFileRoute, useSearch } from "@tanstack/react-router";
import { PublicGuard } from "@/components/access-guard";
import { AuthFlipCard } from "@/components/auth-flip-card";
import { z } from "zod";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: z.object({
    redirect: z.string().optional(),
    plan: z.string().optional(),
    billing: z.string().optional(),
    mode: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Create Workspace | Occo Flow" }] }),
  component: SignupPage,
});

function SignupPage() {
  const search = useSearch({ from: "/auth/signup" });
  return (
    <PublicGuard>
      <AuthFlipCard
        initialMode="signup"
        redirect={search.redirect}
        initialPlan={search.plan}
        initialBilling={search.billing}
        initialOnboardingType={search.mode as "trial" | "purchase" | undefined}
      />
    </PublicGuard>
  );
}
