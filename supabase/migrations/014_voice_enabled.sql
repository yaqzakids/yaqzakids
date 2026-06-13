-- Optional platform setting to enable/disable read-aloud voice controls
INSERT INTO platform_settings (key, value) VALUES
  ('voice_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
