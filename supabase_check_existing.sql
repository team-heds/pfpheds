-- ================================================
-- VÉRIFICATION DES TABLES EXISTANTES
-- Exécute ce script pour voir ce que tu as déjà
-- ================================================

-- 1. Lister toutes les tables de gamification
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'badges',
    'user_badges',
    'challenges',
    'user_challenges',
    'quests',
    'user_quests',
    'houses',
    'gamification_data',
    'notifications',
    'gamification_logs'
  )
ORDER BY table_name;

-- 2. Compter les données dans chaque table
DO $$
DECLARE
  table_record RECORD;
  query TEXT;
  result_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOMBRE DE LIGNES PAR TABLE';
  RAISE NOTICE '========================================';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'badges', 'user_badges', 'challenges', 'user_challenges',
        'quests', 'user_quests', 'houses', 'gamification_data',
        'notifications', 'gamification_logs'
      )
  LOOP
    query := format('SELECT COUNT(*) FROM %I', table_record.table_name);
    EXECUTE query INTO result_count;
    RAISE NOTICE '% : % lignes', 
      RPAD(table_record.table_name, 25), 
      result_count;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- 3. Structure de gamification_data (si existe)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gamification_data'
ORDER BY ordinal_position;

-- 4. Structure de houses (si existe)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'houses'
ORDER BY ordinal_position;

-- 5. Vérifier les index existants
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'badges', 'user_badges', 'challenges', 'user_challenges',
  'quests', 'user_quests', 'houses', 'gamification_data'
)
ORDER BY tablename, indexname;

-- 6. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'badges', 'user_badges', 'challenges', 'user_challenges',
  'quests', 'user_quests', 'houses', 'gamification_data'
)
ORDER BY tablename, policyname;

-- 7. Vérifier les triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN (
  'badges', 'user_badges', 'challenges', 'user_challenges',
  'quests', 'user_quests', 'houses', 'gamification_data'
)
ORDER BY event_object_table, trigger_name;

-- 8. Aperçu des données gamification_data (5 premiers)
SELECT 
  user_id,
  total_xp,
  current_level,
  login_streak
FROM gamification_data
LIMIT 5;

-- 9. Aperçu des données houses (toutes)
SELECT 
  name,
  total_points,
  level
FROM houses
ORDER BY name;

SELECT '✅ Vérification terminée !' as status;
