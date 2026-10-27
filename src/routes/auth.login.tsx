import { createFileRoute, useSearch } from "@tanstack/react-router";
import { PublicGuard } from "@/components/access-guard";
import { AuthFlipCard } from "@/components/auth-flip-card";
import { z } from "zod";

export const Route = createFileRoute("/auth/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Login | Occo Flow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/auth/login" });
  return (
    <PublicGuard>
      <AuthFlipCard initialMode="login" redirect={search.redirect} />
    </PublicGuard>
  );
}
