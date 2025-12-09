-- =====================================================
-- INSTALLATION COMPLÈTE DES FONCTIONS ADMIN
-- =====================================================
-- Exécute ce script dans Supabase Dashboard > SQL Editor
-- Il va créer toutes les fonctions nécessaires pour la gestion des utilisateurs

-- =====================================================
-- 1. ACTIVER LES EXTENSIONS NÉCESSAIRES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. FONCTION DE CRÉATION D'UTILISATEUR (ADMIN)
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_forname TEXT DEFAULT '',
  user_family_name TEXT DEFAULT '',
  user_role TEXT DEFAULT 'student'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Vérifier que l'utilisateur courant est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid()::text 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can create users';
  END IF;

  -- Générer un nouvel UUID
  new_user_id := uuid_generate_v4();

  -- Insérer dans auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object(
      'forname', user_forname,
      'family_name', user_family_name,
      'role', user_role
    ),
    FALSE,
    'authenticated',
    'authenticated'
  );

  -- Créer le profil utilisateur
  INSERT INTO public.user_profiles (
    user_id,
    email,
    forname,
    family_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id::text,
    user_email,
    user_forname,
    user_family_name,
    user_role,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Créer gamification_data si la table existe
  BEGIN
    INSERT INTO public.gamification_data (
      user_id,
      email,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id::text,
      user_email,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;

  -- Retourner le résultat
  result := json_build_object(
    'user_id', new_user_id,
    'email', user_email,
    'role', user_role,
    'success', true
  );

  RETURN result;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_create_user IS 
'Permet à un admin de créer un utilisateur sans se déconnecter. Vérifie que l''appelant est admin.';

-- =====================================================
-- 3. FONCTION DE SUPPRESSION D'UTILISATEUR (ADMIN)
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur courant est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid()::text 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can delete users';
  END IF;

  -- Supprimer de user_profiles
  DELETE FROM public.user_profiles WHERE public.user_profiles.user_id = delete_user.user_id::text;
  
  -- Supprimer de auth.users
  DELETE FROM auth.users WHERE id = delete_user.user_id;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.delete_user IS 
'Permet à un admin de supprimer complètement un utilisateur (auth + profil).';

-- =====================================================
-- 4. VÉRIFICATION DE L'INSTALLATION
-- =====================================================

-- Afficher les fonctions créées
SELECT 
    routine_name AS "Fonction",
    routine_type AS "Type",
    data_type AS "Retour"
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('admin_create_user', 'delete_user')
ORDER BY routine_name;

-- =====================================================
-- ✅ INSTALLATION TERMINÉE
-- =====================================================
-- Si vous voyez 2 lignes dans le résultat ci-dessus :
-- - admin_create_user
-- - delete_user
-- 
-- Alors l'installation est réussie ! 🎉
