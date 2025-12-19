-- ============================================
-- Migration 004: Création table USER_TRACK_ROLES
-- Date: 2024-12-17
-- Description: Gestion des rôles par filière (multi-casquettes)
-- ⚠️ IDEMPOTENT: peut être exécuté plusieurs fois
-- ============================================

-- Supprimer les anciennes fonctions si elles existent (pour éviter erreur de type)
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_global_admin();
DROP FUNCTION IF EXISTS has_track_role(TEXT, TEXT);
DROP FUNCTION IF EXISTS has_any_track_role(TEXT, TEXT[]);
DROP FUNCTION IF EXISTS get_user_tracks();
DROP FUNCTION IF EXISTS can_access_track(TEXT);
DROP FUNCTION IF EXISTS has_track_access_level(TEXT, TEXT);
DROP FUNCTION IF EXISTS api_my_track_roles();

-- Enum des rôles disponibles
DO $$ BEGIN
  CREATE TYPE track_role AS ENUM (
    'SUPER_ADMIN',      -- Tous les droits, toutes filières
    'SECRETARIAT',      -- Secrétariat (presque tous les droits sur sa filière)
    'RF',               -- Responsable Filière (vue d'ensemble)
    'ADMIN',            -- Admin filière
    'RM',               -- Responsable Module
    'TEACHER',          -- Enseignant
    'STUDENT'           -- Étudiant
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table des rôles utilisateur par filière
CREATE TABLE IF NOT EXISTS user_track_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,  -- NULL = rôle global (SUPER_ADMIN)
  role track_role NOT NULL,
  
  -- Métadonnées
  granted_by UUID REFERENCES auth.users(id),              -- Qui a accordé ce rôle
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                                  -- NULL = permanent
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: un user ne peut avoir qu'une fois le même rôle pour une filière
  UNIQUE(user_id, track_id, role)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_track_roles_user ON user_track_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_track ON user_track_roles(track_id);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_role ON user_track_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_active ON user_track_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_track_roles_user_active ON user_track_roles(user_id, is_active);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_track_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_track_roles_updated_at ON user_track_roles;
CREATE TRIGGER user_track_roles_updated_at
  BEFORE UPDATE ON user_track_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_track_roles_updated_at();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE user_track_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Voir ses propres rôles
DROP POLICY IF EXISTS "Users can view own roles" ON user_track_roles;
CREATE POLICY "Users can view own roles" ON user_track_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: SuperAdmin peut tout voir
DROP POLICY IF EXISTS "SuperAdmin can view all roles" ON user_track_roles;
CREATE POLICY "SuperAdmin can view all roles" ON user_track_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_track_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.role = 'SUPER_ADMIN'
      AND utr.is_active = true
      AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
    )
  );

-- Policy: Admin/Secrétariat peut voir les rôles de sa filière
DROP POLICY IF EXISTS "Admin can view track roles" ON user_track_roles;
CREATE POLICY "Admin can view track roles" ON user_track_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_track_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.track_id = user_track_roles.track_id
      AND utr.role IN ('ADMIN', 'SECRETARIAT', 'RF')
      AND utr.is_active = true
      AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
    )
  );

-- Policy: SuperAdmin peut modifier tous les rôles
DROP POLICY IF EXISTS "SuperAdmin can manage all roles" ON user_track_roles;
CREATE POLICY "SuperAdmin can manage all roles" ON user_track_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_track_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.role = 'SUPER_ADMIN'
      AND utr.is_active = true
      AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
    )
  );

-- Policy: Admin peut gérer les rôles de sa filière (sauf SUPER_ADMIN)
DROP POLICY IF EXISTS "Admin can manage track roles" ON user_track_roles;
CREATE POLICY "Admin can manage track roles" ON user_track_roles
  FOR ALL
  USING (
    user_track_roles.role != 'SUPER_ADMIN'
    AND EXISTS (
      SELECT 1 FROM user_track_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.track_id = user_track_roles.track_id
      AND utr.role IN ('ADMIN', 'SECRETARIAT')
      AND utr.is_active = true
      AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
    )
  );

-- Vérification
SELECT '✅ Table user_track_roles créée avec succès' AS status;
