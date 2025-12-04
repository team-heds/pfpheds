-- ========================================
-- FIX RLS pour StudentsPhysio (ADMIN ONLY)
-- ========================================
-- Permet SEULEMENT aux admins de modifier StudentsPhysio

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow authenticated users to update" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow authenticated users to select" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow admins to insert" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow admins to update" ON "StudentsPhysio";
DROP POLICY IF EXISTS "Allow admins to select" ON "StudentsPhysio";

-- 2. Créer les politiques ADMIN ONLY

-- SELECT : Admins et utilisateurs peuvent lire leurs propres données
CREATE POLICY "Allow admins to select"
ON "StudentsPhysio"
FOR SELECT
TO authenticated
USING (
  -- Soit l'utilisateur est admin
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
  -- Soit c'est ses propres données
  OR user_id = auth.uid()
);

-- INSERT : SEULEMENT les admins peuvent insérer
CREATE POLICY "Allow admins to insert"
ON "StudentsPhysio"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- UPDATE : SEULEMENT les admins peuvent mettre à jour
CREATE POLICY "Allow admins to update"
ON "StudentsPhysio"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 3. Vérifier les politiques
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'StudentsPhysio';
