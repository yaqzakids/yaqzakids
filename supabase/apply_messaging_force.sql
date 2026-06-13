-- FORCE INSTALL messaging + broadcast center (run ALL in Supabase SQL Editor)
-- Fixes: PGRST205 — conversations / broadcasts / messages tables missing
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS)
--
-- IMPORTANT: Run the ENTIRE script in one go. Do not run in parts.

-- ── A) Ensure is_admin() exists ───────────────────────────────────────────
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

-- ── B) Tables FIRST (before functions that reference them) ─────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('parent', 'admin')),
  last_read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conversation_participants_user_idx
  ON public.conversation_participants (user_id, archived_at);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('parent', 'admin')),
  message text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
  ON public.messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL DEFAULT 'everyone'
    CHECK (audience IN ('everyone', 'premium', 'free')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_type text NOT NULL CHECK (broadcast_type IN (
    'feature', 'path', 'eid', 'maintenance', 'subscription'
  )),
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL CHECK (audience IN (
    'all', 'free', 'premium', 'trial', 'inactive'
  )),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broadcasts_status_idx ON public.broadcasts (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS broadcasts_created_by_idx ON public.broadcasts (created_by);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS broadcast_id uuid REFERENCES public.broadcasts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_broadcast_id_idx
  ON public.conversations (broadcast_id) WHERE broadcast_id IS NOT NULL;

-- ── C) Helper functions (after tables exist) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages m
  INNER JOIN public.conversation_participants cp
    ON cp.conversation_id = m.conversation_id AND cp.user_id = p_user_id
  WHERE cp.archived_at IS NULL
    AND m.sender_id IS DISTINCT FROM p_user_id
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- ── D) RLS policies ────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT USING (public.is_admin() OR public.is_conversation_participant(id));

DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS conversations_update ON public.conversations;
CREATE POLICY conversations_update ON public.conversations
  FOR UPDATE USING (public.is_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS conversation_participants_select ON public.conversation_participants;
CREATE POLICY conversation_participants_select ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS conversation_participants_insert ON public.conversation_participants;
CREATE POLICY conversation_participants_insert ON public.conversation_participants
  FOR INSERT WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS conversation_participants_update ON public.conversation_participants;
CREATE POLICY conversation_participants_update ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (public.is_admin() OR public.is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (public.is_admin() OR public.is_conversation_participant(conversation_id))
  );

DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;
CREATE POLICY announcements_admin_all ON public.announcements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS announcement_dismissals_own ON public.announcement_dismissals;
CREATE POLICY announcement_dismissals_own ON public.announcement_dismissals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS announcement_dismissals_admin ON public.announcement_dismissals;
CREATE POLICY announcement_dismissals_admin ON public.announcement_dismissals
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS broadcasts_admin_all ON public.broadcasts;
CREATE POLICY broadcasts_admin_all ON public.broadcasts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.touch_conversation_on_message();

-- ── E) Admin RPCs ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_conversation(
  p_subject text,
  p_message text,
  p_recipient_ids uuid[],
  p_sender_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_recipient uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.conversations (subject, created_by)
  VALUES (p_subject, p_sender_id)
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
  VALUES (v_conversation_id, p_sender_id, 'admin');

  FOREACH v_recipient IN ARRAY p_recipient_ids LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, v_recipient, 'parent')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;

  INSERT INTO public.messages (conversation_id, sender_id, sender_type, message)
  VALUES (v_conversation_id, p_sender_id, 'admin', p_message);

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_conversation(text, text, uuid[], uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_send_broadcast(
  p_broadcast_type text,
  p_title text,
  p_message text,
  p_audience text,
  p_recipient_ids uuid[],
  p_sender_id uuid DEFAULT auth.uid(),
  p_draft_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_broadcast_id uuid;
  v_recipient uuid;
  v_conversation_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_draft_id IS NOT NULL THEN
    UPDATE public.broadcasts
    SET
      broadcast_type = p_broadcast_type,
      title = p_title,
      message = p_message,
      audience = p_audience,
      status = 'sent',
      sent_at = now(),
      updated_at = now()
    WHERE id = p_draft_id AND status = 'draft'
    RETURNING id INTO v_broadcast_id;

    IF v_broadcast_id IS NULL THEN
      RAISE EXCEPTION 'Draft not found or already sent';
    END IF;
  ELSE
    INSERT INTO public.broadcasts (
      broadcast_type, title, message, audience, status, created_by, sent_at
    )
    VALUES (
      p_broadcast_type, p_title, p_message, p_audience, 'sent', p_sender_id, now()
    )
    RETURNING id INTO v_broadcast_id;
  END IF;

  FOREACH v_recipient IN ARRAY p_recipient_ids LOOP
    INSERT INTO public.conversations (subject, created_by, broadcast_id)
    VALUES (p_title, p_sender_id, v_broadcast_id)
    RETURNING id INTO v_conversation_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, p_sender_id, 'admin');

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, v_recipient, 'parent')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    INSERT INTO public.messages (conversation_id, sender_id, sender_type, message)
    VALUES (v_conversation_id, p_sender_id, 'admin', p_message);
  END LOOP;

  RETURN v_broadcast_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_send_broadcast(
  text, text, text, text, uuid[], uuid, uuid
) TO authenticated;

-- ── F) Storage for attachments ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-attachments', 'message-attachments', false, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS message_attachments_insert ON storage.objects;
CREATE POLICY message_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS message_attachments_select ON storage.objects;
CREATE POLICY message_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ── G) Reload PostgREST schema cache ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── H) Verify — expect 6 rows below ─────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'conversations',
    'conversation_participants',
    'messages',
    'announcements',
    'announcement_dismissals',
    'broadcasts'
  )
ORDER BY table_name;
