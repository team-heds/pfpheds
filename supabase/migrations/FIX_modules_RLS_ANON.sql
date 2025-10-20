-- =====================================================
-- FIX: Permettre la lecture anonyme des modules
-- Date: 2025-01-20
-- =====================================================
--
-- Problème: Les modules ne se chargent pas car l'utilisateur
-- est connecté avec Firebase, pas Supabase
--
-- Solution: Permettre la lecture anonyme (anon) des modules
-- tout en gardant les autres opérations réservées aux authentifiés
-- =====================================================

-- Supprimer l'ancienne policy de lecture
DROP POLICY IF EXISTS "Allow authenticated users to read modules" ON public.modules;
DROP POLICY IF EXISTS "Allow anyone to read modules" ON public.modules;

-- Nouvelle policy: Tout le monde peut lire les modules (même anonyme)
CREATE POLICY "Allow anyone to read modules"
  ON public.modules
  FOR SELECT
  TO anon, authenticated  -- anon = utilisateurs non connectés, authenticated = connectés
  USING (true);

-- Les autres opérations restent limitées aux utilisateurs authentifiés
-- (les policies INSERT, UPDATE, DELETE créées précédemment sont conservées)

-- Vérification
-- SELECT * FROM pg_policies WHERE tablename = 'modules';
