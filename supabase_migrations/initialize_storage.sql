-- Migration : Initialiser Supabase Storage
-- Date: 2025-10-08
-- Description: Créer le schéma storage et le bucket avatars pour les photos de profil

-- ========================================
-- CRÉER LE SCHÉMA STORAGE
-- ========================================

CREATE SCHEMA IF NOT EXISTS storage;

-- ========================================
-- CRÉER LA TABLE BUCKETS
-- ========================================

CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    owner uuid REFERENCES auth.users,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- ========================================
-- CRÉER LA TABLE OBJECTS (Fichiers)
-- ========================================

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id text REFERENCES storage.buckets(id),
    name text,
    owner uuid REFERENCES auth.users,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version text,
    owner_id text
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS objects_bucket_id_name_idx ON storage.objects(bucket_id, name);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects(name);

-- ========================================
-- CRÉER LE BUCKET 'avatars'
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,  -- Public pour que les avatars soient accessibles
    5242880,  -- 5 MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- POLITIQUES RLS POUR LE BUCKET 'avatars'
-- ========================================

-- Activer RLS sur les tables storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read buckets" ON storage.buckets;

-- Politique : Lecture publique des avatars
CREATE POLICY "Public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique : Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Politique : Mise à jour de son propre avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Politique : Suppression de son propre avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Politique : Lecture des buckets (nécessaire pour les opérations)
CREATE POLICY "Anyone can read buckets"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- ========================================
-- VÉRIFICATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage initialisé avec succès !';
  RAISE NOTICE '✅ Bucket "avatars" créé (public, max 5MB)';
  RAISE NOTICE '✅ Politiques RLS configurées';
END $$;

-- Afficher les buckets créés
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- Afficher les politiques RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'storage';
