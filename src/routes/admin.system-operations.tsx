import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Activity,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  Layers,
  Check,
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminShell, AdminKpiCard } from "@/components/admin-shell";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/system-operations")({
  head: () => ({ meta: [{ title: "System Operations | Admin | Occo Flow" }] }),
  component: AdminSystemOperationsPage,
});

function AdminSystemOperationsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <SystemOperationsContent />
      </AdminShell>
    </AdminGuard>
  );
}

interface PlatformActivityStats {
  totalLeads: number;
  wonLeads: number;
  totalContacts: number;
  totalDeals: number;
  totalTasks: number;
  completedTasks: number;
}

function SystemOperationsContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformActivityStats>({
    totalLeads: 0,
    wonLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const [
        { count: totalLeads },
        { count: wonLeads },
        { count: totalContacts },
        { count: totalDeals },
        { count: totalTasks },
        { count: completedTasks },
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "Won"),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "Completed"),
      ]);

      setStats({
        totalLeads: totalLeads ?? 0,
        wonLeads: wonLeads ?? 0,
        totalContacts: totalContacts ?? 0,
        totalDeals: totalDeals ?? 0,
        totalTasks: totalTasks ?? 0,
        completedTasks: completedTasks ?? 0,
      });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadStats();
      }, 300);
    };

    const channel = supabase
      .channel("admin-system-ops-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, debouncedReload)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const winRate =
    stats.totalLeads > 0 ? `${Math.round((stats.wonLeads / stats.totalLeads) * 100)}%` : "0%";

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#2563eb]" />
          <span className="text-sm font-bold text-slate-800">
            Real-Time Workspace Operations & Throughput
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
          className="h-8 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main 6 Metric Cards */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <AdminKpiCard
              label="Total Leads Managed"
              value={stats.totalLeads}
              icon={Target}
              tone="bg-blue-50 text-blue-600"
              sub={`${stats.wonLeads} deals won`}
            />
            <AdminKpiCard
              label="Customer Contacts Stored"
              value={stats.totalContacts}
              icon={Users}
              tone="bg-emerald-50 text-emerald-600"
              sub="Address book entries"
            />
            <AdminKpiCard
              label="Pipeline Deals Logged"
              value={stats.totalDeals}
              icon={TrendingUp}
              tone="bg-violet-50 text-violet-600"
              sub="Sales opportunities created"
            />
            <AdminKpiCard
              label="Total Tasks Completed"
              value={stats.completedTasks}
              icon={CheckCircle2}
              tone="bg-emerald-50 text-emerald-600"
              sub={`Out of ${stats.totalTasks} total tasks`}
            />
            <AdminKpiCard
              label="Pending Tasks In Flight"
              value={Math.max(0, stats.totalTasks - stats.completedTasks)}
              icon={Clock}
              tone="bg-amber-50 text-amber-600"
              sub="Follow-ups and calls queued"
            />
            <AdminKpiCard
              label="Lead Win Rate"
              value={winRate}
              icon={Activity}
              tone="bg-indigo-50 text-indigo-600"
              sub="Conversion efficacy"
            />
          </div>

          {/* Platform Status Banner */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Check size={16} />
              </div>
              <div>
                <p className="font-bold text-[#0f172a]">Live Realtime Sync Active</p>
                <p className="text-slate-500">
                  Data reflects immediate inserts, updates, and completions across all tenant
                  businesses.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
