-- Run this once in Supabase Dashboard → SQL Editor → Run
-- Fixes: PGRST204 "Could not find the 'avatar_id' column of 'profiles' in the schema cache"

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_id text;
ALTER TABLE public.child_profiles ADD COLUMN IF NOT EXISTS avatar_id text;

-- Optional: layered builder column (safe if already exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb;
ALTER TABLE public.child_profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb;

-- Self-service profile updates
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Parent-managed child profiles
DROP POLICY IF EXISTS "Parents can manage own children" ON public.child_profiles;
CREATE POLICY "Parents can manage own children" ON public.child_profiles
  FOR ALL
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- Refresh PostgREST schema cache (clears PGRST204 after DDL)
NOTIFY pgrst, 'reload schema';
