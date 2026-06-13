-- Run in Supabase SQL Editor to enable Azure TTS voice settings + cache table.
-- Azure API keys are set via Edge Function secrets (never in this file).

INSERT INTO platform_settings (key, value) VALUES
  ('voice_enabled', 'true'),
  ('voice_provider', 'azure'),
  ('voice_default_en', 'en-US-JennyNeural'),
  ('voice_default_fr', 'fr-FR-DeniseNeural'),
  ('voice_default_ar', 'ar-SA-ZariyahNeural'),
  ('voice_speaking_speed', '1'),
  ('voice_pronunciation_dictionary', '[{"term":"Salman al-Farsi","alias":"Salman al Far-see"},{"term":"Abu Bakr","alias":"Abu Bakr"},{"term":"Khadijah","alias":"Khadija"},{"term":"Qur''an","alias":"Koran"},{"term":"Hadith","alias":"Ha-deeth"},{"term":"ﷺ","alias":"peace be upon him"},{"term":"SAW","alias":"peace be upon him"}]')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

CREATE TABLE IF NOT EXISTS tts_audio_cache (
  cache_key text PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  language text NOT NULL,
  age_group text,
  voice_name text NOT NULL,
  speaking_rate numeric NOT NULL DEFAULT 1,
  content_hash text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_audio_cache_article ON tts_audio_cache(article_id);

ALTER TABLE tts_audio_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tts_cache_admin_read" ON tts_audio_cache;
CREATE POLICY "tts_cache_admin_read" ON tts_audio_cache
  FOR SELECT USING (is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tts-cache', 'tts-cache', false, 52428800, ARRAY['audio/mpeg', 'audio/mp3'])
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
