import { supabase } from "./supabase";
import type { Task, Lead } from "./crm-data";

export type TeamRole = "owner" | "admin" | "manager" | "sales_rep" | "support";

export interface TeamMember {
  id: string;
  userId?: string | null;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  department: string;
  status: "active" | "invited";
  avatarUrl?: string;
  inviteToken?: string;
  invitedAt?: string;
  joinedAt?: string;

  // Live workload metrics
  assignedTasksCount: number;
  completedTasksCount: number;
  assignedLeadsCount: number;
}

export interface TeamInvitePayload {
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  department: string;
  notes?: string;
}

// Local cache helper
function getLocalTeam(businessId: string): TeamMember[] {
  try {
    const raw =
      localStorage.getItem(`occo_team_${businessId}`) ||
      localStorage.getItem(`futora_team_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTeam(businessId: string, members: TeamMember[]) {
  try {
    localStorage.setItem(`occo_team_${businessId}`, JSON.stringify(members));
  } catch (e) {
    console.warn("[TeamService] local storage save error:", e);
  }
}

export const teamService = {
  // Fetch all team members & pending invites
  async listMembers(
    businessId: string,
    tasks: Task[] = [],
    leads: Lead[] = [],
  ): Promise<TeamMember[]> {
    if (!businessId) return [];

    const members: TeamMember[] = [];

    // 1. Fetch real active members from memberships & profiles
    try {
      const { data: mems, error: memErr } = await supabase
        .from("memberships")
        .select("id, user_id, business_id, role, created_at")
        .eq("business_id", businessId);

      if (!memErr && mems && mems.length > 0) {
        const userIds = mems.map((m) => m.user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url")
          .in("id", userIds);

        const profMap = new Map((profs || []).map((p) => [p.id, p]));

        for (const m of mems) {
          const prof = profMap.get(m.user_id);
          const name = prof?.full_name?.trim() || "Team Member";
          const phone = prof?.phone || "";

          // Calculate assigned tasks & leads
          const assignedTasks = tasks.filter((t) => t.assignedUserId === m.user_id);
          const completedTasks = assignedTasks.filter((t) => t.completed).length;
          const assignedLeads = leads.filter((l) => l.assignedUserId === m.user_id).length;

          members.push({
            id: m.user_id,
            userId: m.user_id,
            businessId,
            name,
            email: "", // User auth emails are protected in auth.users
            phone,
            role: (m.role as TeamRole) || "member",
            department: m.role === "owner" ? "Executive" : "Sales & Operations",
            status: "active",
            avatarUrl: prof?.avatar_url || "",
            joinedAt: m.created_at,
            assignedTasksCount: assignedTasks.length,
            completedTasksCount: completedTasks,
            assignedLeadsCount: assignedLeads,
          });
        }
      }
    } catch (err) {
      console.warn("[TeamService] error fetching memberships:", err);
    }

    // 2. Fetch pending invitations from activities (cloud synced)
    try {
      const { data: actData } = await supabase
        .from("activities")
        .select("*")
        .eq("business_id", businessId)
        .eq("type", "team_invitation")
        .order("created_at", { ascending: false });

      if (actData && actData.length > 0) {
        for (const act of actData) {
          try {
            const parsed = JSON.parse(act.detail || "{}");
            if (parsed && parsed.status === "invited") {
              const assignedTasks = tasks.filter((t) => t.assignedUserId === act.id);
              const completedTasks = assignedTasks.filter((t) => t.completed).length;
              const assignedLeads = leads.filter((l) => l.assignedUserId === act.id).length;

              members.push({
                id: act.id,
                userId: null,
                businessId,
                name: parsed.name || act.title,
                email: parsed.email || "",
                phone: parsed.phone || "",
                role: parsed.role || "sales_rep",
                department: parsed.department || "Sales",
                status: "invited",
                inviteToken: parsed.inviteToken || "",
                invitedAt: act.created_at,
                assignedTasksCount: assignedTasks.length,
                completedTasksCount: completedTasks,
                assignedLeadsCount: assignedLeads,
              });
            }
          } catch {
            // ignore JSON parse error
          }
        }
      }
    } catch (err) {
      console.warn("[TeamService] error fetching invitations:", err);
    }

    // 3. Fallback to local cache if empty
    const local = getLocalTeam(businessId);
    if (members.length === 0 && local.length > 0) {
      return local;
    }

    setLocalTeam(businessId, members);
    return members;
  },

  // Invite a new team member
  async inviteMember(
    businessId: string,
    payload: TeamInvitePayload,
    inviterName: string,
  ): Promise<TeamMember> {
    const id = crypto.randomUUID();
    const inviteToken = `FT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const member: TeamMember = {
      id,
      userId: null,
      businessId,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      role: payload.role,
      department: payload.department.trim() || "Sales",
      status: "invited",
      inviteToken,
      invitedAt: now,
      assignedTasksCount: 0,
      completedTasksCount: 0,
      assignedLeadsCount: 0,
    };

    // 1. Persist to Supabase activities (cloud synced across all sessions)
    try {
      await supabase.from("activities").insert([
        {
          id: member.id,
          business_id: businessId,
          type: "team_invitation",
          title: member.name,
          detail: JSON.stringify({
            ...member,
            inviterName,
            notes: payload.notes || "",
          }),
        },
      ]);
    } catch (err) {
      console.warn("[TeamService] save invitation error:", err);
    }

    // 2. Try workspace_invitations table if it exists
    try {
      await supabase.from("workspace_invitations").insert([
        {
          id: member.id,
          business_id: businessId,
          invitee_name: member.name,
          invitee_email: member.email,
          invitee_phone: member.phone,
          role: member.role,
          department: member.department,
          token: inviteToken,
          status: "pending",
        },
      ]);
    } catch {
      // Ignored if table not created yet
    }

    // 3. Update local cache
    const existing = getLocalTeam(businessId);
    setLocalTeam(businessId, [member, ...existing]);

    return member;
  },

  // Assign a task to team member
  async assignTask(taskId: string, assignedUserId: string, businessId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_user_id: assignedUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) {
        console.warn("[TeamService] assign task error:", error);
      }
      return true;
    } catch {
      return false;
    }
  },

  // Remove or revoke member invitation
  async removeMember(businessId: string, memberId: string): Promise<boolean> {
    try {
      await supabase.from("activities").delete().eq("id", memberId);
    } catch {
      // ignore
    }
    try {
      await supabase.from("workspace_invitations").delete().eq("id", memberId);
    } catch {
      // ignore
    }
    try {
      await supabase
        .from("memberships")
        .delete()
        .eq("user_id", memberId)
        .eq("business_id", businessId);
    } catch {
      // ignore
    }

    const current = getLocalTeam(businessId);
    setLocalTeam(
      businessId,
      current.filter((m) => m.id !== memberId),
    );
    return true;
  },

  // Update member role
  async updateRole(businessId: string, memberId: string, role: TeamRole): Promise<boolean> {
    try {
      await supabase
        .from("memberships")
        .update({ role })
        .eq("user_id", memberId)
        .eq("business_id", businessId);
    } catch {
      // ignore
    }

    const current = getLocalTeam(businessId);
    const updated = current.map((m) => (m.id === memberId ? { ...m, role } : m));
    setLocalTeam(businessId, updated);
    return true;
  },

  // Format WhatsApp invite link
  generateWhatsAppInvite(member: TeamMember, businessName: string): string {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://flow.heyocco.com";
    const inviteLink = `${origin}/auth/signup?invite=${member.inviteToken || member.id}`;
    const text = encodeURIComponent(
      `Hello ${member.name} 👋,\n\nYou have been invited to join *${businessName}* on Occo Flow as *${member.role.toUpperCase()}* (${member.department}).\n\nClick below to access your workspace and assigned tasks:\n👉 ${inviteLink}\n\nYour Invite Code: *${member.inviteToken}*`,
    );
    const cleanPhone = member.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${text}`;
  },

  // Format Email invite link
  generateEmailInvite(member: TeamMember, businessName: string): string {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://flow.heyocco.com";
    const inviteLink = `${origin}/auth/signup?invite=${member.inviteToken || member.id}`;
    const subject = encodeURIComponent(`Invitation to join ${businessName} on Occo Flow`);
    const body = encodeURIComponent(
      `Hi ${member.name},\n\nYou have been invited by ${businessName} to collaborate on Occo Flow.\n\nRole: ${member.role.toUpperCase()}\nDepartment: ${member.department}\n\nJoin your workspace here:\n${inviteLink}\n\nInvite Code: ${member.inviteToken}\n\nBest regards,\n${businessName} Team`,
    );
    return `mailto:${member.email}?subject=${subject}&body=${body}`;
  },
};
