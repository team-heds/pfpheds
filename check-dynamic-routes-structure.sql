-- Script pour vérifier la structure de la table dynamic_routes
-- Exécutez ceci d'abord pour voir toutes les colonnes

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'dynamic_routes'
ORDER BY ordinal_position;

-- Alternative: voir un exemple de route existante
-- SELECT * FROM dynamic_routes LIMIT 1;
