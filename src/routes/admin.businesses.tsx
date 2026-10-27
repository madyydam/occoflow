import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/businesses")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users", search: { tab: "all" } });
  },
});
