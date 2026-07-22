-- Historique des événements de suivi pour les cas particuliers en Formation Pratique
-- (changement de date de stage, changement d'institution, absence, note libre)
-- Complète suivi_cas_particuliers (état courant couleur/commentaire) par un vrai journal daté.

CREATE TABLE IF NOT EXISTS public.cas_particuliers_historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pfp_field TEXT NOT NULL, -- 'pfp1' | 'pfp1_prime' | 'pfp2' | 'pfp2_prime' | 'pfp3' | 'pfp3_prime' | 'pfp4' | 'pfp4_prime' | 'info_etudiant'
  type_evenement TEXT NOT NULL DEFAULT 'note', -- 'changement_date' | 'changement_institution' | 'absence' | 'note'
  ancienne_date DATE,
  nouvelle_date DATE,
  description TEXT,
  couleur TEXT, -- snapshot de la couleur au moment de l'événement (optionnel)
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cas_particuliers_historique_type_check
    CHECK (type_evenement IN ('changement_date', 'changement_institution', 'absence', 'note'))
);

CREATE INDEX IF NOT EXISTS idx_cas_historique_user ON public.cas_particuliers_historique(user_id);
CREATE INDEX IF NOT EXISTS idx_cas_historique_user_field ON public.cas_particuliers_historique(user_id, pfp_field);
CREATE INDEX IF NOT EXISTS idx_cas_historique_created_at ON public.cas_particuliers_historique(created_at DESC);

-- Permissions (cohérent avec institution_offer_tracking : pas de RLS, contrôle d'accès applicatif via meta.need admin)
GRANT ALL ON public.cas_particuliers_historique TO authenticated;
GRANT ALL ON public.cas_particuliers_historique TO service_role;
