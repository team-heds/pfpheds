-- Ajoute 'sae' comme valeur autorisée de pfp_field sur suivi_cas_particuliers
-- Permet de marquer un étudiant "SAE" (cas particulier / suivi spécial) au même titre
-- que info_etudiant, avec couleur + commentaire + historique daté.

ALTER TABLE public.suivi_cas_particuliers DROP CONSTRAINT IF EXISTS suivi_cas_particuliers_pfp_field_check;

ALTER TABLE public.suivi_cas_particuliers ADD CONSTRAINT suivi_cas_particuliers_pfp_field_check
  CHECK (pfp_field = ANY (ARRAY[
    'pfp1'::text, 'pfp1_prime'::text,
    'pfp2'::text, 'pfp2_prime'::text,
    'pfp3'::text, 'pfp3_prime'::text,
    'pfp4'::text, 'pfp4_prime'::text,
    'info_etudiant'::text,
    'sae'::text
  ]));
