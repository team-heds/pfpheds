-- Migration pour supporter plusieurs classes par séance
-- Date: 2026-01-30

-- 1. Ajouter la colonne class_codes (array) à côté de class_code
ALTER TABLE planning_time_slots
ADD COLUMN IF NOT EXISTS class_codes text[] DEFAULT NULL;

-- 2. Migrer les données existantes : class_code -> class_codes
UPDATE planning_time_slots
SET class_codes = ARRAY[class_code]
WHERE class_code IS NOT NULL AND (class_codes IS NULL OR array_length(class_codes, 1) IS NULL);

-- 3. Supprimer l'ancienne contrainte unique qui inclut class_code
ALTER TABLE planning_time_slots
DROP CONSTRAINT IF EXISTS planning_time_slots_class_code_week_number_day_start_time_key;

-- 4. Nettoyer les doublons potentiels avant de créer la nouvelle contrainte
-- Garder seulement la première occurrence pour chaque (week_number, day, start_time, module_code)
DELETE FROM planning_time_slots 
WHERE id NOT IN (
  SELECT DISTINCT ON (week_number, day, start_time, module_code) id 
  FROM planning_time_slots 
  ORDER BY week_number, day, start_time, module_code, id
);

-- 5. Créer une nouvelle contrainte unique SANS class_code
-- Une seule séance par (week_number, day, start_time, module_code)
ALTER TABLE planning_time_slots
ADD CONSTRAINT planning_time_slots_week_day_time_module_unique 
UNIQUE (week_number, day, start_time, module_code);

-- 6. Créer un index GIN pour rechercher efficacement dans class_codes
CREATE INDEX IF NOT EXISTS idx_planning_time_slots_class_codes 
ON planning_time_slots USING gin(class_codes);

-- 7. Ajouter un commentaire pour documentation
COMMENT ON COLUMN planning_time_slots.class_codes IS 'Array de codes de classes (ex: [''BAC25'', ''BAC26'']) - remplace class_code';
COMMENT ON COLUMN planning_time_slots.class_code IS 'DEPRECATED - Utiliser class_codes à la place';
