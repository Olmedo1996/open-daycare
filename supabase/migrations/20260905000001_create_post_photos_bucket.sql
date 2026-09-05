-- Bucket post-photos en Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-photos',
  'post-photos',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas RLS para storage.objects (bucket post-photos)
-- Staff puede subir archivos
CREATE POLICY "post_photos_upload_staff"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-photos'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  )
);

-- Staff puede eliminar sus archivos
CREATE POLICY "post_photos_delete_staff"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'post-photos'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  )
);

-- Todos los autenticados pueden leer
CREATE POLICY "post_photos_select_authenticated"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'post-photos');
