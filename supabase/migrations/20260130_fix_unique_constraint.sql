-- Migration corrective pour supprimer la contrainte unique obsolète
-- Date: 2026-01-30
-- Fix: Supprimer ux_pts_class_week_day_start_sync qui bloque les updates

-- 1. Supprimer l'ancienne contrainte unique basée sur class_code
DROP INDEX IF EXISTS ux_pts_class_week_day_start_sync;

-- 2. Fusionner les doublons : grouper les class_codes pour les séances identiques
-- Garder le premier ID, fusionner les class_codes
WITH duplicates AS (
  SELECT 
    week_number, 
    day, 
    start_time, 
    module_code,
    MIN(id) as keep_id,
    array_agg(id) as all_ids
  FROM planning_time_slots
  WHERE start_time IS NOT NULL AND module_code IS NOT NULL
  GROUP BY week_number, day, start_time, module_code
  HAVING COUNT(*) > 1
),
expanded_classes AS (
  SELECT 
    d.keep_id,
    COALESCE(pts.class_code, unnested.class_code) as class_code
  FROM duplicates d
  JOIN planning_time_slots pts ON pts.id = ANY(d.all_ids)
  LEFT JOIN LATERAL unnest(pts.class_codes) as unnested(class_code) ON true
  WHERE pts.class_code IS NOT NULL OR unnested.class_code IS NOT NULL
),
merged_classes AS (
  SELECT 
    keep_id,
    array_agg(DISTINCT class_code ORDER BY class_code) as merged_class_codes
  FROM expanded_classes
  GROUP BY keep_id
)
UPDATE planning_time_slots pts
SET class_codes = mc.merged_class_codes
FROM merged_classes mc
WHERE pts.id = mc.keep_id;

-- 3. Supprimer les doublons (garder seulement le premier ID)
DELETE FROM planning_time_slots 
WHERE id IN (
  SELECT pts.id
  FROM planning_time_slots pts
  INNER JOIN (
    SELECT 
      week_number, 
      day, 
      start_time, 
      module_code,
      MIN(id) as keep_id
    FROM planning_time_slots
    WHERE start_time IS NOT NULL AND module_code IS NOT NULL
    GROUP BY week_number, day, start_time, module_code
    HAVING COUNT(*) > 1
  ) dups ON 
    pts.week_number = dups.week_number 
    AND pts.day = dups.day 
    AND pts.start_time = dups.start_time 
    AND pts.module_code = dups.module_code
    AND pts.id != dups.keep_id
);

-- 4. S'assurer que class_codes est populé pour toutes les lignes
UPDATE planning_time_slots
SET class_codes = ARRAY[class_code]
WHERE class_code IS NOT NULL AND (class_codes IS NULL OR array_length(class_codes, 1) IS NULL);

-- 5. Vérifier que la nouvelle contrainte existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'planning_time_slots_week_day_time_module_unique'
  ) THEN
    ALTER TABLE planning_time_slots
    ADD CONSTRAINT planning_time_slots_week_day_time_module_unique 
    UNIQUE (week_number, day, start_time, module_code);
  END IF;
END $$;

-- 4. Vérifier que l'index GIN existe
CREATE INDEX IF NOT EXISTS idx_planning_time_slots_class_codes 
ON planning_time_slots USING gin(class_codes);
