import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Shield,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Share2,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { PageTitle, EmptyState } from "@/components/crm-ui";
import { useAuth } from "@/lib/auth-context";
import { useCRM } from "@/lib/crm-context";
import { type TeamMember, type TeamRole, teamService } from "@/lib/team-service";
import { InviteTeamMemberModal, AssignTeamTaskModal } from "@/components/team-ui-modals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & Workload Delegation | Occo Flow" },
      {
        name: "description",
        content: "Collaborate with colleagues, assign tasks, and track team sales performance.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <AccessGuard>
      <AppShell>
        <TeamContent />
      </AppShell>
    </AccessGuard>
  );
}

function TeamContent() {
  const { business, profile } = useAuth();
  const { tasks, leads, completeTask } = useCRM();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "tasks">("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [selectedMemberForTasks, setSelectedMemberForTasks] = useState<string>("All");

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [preselectedMember, setPreselectedMember] = useState<TeamMember | null>(null);

  // Load team data
  const loadTeam = useCallback(async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const data = await teamService.listMembers(business.id, tasks, leads);
      setMembers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members.");
    } finally {
      setIsLoading(false);
    }
  }, [business?.id, tasks, leads]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Overall Team Metrics
  const teamMetrics = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    const pendingInvites = members.filter((m) => m.status === "invited").length;

    const totalAssignedTasks = tasks.filter((t) => Boolean(t.assignedUserId)).length;
    const completedTeamTasks = tasks.filter(
      (t) => Boolean(t.assignedUserId) && (t.status === "Completed" || Boolean(t.completed)),
    ).length;
    const pendingTeamTasks = totalAssignedTasks - completedTeamTasks;

    return {
      totalMembers,
      activeMembers,
      pendingInvites,
      totalAssignedTasks,
      completedTeamTasks,
      pendingTeamTasks,
      completionRate:
        totalAssignedTasks > 0 ? Math.round((completedTeamTasks / totalAssignedTasks) * 100) : 0,
    };
  }, [members, tasks]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        searchQuery === "" ||
        `${m.name} ${m.email} ${m.phone} ${m.department}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "All" || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Delegated Tasks list
  const delegatedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assignedId = t.assignedUserId;
      if (!assignedId) return false;
      if (selectedMemberForTasks !== "All" && assignedId !== selectedMemberForTasks) return false;
      return true;
    });
  }, [tasks, selectedMemberForTasks]);

  // Actions
  const handleRemoveMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this workspace?`)) return;
    try {
      await teamService.removeMember(business?.id || "", id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success(`${name} has been removed.`);
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleOpenAssignModal = (member?: TeamMember) => {
    setPreselectedMember(member || null);
    setAssignModalOpen(true);
  };

  const getRoleBadgeStyle = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sales_rep":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "support":
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <>
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <PageTitle
            title="Team & Workload Delegation"
            description="Manage colleagues, invite teammates, and assign customer follow-up tasks."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTeam}
            title="Refresh team"
            className="h-9 px-3 rounded-xl border-slate-200 text-xs text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-600" : ""} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignModal()}
            className="h-9 px-3.5 rounded-xl border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100/70 text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <Calendar size={13} /> Assign Task
          </Button>

          <Button
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} /> Invite Member
          </Button>
        </div>
      </div>

      {/* ── 1. Team Performance Metrics ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Team Members</span>
            <div className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Users size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            {teamMetrics.totalMembers}
          </p>
          <span className="text-[10px] text-slate-400">
            {teamMetrics.activeMembers} active · {teamMetrics.pendingInvites} invited
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tasks Delegated</span>
            <div className="grid size-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <Briefcase size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            {teamMetrics.totalAssignedTasks}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold">Assigned across team</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 leading-tight">
            {teamMetrics.completedTeamTasks}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {teamMetrics.completionRate}% completion rate
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Workload</span>
            <div className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-700 leading-tight">
            {teamMetrics.pendingTeamTasks}
          </p>
          <span className="text-[10px] text-amber-600 font-medium">To-do follow ups</span>
        </div>
      </div>

      {/* ── 2. Tab Navigation (Members vs Delegated Tasks) ─────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab("members")}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "members"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          👥 Team Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`h-10 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "tasks"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          📋 Delegated Tasks Board ({delegatedTasks.length})
        </button>
      </div>

      {/* ── 3. Tab Content: Team Members ──────────────────────────────── */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Search & Role Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search member name, email or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl border-slate-200 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["All", "owner", "admin", "manager", "sales_rep", "support"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    roleFilter === r
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r === "All" ? "All Roles" : r.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Members List */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              title="No team members found"
              description="Invite your first sales rep, manager, or colleague to assign tasks and manage leads together."
              action="Invite Team Member"
              onAdd={() => setInviteModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMembers.map((m) => {
                const initials =
                  m.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "TM";

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                  >
                    <div>
                      {/* Member Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-extrabold text-sm shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-slate-900">{m.name}</h3>
                              {m.status === "invited" && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0">
                                  Pending Invite
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {m.department || "General"}
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={`text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(m.role)}`}
                        >
                          {m.role.replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-xs text-slate-600 mb-3.5 pt-2 border-t border-slate-100">
                        {m.phone && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone size={12} className="text-slate-400" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail size={12} className="text-slate-400" />
                            <span className="truncate">{m.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Workload Stats Chips */}
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-2 text-center text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Tasks</span>
                          <span className="font-bold text-slate-800">{m.assignedTasksCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Done</span>
                          <span className="font-bold text-emerald-600">
                            {m.completedTasksCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Leads</span>
                          <span className="font-bold text-blue-600">{m.assignedLeadsCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAssignModal(m)}
                        className="h-8 flex-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs border border-purple-200/80 shadow-none flex items-center justify-center gap-1"
                      >
                        <Plus size={13} /> Assign Task
                      </Button>

                      {m.phone && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const clean = m.phone.replace(/\D/g, "");
                            const p = clean.length === 10 ? `91${clean}` : clean;
                            window.open(`https://wa.me/${p}`, "_blank");
                          }}
                          title="Message on WhatsApp"
                          className="size-8 rounded-xl border-slate-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <MessageCircle size={14} />
                        </Button>
                      )}

                      {m.role !== "owner" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          title="Remove Member from Team"
                          className="size-8 rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl text-slate-400"
                          >
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl p-1">
                          <DropdownMenuItem onClick={() => handleOpenAssignModal(m)}>
                            <Calendar size={13} className="mr-2" /> Assign New Task
                          </DropdownMenuItem>
                          {m.status === "invited" && (
                            <DropdownMenuItem
                              onClick={() => {
                                const link = teamService.generateWhatsAppInvite(
                                  m,
                                  business?.name || "Business",
                                );
                                window.open(link, "_blank");
                              }}
                            >
                              <Share2 size={13} className="mr-2" /> Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {m.role !== "owner" && (
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(m.id, m.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={13} className="mr-2" /> Remove Member
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Tab Content: Delegated Tasks Board ─────────────────────── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Member Filter */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Assignee:</span>
              <select
                value={selectedMemberForTasks}
                onChange={(e) => setSelectedMemberForTasks(e.target.value)}
                className="h-8.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="All">All Team Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenAssignModal()}
              className="h-8.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Delegate New Task
            </Button>
          </div>

          {/* Tasks List */}
          {delegatedTasks.length === 0 ? (
            <EmptyState
              title="No tasks delegated to team"
              description="Assign tasks and customer follow-ups to your colleagues to track who is working on what."
              action="Assign First Task"
              onAdd={() => handleOpenAssignModal()}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Task & Customer</th>
                      <th className="py-3 px-4">Assigned Member</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {delegatedTasks.map((t) => {
                      const assignee = members.find((m) => m.id === t.assignedUserId);
                      const isDone = t.status === "Completed" || Boolean(t.completed);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div>
                              <p
                                className={`font-bold ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}
                              >
                                {t.title}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {t.customer || "General"}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                              👤 {assignee?.name || "Assigned Colleague"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{t.date || t.dueDate || "Pending"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              className={`text-[10px] px-2 py-0.5 border-0 ${
                                t.priority === "High"
                                  ? "bg-rose-100 text-rose-800"
                                  : t.priority === "Low"
                                    ? "bg-slate-100 text-slate-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {t.priority}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                t.completed ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {t.completed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                              {t.completed ? "Completed" : "Pending"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => completeTask(t.id)}
                              className={`h-7.5 px-2.5 rounded-lg text-[11px] font-semibold ${
                                t.completed
                                  ? "border-slate-200 text-slate-500 hover:bg-slate-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {t.completed ? "Reopen" : "Mark Done"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <InviteTeamMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvited={(newMember) => setMembers((prev) => [newMember, ...prev])}
      />

      <AssignTeamTaskModal
        open={assignModalOpen}
        members={members}
        preselectedMember={preselectedMember}
        onClose={() => setAssignModalOpen(false)}
        onTaskCreated={loadTeam}
      />
    </>
  );
}
