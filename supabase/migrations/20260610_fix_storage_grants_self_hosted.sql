-- Fix missing grants for self-hosted Supabase Storage.
-- Policies alone are not enough on this stack: the storage API also needs
-- table/schema privileges on storage.buckets and storage.objects.

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

GRANT SELECT ON TABLE storage.buckets TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE storage.buckets TO service_role;

GRANT SELECT ON TABLE storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE storage.objects TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT ALL PRIVILEGES ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT ALL PRIVILEGES ON TABLE storage.s3_multipart_uploads_parts TO service_role;
