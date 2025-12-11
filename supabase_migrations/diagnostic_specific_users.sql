-- =====================================================
-- DIAGNOSTIC POUR UTILISATEURS SPÉCIFIQUES
-- =====================================================
-- Description: Vérifie en détail les permissions de Dylan Ortlieb et Axelle Sauthier
-- Date: 2025-12-11

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 DIAGNOSTIC DÉTAILLÉ DES UTILISATEURS';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 1. RECHERCHE PAR EMAIL/NOM
-- =====================================================

-- Dylan Ortlieb
SELECT 
  '🔍 DYLAN ORTLIEB' AS diagnostic,
  user_id,
  email,
  forname,
  family_name,
  display_name,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
FROM public.user_profiles
WHERE 
  LOWER(email) LIKE '%dylan%ortlieb%'
  OR LOWER(family_name) LIKE '%ortlieb%'
  OR LOWER(forname) LIKE '%dylan%';

-- Axelle Sauthier
SELECT 
  '🔍 AXELLE SAUTHIER' AS diagnostic,
  user_id,
  email,
  forname,
  family_name,
  display_name,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
FROM public.user_profiles
WHERE 
  LOWER(email) LIKE '%axelle%'
  OR LOWER(family_name) LIKE '%sauthier%'
  OR LOWER(forname) LIKE '%axelle%';

-- =====================================================
-- 2. TOUS LES UTILISATEURS AVEC RÔLE ADMIN
-- =====================================================

SELECT 
  '📋 TOUS LES ADMINS' AS section,
  user_id,
  email,
  forname || ' ' || family_name AS full_name,
  role,
  permissions,
  is_active
FROM public.user_profiles
WHERE role IN ('admin', 'AdminSoins', 'AdminPhysio')
ORDER BY email;

-- =====================================================
-- 3. STATISTIQUES DES RÔLES
-- =====================================================

SELECT 
  '📊 STATISTIQUES' AS section,
  role,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE is_active = true) AS active_count,
  COUNT(*) FILTER (WHERE permissions IS NOT NULL AND array_length(permissions, 1) > 0) AS with_permissions
FROM public.user_profiles
GROUP BY role
ORDER BY count DESC;

-- =====================================================
-- 4. RECHERCHE D'ANOMALIES
-- =====================================================

-- Admins sans permissions
SELECT 
  '⚠️ ADMINS SANS PERMISSIONS' AS alert,
  user_id,
  email,
  forname,
  family_name,
  role
FROM public.user_profiles
WHERE 
  role IN ('admin', 'AdminSoins', 'AdminPhysio')
  AND (permissions IS NULL OR array_length(permissions, 1) = 0);

-- Admins inactifs
SELECT 
  '⚠️ ADMINS INACTIFS' AS alert,
  user_id,
  email,
  forname,
  family_name,
  role
FROM public.user_profiles
WHERE 
  role IN ('admin', 'AdminSoins', 'AdminPhysio')
  AND is_active = false;

-- =====================================================
-- 5. VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
-- =====================================================

-- Qui peut accéder à page1.access
SELECT 
  '✅ UTILISATEURS AVEC page1.access' AS section,
  user_id,
  email,
  role,
  permissions
FROM public.user_profiles
WHERE 
  'page1.access' = ANY(permissions)
  OR role IN ('admin', 'AdminSoins', 'AdminPhysio');

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DIAGNOSTIC TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ SI PROBLÈME IDENTIFIÉ:';
  RAISE NOTICE '  1. Exécuter fix_admin_access.sql';
  RAISE NOTICE '  2. Exécuter create_api_my_permissions_function.sql';
  RAISE NOTICE '  3. Demander aux utilisateurs de se déconnecter/reconnecter';
  RAISE NOTICE '========================================';
END $$;
