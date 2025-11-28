-- Force reload des fonctions de permissions
-- Exécutez ceci si vous obtenez l'erreur PGRST202

-- 1. Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Recréer la fonction update_user_permissions (au cas où)
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

-- 3. Vérifier que la fonction est bien créée
SELECT 
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_user_permissions';

-- 4. Recharger une dernière fois
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction update_user_permissions recréée et cache rechargé';
  RAISE NOTICE '⏳ Attendez 30 secondes puis testez à nouveau dans l application';
END $$;
