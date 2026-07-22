-- Active RLS sur les tables de suivi des cas particuliers / historique / SAE.
-- Objectif minimal et sûr : bloquer l'accès anonyme (sans connexion), qui était
-- possible jusqu'ici via la clé anon publique sans aucune session.
-- Tout utilisateur AUTHENTIFIÉ (déjà le cas pour accéder à la page admin, qui
-- exige requiresAuth + need:'page1.access') garde exactement le même accès
-- qu'aujourd'hui - aucun changement de comportement pour les utilisateurs réels.

ALTER TABLE public.suivi_cas_particuliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suivi_cas_particuliers_authenticated_all" ON public.suivi_cas_particuliers;
CREATE POLICY "suivi_cas_particuliers_authenticated_all"
ON public.suivi_cas_particuliers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE public.cas_particuliers_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cas_particuliers_historique_authenticated_all" ON public.cas_particuliers_historique;
CREATE POLICY "cas_particuliers_historique_authenticated_all"
ON public.cas_particuliers_historique
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- service_role bypass RLS nativement (Supabase/Postgres), les grants existants restent valables.
