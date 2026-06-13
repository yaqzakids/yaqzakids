-- Child profile age + interests — paste into Supabase SQL Editor (safe to re-run)

ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN child_profiles.age IS 'Child age in years (6–16)';
COMMENT ON COLUMN child_profiles.interests IS 'Learning interest tags for personalization';

-- Refresh PostgREST schema cache so the API sees new columns immediately
NOTIFY pgrst, 'reload schema';
