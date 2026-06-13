-- Profile display fields for admin/parent settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title text DEFAULT 'Founder & Owner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_contact_email text DEFAULT 'hello@yaqzakids.com';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
