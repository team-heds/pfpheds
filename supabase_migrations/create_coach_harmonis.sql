-- Migration : Créer le coach de la maison Harmonis
-- Date: 2025-10-08
-- Description: Créer le profil user_profiles, gamification_data pour le coach Harmonis

-- ========================================
-- COACH HARMONIS (Maison verte)
-- ========================================

DO $$
DECLARE
  coach_id UUID := 'a9db2fd0-e640-406d-a2db-0bd2b9437608';
  coach_email TEXT := 'christophe.baur@hevs.ch';
  coach_forname TEXT := 'Christophe';
  coach_family_name TEXT := 'Baur';
  harmonis_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- ID de la maison Harmonis
BEGIN
  RAISE NOTICE 'Utilisation de la maison Harmonis: %', harmonis_id;
  
  -- Créer le profil user_profiles avec le rôle house_coach
  INSERT INTO user_profiles (
    user_id,
    email,
    forname,
    family_name,
    display_name,
    role,
    house_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    coach_id,
    coach_email,
    coach_forname,
    coach_family_name,
    coach_family_name || ' ' || coach_forname,
    'house_coach',
    harmonis_id,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    forname = EXCLUDED.forname,
    family_name = EXCLUDED.family_name,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    house_id = EXCLUDED.house_id,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Profil user_profiles créé avec rôle house_coach pour: % %', coach_forname, coach_family_name;
  
  -- Créer les données gamification_data
  INSERT INTO gamification_data (
    user_id,
    email,
    house_id,
    current_level,
    total_xp,
    created_at,
    updated_at
  ) VALUES (
    coach_id,
    coach_email,
    harmonis_id,
    20, -- Niveau de départ pour un coach
    0, -- XP de départ
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    house_id = EXCLUDED.house_id,
    current_level = EXCLUDED.current_level,
    total_xp = EXCLUDED.total_xp,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Données gamification_data créées';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Coach Harmonis créé avec succès!';
  RAISE NOTICE 'Nom: % %', coach_forname, coach_family_name;
  RAISE NOTICE 'Email: %', coach_email;
  RAISE NOTICE 'Rôle: house_coach';
  RAISE NOTICE 'Maison: Harmonis (verte)';
  RAISE NOTICE 'Niveau: 20 | XP: 0';
  RAISE NOTICE '========================================';
  
END $$;

-- Vérification finale
SELECT 
  up.user_id,
  up.forname || ' ' || up.family_name as "Nom complet",
  up.email as "Email",
  up.role as "Rôle",
  h.name as "Maison",
  gd.current_level as "Niveau",
  gd.total_xp as "XP"
FROM user_profiles up
LEFT JOIN gamification_data gd ON up.user_id = gd.user_id
LEFT JOIN houses h ON up.house_id = h.id
WHERE up.user_id = 'a9db2fd0-e640-406d-a2db-0bd2b9437608';
