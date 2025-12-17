-- ============================================
-- Migration 004d: Migration des rôles existants
-- Date: 2024-12-17
-- Description: Migrer les rôles de user_profiles.permissions vers user_track_roles
-- ⚠️ IDEMPOTENT: peut être exécuté plusieurs fois (ON CONFLICT DO NOTHING)
-- ============================================

-- ============================================
-- 1. Migrer les SuperAdmins (super.all, admin global) - SI + PHY
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'SI', 'SUPER_ADMIN'
FROM user_profiles
WHERE role IN ('super.all', 'admin')
   OR (permissions IS NOT NULL AND (permissions ? 'super.all' OR permissions ? 'admin'))
ON CONFLICT (user_id, track_id, role) DO NOTHING;

INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'PHY', 'SUPER_ADMIN'
FROM user_profiles
WHERE role IN ('super.all', 'admin')
   OR (permissions IS NOT NULL AND (permissions ? 'super.all' OR permissions ? 'admin'))
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 2. Migrer les AdminSoins → ADMIN SI
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'SI', 'ADMIN'::track_role
FROM user_profiles
WHERE role = 'AdminSoins' 
   OR (permissions IS NOT NULL AND permissions ? 'AdminSoins')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 3. Migrer les AdminPhysio → ADMIN PHY
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'PHY', 'ADMIN'::track_role
FROM user_profiles
WHERE role = 'AdminPhysio' 
   OR (permissions IS NOT NULL AND permissions ? 'AdminPhysio')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 4. Migrer les RMSoins → RM SI
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'SI', 'RM'::track_role
FROM user_profiles
WHERE role = 'RMSoins' 
   OR (permissions IS NOT NULL AND permissions ? 'RMSoins')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 5. Migrer les RMPhysio → RM PHY
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'PHY', 'RM'::track_role
FROM user_profiles
WHERE role = 'RMPhysio' 
   OR (permissions IS NOT NULL AND permissions ? 'RMPhysio')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 6. Migrer les EnseignantSoins → TEACHER SI
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'SI', 'TEACHER'::track_role
FROM user_profiles
WHERE role = 'EnseignantSoins' 
   OR (permissions IS NOT NULL AND permissions ? 'EnseignantSoins')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 7. Migrer les EnseignantPhysio → TEACHER PHY
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'PHY', 'TEACHER'::track_role
FROM user_profiles
WHERE role = 'EnseignantPhysio' 
   OR (permissions IS NOT NULL AND permissions ? 'EnseignantPhysio')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 8. Migrer les EtudiantSoins → STUDENT SI
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'SI', 'STUDENT'::track_role
FROM user_profiles
WHERE role = 'EtudiantSoins' 
   OR (permissions IS NOT NULL AND permissions ? 'EtudiantSoins')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- 9. Migrer les EtudiantPhysio → STUDENT PHY
-- ============================================
INSERT INTO user_track_roles (user_id, track_id, role)
SELECT user_id, 'PHY', 'STUDENT'::track_role
FROM user_profiles
WHERE role = 'EtudiantPhysio' 
   OR (permissions IS NOT NULL AND permissions ? 'EtudiantPhysio')
ON CONFLICT (user_id, track_id, role) DO NOTHING;

-- ============================================
-- Vérification de la migration
-- ============================================
SELECT '✅ Migration des rôles terminée' AS status;

SELECT 
  COALESCE(track_id, 'GLOBAL') as filiere,
  role,
  COUNT(*) as count
FROM user_track_roles
GROUP BY track_id, role
ORDER BY track_id NULLS FIRST, role;
