ALTER TABLE path_articles ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;
