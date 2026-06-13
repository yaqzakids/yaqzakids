-- Article i18n JSONB column
-- Run in Supabase SQL Editor (safe to re-run)

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS locales_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN articles.locales_i18n IS
  'Per-language article content: { en, fr, ar } with title, age bodies, islamic_teaching, think_about_it, activity';

CREATE INDEX IF NOT EXISTS idx_articles_locales_i18n ON articles USING gin (locales_i18n);
