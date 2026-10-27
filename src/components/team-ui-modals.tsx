import { useState } from "react";
import {
  Users,
  UserPlus,
  Send,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Calendar,
  Briefcase,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  type TeamMember,
  type TeamRole,
  type TeamInvitePayload,
  teamService,
} from "@/lib/team-service";
import { useAuth } from "@/lib/auth-context";
import { useCRM } from "@/lib/crm-context";
import { toast } from "sonner";

// ── 1. Invite Team Member Modal ─────────────────────────────────────
export function InviteTeamMemberModal({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (member: TeamMember) => void;
}) {
  const { business, profile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("sales_rep");
  const [department, setDepartment] = useState("Sales");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state showing instant invite actions
  const [createdMember, setCreatedMember] = useState<TeamMember | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      toast.error("Please provide member Name and at least Email or Phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const member = await teamService.inviteMember(
        business?.id || "",
        {
          name,
          email,
          phone,
          role,
          department,
          notes,
        },
        profile?.fullName || "Admin",
      );

      toast.success(`Invitation created for ${member.name}!`);
      setCreatedMember(member);
      onInvited(member);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdMember) return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://flow.heyocco.com";
    const link = `${origin}/auth/signup?invite=${createdMember.inviteToken || createdMember.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!createdMember) return;
    const link = teamService.generateWhatsAppInvite(
      createdMember,
      business?.name || "Our Business",
    );
    window.open(link, "_blank");
  };

  const handleSendEmail = () => {
    if (!createdMember) return;
    const link = teamService.generateEmailInvite(createdMember, business?.name || "Our Business");
    window.open(link, "_blank");
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("sales_rep");
    setDepartment("Sales");
    setNotes("");
    setCreatedMember(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-700 font-bold">
              <UserPlus size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {createdMember ? "Share Invitation" : "Invite Team Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {createdMember
                  ? `Invite link generated for ${createdMember.name}`
                  : `Add colleagues to collaborate on leads, deals, and tasks in ${business?.name || "your workspace"}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!createdMember ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
              <Input
                required
                placeholder="e.g. Vikram Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  WhatsApp / Phone *
                </label>
                <Input
                  required
                  placeholder="e.g. 9820011223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="vikram@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Workspace Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs"
                >
                  <option value="sales_rep">Sales Representative</option>
                  <option value="manager">Sales Manager</option>
                  <option value="support">Support & Operations</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Department / Designation
                </label>
                <Input
                  placeholder="e.g. Senior BDE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Welcome Note / Instructions
              </label>
              <Input
                placeholder="e.g. Welcome to the sales team! Please review incoming leads."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting ? "Generating..." : "Generate Invitation"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/90 p-3.5 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">
                  Invitation Ready for {createdMember.name}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Assigned Role:{" "}
                  <span className="font-semibold uppercase">{createdMember.role}</span> (
                  {createdMember.department})
                </p>
                <p className="text-[11px] font-mono text-emerald-800 mt-1">
                  Invite Code: {createdMember.inviteToken}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Instant Invitation Delivery:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleSendWhatsApp}
                  className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={15} /> Send WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  className="h-9 rounded-xl border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} /> Send Email
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full h-8.5 rounded-xl border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/70 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Invite Link Copied!" : "Copy Direct Registration Link"}
              </Button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                onClick={handleClose}
                className="rounded-xl h-9 text-xs bg-slate-900 text-white font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── 2. Assign Task to Team Member Modal ──────────────────────────────
export function AssignTeamTaskModal({
  open,
  members,
  preselectedMember,
  onClose,
  onTaskCreated,
}: {
  open: boolean;
  members: TeamMember[];
  preselectedMember?: TeamMember | null;
  onClose: () => void;
  onTaskCreated: () => void;
}) {
  const { addTask, leads, deals } = useCRM();

  const [title, setTitle] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState(
    preselectedMember?.id || members[0]?.id || "",
  );
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [dueTime, setDueTime] = useState("11:00 AM");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("High");
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedMemberId) {
      toast.error("Please enter a task title and choose a team assignee.");
      return;
    }

    const assigned = members.find((m) => m.id === assignedMemberId);
    const assignedName = assigned?.name || "Team Member";

    setIsSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await addTask({
        id,
        title: title.trim(),
        customer: customer.trim() || "General",
        dueDate,
        dueTime,
        priority,
        status: "Pending",
        completed: false,
        assignedUserId: assignedMemberId,
      } as unknown as Parameters<typeof addTask>[0]);

      toast.success(`Task assigned to ${assignedName}!`);
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Assign Task to Team
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Delegate customer follow-ups and action items to team members.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Member Selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Assign To Team Member *
            </label>
            <select
              required
              value={assignedMemberId}
              onChange={(e) => setAssignedMemberId(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-xs font-semibold text-slate-800"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name} ({m.role.toUpperCase()} - {m.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Task Title / Action Item *
            </label>
            <Input
              required
              placeholder="e.g. Call client regarding quotation review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Customer / Lead Name (Optional)
            </label>
            <Input
              placeholder="e.g. Ramesh Patel / Acme Corp"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Due Date *</label>
              <Input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Time</label>
              <Input
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="11:00 AM"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    priority === p
                      ? p === "High"
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {isSubmitting ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
