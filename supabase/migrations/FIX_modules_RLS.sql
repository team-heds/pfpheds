-- =====================================================
-- FIX: Permissions RLS pour la table modules
-- Date: 2025-01-20
-- =====================================================
--
-- Problème: Les modules ne sont pas chargés dans le dropdown
-- car la table n'a probablement pas de policies RLS
--
-- Solution: Ajouter des policies pour permettre la lecture
-- =====================================================

-- Activer RLS sur la table modules (si pas déjà fait)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to read modules" ON public.modules;
DROP POLICY IF EXISTS "Allow authenticated users to create modules" ON public.modules;
DROP POLICY IF EXISTS "Allow authenticated users to update modules" ON public.modules;
DROP POLICY IF EXISTS "Allow authenticated users to delete modules" ON public.modules;

-- Policy: Tous les utilisateurs authentifiés peuvent lire les modules
CREATE POLICY "Allow authenticated users to read modules"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Utilisateurs authentifiés peuvent créer des modules
CREATE POLICY "Allow authenticated users to create modules"
  ON public.modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Utilisateurs authentifiés peuvent modifier des modules
CREATE POLICY "Allow authenticated users to update modules"
  ON public.modules
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Utilisateurs authentifiés peuvent supprimer des modules
CREATE POLICY "Allow authenticated users to delete modules"
  ON public.modules
  FOR DELETE
  TO authenticated
  USING (true);

-- Vérification
-- SELECT * FROM pg_policies WHERE tablename = 'modules';
