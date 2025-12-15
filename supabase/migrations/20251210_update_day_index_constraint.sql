-- Mise à jour de la contrainte sur day_index pour autoriser jusqu'à 6 (Samedi/Distance et Dimanche)

DO $$
BEGIN
    -- Supprimer l'ancienne contrainte si elle existe
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planning_time_slots_day_index_check') THEN
        ALTER TABLE planning_time_slots DROP CONSTRAINT planning_time_slots_day_index_check;
    END IF;
END $$;

-- Ajouter la nouvelle contrainte (0=Lundi ... 6=Dimanche ou Distance)
ALTER TABLE planning_time_slots 
ADD CONSTRAINT planning_time_slots_day_index_check 
CHECK (day_index >= 0 AND day_index <= 6);
