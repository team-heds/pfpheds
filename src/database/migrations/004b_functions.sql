-- ============================================
-- Migration 004b: Fonctions SQL utilitaires RBAC
-- Date: 2024-12-17
-- Description: Fonctions pour vérifier les rôles/permissions
-- ⚠️ IDEMPOTENT: peut être exécuté plusieurs fois
-- ============================================

-- ============================================
-- 1. Fonction: is_super_admin()
-- Vérifie si l'utilisateur courant est SuperAdmin
-- ============================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- ============================================
-- 2. Fonction: is_global_admin()
-- Vérifie si l'utilisateur est admin global (SuperAdmin OU via user_profiles legacy)
-- ============================================
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (
      role IN ('admin', 'super.all')
      OR (permissions IS NOT NULL AND permissions ? 'admin')
      OR (permissions IS NOT NULL AND permissions ? 'super.all')
    )
  );
$$;

-- ============================================
-- 3. Fonction: has_track_role(track_id, role)
-- Vérifie si l'utilisateur a un rôle spécifique pour une filière
-- ============================================
CREATE OR REPLACE FUNCTION has_track_role(p_track_id TEXT, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role::TEXT = p_role
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- ============================================
-- 4. Fonction: has_any_track_role(track_id, roles[])
-- Vérifie si l'utilisateur a l'un des rôles spécifiés pour une filière
-- ============================================
CREATE OR REPLACE FUNCTION has_any_track_role(p_track_id TEXT, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role::TEXT = ANY(p_roles)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- ============================================
-- 5. Fonction: get_user_tracks()
-- Retourne les filières accessibles à l'utilisateur courant
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tracks()
RETURNS TABLE(track_id TEXT, roles TEXT[])
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Si SuperAdmin, retourne toutes les filières actives
  SELECT t.id AS track_id, ARRAY['SUPER_ADMIN']::TEXT[] AS roles
  FROM tracks t
  WHERE t.is_active = true
  AND is_super_admin()
  
  UNION
  
  -- Sinon, retourne les filières où l'utilisateur a des rôles
  SELECT 
    utr.track_id,
    ARRAY_AGG(DISTINCT utr.role::TEXT) AS roles
  FROM user_track_roles utr
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND utr.track_id IS NOT NULL
  AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
  GROUP BY utr.track_id;
$$;

-- ============================================
-- 6. Fonction: can_access_track(track_id)
-- Vérifie si l'utilisateur peut accéder à une filière
-- ============================================
CREATE OR REPLACE FUNCTION can_access_track(p_track_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM user_track_roles
      WHERE user_id = auth.uid()
      AND track_id = p_track_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    );
$$;

-- ============================================
-- 7. Fonction: has_track_access_level(track_id, min_level)
-- Vérifie si l'utilisateur a au moins un certain niveau d'accès
-- Niveaux: SUPER_ADMIN > SECRETARIAT > RF > ADMIN > RM > TEACHER > STUDENT
-- ============================================
CREATE OR REPLACE FUNCTION has_track_access_level(p_track_id TEXT, p_min_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role_order INTEGER;
  v_min_order INTEGER;
  v_user_roles TEXT[];
BEGIN
  -- Définir l'ordre des rôles (plus petit = plus de droits)
  v_min_order := CASE p_min_role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'SECRETARIAT' THEN 2
    WHEN 'RF' THEN 3
    WHEN 'ADMIN' THEN 4
    WHEN 'RM' THEN 5
    WHEN 'TEACHER' THEN 6
    WHEN 'STUDENT' THEN 7
    ELSE 99
  END;
  
  -- SuperAdmin a toujours accès
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier les rôles de l'utilisateur pour cette filière
  SELECT ARRAY_AGG(role::TEXT) INTO v_user_roles
  FROM user_track_roles
  WHERE user_id = auth.uid()
  AND track_id = p_track_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_roles IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si au moins un rôle a le niveau requis
  RETURN EXISTS (
    SELECT 1 FROM unnest(v_user_roles) AS r
    WHERE CASE r
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'SECRETARIAT' THEN 2
      WHEN 'RF' THEN 3
      WHEN 'ADMIN' THEN 4
      WHEN 'RM' THEN 5
      WHEN 'TEACHER' THEN 6
      WHEN 'STUDENT' THEN 7
      ELSE 99
    END <= v_min_order
  );
END;
$$;

-- ============================================
-- 8. Fonction: api_my_track_roles()
-- RPC pour récupérer les rôles de l'utilisateur courant (pour le frontend)
-- ============================================
CREATE OR REPLACE FUNCTION api_my_track_roles()
RETURNS TABLE(
  track_id TEXT,
  track_label TEXT,
  track_color TEXT,
  role TEXT,
  granted_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    utr.track_id,
    t.label AS track_label,
    t.color AS track_color,
    utr.role::TEXT,
    utr.granted_at
  FROM user_track_roles utr
  LEFT JOIN tracks t ON t.id = utr.track_id
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
  ORDER BY t.display_order, utr.role;
$$;

-- Vérification
SELECT '✅ Fonctions RBAC créées avec succès' AS status;
