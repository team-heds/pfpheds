-- Migration: Ajouter le champ pfp_cohort à user_profiles
-- Date: 2025-11-28
-- Description: Permet d'identifier si un étudiant est en PFP1A ou PFP1B

-- Ajouter la colonne pfp_cohort
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS pfp_cohort text;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.user_profiles.pfp_cohort IS 'Cohorte PFP de l''étudiant (PFP1A, PFP1B, etc.)';

-- Créer un index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_user_profiles_pfp_cohort 
ON public.user_profiles USING btree (pfp_cohort) 
TABLESPACE pg_default
WHERE pfp_cohort IS NOT NULL;

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_pfp_cohort_values;

-- Ajouter la contrainte pour limiter les valeurs possibles aux cohortes actives
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_pfp_cohort_values 
CHECK (pfp_cohort IS NULL OR pfp_cohort IN ('PFP1A', 'PFP1B'));

-- Exemples de mise à jour pour tester (à adapter selon vos besoins)
-- UPDATE public.user_profiles SET pfp_cohort = 'PFP1A' WHERE role = 'BA25' AND <condition>;
-- UPDATE public.user_profiles SET pfp_cohort = 'PFP1B' WHERE role = 'BA25' AND <autre_condition>;

SELECT 'Migration 0004: pfp_cohort ajouté à user_profiles' as status;
