-- Migration: Ajouter le praticien formateur assigné pour chaque assignation
-- Date: 2025-12-11
-- Description: Permet d'assigner un praticien formateur spécifique à chaque étudiant

-- 1. Ajouter la colonne assigned_praticien_id dans student_result_vote
ALTER TABLE student_result_vote 
ADD COLUMN IF NOT EXISTS assigned_praticien_id bigint NULL;

-- 2. Créer un index pour les recherches par praticien
CREATE INDEX IF NOT EXISTS idx_student_result_vote_praticien 
ON student_result_vote(assigned_praticien_id);

-- 3. Ajouter une foreign key vers praticiens_formateurs (optionnel, peut être NULL)
-- Note: On ne force pas la contrainte pour permettre la flexibilité
-- ALTER TABLE student_result_vote 
-- ADD CONSTRAINT fk_student_result_vote_praticien 
-- FOREIGN KEY (assigned_praticien_id) 
-- REFERENCES praticiens_formateurs(id) 
-- ON DELETE SET NULL;

-- 4. Commentaire pour documenter la colonne
COMMENT ON COLUMN student_result_vote.assigned_praticien_id IS 
'ID du praticien formateur assigné spécifiquement à cet étudiant pour cette place. NULL si pas encore assigné.';

-- Vérification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_result_vote' 
AND column_name = 'assigned_praticien_id';
