-- Enable Supabase Storage bucket + RLS policies for institution images

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'institutions'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'institutions',
      'institutions',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  END IF;
END;
$$;

DROP POLICY IF EXISTS "institutions_images_select_public" ON storage.objects;
CREATE POLICY "institutions_images_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'institutions');

DROP POLICY IF EXISTS "institutions_images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "institutions_images_insert_admin" ON storage.objects;
CREATE POLICY "institutions_images_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'institutions');

DROP POLICY IF EXISTS "institutions_images_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "institutions_images_update_admin" ON storage.objects;
CREATE POLICY "institutions_images_update_authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'institutions'
)
WITH CHECK (
  bucket_id = 'institutions'
);

DROP POLICY IF EXISTS "institutions_images_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "institutions_images_delete_admin" ON storage.objects;
CREATE POLICY "institutions_images_delete_authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'institutions'
);
