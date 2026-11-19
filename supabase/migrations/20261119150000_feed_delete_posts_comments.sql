-- Fil d'actualité : retrait des publications et des commentaires.
--
-- Constat en production (19.11.2026, lecture seule de pg_policies) :
--   * public.posts : la règle « Users can delete their posts » (DELETE, auth.uid() = user_id)
--     réserve déjà le retrait d'une publication à son auteur. Elle vise le rôle public ;
--     anon n'a pas d'auth.uid(), donc aucun retrait anonyme n'est possible.
--   * public.post_comments : seule la règle post_comments_delete_own existe ; l'auteur
--     d'une publication ne peut pas retirer les commentaires reçus.
--   * Administrateurs : aucune règle ne leur donne ce droit, ni sur posts ni sur
--     post_comments. Cette migration n'en ajoute pas et n'en retire pas.
--   * post_media, post_likes et post_comments référencent posts(id) avec ON DELETE CASCADE :
--     retirer une publication retire aussi ses médias (lignes), ses j'aime et ses commentaires.
--     Les réponses d'un commentaire partent avec lui (clé étrangère parent, ON DELETE CASCADE).
--   * Les fichiers du bucket post-media (posts/<auteur>/…) n'ont pas de clé étrangère :
--     l'application les retire après la publication, avec la règle Storage existante
--     « Users delete own post-media », limitée au dossier de l'auteur.
--
-- Après :
--   * une publication : seulement par son auteur (règle existante, limitée au rôle authenticated) ;
--   * un commentaire : par son auteur (règle existante) ou par l'auteur de la publication
--     (nouvelle règle post_comments_delete_post_author). Les règles RLS permissives s'additionnent :
--     le résultat est exactement « auteur du commentaire OU auteur de la publication ».
--
-- Migration rejouable et sans opération destructive : création seulement si absente,
-- ALTER POLICY pour la règle existante.

do $policies$
begin
  -- Publication : auteur seulement.
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'posts' and policyname = 'Users can delete their posts'
  ) then
    alter policy "Users can delete their posts"
      on public.posts
      to authenticated
      using ((select auth.uid()) = user_id);
  elsif not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_delete_own'
  ) then
    create policy posts_delete_own
      on public.posts
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  -- Commentaire : l'auteur de la publication peut aussi le retirer.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'post_comments' and policyname = 'post_comments_delete_post_author'
  ) then
    create policy post_comments_delete_post_author
      on public.post_comments
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.posts p
          where p.id = post_comments.post_id
            and p.user_id = (select auth.uid())
        )
      );
  end if;
end
$policies$;

comment on policy post_comments_delete_post_author on public.post_comments is
  'L''auteur d''une publication peut retirer les commentaires reçus (en plus de post_comments_delete_own).';
