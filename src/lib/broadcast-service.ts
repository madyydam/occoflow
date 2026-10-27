import { supabase } from "./supabase";

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  type?: string;
  audience?: "all" | "trial" | "subscribed" | string;
  target_audience?: "all" | "trial" | "subscribed" | string;
  is_published: boolean;
  status: string;
  views_count: number;
  viewed_user_ids: string[];
  created_at: string;
  sent_at?: string;
}

export const broadcastService = {
  /**
   * Fetch the most recent unread announcement for the current user.
   * Strictly respects:
   * 1. Target audience (all, trial, subscribed)
   * 2. Browser localStorage flag (occo_seen_broadcast_{id} / legacy fallback)
   * 3. Database viewed_user_ids array
   */
  async getUnreadAnnouncement(
    userId?: string,
    isSubscribed: boolean = false
  ): Promise<BroadcastAnnouncement | null> {
    try {
      const { data, error } = await supabase
        .from("platform_notifications_admin")
        .select("*")
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) return null;

      for (const item of data) {
        // Audience matching
        const audience = (item.target_audience || item.audience || "all").toLowerCase();
        if (audience === "subscribed" && !isSubscribed) continue;
        if (audience === "trial" && isSubscribed) continue;

        const localKey = `occo_seen_broadcast_${item.id}`;
        const legacyKey = `futora_seen_broadcast_${item.id}`;

        // 1. Strict localStorage check (prevents re-popup on page refresh or repeat visits)
        if (typeof window !== "undefined" && (localStorage.getItem(localKey) === "true" || localStorage.getItem(legacyKey) === "true")) {
          continue;
        }

        // 2. Database check (if viewed_user_ids exists on item)
        const viewedUsers: string[] = Array.isArray(item.viewed_user_ids)
          ? item.viewed_user_ids
          : [];

        if (userId && viewedUsers.includes(userId)) {
          if (typeof window !== "undefined") {
            localStorage.setItem(localKey, "true");
          }
          continue;
        }

        // Found unread announcement
        return item as BroadcastAnnouncement;
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Strictly records that the user has viewed and acknowledged the announcement.
   * Synchronously marks localStorage so the modal NEVER pops up again.
   */
  async markAsViewed(
    notificationId: string,
    userId?: string
  ): Promise<void> {
    if (!notificationId) return;

    // 1. Mark localStorage immediately
    const localKey = `occo_seen_broadcast_${notificationId}`;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(localKey, "true");
      } catch (e) {
        console.warn("[broadcastService] Failed to set localStorage:", e);
      }
    }

    try {
      // 2. Attempt RPC function if configured
      await supabase.rpc("record_broadcast_view", {
        p_notification_id: notificationId,
        p_user_id: userId || null,
      });
    } catch {
      // Graceful fallback - localStorage already prevents re-display
    }
  },
};
