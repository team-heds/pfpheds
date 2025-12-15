-- Script de correction rapide pour la contrainte status
-- À exécuter si vous avez déjà une contrainte CHECK qui bloque les valeurs 'published'

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE student_result_vote 
DROP CONSTRAINT IF EXISTS student_result_vote_status_check;

-- 2. Créer la nouvelle contrainte avec les bonnes valeurs
ALTER TABLE student_result_vote
ADD CONSTRAINT student_result_vote_status_check 
CHECK (status IN ('draft', 'published', 'assigned'));

-- 3. Vérifier que ça fonctionne
SELECT status, COUNT(*) as count
FROM student_result_vote
GROUP BY status;
