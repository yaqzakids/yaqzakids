-- Broadcast Center bootstrap for Supabase SQL Editor
-- Run in Supabase Dashboard → SQL Editor (requires migration 017 messaging tables)


-- Broadcast Center: family-wide in-app messages (separate from 1:1 conversations)

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

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS broadcasts_admin_all ON public.broadcasts;
CREATE POLICY broadcasts_admin_all ON public.broadcasts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS broadcast_id uuid REFERENCES public.broadcasts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_broadcast_id_idx
  ON public.conversations (broadcast_id) WHERE broadcast_id IS NOT NULL;

-- Send broadcast: creates one inbox conversation per matching parent
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

NOTIFY pgrst, 'reload schema';
