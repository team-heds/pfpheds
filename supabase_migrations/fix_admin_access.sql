-- =====================================================
-- FIX ACCÈS ADMIN POUR UTILISATEURS
-- =====================================================
-- Description: Corrige les permissions pour les utilisateurs admin qui ne peuvent pas se connecter
-- Cible: Dylan Ortlieb et Axelle Sauthier
-- Date: 2025-12-11

-- =====================================================
-- 1. VÉRIFICATION DE L'ÉTAT ACTUEL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 VÉRIFICATION DES PERMISSIONS ADMIN';
  RAISE NOTICE '========================================';
END $$;

-- Afficher tous les utilisateurs avec rôle admin
SELECT 
  user_id,
  email,
  forname,
  family_name,
  role,
  permissions,
  is_active
FROM public.user_profiles
WHERE role IN ('admin', 'AdminSoins', 'AdminPhysio')
ORDER BY email;

-- =====================================================
-- 2. CORRECTION DES PERMISSIONS
-- =====================================================

-- S'assurer que tous les admins ont bien les permissions nécessaires
UPDATE public.user_profiles
SET 
  permissions = ARRAY['admin', 'page1.access', 'page2.access', 'super.all']::TEXT[],
  updated_at = NOW()
WHERE 
  role IN ('admin', 'AdminSoins', 'AdminPhysio')
  AND (
    permissions IS NULL 
    OR NOT ('admin' = ANY(permissions))
  );

-- =====================================================
-- 3. S'ASSURER QUE LES COMPTES SONT ACTIFS
-- =====================================================

UPDATE public.user_profiles
SET 
  is_active = true,
  updated_at = NOW()
WHERE 
  role IN ('admin', 'AdminSoins', 'AdminPhysio')
  AND is_active = false;

-- =====================================================
-- 4. VÉRIFICATION POST-CORRECTION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ÉTAT APRÈS CORRECTION';
  RAISE NOTICE '========================================';
END $$;

-- Afficher l'état final des admins
SELECT 
  user_id,
  email,
  forname,
  family_name,
  role,
  permissions,
  is_active,
  updated_at
FROM public.user_profiles
WHERE role IN ('admin', 'AdminSoins', 'AdminPhysio')
ORDER BY email;

-- =====================================================
-- 5. RÉSUMÉ DES MODIFICATIONS
-- =====================================================

DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role IN ('admin', 'AdminSoins', 'AdminPhysio');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RÉSUMÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nombre d''administrateurs: %', admin_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Corrections appliquées:';
  RAISE NOTICE '  ✅ Permissions standardisées pour tous les admins';
  RAISE NOTICE '  ✅ Tous les comptes admin activés';
  RAISE NOTICE '  ✅ Permissions: [admin, page1.access, page2.access, super.all]';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Exécuter la migration create_api_my_permissions_function.sql';
  RAISE NOTICE '  2. Demander aux utilisateurs de se reconnecter';
  RAISE NOTICE '  3. Vérifier les logs dans la console du navigateur';
  RAISE NOTICE '========================================';
END $$;
