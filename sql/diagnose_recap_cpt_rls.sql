-- Diagnostic: Vérifier les RLS policies sur recap_cpt_evaluation
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
WHERE tablename = 'recap_cpt_evaluation';

-- Si les policies n'existent pas ou sont incorrectes, exécutez ce qui suit:

-- 1. Désactiver temporairement RLS pour tester (NE PAS FAIRE EN PRODUCTION)
-- ALTER TABLE recap_cpt_evaluation DISABLE ROW LEVEL SECURITY;

-- 2. OU Recréer les policies correctement:
DROP POLICY IF EXISTS "Allow authenticated users to read recap_cpt_evaluation" ON recap_cpt_evaluation;
DROP POLICY IF EXISTS "Allow authenticated users to insert recap_cpt_evaluation" ON recap_cpt_evaluation;
DROP POLICY IF EXISTS "Allow authenticated users to update recap_cpt_evaluation" ON recap_cpt_evaluation;
DROP POLICY IF EXISTS "Allow authenticated users to delete recap_cpt_evaluation" ON recap_cpt_evaluation;

-- Recréer avec des permissions complètes pour authenticated users
CREATE POLICY "Enable read for authenticated users"
  ON recap_cpt_evaluation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON recap_cpt_evaluation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON recap_cpt_evaluation FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON recap_cpt_evaluation FOR DELETE
  TO authenticated
  USING (true);
