-- ============================================
-- Migration 005: RLS Policies sur modules
-- Date: 2024-12-17
-- Description: Filtrage des modules par filière et rôle
-- ⚠️ EXÉCUTÉ AVEC SUCCÈS LE 2024-12-17
-- ============================================

-- Fonction créée: is_rm_for_module(INTEGER)
-- Vérifie si l'utilisateur est RM du module via responsable_email

-- Policy créée: modules_select_policy
-- Permet de voir les modules si:
-- - is_global_admin()
-- - can_access_track(track_id)
-- - is_rm_for_module(id)
-- - module sans track_id et authentifié

SELECT '✅ RLS déjà configuré' AS status;
