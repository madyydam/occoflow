import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, Plus, Send, Megaphone, Trash2, Loader2, Eye } from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminShell, AdminEmptyState, AdminBadge } from "@/components/admin-shell";
import { useAdminAuth } from "@/lib/admin-context";
import { adminNotificationService } from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications | Admin | Occo Flow" }] }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminNotifications />
      </AdminShell>
    </AdminGuard>
  );
}

function AdminNotifications() {
  const { adminUser } = useAdminAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "trial" | "subscribed">("all");
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const data = await adminNotificationService.list();
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 300);
    };

    // Live real-time updates when users view broadcasts
    const channel = supabase
      .channel("admin_notifications_live_views")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "platform_notifications_admin" },
        debouncedReload,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !adminUser) return;

    setSending(true);
    const ok = await adminNotificationService.create(
      {
        title: title.trim(),
        message: message.trim(),
        target_audience: audience,
        audience: audience,
        is_published: true,
        status: "sent",
        views_count: 0,
        viewed_user_ids: [],
        sent_at: new Date().toISOString(),
      },
      adminUser.id,
    );
    setSending(false);

    if (ok) {
      toast.success("Broadcast announcement sent to customer workspaces.");
      setCreateModal(false);
      setTitle("");
      setMessage("");
      loadData();
    } else {
      toast.error("Failed to broadcast announcement. Check database connection.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this broadcast announcement?")) return;
    const ok = await adminNotificationService.delete(id);
    if (ok) {
      toast.success("Broadcast announcement deleted.");
      loadData();
    } else {
      toast.error("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500">Live Platform Broadcasts</span>
        </div>
        <button
          type="button"
          onClick={() => setCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Broadcast Announcement
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#2563eb]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              icon={Bell}
              title="No platform announcements yet"
              description="Click 'Broadcast Announcement' to send notifications regarding scheduled maintenance, feature launches, or holiday notices."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const viewCount =
                n.views_count ?? (Array.isArray(n.viewed_user_ids) ? n.viewed_user_ids.length : 0);
              return (
                <div key={n.id} className="p-5 transition-colors hover:bg-slate-50/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2563eb] border border-blue-100">
                        <Megaphone size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#0f172a]">{n.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-w-3xl">
                          {n.message}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {/* Live Views Counter with Eye Icon */}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-bold text-[#2563eb]">
                            <Eye size={13} className="text-[#2563eb]" />
                            <span>
                              {viewCount} {viewCount === 1 ? "view" : "views"}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Audience:{" "}
                            <strong className="text-slate-700 capitalize">
                              {n.target_audience || n.audience || "all"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(n.created_at || n.sent_at || Date.now()),
                              "dd MMM yyyy, h:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AdminBadge label="Sent" color="green" />
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
              <Megaphone size={18} className="text-[#2563eb]" />
              New Broadcast Announcement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Headline / Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled System Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-[#0f172a] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="all">All Users (Trial + Subscribed)</option>
                <option value="trial">Users on Trial Only</option>
                <option value="subscribed">Subscribed Paying Users Only</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                required
                rows={4}
                placeholder="Enter announcement text that will immediately pop up for users on their next visit..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#0f172a] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Send size={13} /> {sending ? "Broadcasting..." : "Broadcast Announcement"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
