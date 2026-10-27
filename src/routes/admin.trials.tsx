import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/trials")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users", search: { tab: "trials" } });
  },
});

