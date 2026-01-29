-- Mettre à jour la contrainte pour autoriser 'info_etudiant'

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE public.suivi_cas_particuliers 
DROP CONSTRAINT IF EXISTS suivi_cas_particuliers_pfp_field_check;

-- 2. Recréer la contrainte avec 'info_etudiant' inclus
ALTER TABLE public.suivi_cas_particuliers 
ADD CONSTRAINT suivi_cas_particuliers_pfp_field_check 
CHECK (pfp_field IN ('pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime', 'info_etudiant'));

-- 3. Vérifier que la contrainte est bien mise à jour
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.suivi_cas_particuliers'::regclass 
AND conname = 'suivi_cas_particuliers_pfp_field_check';

-- Message de confirmation
SELECT '✅ Contrainte pfp_field mise à jour avec info_etudiant!' as status;
