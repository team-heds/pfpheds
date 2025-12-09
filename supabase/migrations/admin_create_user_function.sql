-- =====================================================
-- FONCTION DE CRÉATION D'UTILISATEUR PAR ADMIN
-- =====================================================
-- Cette fonction permet à un admin de créer un utilisateur
-- SANS se déconnecter de son propre compte
-- Elle utilise les extensions Supabase pour créer l'auth

-- Activer l'extension nécessaire si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la fonction pour créer un utilisateur (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_forname TEXT DEFAULT '',
  user_family_name TEXT DEFAULT '',
  user_role TEXT DEFAULT 'student'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les privilèges du propriétaire
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

  -- Générer un nouvel UUID pour l'utilisateur
  new_user_id := uuid_generate_v4();

  -- Insérer dans auth.users (nécessite SECURITY DEFINER)
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
    '00000000-0000-0000-0000-000000000000', -- Instance ID par défaut
    user_email,
    crypt(user_password, gen_salt('bf')), -- Hasher le mot de passe avec bcrypt
    NOW(), -- Email confirmé immédiatement
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

  -- Créer le profil utilisateur (le trigger handle_new_user devrait le faire automatiquement)
  -- Mais on le fait manuellement pour être sûr
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
  ON CONFLICT (user_id) DO NOTHING; -- Si le trigger l'a déjà créé

  -- Créer les données de gamification si la table existe
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
    WHEN undefined_table THEN
      -- Table gamification_data n'existe pas, ignorer
      NULL;
  END;

  -- Retourner les informations du nouvel utilisateur
  result := json_build_object(
    'user_id', new_user_id,
    'email', user_email,
    'role', user_role,
    'success', true
  );

  RETURN result;
END;
$$;

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION public.admin_create_user IS 
'Permet à un admin de créer un nouvel utilisateur sans se déconnecter. Vérifie que l''appelant est admin.';

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================
-- 1. Exécutez ce script dans Supabase Dashboard > SQL Editor
-- 2. La fonction admin_create_user sera créée
-- 3. Le code Vue.js pourra l'appeler via :
--    supabase.rpc('admin_create_user', {
--      user_email: 'email@example.com',
--      user_password: 'password123',
--      user_forname: 'John',
--      user_family_name: 'Doe',
--      user_role: 'student'
--    })
-- 4. L'admin reste connecté à son propre compte
-- 5. Le nouvel utilisateur peut se connecter avec ses identifiants
