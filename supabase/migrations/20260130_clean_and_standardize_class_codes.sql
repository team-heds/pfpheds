-- Migration pour nettoyer et standardiser la colonne class_codes
-- Date: 2026-01-30

-- 1. Créer une colonne d'archive pour sauvegarder les données originales
ALTER TABLE planning_time_slots
ADD COLUMN IF NOT EXISTS class_codes_archive text[] DEFAULT NULL;

-- 2. Archiver les données existantes avant nettoyage
UPDATE planning_time_slots
SET class_codes_archive = class_codes
WHERE class_codes IS NOT NULL AND class_codes_archive IS NULL;

-- 3. Créer une colonne temporaire pour le nettoyage
ALTER TABLE planning_time_slots
ADD COLUMN IF NOT EXISTS class_codes_clean text[] DEFAULT NULL;

-- 4. Nettoyer et standardiser les class_codes
UPDATE planning_time_slots
SET class_codes_clean = (
  SELECT ARRAY_AGG(DISTINCT UPPER(TRIM(class_item))) 
  FROM unnest(class_codes) AS class_item
  WHERE class_item IS NOT NULL AND TRIM(class_item) != ''
)
WHERE class_codes IS NOT NULL;

-- 5. Supprimer les doublons dans class_codes_clean
UPDATE planning_time_slots
SET class_codes_clean = (
  SELECT ARRAY_AGG(DISTINCT class_item) 
  FROM unnest(class_codes_clean) AS class_item
  WHERE class_item IS NOT NULL
)
WHERE class_codes_clean IS NOT NULL;

-- 6. Trier les classes dans chaque array (ordre alphabétique)
UPDATE planning_time_slots
SET class_codes_clean = (
  SELECT ARRAY_AGG(class_item ORDER BY class_item)
  FROM unnest(class_codes_clean) AS class_item
)
WHERE class_codes_clean IS NOT NULL;

-- 7. Remplacer la colonne originale par la version nettoyée
ALTER TABLE planning_time_slots
DROP COLUMN IF EXISTS class_codes;

ALTER TABLE planning_time_slots
RENAME COLUMN class_codes_clean TO class_codes;

-- 8. Ajouter une contrainte CHECK pour s'assurer que class_codes est toujours un array valide
ALTER TABLE planning_time_slots
ADD CONSTRAINT IF NOT EXISTS check_class_codes_not_empty
CHECK (
  class_codes IS NULL OR 
  (array_length(class_codes, 1) > 0 AND class_codes != '{}')
);

-- 9. Créer un index sur la colonne d'archive pour les recherches si nécessaire
CREATE INDEX IF NOT EXISTS idx_planning_time_slots_class_codes_archive 
ON planning_time_slots USING gin(class_codes_archive);

-- 10. Ajouter des commentaires pour documentation
COMMENT ON COLUMN planning_time_slots.class_codes IS 'Array de codes de classes standardisés (ex: [BAC25, BAC26]) - format majuscules, sans doublons, triés alphabétiquement';
COMMENT ON COLUMN planning_time_slots.class_codes_archive IS 'Archive des class_codes originaux avant nettoyage - sauvegarde de sécurité';

-- 11. Afficher un résumé des modifications
DO $$
DECLARE
    total_rows INTEGER;
    cleaned_rows INTEGER;
    archived_rows INTEGER;
BEGIN
    -- Compter le nombre total de lignes avec class_codes
    SELECT COUNT(*) INTO total_rows 
    FROM planning_time_slots 
    WHERE class_codes IS NOT NULL;
    
    -- Compter les lignes archivées
    SELECT COUNT(*) INTO archived_rows 
    FROM planning_time_slots 
    WHERE class_codes_archive IS NOT NULL;
    
    -- Compter les lignes nettoyées
    SELECT COUNT(*) INTO cleaned_rows 
    FROM planning_time_slots 
    WHERE class_codes IS NOT NULL;
    
    RAISE NOTICE '=== RÉSUMÉ DU NETTOYAGE ===';
    RAISE NOTICE 'Total de lignes avec class_codes: %', total_rows;
    RAISE NOTICE 'Lignes archivées: %', archived_rows;
    RAISE NOTICE 'Lignes nettoyées: %', cleaned_rows;
    RAISE NOTICE '=== FIN DU NETTOYAGE ===';
END $$;
