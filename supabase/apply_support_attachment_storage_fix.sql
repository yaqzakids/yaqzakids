-- Fix parent support ticket submission (RLS on storage + reliable ticket RPC)
-- Run in Supabase → SQL Editor

-- ── Storage bucket ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Storage RLS (required for parent file uploads) ───────────────────────
DROP POLICY IF EXISTS support_attachments_parent_insert ON storage.objects;
CREATE POLICY support_attachments_parent_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE auth.uid()::text || '/%'
    )
  );

DROP POLICY IF EXISTS support_attachments_parent_select ON storage.objects;
CREATE POLICY support_attachments_parent_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE auth.uid()::text || '/%'
    )
  );

DROP POLICY IF EXISTS support_attachments_admin_all ON storage.objects;
CREATE POLICY support_attachments_admin_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'support-attachments' AND public.is_admin())
  WITH CHECK (bucket_id = 'support-attachments' AND public.is_admin());

-- Legacy quoted policy names (from older migrations)
DROP POLICY IF EXISTS "support_attachments_parent_insert" ON storage.objects;
DROP POLICY IF EXISTS "support_attachments_parent_select" ON storage.objects;
DROP POLICY IF EXISTS "support_attachments_admin_all" ON storage.objects;

-- ── Ticket insert policies (ensure parents can create tickets) ───────────
DROP POLICY IF EXISTS support_tickets_parent_insert ON public.support_tickets;
CREATE POLICY support_tickets_parent_insert ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "support_tickets_parent_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_parent_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = parent_id);

-- ── Seed message trigger (bypasses RLS via SECURITY DEFINER) ─────────────
CREATE OR REPLACE FUNCTION public.support_ticket_seed_initial_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.support_messages (ticket_id, sender_id, sender_type, message, attachment_url)
  VALUES (NEW.id, NEW.parent_id, 'parent', NEW.message, NEW.attachment_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_after_insert ON public.support_tickets;
CREATE TRIGGER support_ticket_after_insert
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_ticket_seed_initial_message();

-- ── RPC: create ticket as authenticated parent (fallback if RLS misconfigured) ─
CREATE OR REPLACE FUNCTION public.create_parent_support_ticket(
  p_subject text,
  p_category text,
  p_priority text,
  p_message text,
  p_attachment_url text DEFAULT NULL
)
RETURNS TABLE (id uuid, ticket_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.support_tickets%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF trim(coalesce(p_subject, '')) = '' OR trim(coalesce(p_message, '')) = '' THEN
    RAISE EXCEPTION 'Subject and message are required';
  END IF;

  INSERT INTO public.support_tickets (
    parent_id,
    subject,
    category,
    priority,
    message,
    attachment_url,
    status
  ) VALUES (
    v_uid,
    trim(p_subject),
    p_category,
    p_priority,
    trim(p_message),
    p_attachment_url,
    'open'
  )
  RETURNING * INTO v_row;

  RETURN QUERY SELECT v_row.id, v_row.ticket_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_parent_support_ticket(text, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
