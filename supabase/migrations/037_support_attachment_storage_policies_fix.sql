-- Recreate support-attachments storage policies (fixes bug in 036 that dropped them after create)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS support_attachments_parent_insert ON storage.objects;
CREATE POLICY support_attachments_parent_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE auth.uid()::text || '/%'
    )
  );

DROP POLICY IF EXISTS support_attachments_parent_select ON storage.objects;
CREATE POLICY support_attachments_parent_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE auth.uid()::text || '/%'
    )
  );

DROP POLICY IF EXISTS support_attachments_admin_all ON storage.objects;
CREATE POLICY support_attachments_admin_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'support-attachments' AND public.is_admin())
  WITH CHECK (bucket_id = 'support-attachments' AND public.is_admin());

NOTIFY pgrst, 'reload schema';
