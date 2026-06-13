-- Fix discount_codes: accept "percent" alias and normalize to "percentage"
-- Run in Supabase SQL Editor if coupon inserts fail with discount_type_check

-- Normalize any existing rows
UPDATE public.discount_codes
SET discount_type = 'percentage'
WHERE discount_type = 'percent';

ALTER TABLE public.discount_codes
  DROP CONSTRAINT IF EXISTS discount_codes_discount_type_check;

ALTER TABLE public.discount_codes
  ADD CONSTRAINT discount_codes_discount_type_check
  CHECK (discount_type IN ('percentage', 'fixed'));

-- Optional: eligible_plans column (if you use multi-plan coupons)
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS eligible_plans text[];

NOTIFY pgrst, 'reload schema';
