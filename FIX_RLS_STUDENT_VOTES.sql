-- ============================================
-- FIX RLS PERMISSIONS FOR student_votes TABLE
-- ============================================
-- Ce script corrige les permissions Row Level Security (RLS)
-- pour permettre aux administrateurs de voir tous les votes

-- 1. Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'student_votes';

-- 2. Lister les politiques existantes
SELECT * FROM pg_policies WHERE tablename = 'student_votes';

-- 3. Supprimer les anciennes politiques restrictives (si elles existent)
DROP POLICY IF EXISTS "Users can only read their own votes" ON student_votes;
DROP POLICY IF EXISTS "Users can only insert their own votes" ON student_votes;
DROP POLICY IF EXISTS "Users can only update their own votes" ON student_votes;

-- 4. Créer une politique pour permettre aux admins de TOUT voir
-- Option A: Basée sur un champ 'role' dans user_profiles
CREATE POLICY "Admins can read all votes"
ON student_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
  OR
  user_id = auth.uid()  -- Les étudiants peuvent toujours voir leurs propres votes
);

-- 5. Politique pour INSERT (créer un vote)
CREATE POLICY "Users can insert their own votes"
ON student_votes
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 6. Politique pour UPDATE (modifier un vote)
CREATE POLICY "Users can update their own votes"
ON student_votes
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Politique pour DELETE (supprimer un vote)
CREATE POLICY "Admins can delete any vote"
ON student_votes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- ============================================
-- ALTERNATIVE: Si vous n'avez pas de champ 'role'
-- ============================================
-- Utilisez cette option si vous identifiez les admins autrement
-- Par exemple, par email ou par une table séparée

/*
-- Option B: Liste d'emails d'administrateurs
CREATE POLICY "Admin emails can read all votes"
ON student_votes
FOR SELECT
USING (
  auth.jwt() ->> 'email' IN (
    'admin@example.com',
    'admin2@example.com'
  )
  OR
  user_id = auth.uid()
);
*/

/*
-- Option C: Désactiver temporairement RLS (NON RECOMMANDÉ en production)
ALTER TABLE student_votes DISABLE ROW LEVEL SECURITY;

-- Pour réactiver plus tard:
-- ALTER TABLE student_votes ENABLE ROW LEVEL SECURITY;
*/

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après avoir exécuté ce script, vérifiez les politiques:
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
WHERE tablename = 'student_votes'
ORDER BY policyname;

-- Testez en comptant les votes:
-- SELECT COUNT(*) FROM student_votes;
