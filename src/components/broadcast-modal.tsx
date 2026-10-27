import { useState, useEffect, useCallback } from "react";
import { Megaphone, CheckCircle2, Calendar, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { broadcastService, type BroadcastAnnouncement } from "@/lib/broadcast-service";
import { format } from "date-fns";

export function BroadcastAnnouncementModal() {
  const { profile, subscription } = useAuth();
  const [announcement, setAnnouncement] = useState<BroadcastAnnouncement | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const isSubscribed = subscription?.status === "subscribed";
  const userId = profile?.id;

  const checkForAnnouncement = useCallback(async () => {
    try {
      const active = await broadcastService.getUnreadAnnouncement(userId, isSubscribed);
      if (active) {
        setAnnouncement(active);
        setOpen(true);
      }
    } catch (err) {
      console.warn("[BroadcastModal] Failed to check announcements:", err);
    }
  }, [userId, isSubscribed]);

  useEffect(() => {
    // Only check once user auth state is initialized
    checkForAnnouncement();
  }, [checkForAnnouncement]);

  const handleDismiss = async () => {
    if (!announcement || dismissing) return;
    setDismissing(true);

    const notificationId = announcement.id;
    // Close modal immediately for snappy user experience
    setOpen(false);

    try {
      // Record view in DB and localStorage so it NEVER shows again
      await broadcastService.markAsViewed(notificationId, userId);
    } finally {
      setAnnouncement(null);
      setDismissing(false);
    }
  };

  if (!announcement) return null;

  const formattedDate = announcement.created_at
    ? format(new Date(announcement.created_at), "dd MMM yyyy, h:mm a")
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleDismiss();
        }
      }}
    >
      <DialogContent
        className="w-[92vw] max-w-lg overflow-hidden rounded-2xl border-0 p-0 shadow-2xl focus:outline-none"
        aria-describedby="broadcast-announcement-desc"
      >
        {/* Top vibrant gradient banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white">
          {/* Subtle background glow effect */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-24 rounded-full bg-blue-400/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
              <Megaphone className="size-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
                <Sparkles size={11} className="text-yellow-300" />
                <span>System Announcement</span>
              </div>
              <p className="mt-1 text-xs text-blue-100/90 flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-5 bg-white space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {announcement.title}
            </h3>
          </div>

          <div
            id="broadcast-announcement-desc"
            className="max-h-[50vh] overflow-y-auto rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words font-normal"
          >
            {announcement.message}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Acknowledging will dismiss this update permanently.
            </span>
            <Button
              onClick={handleDismiss}
              disabled={dismissing}
              className="h-10 px-6 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle2 size={16} />
              <span>OK, Understood</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
