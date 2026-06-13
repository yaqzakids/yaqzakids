-- Child profile age and interests
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN child_profiles.age IS 'Child age in years (6–16)';
COMMENT ON COLUMN child_profiles.interests IS 'Learning interest tags for personalization';

NOTIFY pgrst, 'reload schema';
