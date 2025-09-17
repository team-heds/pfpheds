-- Ajoute une colonne pour stocker l'ID de l'auteur original de Firebase.
-- Cela permet de conserver la référence même si l'utilisateur n'a pas encore été importé.

ALTER TABLE public.posts
ADD COLUMN firebase_author_id TEXT;

-- Plus tard, une fois les utilisateurs importés, vous pourrez utiliser cette colonne pour remplir `author_id`.
/*
UPDATE public.posts p
SET author_id = u.user_id
FROM public.user_profiles u
WHERE p.firebase_author_id = u.firebase_uid
  AND p.author_id IS NULL;
*/
