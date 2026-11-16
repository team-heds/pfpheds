-- Effacement automatique des stories expirées par le worker du serveur.
--
-- Le worker (workers/storiesCleanup.js, compte service_role) lit les stories expirées depuis
-- plus d'une heure, retire leurs médias par l'API Storage (ce qui libère le disque), puis
-- supprime les lignes. La table stories (20261110170000) n'accordait aucun droit à
-- service_role : la lecture échouait (« permission denied for table stories »).
-- Seuls la lecture et la suppression sont accordées ; ni anon ni authenticated ne changent.

grant select, delete on table public.stories to service_role;
grant select, delete on table public.story_views to service_role;
