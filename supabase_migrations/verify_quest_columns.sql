-- Script de vérification des colonnes de la table quests
-- Exécutez ce script dans Supabase SQL Editor pour voir quelles colonnes existent

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;

-- Résultat attendu : vous devriez voir toutes ces colonnes :
-- - start_date (timestamptz)
-- - end_date (timestamptz)
-- - icon (text)
-- - duration (integer)
-- - is_recurring (boolean)
-- - recurring_type (text)
-- - min_level (integer)
-- - max_level (integer)
-- - target_houses (text[])
