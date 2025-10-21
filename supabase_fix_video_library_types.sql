-- =====================================================
-- SCRIPT DE CORRECTION DES TYPES video_library
-- À exécuter si la table existe déjà avec les mauvais types
-- =====================================================

-- Option 1 : Supprimer et recréer la table (ATTENTION : perte de données)
-- DROP TABLE IF EXISTS video_library CASCADE;

-- Option 2 : Modifier les types des colonnes existantes (RECOMMANDÉ)
-- Modifier module_id de UUID vers INTEGER
ALTER TABLE video_library 
  ALTER COLUMN module_id TYPE INTEGER USING module_id::TEXT::INTEGER;

-- Modifier year_id de UUID vers INTEGER  
ALTER TABLE video_library 
  ALTER COLUMN year_id TYPE INTEGER USING year_id::TEXT::INTEGER;

-- Si les colonnes n'existent pas encore, les ajouter
-- ALTER TABLE video_library ADD COLUMN IF NOT EXISTS module_id INTEGER;
-- ALTER TABLE video_library ADD COLUMN IF NOT EXISTS year_id INTEGER;

-- Vérifier les types
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'video_library' 
  AND column_name IN ('module_id', 'year_id', 'ticket_id', 'id');

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
