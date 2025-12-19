-- ============================================
-- MASTER MIGRATION: Système Multi-Filières SI/PHY
-- Date: 2024-12-17
-- ============================================
-- 
-- ORDRE D'EXÉCUTION:
-- 1. 003_create_tracks_table.sql       - Table des filières
-- 2. 004_create_user_track_roles.sql   - Table des rôles par filière
-- 3. 004b_functions.sql                - Fonctions SQL utilitaires
-- 4. 004c_add_track_id_to_modules.sql  - Ajout track_id aux modules
-- 5. 004d_migrate_roles.sql            - Migration des rôles existants
--
-- ⚠️ À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================

-- Vérification préalable
SELECT '🚀 Démarrage migration multi-filières...' AS status;

-- ============================================
-- ÉTAPE 1: Table tracks
-- ============================================
\echo '📋 Étape 1: Création table tracks...'

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  label_short TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'pi pi-briefcase',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tracks (id, label, label_short, description, color, icon, display_order, is_active)
VALUES 
  ('SI', 'Soins Infirmiers', 'SI', 'Filière Bachelor en Soins Infirmiers', '#3b82f6', 'pi pi-heart', 1, true),
  ('PHY', 'Physiothérapie', 'PHY', 'Filière Bachelor en Physiothérapie', '#10b981', 'pi pi-user', 2, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  updated_at = NOW();

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tracks visible par tous" ON tracks;
CREATE POLICY "Tracks visible par tous" ON tracks FOR SELECT USING (true);

SELECT '✅ Table tracks créée' AS status;

-- ============================================
-- ÉTAPE 2: Enum et table user_track_roles
-- ============================================
\echo '📋 Étape 2: Création table user_track_roles...'

DO $$ BEGIN
  CREATE TYPE track_role AS ENUM (
    'SUPER_ADMIN', 'SECRETARIAT', 'RF', 'ADMIN', 'RM', 'TEACHER', 'STUDENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_track_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,
  role track_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_track_roles_user ON user_track_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_track ON user_track_roles(track_id);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_active ON user_track_roles(user_id, is_active);

ALTER TABLE user_track_roles ENABLE ROW LEVEL SECURITY;

SELECT '✅ Table user_track_roles créée' AS status;

-- ============================================
-- ÉTAPE 3: Fonctions utilitaires
-- ============================================
\echo '📋 Étape 3: Création fonctions RBAC...'

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_super_admin()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (role IN ('admin', 'super.all')
      OR (permissions IS NOT NULL AND permissions ? 'admin')
      OR (permissions IS NOT NULL AND permissions ? 'super.all'))
  );
$$;

CREATE OR REPLACE FUNCTION has_track_role(p_track_id TEXT, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role::TEXT = p_role
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION can_access_track(p_track_id TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_super_admin()
  OR EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION api_my_track_roles()
RETURNS TABLE(track_id TEXT, track_label TEXT, track_color TEXT, role TEXT, granted_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT utr.track_id, t.label, t.color, utr.role::TEXT, utr.granted_at
  FROM user_track_roles utr
  LEFT JOIN tracks t ON t.id = utr.track_id
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
  ORDER BY t.display_order, utr.role;
$$;

SELECT '✅ Fonctions RBAC créées' AS status;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================
SELECT '🎉 Migration multi-filières terminée!' AS status;
SELECT 'Tables créées: tracks, user_track_roles' AS info;
SELECT 'Fonctions: is_super_admin(), is_global_admin(), has_track_role(), can_access_track(), api_my_track_roles()' AS fonctions;
