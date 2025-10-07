-- ================================================
-- ULTRA SIMPLE - Juste compter et voir
-- ================================================

-- 1. Combien de lignes ?
SELECT 'badges' as table_name, COUNT(*) as nombre FROM badges
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'quests', COUNT(*) FROM quests
UNION ALL
SELECT 'user_badges', COUNT(*) FROM user_badges
UNION ALL
SELECT 'user_challenge_progress', COUNT(*) FROM user_challenge_progress
UNION ALL
SELECT 'user_quest_progress', COUNT(*) FROM user_quest_progress
UNION ALL
SELECT 'gamification_data', COUNT(*) FROM gamification_data
UNION ALL
SELECT 'houses', COUNT(*) FROM houses;

-- 2. Voir colonnes de badges
SELECT column_name FROM information_schema.columns WHERE table_name = 'badges';

-- 3. Voir colonnes de challenges  
SELECT column_name FROM information_schema.columns WHERE table_name = 'challenges';

-- 4. Voir colonnes de quests
SELECT column_name FROM information_schema.columns WHERE table_name = 'quests';

-- 5. Voir colonnes de gamification_data
SELECT column_name FROM information_schema.columns WHERE table_name = 'gamification_data';

-- 6. Tout voir badges
SELECT * FROM badges LIMIT 3;

-- 7. Tout voir challenges
SELECT * FROM challenges LIMIT 3;

-- 8. Tout voir quests
SELECT * FROM quests LIMIT 3;

-- 9. Tout voir gamification_data
SELECT * FROM gamification_data LIMIT 3;

-- 10. Tout voir houses
SELECT * FROM houses;
