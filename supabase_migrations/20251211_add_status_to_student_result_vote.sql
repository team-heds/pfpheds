-- Migration: Ajouter le champ status pour gérer la publication des assignations
-- Date: 11 décembre 2025

-- 1. Supprimer l'ancienne contrainte CHECK si elle existe
ALTER TABLE student_result_vote 
DROP CONSTRAINT IF EXISTS student_result_vote_status_check;

-- 2. Ajouter la colonne status si elle n'existe pas déjà
ALTER TABLE student_result_vote 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- 3. Mettre à jour les valeurs NULL existantes en 'draft'
UPDATE student_result_vote 
SET status = 'draft' 
WHERE status IS NULL;

-- 4. Créer une nouvelle contrainte CHECK avec les valeurs correctes
ALTER TABLE student_result_vote
ADD CONSTRAINT student_result_vote_status_check 
CHECK (status IN ('draft', 'published', 'assigned'));

-- Note: 'assigned' est inclus pour compatibilité avec les données existantes
-- Vous pouvez mettre à jour les anciennes valeurs 'assigned' vers 'draft' si nécessaire:
-- UPDATE student_result_vote SET status = 'draft' WHERE status = 'assigned';

-- 5. Ajouter un commentaire pour documenter
COMMENT ON COLUMN student_result_vote.status IS 'Statut de l''assignation: draft (brouillon), published (publié aux étudiants), assigned (ancien statut pour compatibilité)';

-- 6. Créer un index pour les requêtes par statut
CREATE INDEX IF NOT EXISTS idx_student_result_vote_status 
ON student_result_vote(status);

-- 7. Créer un index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_student_result_vote_user_pfp_year_status
ON student_result_vote(user_id, pfp_type, year, status);

COMMENT ON INDEX idx_student_result_vote_user_pfp_year_status IS 'Index composite pour optimiser les requêtes de récupération des assignations par étudiant';
