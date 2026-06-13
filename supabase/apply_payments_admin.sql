-- FORCE INSTALL payments admin (run ALL in Supabase SQL Editor)
-- Fixes: PGRST205 — payment_records / failed_payment_events / trial_extensions missing
-- Safe to re-run. Run AFTER apply_messaging_force.sql if using messaging too.

-- ── A) Ensure is_admin() exists ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role')
  THEN
    INSERT INTO public.admin_roles (user_id, role)
    SELECT p.id, 'owner' FROM public.profiles p WHERE p.role = 'admin'
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
  END IF;
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── B) Profile + refund request columns ─────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_refund_requests'
  ) THEN
    ALTER TABLE public.support_refund_requests ADD COLUMN IF NOT EXISTS admin_notes text;
    ALTER TABLE public.support_refund_requests ADD COLUMN IF NOT EXISTS processed_at timestamptz;
    ALTER TABLE public.support_refund_requests ADD COLUMN IF NOT EXISTS stripe_refund_id text;
  END IF;
END $$;

-- ── C) Payment records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  record_type text NOT NULL DEFAULT 'manual_note'
    CHECK (record_type IN ('subscription', 'one_time', 'manual_note')),
  description text NOT NULL,
  source text NOT NULL DEFAULT 'internal' CHECK (source IN ('internal', 'stripe')),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_records_user_id_idx ON public.payment_records (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_status_idx ON public.payment_records (status, created_at DESC);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_records_admin_all ON public.payment_records;
CREATE POLICY payment_records_admin_all ON public.payment_records
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── D) Failed payment events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.failed_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  failure_reason text NOT NULL,
  stripe_event_id text UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'waived')),
  admin_notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS failed_payment_events_status_idx ON public.failed_payment_events (status, created_at DESC);

ALTER TABLE public.failed_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS failed_payment_events_admin_all ON public.failed_payment_events;
CREATE POLICY failed_payment_events_admin_all ON public.failed_payment_events
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── E) Trial extensions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extra_days integer NOT NULL CHECK (extra_days > 0),
  trial_ends_at timestamptz NOT NULL,
  reason text,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_extensions_user_id_idx ON public.trial_extensions (user_id, created_at DESC);

ALTER TABLE public.trial_extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trial_extensions_admin_all ON public.trial_extensions;
CREATE POLICY trial_extensions_admin_all ON public.trial_extensions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── F) Manual access grants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manual_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan text NOT NULL,
  end_date date,
  reason text,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_access_grants_user_id_idx ON public.manual_access_grants (user_id, created_at DESC);

ALTER TABLE public.manual_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manual_access_grants_admin_all ON public.manual_access_grants;
CREATE POLICY manual_access_grants_admin_all ON public.manual_access_grants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── G) Discount codes: eligible_plans column (optional) ─────────────────────
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS eligible_plans text[];

-- ── H) Reload PostgREST schema cache ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── I) Verify — expect 4 rows below ───────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'payment_records',
    'failed_payment_events',
    'trial_extensions',
    'manual_access_grants'
  )
ORDER BY table_name;
