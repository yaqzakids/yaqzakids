-- Learning path public pages + admin metadata
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS public_slug text UNIQUE;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS mission_statement text;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS age_groups text[] NOT NULL DEFAULT ARRAY['explorer', 'discoverer', 'thinker'];
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS certificate_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE adventure_paths ADD COLUMN IF NOT EXISTS certificate_title text;

-- Link seeded paths to public marketing slugs where slugs match
UPDATE adventure_paths SET public_slug = 'science-nature' WHERE slug = 'wonders-creation' AND public_slug IS NULL;
UPDATE adventure_paths SET public_slug = 'foundations-of-faith' WHERE slug = 'search-for-truth' AND public_slug IS NULL;
UPDATE adventure_paths SET public_slug = 'history-civilization' WHERE slug = 'ancient-egypt' AND public_slug IS NULL;
UPDATE adventure_paths SET public_slug = 'todays-world' WHERE slug = 'understanding-news' AND public_slug IS NULL;
UPDATE adventure_paths SET public_slug = 'environment-stewardship' WHERE slug = 'signs-in-nature' AND public_slug IS NULL;
UPDATE adventure_paths SET public_slug = 'technology-ai' WHERE slug = 'building-character' AND public_slug IS NULL;

UPDATE adventure_paths SET mission_statement = description WHERE mission_statement IS NULL AND description IS NOT NULL;
