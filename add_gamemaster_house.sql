-- ================================================
-- AJOUTER MAISON "MAÎTRE DU JEU" POUR LES ADMINS
-- ================================================

-- 1. Voir les maisons actuelles
SELECT * FROM houses ORDER BY name;

-- 2. Ajouter la maison Maître du Jeu
INSERT INTO houses (id, name, color, motto, description, total_xp, member_count, level, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- UUID unique pour Game Master
  'gamemaster',                              -- Nom de la maison
  '#9333ea',                                 -- Couleur violette/pourpre (royale)
  'Voir tout, gérer tout',                   -- Devise
  'Maison spéciale réservée aux maîtres du jeu et administrateurs',
  0,                                         -- XP initial
  0,                                         -- Membres initial
  1,                                         -- Niveau initial
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  motto = EXCLUDED.motto,
  description = EXCLUDED.description;

-- 3. Vérifier que la maison est créée
SELECT 
  id,
  name,
  color,
  motto,
  level,
  total_xp,
  member_count
FROM houses
ORDER BY 
  CASE name
    WHEN 'gamemaster' THEN 0  -- Game Master en premier
    ELSE 1
  END,
  name;

-- 4. Trouver ton user_id
SELECT user_id, email, total_xp, current_level 
FROM gamification_data 
WHERE email LIKE '%antoine%'
ORDER BY email;

-- 5. T'assigner à Game Master + Niveau 20 + XP max
-- ⚠️ REMPLACE 'TON-USER-ID' par ton vrai user_id ci-dessus
UPDATE gamification_data
SET 
  house_id = '550e8400-e29b-41d4-a716-446655440000',
  total_xp = 40000,          -- XP pour niveau 20 (20² × 100)
  current_level = 20          -- Niveau 20 direct
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';  -- ← REMPLACE ICI

-- 6. Mettre la maison Game Master au niveau max (10)
UPDATE houses
SET 
  total_xp = 1000000,         -- 1 million XP (largement niveau 10)
  member_count = 1,           -- Toi comme membre
  level = 10                  -- Niveau 10 (max)
WHERE name = 'gamemaster';

-- 5. Statistiques finales
SELECT 
  'Total Maisons' as stat,
  COUNT(*)::TEXT as valeur
FROM houses

UNION ALL

SELECT 
  'Maisons Normales' as stat,
  COUNT(*)::TEXT as valeur
FROM houses
WHERE name != 'gamemaster'

UNION ALL

SELECT 
  'Maison Admin' as stat,
  COUNT(*)::TEXT as valeur
FROM houses
WHERE name = 'gamemaster';

-- 7. Vérification finale : Ton compte
SELECT 
  g.user_id,
  g.email,
  g.total_xp,
  g.current_level,
  h.name as maison,
  h.level as niveau_maison,
  h.color,
  CASE
    WHEN g.current_level = 20 AND h.name = 'gamemaster' THEN '✅ PARFAIT - Niveau 20 & Game Master !'
    WHEN g.current_level = 20 THEN '⚠️ Niveau 20 OK mais pas Game Master'
    WHEN h.name = 'gamemaster' THEN '⚠️ Game Master OK mais pas niveau 20'
    ELSE '❌ Pas encore configuré'
  END as statut
FROM gamification_data g
JOIN houses h ON g.house_id = h.id
WHERE g.email LIKE '%antoine%';

-- 8. Vérification maison Game Master
SELECT 
  name as maison,
  total_xp,
  level,
  member_count,
  color,
  CASE
    WHEN level = 10 AND total_xp >= 810000 THEN '✅ Niveau MAX atteint !'
    ELSE '⚠️ Niveau ' || level || ' - XP: ' || total_xp
  END as statut
FROM houses
WHERE name = 'gamemaster';

SELECT '🎮 ✅ CONFIGURATION GAME MASTER TERMINÉE !' as status;
