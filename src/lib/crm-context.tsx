import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  leadService,
  contactService,
  dealService,
  taskService,
  noteService,
  followUpService,
  activityService,
} from "./supabase";
import type {
  Lead, Contact, Deal, Task, Note, FollowUp, Activity,
} from "./crm-data";
import { useAuth } from "./auth-context";

// ── Store Type ────────────────────────────────────────────────────
interface CRMStore {
  // Data
  leads: Lead[];
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  followUps: FollowUp[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  // Leads
  addLead: (payload: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">) => Promise<Lead | null>;
  addLeadsBulk: (payloads: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">[]) => Promise<Lead[]>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
  archiveLead: (id: string) => Promise<boolean>;

  // Contacts
  addContact: (payload: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (id: string, patch: Partial<Contact>) => Promise<boolean>;
  archiveContact: (id: string) => Promise<boolean>;
  convertLeadToContact: (lead: Lead) => Promise<Contact | null>;

  // Deals
  addDeal: (payload: Partial<Deal>) => Promise<Deal | null>;
  updateDeal: (id: string, patch: Partial<Deal>) => Promise<boolean>;
  archiveDeal: (id: string) => Promise<boolean>;
  convertLeadToDeal: (lead: Lead, dealTitle: string, value?: number) => Promise<Deal | null>;

  // Tasks
  addTask: (payload: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<boolean>;
  completeTask: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  // Notes
  addNote: (content: string, opts?: { leadId?: string; contactId?: string; dealId?: string }) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;

  // Follow-ups
  addFollowUp: (payload: Partial<FollowUp>) => Promise<FollowUp | null>;
  completeFollowUp: (id: string) => Promise<boolean>;

  // Refresh
  refresh: () => Promise<void>;
}

const CRMContext = createContext<CRMStore | null>(null);

export function useCRM(): CRMStore {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error("useCRM must be used inside CRMProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────
export function CRMProvider({ children }: { children: ReactNode }) {
  const { business, user } = useAuth();
  const bizId = business?.id ?? null;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Log activity helper ─────────────────────────────────────────
  const logActivity = useCallback(
    async (
      type: string,
      title: string,
      detail: string,
      opts?: { leadId?: string; contactId?: string; dealId?: string },
    ) => {
      if (!bizId || !user) return;
      const act = await activityService.insert({
        businessId: bizId,
        userId: user.id,
        type,
        title,
        detail,
        leadId: opts?.leadId ?? null,
        contactId: opts?.contactId ?? null,
        dealId: opts?.dealId ?? null,
      });
      if (act) setActivities((prev) => [act, ...prev]);
    },
    [bizId, user],
  );

  // ── Load all data ───────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!bizId) {
      setLeads([]); setContacts([]); setDeals([]);
      setTasks([]); setNotes([]); setFollowUps([]); setActivities([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [l, c, d, t, fu, acts] = await Promise.all([
        leadService.list(bizId),
        contactService.list(bizId),
        dealService.list(bizId),
        taskService.list(bizId),
        followUpService.list(bizId),
        activityService.list(bizId),
      ]);
      setLeads(l); setContacts(c); setDeals(d);
      setTasks(t); setFollowUps(fu); setActivities(acts);
    } catch {
      setError("Failed to load CRM data");
    } finally {
      setIsLoading(false);
    }
  }, [bizId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = loadAll;

  // ── Leads ───────────────────────────────────────────────────────
  const addLead = useCallback(async (payload: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">) => {
    if (!bizId) return null;
    const lead = await leadService.insert(bizId, payload);
    if (!lead) { toast.error("Failed to add lead"); return null; }
    setLeads((prev) => [lead, ...prev]);
    toast.success("Lead added");
    await logActivity("lead_created", "Lead created", lead.name, { leadId: lead.id });
    return lead;
  }, [bizId, logActivity]);

  const addLeadsBulk = useCallback(async (payloads: Omit<Lead, "id" | "businessId" | "archived" | "createdAt" | "updatedAt">[]) => {
    if (!bizId || payloads.length === 0) return [];
    const inserted = await leadService.insertMany(bizId, payloads);
    if (inserted.length > 0) {
      setLeads((prev) => [...inserted, ...prev]);
      toast.success(`${inserted.length} leads added to CRM`);
      await logActivity("lead_created", `Bulk created ${inserted.length} leads`, `${inserted.length} leads added via Occo Assistant`);
    }
    return inserted;
  }, [bizId, logActivity]);

  const updateLead = useCallback(async (id: string, patch: Partial<Lead>) => {
    const ok = await leadService.update(id, patch);
    if (!ok) { toast.error("Failed to update lead"); return false; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (patch.status) {
      toast.success(`Status updated to ${patch.status}`);
      await logActivity("status_changed", `Status changed to ${patch.status}`, "", { leadId: id });
    } else {
      toast.success("Lead updated");
    }
    return true;
  }, [logActivity]);

  const deleteLead = useCallback(async (id: string) => {
    const ok = await leadService.delete(id);
    if (!ok) { toast.error("Failed to delete lead"); return false; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead deleted");
    return true;
  }, []);

  const archiveLead = useCallback(async (id: string) => {
    const ok = await leadService.archive(id);
    if (!ok) { toast.error("Failed to archive lead"); return false; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead archived");
    return true;
  }, []);

  // ── Contacts ────────────────────────────────────────────────────
  const addContact = useCallback(async (payload: Partial<Contact>) => {
    if (!bizId) return null;
    const contact = await contactService.insert(bizId, payload);
    if (!contact) { toast.error("Failed to add contact"); return null; }
    setContacts((prev) => [contact, ...prev]);
    toast.success("Contact added");
    await logActivity("contact_created", "Contact created", contact.name, { contactId: contact.id });
    return contact;
  }, [bizId, logActivity]);

  const updateContact = useCallback(async (id: string, patch: Partial<Contact>) => {
    const ok = await contactService.update(id, patch);
    if (!ok) { toast.error("Failed to update contact"); return false; }
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    toast.success("Contact updated");
    return true;
  }, []);

  const archiveContact = useCallback(async (id: string) => {
    const ok = await contactService.archive(id);
    if (!ok) { toast.error("Failed to archive contact"); return false; }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact archived");
    return true;
  }, []);

  const convertLeadToContact = useCallback(async (lead: Lead) => {
    let existingContact: Contact | undefined;
    setContacts((current) => {
      existingContact = current.find((c) => c.email === lead.email || c.phone === lead.phone);
      return current;
    });
    if (existingContact) {
      toast.info("Contact already exists for this lead");
      return existingContact;
    }
    const contact = await addContact({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      company: lead.company,
      leadId: lead.id,
    });
    if (contact) {
      await logActivity("lead_converted", "Converted lead to contact", lead.name, { leadId: lead.id, contactId: contact.id });
    }
    return contact;
  }, [addContact, logActivity]);

  // ── Deals ───────────────────────────────────────────────────────
  const addDeal = useCallback(async (payload: Partial<Deal>) => {
    if (!bizId) return null;
    const deal = await dealService.insert(bizId, payload);
    if (!deal) { toast.error("Failed to add deal"); return null; }
    setDeals((prev) => [deal, ...prev]);
    toast.success("Deal created");
    await logActivity("deal_created", "Deal created", deal.title, { dealId: deal.id, ...(deal.leadId ? { leadId: deal.leadId } : {}) });
    return deal;
  }, [bizId, logActivity]);

  const updateDeal = useCallback(async (id: string, patch: Partial<Deal>) => {
    const ok = await dealService.update(id, patch);
    if (!ok) { toast.error("Failed to update deal"); return false; }
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    if (patch.stage) {
      toast.success(`Deal moved to ${patch.stage}`);
      await logActivity("deal_stage_changed", `Deal stage → ${patch.stage}`, "", { dealId: id });
    } else {
      toast.success("Deal updated");
    }
    return true;
  }, [logActivity]);

  const archiveDeal = useCallback(async (id: string) => {
    const ok = await dealService.archive(id);
    if (!ok) { toast.error("Failed to archive deal"); return false; }
    setDeals((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deal archived");
    return true;
  }, []);

  const convertLeadToDeal = useCallback(async (lead: Lead, dealTitle: string, value?: number) => {
    return addDeal({
      title: dealTitle,
      customer: lead.name,
      value: value ?? lead.value,
      stage: "New",
      leadId: lead.id,
    });
  }, [addDeal]);

  // ── Tasks ───────────────────────────────────────────────────────
  const addTask = useCallback(async (payload: Partial<Task>) => {
    if (!bizId) return null;
    const task = await taskService.insert(bizId, payload);
    if (!task) { toast.error("Failed to add task"); return null; }
    setTasks((prev) => [task, ...prev]);
    toast.success("Task created");
    await logActivity("task_created", "Task created", task.title, { ...(task.relatedLeadId ? { leadId: task.relatedLeadId } : {}) });
    return task;
  }, [bizId, logActivity]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    const ok = await taskService.update(id, patch);
    if (!ok) { toast.error("Failed to update task"); return false; }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    toast.success("Task updated");
    return true;
  }, []);

  const completeTask = useCallback(async (id: string) => {
    const ok = await taskService.update(id, { status: "Completed" });
    if (!ok) { toast.error("Failed to complete task"); return false; }
    let finishedTask: Task | undefined;
    setTasks((prev) => {
      finishedTask = prev.find((t) => t.id === id);
      return prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t));
    });
    toast.success("Task completed");
    if (finishedTask) {
      await logActivity("task_completed", "Task completed", finishedTask.title, { ...(finishedTask.relatedLeadId ? { leadId: finishedTask.relatedLeadId } : {}) });
    }
    return true;
  }, [logActivity]);

  const deleteTask = useCallback(async (id: string) => {
    const ok = await taskService.delete(id);
    if (!ok) { toast.error("Failed to delete task"); return false; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task deleted");
    return true;
  }, []);

  // ── Notes ───────────────────────────────────────────────────────
  const addNote = useCallback(async (content: string, opts?: { leadId?: string; contactId?: string; dealId?: string }) => {
    if (!bizId || !user) return null;
    const note = await noteService.insert(bizId, user.id, content, opts);
    if (!note) { toast.error("Failed to save note"); return null; }
    setNotes((prev) => [note, ...prev]);
    toast.success("Note added");
    await logActivity("note_added", "Note added", content.slice(0, 80), opts);
    return note;
  }, [bizId, user, logActivity]);

  const deleteNote = useCallback(async (id: string) => {
    const ok = await noteService.delete(id);
    if (!ok) { toast.error("Failed to delete note"); return false; }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    return true;
  }, []);

  // ── Follow-ups ──────────────────────────────────────────────────
  const addFollowUp = useCallback(async (payload: Partial<FollowUp>) => {
    if (!bizId) return null;
    const fu = await followUpService.insert(bizId, payload);
    if (!fu) { toast.error("Failed to schedule follow-up"); return null; }
    setFollowUps((prev) => [fu, ...prev]);
    toast.success("Follow-up scheduled");
    await logActivity("follow_up_scheduled", "Follow-up scheduled", fu.note, { ...(fu.leadId ? { leadId: fu.leadId } : {}) });
    return fu;
  }, [bizId, logActivity]);

  const completeFollowUp = useCallback(async (id: string) => {
    const ok = await followUpService.complete(id);
    if (!ok) { toast.error("Failed to complete follow-up"); return false; }
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status: "Completed" } : f)));
    toast.success("Follow-up completed");
    return true;
  }, []);

  const value = useMemo(
    () => ({
      leads,
      contacts,
      deals,
      tasks,
      notes,
      followUps,
      activities,
      isLoading,
      error,
      addLead,
      addLeadsBulk,
      updateLead,
      deleteLead,
      archiveLead,
      addContact,
      updateContact,
      archiveContact,
      convertLeadToContact,
      addDeal,
      updateDeal,
      archiveDeal,
      convertLeadToDeal,
      addTask,
      updateTask,
      completeTask,
      deleteTask,
      addNote,
      deleteNote,
      addFollowUp,
      completeFollowUp,
      refresh,
    }),
    [
      leads,
      contacts,
      deals,
      tasks,
      notes,
      followUps,
      activities,
      isLoading,
      error,
      addLead,
      addLeadsBulk,
      updateLead,
      deleteLead,
      archiveLead,
      addContact,
      updateContact,
      archiveContact,
      convertLeadToContact,
      addDeal,
      updateDeal,
      archiveDeal,
      convertLeadToDeal,
      addTask,
      updateTask,
      completeTask,
      deleteTask,
      addNote,
      deleteNote,
      addFollowUp,
      completeFollowUp,
      refresh,
    ]
  );

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}
