-- =====================================================
-- AJOUT DE LA COLONNE PERMISSIONS À USER_PROFILES
-- =====================================================
-- Description: Ajoute une colonne permissions (type text[]) pour gérer les permissions utilisateurs
-- Version: 1.0
-- Date: 2025-10-30

-- Ajouter la colonne permissions si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN permissions TEXT[] DEFAULT '{}';
    
    RAISE NOTICE 'Colonne permissions ajoutée à user_profiles';
  ELSE
    RAISE NOTICE 'Colonne permissions existe déjà';
  END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes sur les permissions
CREATE INDEX IF NOT EXISTS idx_user_profiles_permissions 
ON public.user_profiles USING GIN (permissions);

-- =====================================================
-- FONCTION RPC : Mettre à jour les permissions utilisateur
-- =====================================================
-- Cette fonction permet aux admins de mettre à jour les permissions
-- à la fois dans user_profiles ET dans auth.users metadata

CREATE OR REPLACE FUNCTION public.update_user_permissions(
  target_user_id TEXT,
  new_permissions TEXT[]
)
RETURNS JSON AS $$
DECLARE
  calling_user_id TEXT;
  calling_user_role TEXT;
  result JSON;
BEGIN
  -- Récupérer l'ID de l'utilisateur qui fait l'appel
  calling_user_id := auth.uid()::text;
  
  -- Vérifier que l'utilisateur est connecté
  IF calling_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non authentifié'
    );
  END IF;
  
  -- Récupérer le rôle de l'utilisateur qui fait l'appel
  SELECT role INTO calling_user_role 
  FROM public.user_profiles 
  WHERE user_id = calling_user_id;
  
  -- Vérifier que l'utilisateur a les permissions d'admin
  IF calling_user_role NOT IN ('admin', 'AdminSoins', 'AdminPhysio') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permissions insuffisantes'
    );
  END IF;
  
  -- Mettre à jour les permissions dans user_profiles
  UPDATE public.user_profiles
  SET 
    permissions = new_permissions,
    updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Vérifier que la mise à jour a fonctionné
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
  -- Mettre à jour les métadonnées dans auth.users
  -- Note: Cela nécessite des privilèges SECURITY DEFINER
  BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('permissions', to_jsonb(new_permissions))
    WHERE id::text = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Impossible de mettre à jour auth.users metadata: %', SQLERRM;
  END;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Permissions mises à jour avec succès',
    'user_id', target_user_id,
    'permissions', new_permissions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION RPC : Récupérer les permissions utilisateur
-- =====================================================
-- Cette fonction récupère les permissions d'un utilisateur

CREATE OR REPLACE FUNCTION public.get_user_permissions(uid TEXT)
RETURNS TEXT[] AS $$
DECLARE
  user_permissions TEXT[];
BEGIN
  -- D'abord essayer de récupérer depuis user_profiles
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = uid;
  
  -- Si trouvé, retourner
  IF user_permissions IS NOT NULL THEN
    RETURN user_permissions;
  END IF;
  
  -- Sinon, essayer depuis auth.users metadata
  BEGIN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        (raw_app_meta_data->'permissions')::jsonb
      )
    ) INTO user_permissions
    FROM auth.users
    WHERE id::text = uid;
    
    RETURN COALESCE(user_permissions, '{}');
  EXCEPTION WHEN OTHERS THEN
    RETURN '{}';
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Vérifier si un utilisateur a une permission
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_uid TEXT,
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions TEXT[];
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = user_uid;
  
  RETURN required_permission = ANY(COALESCE(user_permissions, '{}'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLITIQUE RLS : Permettre aux admins de modifier les permissions
-- =====================================================

-- Politique : Les admins peuvent mettre à jour les profils (incluant permissions)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()::text
        AND role IN ('admin', 'AdminSoins', 'AdminPhysio')
    )
  );

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Système de permissions créé avec succès';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Modifications:';
  RAISE NOTICE '  - Colonne permissions ajoutée à user_profiles';
  RAISE NOTICE '  - Index GIN créé pour les permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions RPC créées:';
  RAISE NOTICE '  - update_user_permissions() : MAJ des permissions';
  RAISE NOTICE '  - get_user_permissions() : Récupérer les permissions';
  RAISE NOTICE '  - user_has_permission() : Vérifier une permission';
  RAISE NOTICE '';
  RAISE NOTICE 'Politiques RLS:';
  RAISE NOTICE '  - Les admins peuvent modifier tous les profils';
  RAISE NOTICE '========================================';
END $$;
