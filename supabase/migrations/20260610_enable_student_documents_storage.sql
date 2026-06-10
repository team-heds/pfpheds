-- Enable Supabase Storage bucket + RLS policies for student documents

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'student-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'student-documents',
      'student-documents',
      true,
      10485760,
      ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
    );
  END IF;
END;
$$;

DROP POLICY IF EXISTS "student_documents_select_public" ON storage.objects;
CREATE POLICY "student_documents_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'student-documents');

DROP POLICY IF EXISTS "student_documents_insert_own_folder" ON storage.objects;
CREATE POLICY "student_documents_insert_own_folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "student_documents_update_own_folder" ON storage.objects;
CREATE POLICY "student_documents_update_own_folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "student_documents_delete_own_folder" ON storage.objects;
CREATE POLICY "student_documents_delete_own_folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
