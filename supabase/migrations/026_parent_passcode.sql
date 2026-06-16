-- Parent 4-digit passcode (bcrypt hash, never store plain text)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_passcode_hash TEXT;

COMMENT ON COLUMN public.profiles.parent_passcode_hash IS
  'Bcrypt hash of 4-digit parent passcode for unlocking billing/settings.';

CREATE OR REPLACE FUNCTION public.set_parent_passcode(p_passcode TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_passcode IS NULL OR p_passcode !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 4 digits';
  END IF;
  UPDATE public.profiles
  SET parent_passcode_hash = crypt(p_passcode, gen_salt('bf'))
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_parent_passcode(p_passcode TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT parent_passcode_hash INTO stored FROM public.profiles WHERE id = auth.uid();
  IF stored IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored = crypt(p_passcode, stored);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_parent_passcode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_passcode_hash IS NOT NULL FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

REVOKE ALL ON FUNCTION public.set_parent_passcode(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_parent_passcode(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_parent_passcode() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_parent_passcode(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_parent_passcode(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_parent_passcode() TO authenticated;
