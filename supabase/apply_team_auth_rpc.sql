-- Run in Supabase Dashboard → SQL Editor (after apply_admin_team_employees.sql)
-- Creates team logins without deploying edge functions

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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

  -- Hosted Supabase: auth.instances is often empty; copy instance_id from an existing user
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

CREATE OR REPLACE FUNCTION public.create_employee_account(
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT 'editor',
  p_status text DEFAULT 'active'
)
RETURNS public.admin_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_row public.admin_users;
BEGIN
  IF NOT public.is_admin_owner() THEN
    RAISE EXCEPTION 'Only the owner can create employee accounts';
  END IF;

  v_email := lower(trim(coalesce(p_email, '')));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email required';
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Cannot create an account for the owner email';
  END IF;
  IF p_role NOT IN ('admin', 'editor', 'support', 'content_writer', 'reviewer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF p_status NOT IN ('active', 'invited', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  v_user_id := public.upsert_team_auth_user(v_email, p_password, p_full_name);

  INSERT INTO public.admin_users (
    email, role, user_id, created_by, full_name, status, must_change_password
  )
  VALUES (
    v_email,
    p_role,
    v_user_id,
    auth.uid(),
    nullif(trim(coalesce(p_full_name, '')), ''),
    p_status,
    true
  )
  ON CONFLICT (email) DO UPDATE
    SET role = EXCLUDED.role,
        user_id = EXCLUDED.user_id,
        created_by = coalesce(admin_users.created_by, EXCLUDED.created_by),
        full_name = coalesce(EXCLUDED.full_name, admin_users.full_name),
        status = EXCLUDED.status,
        must_change_password = true
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_employee_account_password(
  p_admin_user_id uuid,
  p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin_owner() THEN
    RAISE EXCEPTION 'Only the owner can reset employee passwords';
  END IF;

  IF coalesce(length(p_password), 0) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  SELECT lower(email) INTO v_email FROM public.admin_users WHERE id = p_admin_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Cannot reset the owner password here';
  END IF;

  v_user_id := public.upsert_team_auth_user(v_email, p_password, NULL);

  UPDATE public.admin_users
  SET user_id = v_user_id, must_change_password = true
  WHERE id = p_admin_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_employee_account(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_employee_account_password(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
