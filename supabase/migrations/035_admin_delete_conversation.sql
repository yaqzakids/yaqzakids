-- Permanent delete for trashed admin inbox conversations

CREATE OR REPLACE FUNCTION public.admin_delete_conversation(p_conversation_id uuid)
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND c.broadcast_id IS NULL
      AND (
        c.status = 'trashed'
        OR EXISTS (
          SELECT 1
          FROM public.conversation_participants cp
          WHERE cp.conversation_id = c.id
            AND cp.user_id = auth.uid()
            AND cp.trashed_at IS NOT NULL
        )
      )
  ) THEN
    RAISE EXCEPTION 'Only trashed conversations can be permanently deleted';
  END IF;

  DELETE FROM public.conversations WHERE id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_conversation(uuid) TO authenticated;

DROP POLICY IF EXISTS conversations_delete ON public.conversations;
CREATE POLICY conversations_delete ON public.conversations
  FOR DELETE USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
