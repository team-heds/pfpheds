-- Ajouter la colonne 'remarques' pour les remarques manuelles de l'admin
-- Séparée de 'notes' qui est utilisé par l'algorithme d'attribution
ALTER TABLE student_result_vote ADD COLUMN IF NOT EXISTS remarques text;
