-- =====================================================
-- FONCTION RPC : api_my_permissions
-- =====================================================
-- Description: Récupère toutes les permissions de l'utilisateur connecté
-- Version: 1.0
-- Date: 2025-12-11

-- Cette fonction retourne les permissions de l'utilisateur connecté
-- Elle combine le rôle et les permissions explicites depuis user_profiles

CREATE OR REPLACE FUNCTION public.api_my_permissions()
RETURNS TABLE(perm TEXT) AS $$
DECLARE
  current_user_id TEXT;
  user_role TEXT;
  user_permissions TEXT[];
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  current_user_id := auth.uid()::text;
  
  -- Si pas d'utilisateur connecté, retourner vide
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Récupérer le rôle et les permissions depuis user_profiles
  SELECT up.role, up.permissions 
  INTO user_role, user_permissions
  FROM public.user_profiles up
  WHERE up.user_id = current_user_id;
  
  -- Retourner le rôle comme permission (ex: 'admin')
  IF user_role IS NOT NULL THEN
    RETURN QUERY SELECT user_role::TEXT;
  END IF;
  
  -- Retourner toutes les permissions explicites du tableau
  IF user_permissions IS NOT NULL THEN
    RETURN QUERY SELECT UNNEST(user_permissions);
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS DE LA FONCTION
-- =====================================================

-- Tester pour l'utilisateur connecté
-- SELECT * FROM public.api_my_permissions();

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Permettre à tous les utilisateurs authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.api_my_permissions() TO authenticated;

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Fonction api_my_permissions créée';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Description:';
  RAISE NOTICE '  - Récupère les permissions de l''utilisateur connecté';
  RAISE NOTICE '  - Combine le rôle et les permissions explicites';
  RAISE NOTICE '  - Accessible par tous les utilisateurs authentifiés';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT * FROM api_my_permissions();';
  RAISE NOTICE '========================================';
END $$;
