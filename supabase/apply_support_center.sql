-- Support Center bootstrap + upgrade
-- Run in Supabase Dashboard → SQL Editor (fixes PGRST205: support_tickets missing)
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Prerequisite: admin_roles + is_admin() (safe if migration 004 never ran)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Rename legacy inbox support_messages → support_inbox_legacy
-- (Old schema: user_id, subject, message — no ticket_id column)
-- ---------------------------------------------------------------------------
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
    DROP TABLE public.support_messages;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Create support_tickets (missing on DBs that never ran migration 004)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text,
  parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  category text,
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

-- Migrate rows from legacy inbox table if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_inbox_legacy'
  ) THEN
    INSERT INTO support_tickets (
      parent_id, subject, message, status, admin_reply, admin_notes, created_at, updated_at, category, priority
    )
    SELECT
      l.user_id,
      l.subject,
      l.message,
      CASE
        WHEN l.status = 'resolved' THEN 'resolved'
        WHEN l.status = 'in_progress' THEN 'in_progress'
        ELSE 'open'
      END,
      l.admin_reply,
      l.admin_notes,
      l.created_at,
      COALESCE(l.resolved_at, l.created_at),
      'other',
      'normal'
    FROM support_inbox_legacy l
    WHERE l.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM support_tickets t
        WHERE t.parent_id = l.user_id
          AND t.subject = l.subject
          AND t.created_at = l.created_at
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Extend / normalize support_tickets columns
-- ---------------------------------------------------------------------------
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ticket_number text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_ticket_number_idx
  ON support_tickets (ticket_number)
  WHERE ticket_number IS NOT NULL;

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'pending_parent', 'in_progress', 'resolved', 'closed'));

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_category_check
  CHECK (category IS NULL OR category IN (
    'technical_issue', 'billing', 'subscription', 'child_profile',
    'content_feedback', 'feature_request', 'bug_report', 'other'
  ));

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_priority_check
  CHECK (priority IN ('low', 'normal', 'high'));

CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('support_ticket_number_seq');
  RETURN 'YK-' || lpad(n::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION set_support_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM support_tickets WHERE ticket_number IS NULL ORDER BY created_at LOOP
    UPDATE support_tickets
    SET ticket_number = generate_support_ticket_number()
    WHERE id = r.id;
  END LOOP;
END $$;

UPDATE support_tickets SET category = 'other' WHERE category IS NULL;
UPDATE support_tickets SET priority = 'normal' WHERE priority IS NULL;

SELECT setval(
  'support_ticket_number_seq',
  GREATEST(
    COALESCE(
      (SELECT MAX(CAST(SUBSTRING(ticket_number FROM 4) AS integer))
       FROM support_tickets
       WHERE ticket_number ~ '^YK-[0-9]+$'),
      0
    ),
    1
  ),
  true
);

ALTER TABLE support_tickets ALTER COLUMN ticket_number SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Conversation thread: support_messages (ticket_id schema)
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx ON support_messages (ticket_id, created_at);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_users_select" ON support_messages;
DROP POLICY IF EXISTS "support_users_insert" ON support_messages;
DROP POLICY IF EXISTS "support_admin_all" ON support_messages;

DROP POLICY IF EXISTS "support_messages_parent_select" ON support_messages;
CREATE POLICY "support_messages_parent_select" ON support_messages
  FOR SELECT USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "support_messages_parent_insert" ON support_messages;
CREATE POLICY "support_messages_parent_insert" ON support_messages
  FOR INSERT WITH CHECK (
    sender_type = 'parent'
    AND sender_id = auth.uid()
    AND is_internal = false
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "support_messages_admin_all" ON support_messages;
CREATE POLICY "support_messages_admin_all" ON support_messages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, attachment_url, created_at)
SELECT t.id, t.parent_id, 'parent', t.message, t.attachment_url, t.created_at
FROM support_tickets t
WHERE NOT EXISTS (
  SELECT 1 FROM support_messages m WHERE m.ticket_id = t.id
);

CREATE OR REPLACE FUNCTION support_ticket_seed_initial_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- ---------------------------------------------------------------------------
-- Refund requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_refund_requests_ticket_id_idx ON support_refund_requests (ticket_id);

ALTER TABLE support_refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_refund_requests_admin_all" ON support_refund_requests;
CREATE POLICY "support_refund_requests_admin_all" ON support_refund_requests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "support_refund_requests_parent_select" ON support_refund_requests;
CREATE POLICY "support_refund_requests_parent_select" ON support_refund_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.parent_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Notification queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('ticket_created', 'admin_replied', 'ticket_resolved')),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS support_notification_queue_status_idx ON support_notification_queue (status, created_at);

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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO support_notification_queue (
    event_type, ticket_id, recipient_id, recipient_email, payload
  )
  VALUES (
    p_event_type, p_ticket_id, p_recipient_id, p_recipient_email, p_payload
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_support_notification TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for attachments
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "support_attachments_parent_insert" ON storage.objects;
CREATE POLICY "support_attachments_parent_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "support_attachments_parent_select" ON storage.objects;
CREATE POLICY "support_attachments_parent_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "support_attachments_admin_all" ON storage.objects;
CREATE POLICY "support_attachments_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'support-attachments' AND is_admin())
  WITH CHECK (bucket_id = 'support-attachments' AND is_admin());

-- Reload PostgREST schema cache so API sees new tables immediately
NOTIFY pgrst, 'reload schema';
