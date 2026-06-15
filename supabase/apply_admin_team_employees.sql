-- Run in Supabase Dashboard → SQL Editor
-- Extends admin_users for team accounts + required RPCs (migration 024)

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'support', 'content_writer', 'reviewer'));

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_status_check;
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_status_check
  CHECK (status IN ('active', 'invited', 'suspended'));

UPDATE public.admin_users
SET status = 'active',
    must_change_password = false
WHERE public.is_main_admin_email(email);

CREATE OR REPLACE FUNCTION public.is_active_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_main_admin_email(public.auth_user_email())
    OR EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.status = 'active'
        AND (
          au.user_id = auth.uid()
          OR lower(au.email) = public.auth_user_email()
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE WHEN public.is_main_admin_email(public.auth_user_email()) THEN 'owner' END,
    (
      SELECT au.role
      FROM public.admin_users au
      WHERE au.status = 'active'
        AND (au.user_id = auth.uid() OR lower(au.email) = public.auth_user_email())
      ORDER BY au.created_at ASC
      LIMIT 1
    ),
    (SELECT ar.role FROM public.admin_roles ar WHERE ar.user_id = auth.uid() LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_must_change_password()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT au.must_change_password
      FROM public.admin_users au
      WHERE au.user_id = auth.uid() OR lower(au.email) = public.auth_user_email()
      ORDER BY au.created_at ASC
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.record_admin_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  UPDATE public.admin_users
  SET last_login_at = now(),
      user_id = COALESCE(user_id, auth.uid())
  WHERE user_id = auth.uid() OR lower(email) = public.auth_user_email();
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_admin_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.admin_users
  SET must_change_password = false
  WHERE user_id = auth.uid() OR lower(email) = public.auth_user_email();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_team_member(
  p_id uuid,
  p_role text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_must_change_password boolean DEFAULT NULL
)
RETURNS public.admin_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_row public.admin_users;
BEGIN
  IF NOT public.is_admin_owner() THEN
    RAISE EXCEPTION 'Only the owner can manage team members';
  END IF;

  SELECT lower(email) INTO v_email FROM public.admin_users WHERE id = p_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Cannot modify the owner account';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'editor', 'support', 'content_writer', 'reviewer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'invited', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.admin_users
  SET
    role = COALESCE(p_role, role),
    status = COALESCE(p_status, status),
    full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
    must_change_password = COALESCE(p_must_change_password, must_change_password)
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_admin_user(
  p_email text,
  p_role text DEFAULT 'admin',
  p_full_name text DEFAULT NULL,
  p_status text DEFAULT 'active'
)
RETURNS public.admin_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_uid uuid;
  v_row public.admin_users;
BEGIN
  IF NOT public.is_admin_owner() THEN
    RAISE EXCEPTION 'Only the owner can add team members';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email required';
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Owner email is managed automatically';
  END IF;
  IF p_role NOT IN ('admin', 'editor', 'support', 'content_writer', 'reviewer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF p_status NOT IN ('active', 'invited', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email LIMIT 1;

  INSERT INTO public.admin_users (email, role, user_id, created_by, full_name, status, must_change_password)
  VALUES (
    v_email,
    p_role,
    v_uid,
    auth.uid(),
    NULLIF(trim(p_full_name), ''),
    p_status,
    true
  )
  ON CONFLICT (email) DO UPDATE
    SET role = EXCLUDED.role,
        user_id = COALESCE(EXCLUDED.user_id, admin_users.user_id),
        created_by = COALESCE(admin_users.created_by, EXCLUDED.created_by),
        full_name = COALESCE(EXCLUDED.full_name, admin_users.full_name),
        status = EXCLUDED.status,
        must_change_password = COALESCE(admin_users.must_change_password, true)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_reserved_team_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = lower(trim(coalesce(p_email, '')))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_must_change_password() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_admin_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_admin_must_change_password() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_team_member(uuid, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reserved_team_email(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
