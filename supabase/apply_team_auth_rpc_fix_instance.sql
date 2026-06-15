-- Quick fix: re-run only upsert_team_auth_user (hosted Supabase auth.instances is empty)
-- Paste in Supabase SQL Editor if you saw "Auth instance not configured"

CREATE OR REPLACE FUNCTION public.upsert_team_auth_user(
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user_id uuid;
  v_instance_id uuid;
  v_meta jsonb;
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email required';
  END IF;
  IF coalesce(length(p_password), 0) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  v_meta := coalesce(
    CASE WHEN nullif(trim(coalesce(p_full_name, '')), '') IS NOT NULL
      THEN jsonb_build_object('full_name', trim(p_full_name), 'is_admin_team', true)
      ELSE '{"is_admin_team": true}'::jsonb
    END,
    '{}'::jsonb
  );

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_meta
    WHERE id = v_user_id;
    RETURN v_user_id;
  END IF;

  SELECT instance_id INTO v_instance_id FROM auth.users WHERE id = auth.uid();
  IF v_instance_id IS NULL THEN
    SELECT instance_id INTO v_instance_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'No auth users found on this project. Sign in once as the owner, then retry.';
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    is_sso_user
  ) VALUES (
    v_instance_id,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    v_meta,
    now(),
    now(),
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_email,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_team_auth_user(text, text, text) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
