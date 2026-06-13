-- Custom avatar builder configuration (JSON preset features)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb;
