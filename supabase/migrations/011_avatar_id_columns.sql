-- Built-in avatar selection (library id + display value)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_id text;

ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS avatar_id text;
