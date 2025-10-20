-- =====================================================
-- FIX: Permettre l'accès anonyme aux tickets
-- Date: 2025-01-20
-- =====================================================
--
-- Problème: Les tickets nécessitent une authentification Supabase
-- mais l'utilisateur est connecté via Firebase
--
-- Solution: Permettre l'accès anonyme (lecture ET écriture)
-- pour permettre l'utilisation avec Firebase Auth
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Authenticated users can view all tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Allow anyone to access tickets" ON public.academic_tickets;

-- Nouvelle policy unique: Tout le monde peut tout faire
-- (simplifie pour les tests, à restreindre en production)
CREATE POLICY "Allow anyone to access tickets"
  ON public.academic_tickets
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Le trigger pour auto-remplir created_by est toujours actif
-- (créé dans FIX_academic_tickets_RLS.sql)

-- Vérification
-- SELECT * FROM pg_policies WHERE tablename = 'academic_tickets';
