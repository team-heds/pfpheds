-- Script pour créer le système de rôles gamification et attribuer le rôle Game Master
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table user_roles si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role_name text NOT NULL,
  role_display_name text NOT NULL,
  role_description text,
  permissions jsonb DEFAULT '{}',
  badge_color text DEFAULT '#FFD700',
  badge_icon text DEFAULT 'pi pi-crown',
  is_active boolean DEFAULT true,
  granted_by uuid,
  granted_at timestamptz DEFAULT NOW(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id, role_name),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- 3. Activer RLS sur la table user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Game masters can view all roles" ON user_roles;
CREATE POLICY "Game masters can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_name = 'game_master' 
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Game masters can manage roles" ON user_roles;
CREATE POLICY "Game masters can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_name = 'game_master' 
      AND ur.is_active = true
    )
  );

-- 5. Attribuer le rôle Game Master à Antoine (remplace par ton user_id)
-- Note: Tu devras remplacer 'TON_USER_ID_ICI' par ton vrai user_id Supabase
INSERT INTO user_roles (
  user_id,
  role_name,
  role_display_name,
  role_description,
  permissions,
  badge_color,
  badge_icon
) VALUES (
  -- Remplace par ton user_id Supabase (tu peux le trouver dans auth.users)
  (SELECT id FROM auth.users WHERE email = 'antoine.quarroz@hevs.ch' LIMIT 1),
  'game_master',
  'Maître du Jeu',
  'Responsable de la gamification et des systèmes de jeu de la plateforme HEdS',
  '{
    "gamification": {
      "manage_houses": true,
      "manage_challenges": true,
      "manage_quests": true,
      "manage_badges": true,
      "view_analytics": true,
      "moderate_content": true,
      "assign_roles": true,
      "rebalance_houses": true
    },
    "admin": {
      "view_all_users": true,
      "manage_gamification_data": true,
      "access_debug_tools": true
    }
  }',
  '#8B5CF6',
  'pi pi-crown'
) ON CONFLICT (user_id, role_name) DO UPDATE SET
  role_display_name = EXCLUDED.role_display_name,
  role_description = EXCLUDED.role_description,
  permissions = EXCLUDED.permissions,
  badge_color = EXCLUDED.badge_color,
  badge_icon = EXCLUDED.badge_icon,
  updated_at = NOW();

-- 6. Créer d'autres rôles gamification utiles
INSERT INTO user_roles (
  user_id,
  role_name,
  role_display_name,
  role_description,
  permissions,
  badge_color,
  badge_icon
) VALUES 
-- Rôle House Coach (pour les responsables de maison)
(
  (SELECT id FROM auth.users WHERE email = 'antoine.quarroz@hevs.ch' LIMIT 1),
  'house_coach',
  'Coach de Maison',
  'Responsable d\'une maison spécifique dans le système gamification',
  '{
    "gamification": {
      "manage_house_members": true,
      "create_house_challenges": true,
      "view_house_analytics": true,
      "moderate_house_content": true
    }
  }',
  '#10B981',
  'pi pi-home'
),
-- Rôle Quest Creator (pour créer des quêtes)
(
  (SELECT id FROM auth.users WHERE email = 'antoine.quarroz@hevs.ch' LIMIT 1),
  'quest_creator',
  'Créateur de Quêtes',
  'Peut créer et gérer des quêtes pour les étudiants',
  '{
    "gamification": {
      "create_quests": true,
      "manage_own_quests": true,
      "view_quest_analytics": true
    }
  }',
  '#F59E0B',
  'pi pi-map'
) ON CONFLICT (user_id, role_name) DO NOTHING;

-- 7. Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_permission(
  user_uuid uuid,
  permission_path text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_permission boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND (ur.permissions #>> string_to_array(permission_path, '.'))::boolean = true
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;

-- 8. Fonction pour obtenir tous les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid uuid)
RETURNS TABLE (
  role_name text,
  role_display_name text,
  role_description text,
  badge_color text,
  badge_icon text,
  permissions jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.role_name,
    ur.role_display_name,
    ur.role_description,
    ur.badge_color,
    ur.badge_icon,
    ur.permissions
  FROM user_roles ur
  WHERE ur.user_id = user_uuid
  AND ur.is_active = true
  ORDER BY ur.created_at ASC;
$$;

-- 9. Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(uuid) TO anon;

-- 10. Vérification finale - Afficher les rôles créés
SELECT 
  ur.role_display_name,
  ur.role_description,
  ur.badge_color,
  ur.badge_icon,
  u.email
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.is_active = true
ORDER BY ur.created_at;
