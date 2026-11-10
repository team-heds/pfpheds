-- Fil d'actualité : commentaires des publications, façon Instagram.
--
-- Avant : aucune table ne stockait les commentaires. Le champ « Écrire un commentaire » du fil
-- appelait une API /posts avec un parent_id que la table posts n'a pas : rien n'était enregistré,
-- le compteur restait à 0 et la liste était toujours vide.
--
-- Règles :
--   * un utilisateur connecté ne crée et ne supprime que ses propres commentaires (RLS) ;
--   * aucune modification (pas de UPDATE) ; aucun accès anonyme ;
--   * la date est posée par le serveur (created_at n'est pas modifiable par l'API) ;
--   * une réponse vise un commentaire de premier niveau de la même publication (un seul niveau) ;
--   * texte de 1 à 1000 caractères utiles ;
--   * commenter ne rapporte aucun XP : aucun déclencheur de gamification n'est branché ici.

create table if not exists public.post_comments (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid,
  content text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_pkey primary key (id),
  -- Cible de la clé étrangère composite : une réponse reste sur la même publication.
  constraint post_comments_id_post_key unique (id, post_id),
  constraint post_comments_parent_fkey foreign key (parent_id, post_id)
    references public.post_comments (id, post_id) on delete cascade,
  constraint post_comments_not_self_parent check (parent_id is null or parent_id <> id),
  constraint post_comments_content_length check (char_length(btrim(content)) between 1 and 1000)
);

comment on table public.post_comments is
  'Commentaires du fil d''actualité ; parent_id = réponse à un commentaire de premier niveau.';

create index if not exists idx_post_comments_post_created on public.post_comments (post_id, created_at);
create index if not exists idx_post_comments_parent on public.post_comments (parent_id) where parent_id is not null;
create index if not exists idx_post_comments_user on public.post_comments (user_id);

alter table public.post_comments enable row level security;

revoke all on table public.post_comments from public, anon, authenticated;
grant select, delete on table public.post_comments to authenticated;
-- Pas de created_at : la date vient toujours du serveur. L'id peut être fourni par le client
-- (mise à jour optimiste), user_id est contrôlé par la règle ci-dessous.
grant insert (id, post_id, user_id, parent_id, content) on table public.post_comments to authenticated;

-- Règles créées seulement si absentes (migration rejouable, sans suppression).
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_comments' and policyname = 'post_comments_select_authenticated') then
    create policy post_comments_select_authenticated
      on public.post_comments
      for select
      to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_comments' and policyname = 'post_comments_insert_own') then
    create policy post_comments_insert_own
      on public.post_comments
      for insert
      to authenticated
      with check (
        (select auth.uid()) = user_id
        and (
          parent_id is null
          or exists (
            select 1
            from public.post_comments parent
            where parent.id = post_comments.parent_id
              and parent.post_id = post_comments.post_id
              and parent.parent_id is null
          )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_comments' and policyname = 'post_comments_delete_own') then
    create policy post_comments_delete_own
      on public.post_comments
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$policies$;

-- Nombre de commentaires (réponses comprises) pour une page du fil.
create or replace function public.get_post_comment_counts(p_post_ids uuid[])
returns table (post_id uuid, comment_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select ids.post_id, count(c.id)::integer as comment_count
  from unnest(coalesce(p_post_ids, '{}'::uuid[])) as ids(post_id)
  left join public.post_comments c on c.post_id = ids.post_id
  group by ids.post_id;
$$;

-- Commentaires d'une publication avec leur auteur, plus anciens d'abord (ordre de lecture).
create or replace function public.get_post_comments(p_post_id uuid, p_limit integer default 200)
returns table (
  id uuid,
  post_id uuid,
  parent_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.post_id,
    c.parent_id,
    c.user_id,
    c.content,
    c.created_at,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(concat_ws(' ', p.forname, p.family_name)), ''),
      'Utilisateur'
    )::text as display_name,
    p.avatar_url
  from public.post_comments c
  left join public.user_profiles p on p.user_id = c.user_id
  where c.post_id = p_post_id
  order by c.created_at asc, c.id asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

revoke all on function public.get_post_comment_counts(uuid[]) from public, anon;
revoke all on function public.get_post_comments(uuid, integer) from public, anon;
grant execute on function public.get_post_comment_counts(uuid[]) to authenticated;
grant execute on function public.get_post_comments(uuid, integer) to authenticated;
