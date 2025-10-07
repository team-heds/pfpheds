-- ================================================
-- VOIR TOUT SIMPLEMENT (sans erreur de colonnes)
-- ================================================

-- 1. Structure badges
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'badges' 
ORDER BY ordinal_position;

-- 2. Structure challenges
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenges' 
ORDER BY ordinal_position;

-- 3. Structure quests
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quests' 
ORDER BY ordinal_position;

-- 4. Voir TOUTES les données badges
SELECT * FROM badges;

-- 5. Voir TOUTES les données challenges
SELECT * FROM challenges;

-- 6. Voir TOUTES les données quests
SELECT * FROM quests;

-- 7. Compter tout
SELECT 
  (SELECT COUNT(*) FROM badges) as nb_badges,
  (SELECT COUNT(*) FROM challenges) as nb_challenges,
  (SELECT COUNT(*) FROM quests) as nb_quests;
