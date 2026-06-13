-- FORCE INSTALL support center (run ALL of this in Supabase SQL Editor)
-- Fixes: only support_messages exists, support_tickets missing (PGRST205)
-- Copies old inbox data, then rebuilds tables cleanly.

-- ── A) Backup legacy inbox (if any) ──────────────────────────────────────
DROP TABLE IF EXISTS public._support_legacy_backup;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_messages'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_messages' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE TABLE public._support_legacy_backup AS SELECT * FROM public.support_messages';
  END IF;
END $$;

-- ── B) is_admin (works without admin_roles table) ────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role')
  THEN
    INSERT INTO public.admin_roles (user_id, role)
    SELECT p.id, 'owner' FROM public.profiles p WHERE p.role = 'admin'
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
  END IF;
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── C) Drop old support tables ───────────────────────────────────────────
DROP TABLE IF EXISTS public.support_notification_queue CASCADE;
DROP TABLE IF EXISTS public.support_refund_requests CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.support_inbox_legacy CASCADE;

-- ── D) Create support_tickets ────────────────────────────────────────────
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attachment_url text,
  admin_reply text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_status_check
    CHECK (status IN ('open', 'pending_parent', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT support_tickets_priority_check
    CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT support_tickets_category_check
    CHECK (category IN (
      'technical_issue', 'billing', 'subscription', 'child_profile',
      'content_feedback', 'feature_request', 'bug_report', 'other'
    ))
);

CREATE SEQUENCE IF NOT EXISTS public.support_ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'YK-' || lpad(nextval('public.support_ticket_number_seq')::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_ticket_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_support_ticket_number();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_tickets_set_number
  BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.set_support_ticket_number();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_tickets_parent_select ON public.support_tickets
  FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY support_tickets_parent_insert ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY support_tickets_admin_all ON public.support_tickets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── E) Restore legacy inbox into support_tickets ─────────────────────────
-- (after_insert trigger is created in section F — nothing to disable here)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_support_legacy_backup'
  ) THEN
    INSERT INTO public.support_tickets (
      parent_id, subject, message, status, admin_reply, admin_notes, created_at, updated_at, ticket_number
    )
    SELECT
      b.user_id,
      b.subject,
      b.message,
      CASE
        WHEN b.status = 'resolved' THEN 'resolved'
        WHEN b.status = 'in_progress' THEN 'in_progress'
        ELSE 'open'
      END,
      b.admin_reply,
      b.admin_notes,
      b.created_at,
      COALESCE(b.resolved_at, b.created_at),
      public.generate_support_ticket_number()
    FROM public._support_legacy_backup b
    WHERE b.user_id IS NOT NULL;
  END IF;
END $$;

-- ── F) Thread table support_messages ─────────────────────────────────────
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('parent', 'admin', 'system')),
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX support_messages_ticket_id_idx ON public.support_messages (ticket_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_messages_parent_select ON public.support_messages
  FOR SELECT USING (
    is_internal = false
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.parent_id = auth.uid())
  );
CREATE POLICY support_messages_parent_insert ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_type = 'parent' AND sender_id = auth.uid() AND is_internal = false
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.parent_id = auth.uid())
  );
CREATE POLICY support_messages_admin_all ON public.support_messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.support_messages (ticket_id, sender_id, sender_type, message, created_at)
SELECT t.id, t.parent_id, 'parent', t.message, t.created_at
FROM public.support_tickets t;

CREATE OR REPLACE FUNCTION public.support_ticket_seed_initial_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.support_messages (ticket_id, sender_id, sender_type, message, attachment_url)
  VALUES (NEW.id, NEW.parent_id, 'parent', NEW.message, NEW.attachment_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_after_insert ON public.support_tickets;
CREATE TRIGGER support_ticket_after_insert
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.support_ticket_seed_initial_message();

-- ── G) Refunds + notifications ───────────────────────────────────────────
CREATE TABLE public.support_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_refund_requests_admin_all ON public.support_refund_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.support_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('ticket_created', 'admin_replied', 'ticket_resolved')),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.support_notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_notification_queue_admin ON public.support_notification_queue
  FOR SELECT USING (public.is_admin());
CREATE POLICY support_notification_queue_insert ON public.support_notification_queue
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.enqueue_support_notification(
  p_event_type text, p_ticket_id uuid,
  p_recipient_id uuid DEFAULT NULL, p_recipient_email text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.support_notification_queue (event_type, ticket_id, recipient_id, recipient_email, payload)
  VALUES (p_event_type, p_ticket_id, p_recipient_id, p_recipient_email, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_support_notification TO authenticated;

-- ── H) Storage bucket ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('support-attachments', 'support-attachments', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- ── I) Reload API + verify ─────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'support%'
ORDER BY table_name;
