-- Run this entire file in Supabase → SQL Editor (copy/paste).
-- Same as supabase/migrations/032_messaging_inbox_v2.sql

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS child_profile_id uuid REFERENCES public.child_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_todo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_status_check
    CHECK (status IN ('open', 'closed', 'archived', 'trashed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_priority_check
    CHECK (priority IN ('normal', 'important'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_category_check
    CHECK (category IN ('general', 'support', 'billing', 'learning', 'feedback'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS trashed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS conversations_parent_user_idx ON public.conversations (parent_user_id);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON public.conversations (status, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS conversations_priority_idx ON public.conversations (priority) WHERE priority = 'important';
CREATE INDEX IF NOT EXISTS conversations_todo_idx ON public.conversations (is_todo) WHERE is_todo = true;

UPDATE public.conversations c
SET parent_user_id = cp.user_id
FROM public.conversation_participants cp
WHERE cp.conversation_id = c.id
  AND cp.user_type = 'parent'
  AND c.parent_user_id IS NULL;

UPDATE public.conversations
SET last_message_at = updated_at
WHERE last_message_at IS NULL;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now(), last_message_at = now()
  WHERE id = NEW.conversation_id;

  IF NEW.recipient_user_id IS NULL AND NEW.sender_type = 'admin' THEN
    UPDATE public.messages m
    SET recipient_user_id = c.parent_user_id
    FROM public.conversations c
    WHERE m.id = NEW.id AND c.id = NEW.conversation_id AND c.parent_user_id IS NOT NULL;
  END IF;

  IF NEW.delivered_at IS NULL AND (NEW.scheduled_for IS NULL OR NEW.scheduled_for <= now()) THEN
    NEW.delivered_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.touch_conversation_on_message();

CREATE OR REPLACE FUNCTION public.admin_create_conversation(
  p_subject text,
  p_message text,
  p_recipient_ids uuid[],
  p_sender_id uuid DEFAULT auth.uid(),
  p_child_profile_id uuid DEFAULT NULL,
  p_category text DEFAULT 'general'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient uuid;
  v_conversation_id uuid;
  v_first_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_recipient_ids IS NULL OR array_length(p_recipient_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one recipient is required';
  END IF;

  FOREACH v_recipient IN ARRAY p_recipient_ids LOOP
    INSERT INTO public.conversations (
      subject, created_by, parent_user_id, child_profile_id,
      category, status, priority, last_message_at
    )
    VALUES (
      p_subject, p_sender_id, v_recipient, p_child_profile_id,
      COALESCE(p_category, 'general'), 'open', 'normal', now()
    )
    RETURNING id INTO v_conversation_id;

    IF v_first_id IS NULL THEN
      v_first_id := v_conversation_id;
    END IF;

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, p_sender_id, 'admin');

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, v_recipient, 'parent')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    INSERT INTO public.messages (
      conversation_id, sender_id, sender_type, message, recipient_user_id, delivered_at
    )
    VALUES (
      v_conversation_id, p_sender_id, 'admin', p_message, v_recipient, now()
    );
  END LOOP;

  RETURN v_first_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_conversation(text, text, uuid[], uuid, uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_create_conversation(text, text, uuid[], uuid);

NOTIFY pgrst, 'reload schema';
