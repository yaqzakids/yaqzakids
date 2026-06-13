-- Ensure platform admin/contact emails use official Yaqza Kids addresses

INSERT INTO platform_settings (key, value) VALUES
  ('admin_email', 'yaqzakids@gmail.com'),
  ('contact_email', 'hello@yaqzakids.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
