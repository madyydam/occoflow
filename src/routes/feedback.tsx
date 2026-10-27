import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
  MessageSquareReply,
} from "lucide-react";
import { AccessGuard } from "@/components/access-guard";
import { AppShell } from "@/components/crm-shell";
import { useAuth } from "@/lib/auth-context";
import { feedbackService, type UserFeedbackItem, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Problems & Suggestions | Occo Flow" },
      { name: "description", content: "Submit problems, suggestions, and feedback directly to our team." },
      { property: "og:title", content: "Problems & Suggestions | Occo Flow" },
      { property: "og:description", content: "Submit problems, suggestions, and feedback directly to our team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <AccessGuard>
      <AppShell>
        <FeedbackContent />
      </AppShell>
    </AccessGuard>
  );
}

const statusBadgeStyles: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200/90",
  open: "bg-sky-50 text-sky-700 border-sky-200/90",
  under_review: "bg-amber-50 text-amber-700 border-amber-200/90",
  waiting: "bg-amber-50 text-amber-700 border-amber-200/90",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200/90",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
  closed: "bg-slate-100 text-slate-700 border-slate-200/90",
};

const statusLabels: Record<string, string> = {
  new: "New",
  open: "New",
  under_review: "Under Review",
  waiting: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STAR_LABELS: Record<number, string> = {
  1: "Needs improvement 😟",
  2: "Fair experience 😐",
  3: "Good, can be better 🙂",
  4: "Very good experience! 😊",
  5: "Excellent! Loving the CRM! 🌟",
};

function FeedbackContent() {
  const { business, user } = useAuth();
  const [items, setItems] = useState<UserFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [type, setType] = useState<"problem" | "suggestion" | "feedback">("problem");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Star Rating State
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isSavingRating, setIsSavingRating] = useState(false);

  const loadData = useCallback(async () => {
    if (!business?.id && !user?.id) return;
    setLoading(true);
    try {
      const [list, userRating] = await Promise.all([
        feedbackService.listOwn(business?.id || "", user?.id),
        feedbackService.getLatestRating(business?.id || "", user?.id || ""),
      ]);
      setItems(list);
      if (userRating?.rating) {
        setSelectedRating(userRating.rating);
      }
    } catch (e) {
      console.error("Error loading feedback:", e);
    } finally {
      setLoading(false);
    }
  }, [business?.id, user?.id]);

  useEffect(() => {
    loadData();

    if (!business?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 300);
    };

    const channel = supabase
      .channel("user-feedback-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `business_id=eq.${business.id}`,
        },
        debouncedReload
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadData, business?.id]);

  const handleSaveRating = async (ratingVal: number) => {
    if (!business?.id || !user?.id) return;
    setSelectedRating(ratingVal);
    setIsSavingRating(true);
    try {
      const ok = await feedbackService.submitRating(business.id, user.id, ratingVal, "");
      if (ok) {
        toast.success(`Thank you! Saved ${ratingVal}-star rating.`);
      }
    } catch {
      toast.error("Error submitting rating.");
    } finally {
      setIsSavingRating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in both subject and description.");
      return;
    }
    if (!business?.id || !user?.id) {
      toast.error("Account session not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await feedbackService.create({
        businessId: business.id,
        userId: user.id,
        type,
        subject,
        description,
        ...(selectedRating ? { rating: selectedRating } : {}),
      });

      if (created) {
        toast.success(
          type === "problem"
            ? "Problem ticket submitted. Our team will review it shortly!"
            : type === "suggestion"
            ? "Suggestion received! Thank you for helping us improve."
            : "Feedback submitted successfully. Thank you!"
        );
        setSubject("");
        setDescription("");
        loadData();
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } catch {
      toast.error("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || selectedRating;

  return (
    <div className="mx-auto max-w-3xl space-y-9 pb-16">
      {/* ── Center Main Form Card ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Big Star Rating Section Inside Form */}
          <div className="rounded-xl border border-border/80 bg-slate-50/70 p-4 sm:p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Rate your experience with Occo Flow
            </p>
            <div className="mt-2.5 flex items-center justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = activeRating >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={isSavingRating}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleSaveRating(star)}
                    className="p-1 transition-transform duration-150 hover:scale-125 focus:outline-none cursor-pointer"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`size-8 sm:size-9 transition-colors ${
                        isLit
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-slate-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 h-4 text-xs font-semibold text-amber-700">
              {activeRating ? STAR_LABELS[activeRating] : "Tap a star to rate"}
            </p>
          </div>

          {/* Ticket Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("problem")}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === "problem"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <AlertCircle size={15} />
                <span>Problem / Bug</span>
              </button>

              <button
                type="button"
                onClick={() => setType("suggestion")}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === "suggestion"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Lightbulb size={15} />
                <span>Suggestion</span>
              </button>

              <button
                type="button"
                onClick={() => setType("feedback")}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === "feedback"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare size={15} />
                <span>Feedback</span>
              </button>
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Subject</label>
            <Input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                type === "problem"
                  ? "What is the problem or bug you encountered?"
                  : type === "suggestion"
                  ? "What feature or improvement would you like?"
                  : "Tell us your thoughts or feedback..."
              }
              className="h-11 rounded-xl border-border bg-card text-xs shadow-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Details</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details so our team can resolve or implement this effectively..."
              className="w-full resize-none rounded-xl border border-border bg-card p-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl px-5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Send size={14} className="mr-1.5" />
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Submissions Table (Scroll Down section) ── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              My Submissions ({items.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              All reported tickets, suggestions, and feedback responses
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Subject & Details</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Team Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Loading your submissions...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Inbox size={24} className="text-slate-300" />
                        <p className="text-xs font-bold text-foreground">No submissions yet</p>
                        <p className="text-[11px] text-muted-foreground">Submit your first ticket using the form above.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const badgeClass = statusBadgeStyles[item.status] || "bg-muted text-muted-foreground";
                    const label = statusLabels[item.status] || item.status;
                    const typeBadgeClass =
                      item.type === "problem"
                        ? "bg-rose-50 text-rose-700 border-rose-200/90"
                        : item.type === "suggestion"
                        ? "bg-amber-50 text-amber-700 border-amber-200/90"
                        : "bg-sky-50 text-sky-700 border-sky-200/90";

                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        {/* Type */}
                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${typeBadgeClass}`}
                          >
                            {item.type === "problem" ? (
                              <AlertCircle size={11} />
                            ) : item.type === "suggestion" ? (
                              <Lightbulb size={11} />
                            ) : (
                              <MessageSquare size={11} />
                            )}
                            <span className="capitalize">{item.type}</span>
                          </span>
                        </td>

                        {/* Subject & Details */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <p className="font-bold text-foreground text-xs leading-snug">{item.subject}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 align-top text-muted-foreground whitespace-nowrap text-[11px]">
                          {format(parseISO(item.createdAt), "dd MMM yyyy")}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <Badge className={`rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-none ${badgeClass}`}>
                            {label}
                          </Badge>
                        </td>

                        {/* Response */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          {item.adminResponse ? (
                            <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-2 text-[11px] text-emerald-900">
                              <div className="flex items-center gap-1 font-bold text-emerald-800 text-[10px] mb-0.5">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Support Team Response</span>
                              </div>
                              <p className="leading-snug">{item.adminResponse}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock size={12} className="text-slate-400" />
                              <span>Waiting for review</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
