-- MINIMAL FIX: creates support_tickets when only legacy support_messages exists
-- Run this entire file in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run.

-- 1) admin_roles + is_admin (required for RLS policies)
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);

INSERT INTO admin_roles (user_id, role)
SELECT id, 'owner' FROM profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_roles'
  ) AND EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 2) Move old inbox table out of the way (legacy schema has user_id, not ticket_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_messages' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.support_messages RENAME TO support_inbox_legacy;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_messages' AND column_name = 'ticket_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_tickets'
  ) THEN
    -- Orphan thread table without tickets — remove so we can recreate cleanly
    DROP TABLE public.support_messages;
  END IF;
END $$;

-- 3) Create support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text,
  parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  category text DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attachment_url text,
  admin_reply text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_parent_select" ON support_tickets;
CREATE POLICY "support_tickets_parent_select" ON support_tickets
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "support_tickets_parent_insert" ON support_tickets;
CREATE POLICY "support_tickets_parent_insert" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "support_tickets_admin_all" ON support_tickets;
CREATE POLICY "support_tickets_admin_all" ON support_tickets
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4) Import legacy inbox rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_inbox_legacy'
  ) THEN
    INSERT INTO support_tickets (
      parent_id, subject, message, status, admin_reply, admin_notes, created_at, updated_at
    )
    SELECT
      l.user_id,
      l.subject,
      l.message,
      COALESCE(l.status, 'open'),
      l.admin_reply,
      l.admin_notes,
      l.created_at,
      COALESCE(l.resolved_at, l.created_at)
    FROM support_inbox_legacy l
    WHERE l.user_id IS NOT NULL;
  END IF;
END $$;

-- 5) Ticket numbers YK-000001
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'YK-' || lpad(nextval('support_ticket_number_seq')::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION set_support_ticket_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_support_ticket_number();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_set_number ON support_tickets;
CREATE TRIGGER support_tickets_set_number
  BEFORE INSERT OR UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_support_ticket_number();

UPDATE support_tickets SET ticket_number = generate_support_ticket_number()
WHERE ticket_number IS NULL;

ALTER TABLE support_tickets ALTER COLUMN ticket_number SET NOT NULL;

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'pending_parent', 'in_progress', 'resolved', 'closed'));

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_priority_check
  CHECK (priority IN ('low', 'normal', 'high'));

-- 6) Thread messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('parent', 'admin', 'system')),
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_parent_select" ON support_messages;
CREATE POLICY "support_messages_parent_select" ON support_messages
  FOR SELECT USING (
    is_internal = false
    AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "support_messages_parent_insert" ON support_messages;
CREATE POLICY "support_messages_parent_insert" ON support_messages
  FOR INSERT WITH CHECK (
    sender_type = 'parent' AND sender_id = auth.uid() AND is_internal = false
    AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "support_messages_admin_all" ON support_messages;
CREATE POLICY "support_messages_admin_all" ON support_messages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, created_at)
SELECT t.id, t.parent_id, 'parent', t.message, t.created_at
FROM support_tickets t
WHERE NOT EXISTS (SELECT 1 FROM support_messages m WHERE m.ticket_id = t.id);

CREATE OR REPLACE FUNCTION support_ticket_seed_initial_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, attachment_url)
  VALUES (NEW.id, NEW.parent_id, 'parent', NEW.message, NEW.attachment_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_after_insert ON support_tickets;
CREATE TRIGGER support_ticket_after_insert
  AFTER INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION support_ticket_seed_initial_message();

-- 7) Refunds + notification queue
CREATE TABLE IF NOT EXISTS support_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_refund_requests_admin_all" ON support_refund_requests;
CREATE POLICY "support_refund_requests_admin_all" ON support_refund_requests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS support_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('ticket_created', 'admin_replied', 'ticket_resolved')),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE support_notification_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_notification_queue_admin" ON support_notification_queue;
CREATE POLICY "support_notification_queue_admin" ON support_notification_queue
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "support_notification_queue_insert" ON support_notification_queue;
CREATE POLICY "support_notification_queue_insert" ON support_notification_queue
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION enqueue_support_notification(
  p_event_type text,
  p_ticket_id uuid,
  p_recipient_id uuid DEFAULT NULL,
  p_recipient_email text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO support_notification_queue (event_type, ticket_id, recipient_id, recipient_email, payload)
  VALUES (p_event_type, p_ticket_id, p_recipient_id, p_recipient_email, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_support_notification TO authenticated;

-- 8) Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('support-attachments', 'support-attachments', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- 9) Refresh API schema cache
NOTIFY pgrst, 'reload schema';

-- 10) Verify (should list support_tickets + support_messages + more)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'support%'
ORDER BY table_name;
