-- Run in Supabase Dashboard → SQL Editor (same as migrations/021_admin_users.sql)

-- Secure admin access: admin_users table + email-based owner (hello@yaqzakids.com)

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'editor', 'support')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email_lower ON public.admin_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users (user_id);

CREATE OR REPLACE FUNCTION public.auth_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(email)) FROM auth.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_main_admin_email(p_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(coalesce(p_email, ''))) = 'hello@yaqzakids.com';
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_main_admin_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_admin_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := public.auth_user_email();
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.admin_users
  SET user_id = auth.uid()
  WHERE lower(email) = v_email
    AND (user_id IS NULL OR user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_admin_user_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
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
      WHERE au.user_id = auth.uid()
         OR lower(au.email) = public.auth_user_email()
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_main_admin_email(public.auth_user_email());
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
      WHERE au.user_id = auth.uid() OR lower(au.email) = public.auth_user_email()
      ORDER BY au.created_at ASC
      LIMIT 1
    ),
    (SELECT ar.role FROM public.admin_roles ar WHERE ar.user_id = auth.uid() LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_role() TO authenticated;

INSERT INTO public.admin_users (email, role, user_id, created_by)
SELECT 'hello@yaqzakids.com', 'owner', u.id, u.id
FROM auth.users u
WHERE lower(u.email) = 'hello@yaqzakids.com'
ON CONFLICT (email) DO UPDATE
  SET role = 'owner',
      user_id = COALESCE(EXCLUDED.user_id, admin_users.user_id);

INSERT INTO public.admin_users (email, role)
VALUES ('hello@yaqzakids.com', 'owner')
ON CONFLICT (email) DO UPDATE SET role = 'owner';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read admin_users" ON public.admin_users;
CREATE POLICY "Admins read admin_users" ON public.admin_users
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Owner manages admin_users" ON public.admin_users;
CREATE POLICY "Owner manages admin_users" ON public.admin_users
  FOR ALL USING (public.is_admin_owner()) WITH CHECK (public.is_admin_owner());

CREATE OR REPLACE FUNCTION public.add_admin_user(p_email text, p_role text DEFAULT 'admin')
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
    RAISE EXCEPTION 'Only the owner can add admins';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email required';
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Owner email is managed automatically';
  END IF;
  IF p_role NOT IN ('admin', 'editor', 'support') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email LIMIT 1;

  INSERT INTO public.admin_users (email, role, user_id, created_by)
  VALUES (v_email, p_role, v_uid, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET role = EXCLUDED.role,
        user_id = COALESCE(EXCLUDED.user_id, admin_users.user_id),
        created_by = COALESCE(admin_users.created_by, EXCLUDED.created_by)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_user(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin_owner() THEN
    RAISE EXCEPTION 'Only the owner can remove admins';
  END IF;

  SELECT lower(email) INTO v_email FROM public.admin_users WHERE id = p_id;
  IF v_email IS NULL THEN
    RETURN;
  END IF;
  IF public.is_main_admin_email(v_email) THEN
    RAISE EXCEPTION 'Cannot remove the owner account';
  END IF;

  DELETE FROM public.admin_users WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_admin_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_user(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
