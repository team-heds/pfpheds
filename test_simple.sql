-- ================================================
-- TEST RAPIDE - Vérifie ce que tu as déjà
-- ================================================

-- 1. Liste tes tables de gamification
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%badge%' 
  OR table_name LIKE '%challenge%'
  OR table_name LIKE '%quest%'
  OR table_name = 'gamification_data'
  OR table_name = 'houses'
ORDER BY table_name;

-- 2. Compte le nombre de lignes
SELECT 
  (SELECT COUNT(*) FROM badges) as badges,
  (SELECT COUNT(*) FROM challenges) as challenges,
  (SELECT COUNT(*) FROM quests) as quests,
  (SELECT COUNT(*) FROM user_badges) as user_badges,
  (SELECT COUNT(*) FROM user_challenge_progress) as challenge_progress,
  (SELECT COUNT(*) FROM user_quest_progress) as quest_progress,
  (SELECT COUNT(*) FROM gamification_data) as gamif_data,
  (SELECT COUNT(*) FROM houses) as houses;

-- 3. Aperçu des badges (structure adaptée)
SELECT * FROM badges LIMIT 5;

-- 4. Aperçu des défis (structure adaptée)
SELECT * FROM challenges LIMIT 5;

-- 5. Aperçu des quêtes (structure adaptée)
SELECT * FROM quests LIMIT 5;

-- 6. Aperçu gamification_data
SELECT user_id, total_xp, current_level, login_streak 
FROM gamification_data 
LIMIT 3;

-- 7. Aperçu houses
SELECT name, total_points, level 
FROM houses;
