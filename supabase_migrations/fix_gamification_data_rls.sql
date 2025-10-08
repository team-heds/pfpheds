-- Migration : Configurer les politiques RLS pour gamification_data
-- Date: 2025-10-08
-- Description: Permettre aux admins de modifier les données de gamification

-- Activer RLS sur la table si ce n'est pas déjà fait
ALTER TABLE gamification_data ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Tout le monde peut lire gamification_data" ON gamification_data;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leurs propres données" ON gamification_data;
DROP POLICY IF EXISTS "Les admins peuvent tout modifier" ON gamification_data;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres données" ON gamification_data;

-- Politique SELECT : Tout le monde peut lire (pour l'affichage public)
CREATE POLICY "Lecture publique gamification_data"
  ON gamification_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique INSERT : Les admins peuvent insérer
CREATE POLICY "Admins peuvent insérer gamification_data"
  ON gamification_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND admin = true
    )
  );

-- Politique UPDATE : Les admins peuvent modifier tout
CREATE POLICY "Admins peuvent modifier gamification_data"
  ON gamification_data
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND admin = true
    )
  );

-- Politique UPDATE : Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Utilisateurs peuvent modifier leurs données"
  ON gamification_data
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politique DELETE : Seuls les admins peuvent supprimer
CREATE POLICY "Admins peuvent supprimer gamification_data"
  ON gamification_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND admin = true
    )
  );

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Politiques RLS configurées pour gamification_data';
  RAISE NOTICE 'SELECT : Lecture publique (authenticated)';
  RAISE NOTICE 'INSERT : Admins uniquement';
  RAISE NOTICE 'UPDATE : Admins + utilisateurs (leurs données)';
  RAISE NOTICE 'DELETE : Admins uniquement';
  RAISE NOTICE '========================================';
END $$;

-- Tester les politiques
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'gamification_data'
ORDER BY cmd, policyname;
