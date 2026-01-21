-- ============================================
-- ALTER TABLE: student_result_vote
-- Ajouter les colonnes pour la validation PFP
-- ============================================

-- Ajouter la colonne pfp_validee
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS pfp_validee boolean DEFAULT false;

-- Ajouter la colonne pfp_echec
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS pfp_echec boolean DEFAULT false;

-- Ajouter la colonne pfp_arret
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS pfp_arret boolean DEFAULT false;

-- Ajouter la colonne commentaire_arret
ALTER TABLE public.student_result_vote 
ADD COLUMN IF NOT EXISTS commentaire_arret text NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_student_result_vote_pfp_validee 
ON public.student_result_vote (pfp_validee);

CREATE INDEX IF NOT EXISTS idx_student_result_vote_pfp_echec 
ON public.student_result_vote (pfp_echec);

CREATE INDEX IF NOT EXISTS idx_student_result_vote_pfp_arret 
ON public.student_result_vote (pfp_arret);

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.student_result_vote.pfp_validee IS 'Indique si la PFP a été validée';
COMMENT ON COLUMN public.student_result_vote.pfp_echec IS 'Indique si la PFP a échoué';
COMMENT ON COLUMN public.student_result_vote.pfp_arret IS 'Indique si la PFP a été arrêtée';
COMMENT ON COLUMN public.student_result_vote.commentaire_arret IS 'Commentaire explicatif pour l\'arrêt de la PFP';
