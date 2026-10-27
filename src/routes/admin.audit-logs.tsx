import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ScrollText,
  Search,
  ShieldCheck,
  Activity,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminShell, AdminPageHeader, AdminEmptyState } from "@/components/admin-shell";
import { adminAuditService, type AdminAuditLog } from "@/lib/admin-service";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs | Admin | Occo Flow" }] }),
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminAuditLogs />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminAuditService.list(0, 50);
        setLogs(res.data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.adminEmail.toLowerCase().includes(q) ||
        l.entityName.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q),
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Logs"
        description="Immutable record of administrative actions, trial modifications, business suspensions, and system changes."
      />

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by action, admin, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              icon={ScrollText}
              title="No audit logs recorded yet"
              description="When administrators extend trials, modify platform settings, or perform account suspensions, immutable log records will automatically be stored here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Admin Staff</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Target Type</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No logs match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-bold text-[#0f172a]">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {log.adminEmail || "Super Admin"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">
                        {log.entityName || log.entityId || "System"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 capitalize">{log.entityType}</td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {format(new Date(log.createdAt), "dd MMM yyyy, h:mm:ss a")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
