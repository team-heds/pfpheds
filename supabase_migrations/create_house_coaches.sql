-- Migration : Créer les 4 coachs de maison (house_coach)
-- Date: 2025-10-08
-- Description: Créer les profils user_profiles, gamification_data et user_roles pour les 4 coachs

-- ========================================
-- COACH 1 : Elaris (Maison rouge)
-- ========================================

-- Remplace ces valeurs par les vraies informations du coach :
-- UUID : génère un UUID depuis Supabase Auth ou utilise un UUID existant
-- Email : email du coach
-- Forname : prénom du coach
-- Family_name : nom du coach

DO $$
DECLARE
  coach1_id UUID := 'aaf2059f-f489-4605-9557-d1c121802631'; -- ⚠️ REMPLACER PAR LE VRAI UUID
  coach1_email TEXT := 'benoit.bontempe@hes-so.ch'; -- ⚠️ REMPLACER
  coach1_forname TEXT := 'Benoît'; -- ⚠️ REMPLACER
  coach1_family_name TEXT := 'Bontempelli'; -- ⚠️ REMPLACER
  harmonis_id UUID;
BEGIN
  -- Récupérer l'ID de la maison Harmonis
  SELECT id INTO harmonis_id FROM houses WHERE LOWER(name) = 'elaris';
  
  -- Créer le profil user_profiles
  INSERT INTO user_profiles (
    user_id,
    email,
    forname,
    family_name,
    display_name,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    coach1_id,
    coach1_email,
    coach1_forname,
    coach1_family_name,
    coach1_family_name || ' ' || coach1_forname,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    forname = EXCLUDED.forname,
    family_name = EXCLUDED.family_name,
    updated_at = NOW();
  
  -- Créer les données gamification_data
  INSERT INTO gamification_data (
    user_id,
    email,
    house_id,
    house_name,
    current_level,
    total_xp,
    login_streak,
    last_login,
    created_at,
    updated_at
  ) VALUES (
    coach1_id,
    coach1_email,
    harmonis_id,
    'harmonis',
    5, -- Niveau de départ pour un coach
    1000, -- XP de départ
    0,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    house_id = EXCLUDED.house_id,
    house_name = EXCLUDED.house_name,
    updated_at = NOW();
  
  -- Assigner le rôle house_coach
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (coach1_id, 'house_coach', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Coach Harmonis créé: % %', coach1_forname, coach1_family_name;
END $$;

-- ========================================
-- COACH 2 : ELARIS (Maison rouge)
-- ========================================

DO $$
DECLARE
  coach2_id UUID := '00000000-0000-0000-0000-000000000002'; -- ⚠️ REMPLACER PAR LE VRAI UUID
  coach2_email TEXT := 'coach.elaris@hevs.ch'; -- ⚠️ REMPLACER
  coach2_forname TEXT := 'Marie'; -- ⚠️ REMPLACER
  coach2_family_name TEXT := 'Martin'; -- ⚠️ REMPLACER
  elaris_id UUID;
BEGIN
  SELECT id INTO elaris_id FROM houses WHERE LOWER(name) = 'elaris';
  
  INSERT INTO user_profiles (user_id, email, forname, family_name, display_name, is_active, created_at, updated_at)
  VALUES (coach2_id, coach2_email, coach2_forname, coach2_family_name, coach2_family_name || ' ' || coach2_forname, true, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, forname = EXCLUDED.forname, family_name = EXCLUDED.family_name, updated_at = NOW();
  
  INSERT INTO gamification_data (user_id, email, house_id, house_name, current_level, total_xp, login_streak, last_login, created_at, updated_at)
  VALUES (coach2_id, coach2_email, elaris_id, 'elaris', 5, 1000, 0, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET house_id = EXCLUDED.house_id, house_name = EXCLUDED.house_name, updated_at = NOW();
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (coach2_id, 'house_coach', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Coach Elaris créé: % %', coach2_forname, coach2_family_name;
END $$;

-- ========================================
-- COACH 3 : DOLORIS (Maison jaune)
-- ========================================

DO $$
DECLARE
  coach3_id UUID := '00000000-0000-0000-0000-000000000003'; -- ⚠️ REMPLACER PAR LE VRAI UUID
  coach3_email TEXT := 'coach.doloris@hevs.ch'; -- ⚠️ REMPLACER
  coach3_forname TEXT := 'Pierre'; -- ⚠️ REMPLACER
  coach3_family_name TEXT := 'Bernard'; -- ⚠️ REMPLACER
  doloris_id UUID;
BEGIN
  SELECT id INTO doloris_id FROM houses WHERE LOWER(name) = 'doloris';
  
  INSERT INTO user_profiles (user_id, email, forname, family_name, display_name, is_active, created_at, updated_at)
  VALUES (coach3_id, coach3_email, coach3_forname, coach3_family_name, coach3_family_name || ' ' || coach3_forname, true, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, forname = EXCLUDED.forname, family_name = EXCLUDED.family_name, updated_at = NOW();
  
  INSERT INTO gamification_data (user_id, email, house_id, house_name, current_level, total_xp, login_streak, last_login, created_at, updated_at)
  VALUES (coach3_id, coach3_email, doloris_id, 'doloris', 5, 1000, 0, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET house_id = EXCLUDED.house_id, house_name = EXCLUDED.house_name, updated_at = NOW();
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (coach3_id, 'house_coach', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Coach Doloris créé: % %', coach3_forname, coach3_family_name;
END $$;

-- ========================================
-- COACH 4 : SOLENCIA (Maison bleue)
-- ========================================

DO $$
DECLARE
  coach4_id UUID := '00000000-0000-0000-0000-000000000004'; -- ⚠️ REMPLACER PAR LE VRAI UUID
  coach4_email TEXT := 'coach.solencia@hevs.ch'; -- ⚠️ REMPLACER
  coach4_forname TEXT := 'Sophie'; -- ⚠️ REMPLACER
  coach4_family_name TEXT := 'Dubois'; -- ⚠️ REMPLACER
  solencia_id UUID;
BEGIN
  SELECT id INTO solencia_id FROM houses WHERE LOWER(name) = 'solencia';
  
  INSERT INTO user_profiles (user_id, email, forname, family_name, display_name, is_active, created_at, updated_at)
  VALUES (coach4_id, coach4_email, coach4_forname, coach4_family_name, coach4_family_name || ' ' || coach4_forname, true, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, forname = EXCLUDED.forname, family_name = EXCLUDED.family_name, updated_at = NOW();
  
  INSERT INTO gamification_data (user_id, email, house_id, house_name, current_level, total_xp, login_streak, last_login, created_at, updated_at)
  VALUES (coach4_id, coach4_email, solencia_id, 'solencia', 5, 1000, 0, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET house_id = EXCLUDED.house_id, house_name = EXCLUDED.house_name, updated_at = NOW();
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (coach4_id, 'house_coach', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Coach Solencia créé: % %', coach4_forname, coach4_family_name;
END $$;

-- ========================================
-- VÉRIFICATION ET RÉSUMÉ
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RÉSUMÉ DES COACHS CRÉÉS';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  up.forname || ' ' || up.family_name as "Nom complet",
  up.email as "Email",
  gd.house_name as "Maison",
  ur.role as "Rôle",
  gd.current_level as "Niveau",
  gd.total_xp as "XP"
FROM user_profiles up
JOIN gamification_data gd ON up.user_id = gd.user_id
JOIN user_roles ur ON up.user_id = ur.user_id
WHERE ur.role = 'house_coach'
ORDER BY gd.house_name;
