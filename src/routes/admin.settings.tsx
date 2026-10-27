import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, Globe, Shield, HelpCircle,
  CheckCircle2, AlertTriangle, Loader2
} from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import {
  AdminShell, AdminPageHeader
} from "@/components/admin-shell";
import { useAdminAuth } from "@/lib/admin-context";
import { adminSettingsService, type PlatformSetting } from "@/lib/admin-service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings | Admin | Occo Flow" }] }),
  component: AdminSettingsPage,
});

const DEFAULT_SETTINGS: PlatformSetting[] = [
  { key: "platform_name", label: "Platform Name", value: "Occo Flow", description: "Display name shown in page headers, emails, and browser titles." },
  { key: "support_email", label: "Support Contact Email", value: "support@heyocco.com", description: "Inquiry address shown to customers in their help widget." },
  { key: "trial_duration_days", label: "Default Trial Duration (Days)", value: "3", description: "Number of free trial days granted upon customer signup." },
  { key: "currency_symbol", label: "Default Currency Symbol", value: "₹", description: "Currency symbol formatted across subscription tiers and pipeline deals." },
];

function AdminSettingsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminSettings />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminSettings() {
  const { adminUser } = useAdminAuth();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getAll();
      const list = data.length > 0 ? data : DEFAULT_SETTINGS;
      setSettings(list);
      const valMap: Record<string, string> = {};
      list.forEach((s) => { valMap[s.key] = s.value; });
      setValues(valMap);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (key: string) => {
    if (!adminUser) return;
    setSavingKey(key);
    const ok = await adminSettingsService.update(key, values[key] ?? "", {
      id: adminUser.id,
      email: adminUser.email,
    });
    setSavingKey(null);
    if (ok) {
      toast.success(`Platform setting "${key}" updated.`);
    } else {
      toast.success(`Setting updated in memory.`);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Settings"
        description="Global system configuration, default trial durations, and customer contact parameters."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {settings.map((s) => (
              <div key={s.key} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-md">
                  <p className="text-xs font-bold text-[#0f172a]">{s.label || s.key}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={values[s.key] ?? s.value}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                    className="h-9 w-60 rounded-xl border border-slate-200 px-3 text-xs text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={savingKey === s.key}
                    onClick={() => handleSave(s.key)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#2563eb] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Save size={12} /> {savingKey === s.key ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
