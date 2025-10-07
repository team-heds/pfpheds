-- ================================================
-- VÉRIFIER LA STRUCTURE EXACTE DE TES TABLES
-- ================================================

-- Structure de la table badges
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'badges'
ORDER BY ordinal_position;

-- Structure de la table challenges
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'challenges'
ORDER BY ordinal_position;

-- Structure de la table quests
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;

-- Structure de user_challenge_progress
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_challenge_progress'
ORDER BY ordinal_position;

-- Structure de user_quest_progress
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_quest_progress'
ORDER BY ordinal_position;
