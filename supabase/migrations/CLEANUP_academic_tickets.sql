-- =====================================================
-- Script de nettoyage complet pour academic_tickets
-- Exécutez ceci AVANT de relancer la migration principale
-- =====================================================

-- Supprimer la vue
DROP VIEW IF EXISTS academic_tickets_stats CASCADE;

-- Supprimer toutes les policies
DROP POLICY IF EXISTS "Authenticated users can view all tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON public.academic_tickets;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_update_academic_tickets_updated_at ON public.academic_tickets;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_academic_tickets_updated_at() CASCADE;

-- Supprimer la table (CASCADE pour supprimer tout ce qui dépend)
DROP TABLE IF EXISTS public.academic_tickets CASCADE;

-- Confirmation
SELECT 'Nettoyage terminé! Vous pouvez maintenant exécuter la migration create_academic_tickets.sql' AS message;
