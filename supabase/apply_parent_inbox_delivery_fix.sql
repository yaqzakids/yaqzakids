-- Parent inbox delivery fix — run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_parent_conversation_ids(
  p_user_id uuid DEFAULT auth.uid(),
  p_archived boolean DEFAULT false
)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.conversation_id
  FROM public.conversation_participants cp
  WHERE cp.user_id = p_user_id
    AND (p_user_id = auth.uid() OR public.is_admin())
    AND (
      (p_archived AND cp.archived_at IS NOT NULL)
      OR (NOT p_archived AND cp.archived_at IS NULL)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_parent_conversation_ids(uuid, boolean) TO authenticated;

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
    INSERT INTO public.conversations (subject, created_by)
    VALUES (p_subject, p_sender_id)
    RETURNING id INTO v_conversation_id;

    IF v_first_id IS NULL THEN
      v_first_id := v_conversation_id;
    END IF;

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, p_sender_id, 'admin')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    INSERT INTO public.conversation_participants (conversation_id, user_id, user_type)
    VALUES (v_conversation_id, v_recipient, 'parent')
    ON CONFLICT (conversation_id, user_id) DO UPDATE
      SET user_type = EXCLUDED.user_type;

    INSERT INTO public.messages (conversation_id, sender_id, sender_type, message)
    VALUES (v_conversation_id, p_sender_id, 'admin', p_message);
  END LOOP;

  RETURN v_first_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_conversation(text, text, uuid[], uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_create_conversation(text, text, uuid[], uuid, uuid, text);

NOTIFY pgrst, 'reload schema';
