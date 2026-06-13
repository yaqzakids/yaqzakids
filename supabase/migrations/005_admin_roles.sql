CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'content_editor', 'support_agent', 'finance_admin', 'viewer')),
  created_at timestamptz DEFAULT now()
);

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

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_role() TO authenticated;

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_roles" ON admin_roles;
CREATE POLICY "Admins can read admin_roles" ON admin_roles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Owners can manage admin_roles" ON admin_roles;
CREATE POLICY "Owners can manage admin_roles" ON admin_roles
  FOR ALL USING (is_admin_owner()) WITH CHECK (is_admin_owner());

INSERT INTO admin_roles (user_id, role)
SELECT id, 'owner' FROM profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;
