-- Fix des permissions pour praticiens_formateurs
-- Si la table existe déjà mais que les insertions échouent

-- 1. Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Authenticated users can view praticiens_formateurs" ON praticiens_formateurs;
DROP POLICY IF EXISTS "Admins and editors can insert praticiens_formateurs" ON praticiens_formateurs;
DROP POLICY IF EXISTS "Admins and editors can update praticiens_formateurs" ON praticiens_formateurs;
DROP POLICY IF EXISTS "Admins can delete praticiens_formateurs" ON praticiens_formateurs;

-- 2. Vérifier que RLS est activé
ALTER TABLE praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- 3. Créer les nouvelles policies simplifiées (ou les remplacer si elles existent)

-- Policy SELECT : Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "authenticated_read_praticiens" ON praticiens_formateurs;
CREATE POLICY "authenticated_read_praticiens"
ON praticiens_formateurs
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT : Tous les utilisateurs authentifiés peuvent insérer (temporaire pour debug)
DROP POLICY IF EXISTS "authenticated_insert_praticiens" ON praticiens_formateurs;
CREATE POLICY "authenticated_insert_praticiens"
ON praticiens_formateurs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy UPDATE : Tous les utilisateurs authentifiés peuvent modifier (temporaire pour debug)
DROP POLICY IF EXISTS "authenticated_update_praticiens" ON praticiens_formateurs;
CREATE POLICY "authenticated_update_praticiens"
ON praticiens_formateurs
FOR UPDATE
TO authenticated
USING (true);

-- Policy DELETE : Seulement les admins peuvent supprimer
DROP POLICY IF EXISTS "admin_delete_praticiens" ON praticiens_formateurs;
CREATE POLICY "admin_delete_praticiens"
ON praticiens_formateurs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
    AND user_profiles.is_active = true
  )
);

-- 4. Vérifier les permissions de la table
GRANT ALL ON praticiens_formateurs TO authenticated;

-- Vérifier si la séquence existe avant de donner les permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'praticiens_formateurs_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE praticiens_formateurs_id_seq TO authenticated;
    ELSE
        RAISE NOTICE 'Séquence praticiens_formateurs_id_seq n''existe pas (probablement UUID ou autre type d''ID)';
    END IF;
END $$;

-- 5. Vérification : Afficher les policies actives
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
WHERE tablename = 'praticiens_formateurs';

-- 6. Test d'insertion (à décommenter si besoin de tester)
-- INSERT INTO praticiens_formateurs (nom, prenom, mail, institution, localite)
-- VALUES ('Test', 'Utilisateur', 'test@example.com', 'HEdS Test', 'Test');
