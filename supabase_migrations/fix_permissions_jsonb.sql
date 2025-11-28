-- =====================================================
-- FIX : Adapter les fonctions pour le type JSONB
-- =====================================================
-- La colonne permissions existe déjà en type JSONB
-- On adapte les fonctions pour gérer ce type

-- 1. Fonction update_user_permissions (version JSONB)
CREATE OR REPLACE FUNCTION public.update_user_permissions(
  target_user_id TEXT,
  new_permissions TEXT[]
)
RETURNS JSON AS $$
DECLARE
  calling_user_id TEXT;
  calling_user_role TEXT;
  permissions_jsonb JSONB;
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
  
  -- Convertir TEXT[] en JSONB
  permissions_jsonb := to_jsonb(new_permissions);
  
  -- Mettre à jour les permissions dans user_profiles (JSONB)
  UPDATE public.user_profiles
  SET 
    permissions = permissions_jsonb,
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
      jsonb_build_object('permissions', permissions_jsonb)
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

-- 2. Fonction get_user_permissions (version JSONB)
CREATE OR REPLACE FUNCTION public.get_user_permissions(uid TEXT)
RETURNS TEXT[] AS $$
DECLARE
  user_permissions JSONB;
  permissions_array TEXT[];
BEGIN
  -- D'abord essayer de récupérer depuis user_profiles
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = uid;
  
  -- Si trouvé et non null, convertir JSONB en TEXT[]
  IF user_permissions IS NOT NULL THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(user_permissions)
    ) INTO permissions_array;
    RETURN permissions_array;
  END IF;
  
  -- Sinon, essayer depuis auth.users metadata
  BEGIN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        (raw_app_meta_data->'permissions')::jsonb
      )
    ) INTO permissions_array
    FROM auth.users
    WHERE id::text = uid;
    
    RETURN COALESCE(permissions_array, '{}');
  EXCEPTION WHEN OTHERS THEN
    RETURN '{}';
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction user_has_permission (version JSONB)
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_uid TEXT,
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = user_uid;
  
  -- Vérifier si la permission existe dans le tableau JSONB
  IF user_permissions IS NOT NULL THEN
    RETURN user_permissions ? required_permission;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. S'assurer que la colonne permissions existe et est de type JSONB
DO $$ 
BEGIN
  -- Vérifier si la colonne existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'permissions'
  ) THEN
    -- Créer la colonne en JSONB
    ALTER TABLE public.user_profiles 
    ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Colonne permissions (JSONB) ajoutée à user_profiles';
  ELSE
    -- Vérifier le type actuel
    DECLARE
      col_type TEXT;
    BEGIN
      SELECT data_type INTO col_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'permissions';
      
      RAISE NOTICE 'Colonne permissions existe déjà (type: %)', col_type;
      
      -- Si c'est TEXT[], convertir en JSONB
      IF col_type = 'ARRAY' THEN
        RAISE NOTICE 'Conversion de TEXT[] vers JSONB...';
        ALTER TABLE public.user_profiles 
        ALTER COLUMN permissions TYPE JSONB 
        USING to_jsonb(permissions);
        RAISE NOTICE '✅ Colonne convertie en JSONB';
      END IF;
    END;
  END IF;
END $$;

-- 5. Créer un index GIN pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_permissions 
ON public.user_profiles USING GIN (permissions);

-- 6. Politique RLS pour les admins
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

-- 7. Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 8. Vérifications finales
DO $$
DECLARE
  col_type TEXT;
  func_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Système de permissions (JSONB) configuré';
  RAISE NOTICE '========================================';
  
  -- Vérifier le type de colonne
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'permissions';
  RAISE NOTICE 'Type de colonne permissions: %', col_type;
  
  -- Compter les fonctions
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name LIKE '%permission%';
  RAISE NOTICE 'Fonctions RPC créées: %', func_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '⏳ Attendez 30 secondes puis testez dans l''application';
  RAISE NOTICE '========================================';
END $$;
