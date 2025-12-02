-- ========================================
-- FIX RLS pour StudentsPhysio
-- ========================================
-- Permet aux utilisateurs authentifiés d'insérer et mettre à jour dans StudentsPhysio

-- 1. Vérifier si RLS est activé
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'StudentsPhysio';

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow authenticated users to update" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow authenticated users to select" ON "StudentsPhysio";

-- 3. Créer les nouvelles politiques

-- SELECT : Tout utilisateur authentifié peut lire
CREATE POLICY "Allow authenticated users to select"
ON "StudentsPhysio"
FOR SELECT
TO authenticated
USING (true);

-- INSERT : Tout utilisateur authentifié peut insérer
CREATE POLICY "Allow authenticated users to insert"
ON "StudentsPhysio"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE : Tout utilisateur authentifié peut mettre à jour
CREATE POLICY "Allow authenticated users to update"
ON "StudentsPhysio"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'StudentsPhysio';
