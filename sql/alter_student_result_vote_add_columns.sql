-- ============================================
-- ALTER TABLE: student_result_vote
-- Ajouter les colonnes pour la gestion des répondants HES
-- ============================================

-- Ajouter la colonne repondant_hes (nom du répondant HES)
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS repondant_hes text NULL;

-- Ajouter la colonne signataire_hes (nom du signataire HES)
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS signataire_hes text NULL;

-- Ajouter la colonne lieu_signature (Présence, Visio-conférence, Étudiant)
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS lieu_signature text NULL;

-- Ajouter la colonne is_validated (checkbox de validation)
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false;

-- Index pour améliorer les performances des filtres
CREATE INDEX IF NOT EXISTS idx_student_result_vote_is_validated 
ON public.student_result_vote (is_validated);

CREATE INDEX IF NOT EXISTS idx_student_result_vote_repondant_hes 
ON public.student_result_vote (repondant_hes);

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.student_result_vote.repondant_hes IS 'Nom du répondant HES assigné';
COMMENT ON COLUMN public.student_result_vote.signataire_hes IS 'Nom du signataire HES';
COMMENT ON COLUMN public.student_result_vote.lieu_signature IS 'Lieu de signature: Présence, Visio-conférence, Étudiant';
COMMENT ON COLUMN public.student_result_vote.is_validated IS 'Indique si la ligne a été validée';
