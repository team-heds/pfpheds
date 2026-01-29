-- Supprimer la contrainte de clé étrangère qui cause les erreurs de sauvegarde
ALTER TABLE public.recap_cpt_evaluation 
DROP CONSTRAINT IF EXISTS recap_cpt_evaluation_user_id_fkey;

-- La table utilise maintenant user_id sans contrainte FK vers auth.users
-- Cela permet de sauvegarder les données même si l'utilisateur n'existe pas dans auth.users
