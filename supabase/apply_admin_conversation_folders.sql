-- Admin inbox trash/archive fix — run in Supabase SQL Editor

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_todo boolean NOT NULL DEFAULT false;

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS trashed_at timestamptz;

CREATE OR REPLACE FUNCTION public.admin_set_conversation_folder(
  p_conversation_id uuid,
  p_action text,
  p_admin_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation id is required';
  END IF;

  INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
  VALUES (p_conversation_id, p_admin_id, 'admin')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  IF p_action = 'trash' THEN
    UPDATE public.conversations SET status = 'trashed' WHERE id = p_conversation_id;
    UPDATE public.conversation_participants
    SET trashed_at = now(), archived_at = NULL
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;
    RETURN;
  END IF;

  IF p_action = 'restore' THEN
    UPDATE public.conversations SET status = 'open' WHERE id = p_conversation_id;
    UPDATE public.conversation_participants
    SET trashed_at = NULL, archived_at = NULL
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;
    RETURN;
  END IF;

  IF p_action = 'archive' THEN
    UPDATE public.conversations SET status = 'archived' WHERE id = p_conversation_id;
    UPDATE public.conversation_participants
    SET archived_at = now(), trashed_at = NULL
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;
    RETURN;
  END IF;

  IF p_action = 'unarchive' THEN
    UPDATE public.conversations SET status = 'open' WHERE id = p_conversation_id;
    UPDATE public.conversation_participants
    SET archived_at = NULL
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id;
    RETURN;
  END IF;

  IF p_action = 'important' THEN
    UPDATE public.conversations SET priority = 'important' WHERE id = p_conversation_id;
    RETURN;
  END IF;

  IF p_action = 'unimportant' THEN
    UPDATE public.conversations SET priority = 'normal' WHERE id = p_conversation_id;
    RETURN;
  END IF;

  IF p_action = 'todo' THEN
    UPDATE public.conversations SET is_todo = true WHERE id = p_conversation_id;
    RETURN;
  END IF;

  IF p_action = 'untodo' THEN
    UPDATE public.conversations SET is_todo = false WHERE id = p_conversation_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Unknown folder action: %', p_action;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_conversation_folder(uuid, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
