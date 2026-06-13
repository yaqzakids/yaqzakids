-- Ensure avatar_id columns exist and users/parents can save preset avatars.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_id text;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS avatar_id text;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Parents can manage own children" ON child_profiles;
CREATE POLICY "Parents can manage own children" ON child_profiles
  FOR ALL
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);
