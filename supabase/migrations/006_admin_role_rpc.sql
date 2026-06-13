-- Ensure admin role RPCs use SECURITY DEFINER SQL functions (bypass RLS on admin_roles)

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION is_admin_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin_owner() TO authenticated;

CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.admin_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_admin_role() TO authenticated;

DROP POLICY IF EXISTS "Owners can manage admin_roles" ON admin_roles;
CREATE POLICY "Owners can manage admin_roles" ON admin_roles
  FOR ALL USING (is_admin_owner()) WITH CHECK (is_admin_owner());
