-- Désactive temporairement la sécurité au niveau des lignes (RLS) pour permettre l'importation.
-- ATTENTION : Cela ouvre temporairement l'accès en écriture à ces tables.

ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags DISABLE ROW LEVEL SECURITY;


-- Pour réactiver la sécurité après l'importation, exécutez les commandes ci-dessous :
/*
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
*/
