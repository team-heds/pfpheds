-- Migration: Ajouter le support des cours asynchrones
-- Date: 2026-01-30
-- Description: Ajoute les colonnes is_async et periods pour gérer les cours à distance/asynchrones
-- Note: On utilise day='distance' (déjà autorisé par la contrainte CHECK) + is_async=true pour les cours asynchrones

-- Supprimer toutes les contraintes et index UNIQUE qui causent des conflits
ALTER TABLE planning_time_slots 
DROP CONSTRAINT IF EXISTS planning_time_slots_class_code_week_number_day_start_time_key;

DROP INDEX IF EXISTS ux_pts_class_week_day_start_sync;
DROP INDEX IF EXISTS ux_pts_week_day_time_module_active;

-- Créer un index UNIQUE partiel en excluant les cours asynchrones (start_time IS NOT NULL)
-- Cela permet d'avoir plusieurs cours asynchrones pour la même classe/semaine
CREATE UNIQUE INDEX ux_pts_class_week_day_start_sync 
ON planning_time_slots (class_code, week_number, day, start_time)
WHERE start_time IS NOT NULL;

-- Recréer l'index pour module (sans IF NOT EXISTS pour forcer la recréation)
CREATE UNIQUE INDEX ux_pts_week_day_time_module_active 
ON planning_time_slots (week_number, day, start_time, module_code)
WHERE archived_at IS NULL AND start_time IS NOT NULL;

-- Supprimer l'ancienne contrainte week_number (1-52)
ALTER TABLE planning_time_slots 
DROP CONSTRAINT IF EXISTS planning_time_slots_week_number_check;

-- Ajouter la nouvelle contrainte qui permet 0 pour les cours asynchrones
ALTER TABLE planning_time_slots 
ADD CONSTRAINT planning_time_slots_week_number_check 
CHECK (week_number >= 0 AND week_number <= 52);

-- Permettre NULL sur start_time et end_time pour les cours asynchrones
ALTER TABLE planning_time_slots 
ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE planning_time_slots 
ALTER COLUMN end_time DROP NOT NULL;

-- Ajouter la colonne is_async (booléen pour indiquer si c'est un cours asynchrone)
ALTER TABLE planning_time_slots 
ADD COLUMN IF NOT EXISTS is_async BOOLEAN DEFAULT false;

-- Ajouter la colonne periods (nombre de périodes pour les cours asynchrones)
ALTER TABLE planning_time_slots 
ADD COLUMN IF NOT EXISTS periods INTEGER;

-- Commentaires pour documentation
COMMENT ON COLUMN planning_time_slots.is_async IS 'Indique si le cours est asynchrone (sans horaire fixe)';
COMMENT ON COLUMN planning_time_slots.periods IS 'Nombre de périodes pour les cours asynchrones';

-- Index pour améliorer les performances des requêtes sur is_async
CREATE INDEX IF NOT EXISTS idx_planning_time_slots_is_async 
ON planning_time_slots(is_async) 
WHERE is_async = true;
