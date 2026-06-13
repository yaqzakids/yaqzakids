-- Discoverer Phase 1 — article faith fields, certificates, reflections
-- Safe to re-run

ALTER TABLE articles ADD COLUMN IF NOT EXISTS usul_theme TEXT
  CHECK (usul_theme IS NULL OR usul_theme IN (
    'tawhid','revelation','purpose','akhlaq',
    'akhirah','stewardship','justice','knowledge'
  ));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quran_connection TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quran_reference TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hadith_connection TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hadith_reference TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS islamic_reflection TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS take_action TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reflection_question TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS fun_facts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS vocabulary JSONB DEFAULT '[]'::jsonb;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS quran_connection_i18n JSONB DEFAULT '{}'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS islamic_reflection_i18n JSONB DEFAULT '{}'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS think_about_it_i18n JSONB DEFAULT '{}'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS take_action_i18n JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  path_id UUID REFERENCES adventure_paths(id) ON DELETE SET NULL,
  child_name TEXT NOT NULL,
  path_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT
);

CREATE TABLE IF NOT EXISTS reflection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflection_responses_child ON reflection_responses(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_certificates_child ON certificates(child_profile_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_responses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates'
      AND policyname = 'Users can manage own certificates'
  ) THEN
    CREATE POLICY "Users can manage own certificates"
      ON certificates FOR ALL
      USING (child_profile_id IN (
        SELECT id FROM child_profiles WHERE parent_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reflection_responses'
      AND policyname = 'Users can manage own reflections'
  ) THEN
    CREATE POLICY "Users can manage own reflections"
      ON reflection_responses FOR ALL
      USING (child_profile_id IN (
        SELECT id FROM child_profiles WHERE parent_id = auth.uid()
      ));
  END IF;
END $$;
