-- Language support (migration 020)
-- See supabase/apply_language_support.sql for SQL Editor apply script

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_language_check
      CHECK (language IN ('en', 'fr', 'ar'));
  END IF;
END $$;

ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'child_profiles_language_check'
  ) THEN
    ALTER TABLE child_profiles
      ADD CONSTRAINT child_profiles_language_check
      CHECK (language IN ('en', 'fr', 'ar'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_profile_language(p_language text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_language NOT IN ('en', 'fr', 'ar') THEN
    RAISE EXCEPTION 'Invalid language: %', p_language;
  END IF;

  UPDATE profiles
  SET language = p_language
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_profile_language(text) TO authenticated;
