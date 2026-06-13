-- Yaqza Kids Admin Dashboard: roles, support, settings, activity log, RLS

-- ---------------------------------------------------------------------------
-- Admin roles (source of truth for admin access)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'content_editor', 'support_agent', 'finance_admin', 'viewer')),
  created_at timestamptz DEFAULT now()
);

-- Admin helper RPCs (must exist before RLS policies)
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

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_roles" ON admin_roles;
CREATE POLICY "Admins can read admin_roles" ON admin_roles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Owners can manage admin_roles" ON admin_roles;
CREATE POLICY "Owners can manage admin_roles" ON admin_roles
  FOR ALL USING (is_admin_owner()) WITH CHECK (is_admin_owner());

-- Seed existing profile admins as owners
INSERT INTO admin_roles (user_id, role)
SELECT id, 'owner' FROM profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Extend profiles for admin user management
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Parent'),
    NEW.email,
    'parent',
    'en'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();

-- ---------------------------------------------------------------------------
-- Adventure content extensions for admin management
-- ---------------------------------------------------------------------------
ALTER TABLE badges ADD COLUMN IF NOT EXISTS condition_type text;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS condition_value text;

ALTER TABLE hero_cards ADD COLUMN IF NOT EXISTS trait text;
ALTER TABLE hero_cards ADD COLUMN IF NOT EXISTS era text;
ALTER TABLE hero_cards ADD COLUMN IF NOT EXISTS star_rating integer DEFAULT 3;
ALTER TABLE hero_cards ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Discount codes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL,
  plan text,
  max_uses integer,
  uses_count integer DEFAULT 0,
  valid_from date,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_codes_admin" ON discount_codes;
CREATE POLICY "discount_codes_admin" ON discount_codes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Support tickets (parent-facing + admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_reply text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_parent_select" ON support_tickets;
CREATE POLICY "support_tickets_parent_select" ON support_tickets
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "support_tickets_parent_insert" ON support_tickets;
CREATE POLICY "support_tickets_parent_insert" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "support_tickets_admin_all" ON support_tickets;
CREATE POLICY "support_tickets_admin_all" ON support_tickets
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Legacy support_messages (kept for backward compatibility)
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_reply text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_users_select" ON support_messages;
CREATE POLICY "support_users_select" ON support_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_users_insert" ON support_messages;
CREATE POLICY "support_users_insert" ON support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_admin_all" ON support_messages;
CREATE POLICY "support_admin_all" ON support_messages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Platform settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

INSERT INTO platform_settings (key, value) VALUES
  ('site_name', 'Yaqza Kids'),
  ('admin_email', 'yaqzakids@gmail.com'),
  ('contact_email', 'hello@yaqzakids.com'),
  ('maintenance_mode', 'false'),
  ('quiz_pass_percentage', '70'),
  ('article_read_points', '10'),
  ('quiz_pass_points', '25'),
  ('path_complete_points', '100'),
  ('badge_points', '50'),
  ('free_trial_days', '14'),
  ('featured_path_slug', ''),
  ('free_articles_per_pillar', '3'),
  ('max_children_free', '1'),
  ('max_children_paid', '3')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON platform_settings;
CREATE POLICY "settings_public_read" ON platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON platform_settings;
CREATE POLICY "settings_admin_write" ON platform_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Admin activity log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_log_admin" ON admin_activity_log;
CREATE POLICY "activity_log_admin" ON admin_activity_log
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "activity_log_admin_insert" ON admin_activity_log;
CREATE POLICY "activity_log_admin_insert" ON admin_activity_log
  FOR INSERT WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPC: reset child progress
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_reset_child_progress(p_child_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM article_progress WHERE child_profile_id = p_child_id;
  DELETE FROM path_progress WHERE child_profile_id = p_child_id;
  DELETE FROM quiz_attempts WHERE child_profile_id = p_child_id;
  DELETE FROM child_badges WHERE child_profile_id = p_child_id;
  DELETE FROM child_hero_cards WHERE child_profile_id = p_child_id;
  DELETE FROM points_ledger WHERE child_profile_id = p_child_id;
  DELETE FROM child_streaks WHERE child_profile_id = p_child_id;
  UPDATE child_profiles SET
    points = 0,
    xp_points = 0,
    level = 1,
    streak_days = 0,
    last_active_date = NULL,
    total_articles_read = 0,
    total_quizzes_completed = 0,
    badges = '{}'
  WHERE id = p_child_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reset_child_progress TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin RLS: profiles, children, subscriptions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles
  FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "child_profiles_admin" ON child_profiles;
CREATE POLICY "child_profiles_admin" ON child_profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "subscriptions_admin" ON subscriptions;
CREATE POLICY "subscriptions_admin" ON subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Admin RLS: content
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "articles_admin_read" ON articles;
CREATE POLICY "articles_admin_read" ON articles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "articles_admin_insert" ON articles;
CREATE POLICY "articles_admin_insert" ON articles
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "articles_admin_update" ON articles;
CREATE POLICY "articles_admin_update" ON articles
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "articles_admin_delete" ON articles;
CREATE POLICY "articles_admin_delete" ON articles
  FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "pillars_admin" ON pillars;
CREATE POLICY "pillars_admin" ON pillars
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "paths_admin" ON adventure_paths;
CREATE POLICY "paths_admin" ON adventure_paths
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "path_articles_admin" ON path_articles;
CREATE POLICY "path_articles_admin" ON path_articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "quizzes_admin" ON quizzes;
CREATE POLICY "quizzes_admin" ON quizzes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "quiz_questions_admin" ON quiz_questions;
CREATE POLICY "quiz_questions_admin" ON quiz_questions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "badges_admin" ON badges;
CREATE POLICY "badges_admin" ON badges
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "hero_cards_admin" ON hero_cards;
CREATE POLICY "hero_cards_admin" ON hero_cards
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Admin RLS: progress & analytics read
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "article_progress_admin" ON article_progress;
CREATE POLICY "article_progress_admin" ON article_progress
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "path_progress_admin" ON path_progress;
CREATE POLICY "path_progress_admin" ON path_progress
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "quiz_attempts_admin" ON quiz_attempts;
CREATE POLICY "quiz_attempts_admin" ON quiz_attempts
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "points_ledger_admin" ON points_ledger;
CREATE POLICY "points_ledger_admin" ON points_ledger
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "child_badges_admin" ON child_badges;
CREATE POLICY "child_badges_admin" ON child_badges
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "child_streaks_admin" ON child_streaks;
CREATE POLICY "child_streaks_admin" ON child_streaks
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "child_hero_cards_admin" ON child_hero_cards;
CREATE POLICY "child_hero_cards_admin" ON child_hero_cards
  FOR SELECT USING (is_admin());
