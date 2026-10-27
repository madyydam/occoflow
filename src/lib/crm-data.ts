// ===========================================================
// OCCO FLOW — Type Definitions & Constants (V2)
// ===========================================================
// NO MOCK / SEED DATA — all data comes from Supabase.
// This file contains only types, enums, and utility helpers.
// ===========================================================

export const BRAND = "Occo Flow";
export const COMPANY = "Heyocco";
export const BOT_NAME = "Occo";

// ── Enums ────────────────────────────────────────────────
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Follow-up" | "Won" | "Lost";
export type LeadPriority = "Low" | "Medium" | "High";
export type DealStage = "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";
export type FollowUpStatus = "Pending" | "Completed" | "Cancelled";
export type SubscriptionStatus =
  | "trial_active"
  | "trial_expired"
  | "subscribed"
  | "subscription_expired"
  | "subscription_cancelled";
export type SubscriptionPlan =
  | "none"
  | "crm_monthly"
  | "crm_yearly"
  | "crm_lifetime"
  | "lifetime"
  | "standard_monthly"
  | "standard_yearly"
  | "premium_monthly"
  | "premium_yearly";
export type BillingCycle = "monthly" | "yearly" | "lifetime" | "custom";
export type AccessState =
  | "loading"
  | "unauthenticated"
  | "trial_active"
  | "trial_expired"
  | "subscribed"
  | "sub_expired";

// ── Lookup Arrays ────────────────────────────────────────
export const leadStatuses: LeadStatus[] = [
  "New", "Contacted", "Qualified", "Follow-up", "Won", "Lost",
];
export const dealStages: DealStage[] = [
  "New", "Qualified", "Proposal", "Negotiation", "Won", "Lost",
];
export const leadSources = [
  "Website", "Instagram", "Google", "Referral", "Walk-in", "Facebook", "LinkedIn", "Other",
];
export const industries = [
  "General", "Agency", "Retail", "Healthcare", "Education", "Fitness",
  "Food & Beverage", "Real Estate", "Technology", "Automotive", "Other",
];

// ── Interfaces ───────────────────────────────────────────
export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  businessId: string | null;
}

export interface Business {
  id: string;
  name: string;
  industry: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
}

export interface Subscription {
  id: string;
  businessId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle | null;
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  value: number;
  notes: string;
  assignedUserId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  // UI compatibility helpers
  followUp?: string;
  category?: string;
}

export interface Contact {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  tags: string[];
  notes: string;
  leadId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  // UI compatibility helper
  lastInteraction?: string;
}

export interface Deal {
  id: string;
  businessId: string;
  title: string;
  customer: string;
  value: number;
  stage: DealStage;
  closeDate: string | null;
  description: string;
  leadId: string | null;
  contactId: string | null;
  assignedUserId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  businessId: string;
  title: string;
  description: string;
  dueDate: string | null;
  dueTime: string;
  priority: TaskPriority;
  status: TaskStatus;
  relatedLeadId: string | null;
  relatedDealId: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  // UI compatibility helpers
  completed?: boolean;
  date?: string;
  time?: string;
  customer?: string;
}

export const OWNER = "Alex Morgan";

export interface Note {
  id: string;
  businessId: string;
  userId: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  businessId: string;
  leadId: string | null;
  contactId: string | null;
  scheduledAt: string;
  note: string;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  businessId: string;
  userId: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
}

// ── Utility Helpers ──────────────────────────────────────
export const money = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const trialDaysLeft = (trialEndsAt: string): number => {
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const isAccessAllowed = (status: SubscriptionStatus): boolean =>
  status === "trial_active" || status === "subscribed";
