-- ================================================
-- VÉRIFIER LA STRUCTURE DES TABLES
-- ================================================

-- 1. Structure de gamification_data
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'gamification_data'
ORDER BY ordinal_position;

-- 2. Structure de houses
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'houses'
ORDER BY ordinal_position;

-- 3. Voir un exemple de données gamification_data
SELECT * FROM gamification_data LIMIT 3;

-- 4. Voir toutes les maisons
SELECT * FROM houses;

-- 5. IDENTIFIER comment lier gamification_data et houses
-- Essai 1 : Si la colonne s'appelle house_id
SELECT 
  g.user_id,
  g.total_xp,
  g.house_id,
  h.name as house_name
FROM gamification_data g
LEFT JOIN houses h ON g.house_id = h.id
LIMIT 5;

-- Si erreur "house_id does not exist", essaie :
-- Essai 2 : Si la colonne s'appelle house_name
SELECT 
  g.user_id,
  g.total_xp,
  g.house_name,
  h.name as house_name_from_table
FROM gamification_data g
LEFT JOIN houses h ON LOWER(g.house_name) = h.name
LIMIT 5;

-- Si erreur encore, essaie :
-- Essai 3 : Lister toutes les colonnes qui contiennent "house" ou "maison"
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('gamification_data', 'houses')
  AND (column_name ILIKE '%house%' OR column_name ILIKE '%maison%');
