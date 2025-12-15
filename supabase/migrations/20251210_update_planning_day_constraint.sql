-- Ajout de la valeur 'distance' aux contraintes des tables de planning

-- 1. Mise à jour de planning_time_slots
DO $$
BEGIN
    -- Vérifier si la contrainte existe et la supprimer pour la recréer
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planning_time_slots_day_check') THEN
        ALTER TABLE planning_time_slots DROP CONSTRAINT planning_time_slots_day_check;
    END IF;
    
    -- Si c'est un type ENUM (cas possible), il faudrait ajouter la valeur
    -- Mais on suppose ici une contrainte CHECK sur text
END $$;

-- Ajouter la contrainte mise à jour
ALTER TABLE planning_time_slots 
ADD CONSTRAINT planning_time_slots_day_check 
CHECK (day IN ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche', 'distance'));


-- 2. Mise à jour de planning_cells
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planning_cells_day_check') THEN
        ALTER TABLE planning_cells DROP CONSTRAINT planning_cells_day_check;
    END IF;
END $$;

ALTER TABLE planning_cells 
ADD CONSTRAINT planning_cells_day_check 
CHECK (day IN ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche', 'distance'));
