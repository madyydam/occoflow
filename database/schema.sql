-- ==============================================================================
-- OCCO FLOW — UNIFIED PRODUCTION DATABASE SCHEMA (SINGLE MASTER FILE)
-- ==============================================================================
-- Location   : database/schema.sql
-- Version    : 3.0.0 (Unified CRM + Admin Portal + Feedback & Rating System)
-- Description: Complete multi-tenant CRM schema with Supabase Auth, Subscriptions,
--              Admin Operations, Problems/Suggestions/Feedback, and CRM Ratings.
--              100% IDEMPOTENT: Safe to run repeatedly without any errors.
-- ==============================================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUMS (Safe creation with duplicate checks)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('New','Contacted','Qualified','Follow-up','Won','Lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_priority AS ENUM ('Low','Medium','High');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM ('New','Qualified','Proposal','Negotiation','Won','Lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('Pending','In Progress','Completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Low','Medium','High');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE follow_up_status AS ENUM ('Pending','Completed','Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trial_active','trial_expired','subscribed','subscription_expired','subscription_cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly','yearly','lifetime','custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM (
    'none','crm_monthly','crm_yearly','crm_lifetime','lifetime','standard_monthly','standard_yearly','premium_monthly','premium_yearly'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin','admin','support','finance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('owner', 'admin', 'manager', 'sales_rep', 'support');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_record_status AS ENUM ('Unpaid', 'Partial', 'Paid', 'Overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_record_mode AS ENUM ('UPI', 'Bank Transfer', 'Cash', 'Cheque', 'Razorpay', 'Other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_channel AS ENUM ('whatsapp', 'sms', 'email', 'in_app', 'call');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Safe enum expansions for existing databases (idempotent ADD VALUE)
DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'lifetime';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_monthly';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_yearly';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_lifetime';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'lifetime';
EXCEPTION WHEN others THEN null; END $$;

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. BUSINESSES / WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  industry           TEXT DEFAULT 'General',
  phone              TEXT DEFAULT '',
  email              TEXT DEFAULT '',
  address            TEXT DEFAULT '',
  logo_url           TEXT DEFAULT '',
  is_suspended       BOOLEAN DEFAULT false NOT NULL,
  suspension_reason  TEXT DEFAULT '' NOT NULL,
  suspended_at       TIMESTAMPTZ,
  last_active_at     TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at         TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at         TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Ensure columns exist if table was created in an earlier migration
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_suspended      BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS suspension_reason  TEXT DEFAULT '' NOT NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS last_active_at     TIMESTAMPTZ DEFAULT timezone('utc', now());

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL DEFAULT '',
  phone        TEXT DEFAULT '',
  avatar_url   TEXT DEFAULT '',
  business_id  UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. MEMBERSHIPS (user <-> business)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'owner',
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, business_id)
);

-- ============================================================
-- 6. SUBSCRIPTIONS (per business)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  status                   subscription_status DEFAULT 'trial_active' NOT NULL,
  plan                     subscription_plan DEFAULT 'none' NOT NULL,
  billing_cycle            billing_cycle,
  trial_started_at         TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  trial_ends_at            TIMESTAMPTZ NOT NULL,
  subscription_started_at  TIMESTAMPTZ,
  subscription_ends_at     TIMESTAMPTZ,
  provider_customer_id     TEXT DEFAULT '',
  provider_subscription_id TEXT DEFAULT '',
  created_at               TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at               TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 7. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT DEFAULT '',
  email            TEXT DEFAULT '',
  company          TEXT DEFAULT '',
  source           TEXT DEFAULT 'Website',
  status           lead_status DEFAULT 'New' NOT NULL,
  priority         lead_priority DEFAULT 'Medium' NOT NULL,
  value            NUMERIC(14,2) DEFAULT 0,
  notes            TEXT DEFAULT '',
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 8. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT DEFAULT '',
  email            TEXT DEFAULT '',
  company          TEXT DEFAULT '',
  tags             TEXT[] DEFAULT '{}',
  notes            TEXT DEFAULT '',
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  archived         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  customer         TEXT NOT NULL,
  value            NUMERIC(14,2) DEFAULT 0,
  stage            deal_stage DEFAULT 'New' NOT NULL,
  close_date       DATE,
  description      TEXT DEFAULT '',
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id       UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS deals_updated_at ON public.deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 10. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  due_date         DATE,
  due_time         TEXT DEFAULT '',
  priority         task_priority DEFAULT 'Medium' NOT NULL,
  status           task_status DEFAULT 'Pending' NOT NULL,
  related_lead_id  UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  related_deal_id  UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time         TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 11. NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id      UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 12. FOLLOW-UPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  note         TEXT DEFAULT '',
  status       follow_up_status DEFAULT 'Pending' NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 13. ACTIVITIES (timeline log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id      UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'note',
  title        TEXT NOT NULL,
  detail       TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 14. IN-APP USER NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'info',
  title        TEXT NOT NULL,
  body         TEXT DEFAULT '',
  read         BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 15. ADMIN USERS (Platform Staff)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          admin_role DEFAULT 'admin' NOT NULL,
  is_active     BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
DROP TRIGGER IF EXISTS admin_users_updated_at ON public.admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: Check if current caller is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 16. PLATFORM SETTINGS (Global Configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  label       TEXT,
  description TEXT,
  updated_by  UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 17. ADMIN AUDIT LOGS (Immutable History)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  entity_name TEXT DEFAULT '' NOT NULL,
  old_value   JSONB DEFAULT '{}',
  new_value   JSONB DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT DEFAULT '' NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 18. PROBLEMS, SUGGESTIONS & SUPPORT TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type                  TEXT DEFAULT 'problem' NOT NULL,
  subject               TEXT NOT NULL,
  description           TEXT DEFAULT '' NOT NULL,
  priority              TEXT DEFAULT 'medium' NOT NULL,
  status                TEXT DEFAULT 'new' NOT NULL,
  assigned_admin_id     UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_response        TEXT DEFAULT '' NOT NULL,
  admin_responded_at    TIMESTAMPTZ,
  admin_responded_by_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  rating                INTEGER,
  rating_comment        TEXT DEFAULT '' NOT NULL,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Ensure all extended columns exist idempotently
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS type                  TEXT DEFAULT 'problem' NOT NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_response        TEXT DEFAULT '' NOT NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_responded_at    TIMESTAMPTZ;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_responded_by_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS rating                INTEGER;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS rating_comment        TEXT DEFAULT '' NOT NULL;

-- Safe check constraints
DO $$ BEGIN
  ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_type_check;
  ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_type_check 
    CHECK (type IN ('problem','suggestion','feedback'));
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
  ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_check 
    CHECK (status IN ('new','under_review','in_progress','resolved','closed','open','waiting'));
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_check;
  ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_priority_check 
    CHECK (priority IN ('low','medium','high','urgent'));
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_rating_check;
  ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_rating_check 
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
EXCEPTION WHEN others THEN null; END $$;

DROP TRIGGER IF EXISTS tickets_updated_at ON public.support_tickets;
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 19. SUPPORT MESSAGES (Threaded ticket conversations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type      TEXT NOT NULL CHECK (sender_type IN ('customer','admin')),
  sender_id        UUID,
  message          TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 20. PLATFORM BROADCAST NOTIFICATIONS (Admin Broadcasts)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_notifications_admin (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  type                TEXT DEFAULT 'info' NOT NULL,
  audience            TEXT DEFAULT 'all' NOT NULL,
  target_audience     TEXT DEFAULT 'all' NOT NULL,
  target_plan         TEXT,
  target_business_ids UUID[] DEFAULT '{}',
  status              TEXT DEFAULT 'sent' NOT NULL,
  is_published        BOOLEAN DEFAULT true NOT NULL,
  views_count         INTEGER DEFAULT 0 NOT NULL,
  viewed_user_ids     UUID[] DEFAULT '{}' NOT NULL,
  scheduled_at        TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_by          UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Idempotent column additions for existing installations
ALTER TABLE public.platform_notifications_admin ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all' NOT NULL;
ALTER TABLE public.platform_notifications_admin ADD COLUMN IF NOT EXISTS is_published    BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.platform_notifications_admin ADD COLUMN IF NOT EXISTS views_count     INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.platform_notifications_admin ADD COLUMN IF NOT EXISTS viewed_user_ids UUID[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.platform_notifications_admin ADD COLUMN IF NOT EXISTS sent_at         TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Function to record a single user view per announcement
CREATE OR REPLACE FUNCTION public.record_broadcast_view(p_notification_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := COALESCE(auth.uid(), p_user_id);
  IF v_uid IS NULL THEN
    UPDATE public.platform_notifications_admin
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_notification_id;
  ELSE
    UPDATE public.platform_notifications_admin
    SET 
      viewed_user_ids = array_append(COALESCE(viewed_user_ids, '{}'), v_uid),
      views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_notification_id
      AND NOT (v_uid = ANY(COALESCE(viewed_user_ids, '{}')));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_broadcast_view(UUID, UUID) TO authenticated, anon, service_role;

-- ============================================================
-- 21. CUSTOM SOFTWARE INQUIRIES (Public Leads & Quotes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_software_inquiries (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_number            TEXT,
  full_name                 TEXT NOT NULL,
  company_name              TEXT NOT NULL,
  email                     TEXT NOT NULL,
  phone                     TEXT NOT NULL,
  preferred_contact_method  TEXT DEFAULT 'email' NOT NULL,
  project_type              TEXT NOT NULL,
  budget_range              TEXT NOT NULL,
  timeline                  TEXT NOT NULL,
  requirements              TEXT NOT NULL,
  status                    TEXT DEFAULT 'new' NOT NULL,
  admin_notes               TEXT DEFAULT '' NOT NULL,
  assigned_to               UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ip_address                TEXT,
  user_agent                TEXT,
  created_at                TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Idempotent column additions for existing installations
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS inquiry_number           TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS full_name                TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS company_name             TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS email                    TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS phone                    TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email';
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS project_type             TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS budget_range             TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS timeline                 TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS requirements             TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS status                   TEXT DEFAULT 'new';
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS admin_notes              TEXT DEFAULT '';
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS assigned_to              UUID;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS ip_address               TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS user_agent               TEXT;
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS created_at               TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.custom_software_inquiries ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Sequence / auto-generation trigger for friendly inquiry_number like CS-1001
CREATE SEQUENCE IF NOT EXISTS public.custom_inquiry_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.set_custom_inquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inquiry_number IS NULL OR NEW.inquiry_number = '' THEN
    NEW.inquiry_number := 'CS-' || nextval('public.custom_inquiry_seq');
  END IF;
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_custom_inquiry_number ON public.custom_software_inquiries;
CREATE TRIGGER trg_custom_inquiry_number
  BEFORE INSERT OR UPDATE ON public.custom_software_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_custom_inquiry_number();

-- ============================================================
-- 22. INDEXES (Fast Queries & Filtering)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_status     ON public.custom_software_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_created    ON public.custom_software_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_email      ON public.custom_software_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_project    ON public.custom_software_inquiries(project_type);
CREATE INDEX IF NOT EXISTS idx_profiles_business          ON public.profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user           ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business       ON public.memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business     ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business             ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status               ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created              ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_business          ON public.contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_deals_business             ON public.deals(business_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage                ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_business             ON public.tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date             ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_notes_lead                 ON public.notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_business        ON public.follow_ups(business_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled       ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_activities_business        ON public.activities(business_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead            ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user         ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created   ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin     ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity    ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business   ON public.support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id    ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type       ON public.support_tickets(type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_rating     ON public.support_tickets(rating);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created    ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket    ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_businesses_suspended       ON public.businesses(is_suspended);
CREATE INDEX IF NOT EXISTS idx_businesses_last_active     ON public.businesses(last_active_at DESC);

-- ============================================================
-- 22. ROW LEVEL SECURITY — Enable on All Tables
-- ============================================================
ALTER TABLE public.businesses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notifications_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_software_inquiries   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 23. RLS POLICIES (Strict Tenant Isolation + Admin Access)
-- ============================================================

-- BUSINESSES
DROP POLICY IF EXISTS "businesses_member" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_override" ON public.businesses;
CREATE POLICY "businesses_member" ON public.businesses
  FOR ALL USING (
    public.is_admin() OR
    id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- PROFILES
DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_override" ON public.profiles;
CREATE POLICY "profiles_self" ON public.profiles
  FOR ALL USING (public.is_admin() OR id = auth.uid());

-- MEMBERSHIPS
DROP POLICY IF EXISTS "memberships_self" ON public.memberships;
CREATE POLICY "memberships_self" ON public.memberships
  FOR ALL USING (public.is_admin() OR user_id = auth.uid());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_member" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_override" ON public.subscriptions;
CREATE POLICY "subscriptions_member" ON public.subscriptions
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- LEADS
DROP POLICY IF EXISTS "leads_business" ON public.leads;
CREATE POLICY "leads_business" ON public.leads
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- CONTACTS
DROP POLICY IF EXISTS "contacts_business" ON public.contacts;
CREATE POLICY "contacts_business" ON public.contacts
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- DEALS
DROP POLICY IF EXISTS "deals_business" ON public.deals;
CREATE POLICY "deals_business" ON public.deals
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- TASKS
DROP POLICY IF EXISTS "tasks_business" ON public.tasks;
CREATE POLICY "tasks_business" ON public.tasks
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- NOTES
DROP POLICY IF EXISTS "notes_business" ON public.notes;
CREATE POLICY "notes_business" ON public.notes
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- FOLLOW-UPS
DROP POLICY IF EXISTS "follow_ups_business" ON public.follow_ups;
CREATE POLICY "follow_ups_business" ON public.follow_ups
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- ACTIVITIES
DROP POLICY IF EXISTS "activities_business" ON public.activities;
CREATE POLICY "activities_business" ON public.activities
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_self" ON public.notifications;
CREATE POLICY "notifications_self" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ADMIN USERS
DROP POLICY IF EXISTS "admin_self" ON public.admin_users;
DROP POLICY IF EXISTS "admin_all_admins" ON public.admin_users;
CREATE POLICY "admin_self" ON public.admin_users FOR SELECT USING (id = auth.uid());
CREATE POLICY "admin_all_admins" ON public.admin_users FOR ALL USING (public.is_admin());

-- PLATFORM SETTINGS
DROP POLICY IF EXISTS "settings_admin" ON public.platform_settings;
CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL USING (public.is_admin());

-- ADMIN AUDIT LOGS
DROP POLICY IF EXISTS "audit_read" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON public.admin_audit_logs;
CREATE POLICY "audit_read" ON public.admin_audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_insert" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- PROBLEMS, SUGGESTIONS & SUPPORT TICKETS
DROP POLICY IF EXISTS "tickets_customer" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin" ON public.support_tickets;
CREATE POLICY "tickets_customer" ON public.support_tickets
  FOR ALL USING (
    user_id = auth.uid() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "tickets_admin" ON public.support_tickets
  FOR ALL USING (public.is_admin());

-- SUPPORT MESSAGES
DROP POLICY IF EXISTS "messages_customer" ON public.support_messages;
DROP POLICY IF EXISTS "messages_admin" ON public.support_messages;
CREATE POLICY "messages_customer" ON public.support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE user_id = auth.uid() OR
            business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
    ) AND is_internal_note = false
  );
CREATE POLICY "messages_admin" ON public.support_messages
  FOR ALL USING (public.is_admin());

-- PLATFORM BROADCAST NOTIFICATIONS
DROP POLICY IF EXISTS "pna_admin" ON public.platform_notifications_admin;
CREATE POLICY "pna_admin" ON public.platform_notifications_admin
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "pna_read_users" ON public.platform_notifications_admin;
CREATE POLICY "pna_read_users" ON public.platform_notifications_admin
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pna_user_view_update" ON public.platform_notifications_admin;
CREATE POLICY "pna_user_view_update" ON public.platform_notifications_admin
  FOR UPDATE USING (true) WITH CHECK (true);

-- CUSTOM SOFTWARE INQUIRIES
-- 1. Anyone (public anonymous & logged in users) can submit a custom software inquiry
DROP POLICY IF EXISTS "csi_insert_public" ON public.custom_software_inquiries;
CREATE POLICY "csi_insert_public" ON public.custom_software_inquiries
  FOR INSERT WITH CHECK (true);

-- 2. ONLY authorized Admin users can view, update, manage, or delete inquiries
DROP POLICY IF EXISTS "csi_admin_all" ON public.custom_software_inquiries;
CREATE POLICY "csi_admin_all" ON public.custom_software_inquiries
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 24. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 25. PAYMENT RECORDS & INVOICE MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name         TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_email        TEXT DEFAULT '',
  invoice_number        TEXT NOT NULL,
  deal_id               UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  lead_id               UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  total_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date              DATE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'Unpaid',
  payment_mode          TEXT NOT NULL DEFAULT 'UPI',
  notes                 TEXT DEFAULT '',
  upi_id                TEXT DEFAULT '',
  recurring_interval    TEXT DEFAULT 'none',
  next_recurring_date   DATE,
  promise_to_pay_date   DATE,
  promise_to_pay_amount NUMERIC(14,2),
  promise_to_pay_note   TEXT DEFAULT '',
  late_fee_enabled      BOOLEAN DEFAULT false,
  late_fee_type         TEXT DEFAULT 'percentage',
  late_fee_rate         NUMERIC(8,2) DEFAULT 0,
  calculated_late_fee   NUMERIC(14,2) DEFAULT 0,
  installments          JSONB DEFAULT '[]'::jsonb,
  reminder_logs         JSONB DEFAULT '[]'::jsonb,
  last_reminded_at      TIMESTAMPTZ,
  auto_remind_enabled   BOOLEAN DEFAULT true,
  created_by_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name       TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Idempotent column migrations for existing instances
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS customer_email        TEXT DEFAULT '';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS upi_id                TEXT DEFAULT '';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS recurring_interval    TEXT DEFAULT 'none';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS next_recurring_date   DATE;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS promise_to_pay_date   DATE;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS promise_to_pay_amount NUMERIC(14,2);
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS promise_to_pay_note   TEXT DEFAULT '';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS late_fee_enabled      BOOLEAN DEFAULT false;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS late_fee_type         TEXT DEFAULT 'percentage';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS late_fee_rate         NUMERIC(8,2) DEFAULT 0;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS calculated_late_fee   NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS installments          JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS reminder_logs         JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS last_reminded_at      TIMESTAMPTZ;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS auto_remind_enabled   BOOLEAN DEFAULT true;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS created_by_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS created_by_name       TEXT DEFAULT '';

-- Triggers
DROP TRIGGER IF EXISTS payment_records_updated_at ON public.payment_records;
CREATE TRIGGER payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_business   ON public.payment_records(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status     ON public.payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_due_date   ON public.payment_records(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_ptp_date   ON public.payment_records(promise_to_pay_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_created    ON public.payment_records(created_at DESC);

-- RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_records_business" ON public.payment_records;
CREATE POLICY "payment_records_business" ON public.payment_records
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- ============================================================
-- 26. WORKSPACE TEAM INVITATIONS & DELEGATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  inviter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_name    TEXT NOT NULL,
  invitee_email   TEXT NOT NULL,
  invitee_phone   TEXT DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'sales_rep',
  department      TEXT DEFAULT 'Sales',
  token           TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending',
  invited_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  expires_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) + interval '7 days' NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Idempotent column migrations for existing instances
ALTER TABLE public.workspace_invitations ADD COLUMN IF NOT EXISTS invitee_name  TEXT;
ALTER TABLE public.workspace_invitations ADD COLUMN IF NOT EXISTS invitee_phone TEXT DEFAULT '';
ALTER TABLE public.workspace_invitations ADD COLUMN IF NOT EXISTS department    TEXT DEFAULT 'Sales';
ALTER TABLE public.workspace_invitations ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'pending';

-- Triggers
DROP TRIGGER IF EXISTS workspace_invitations_updated_at ON public.workspace_invitations;
CREATE TRIGGER workspace_invitations_updated_at
  BEFORE UPDATE ON public.workspace_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_business ON public.workspace_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email    ON public.workspace_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token    ON public.workspace_invitations(token);

-- RLS
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspace_invitations_business" ON public.workspace_invitations;
CREATE POLICY "workspace_invitations_business" ON public.workspace_invitations
  FOR ALL USING (
    public.is_admin() OR
    business_id IN (SELECT business_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- ============================================================
-- 27. EXPANDED SUBSCRIPTION PLANS & LIFETIME BILLING CYCLE
-- ============================================================
DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'lifetime';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_monthly';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_yearly';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'crm_lifetime';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'lifetime';
EXCEPTION WHEN others THEN null; END $$;

-- ==============================================================================
-- END OF UNIFIED SCHEMA — 100% IDEMPOTENT & READY FOR SUPABASE SQL EDITOR
-- ==============================================================================
