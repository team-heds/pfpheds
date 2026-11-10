-- Fil d'actualité : mentions « J'aime » sur les publications, façon Instagram.
--
-- Avant : aucune table ne stockait les j'aime des publications. Le bouton cœur du fil
-- ne changeait qu'un état local, perdu au rechargement, et le compteur restait à 0.
--
-- Règles :
--   * un seul j'aime par utilisateur et par publication (clé primaire post_id + user_id) ;
--   * un utilisateur connecté ne crée et ne supprime que ses propres j'aime (RLS) ;
--   * aucune modification de ligne (pas de UPDATE) ; aucun accès anonyme ;
--   * aimer ne rapporte aucun XP : aucun déclencheur de gamification n'est branché ici.

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_pkey primary key (post_id, user_id)
);

comment on table public.post_likes is
  'Mentions J''aime du fil d''actualité : une ligne par utilisateur et par publication.';

-- La clé primaire couvre les recherches par publication ; cet index couvre « mes j'aime ».
create index if not exists idx_post_likes_user on public.post_likes (user_id, post_id);

alter table public.post_likes enable row level security;

revoke all on table public.post_likes from public, anon, authenticated;
grant select, insert, delete on table public.post_likes to authenticated;

-- Règles créées seulement si absentes (migration rejouable, sans suppression).
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_select_authenticated') then
    create policy post_likes_select_authenticated
      on public.post_likes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_insert_own') then
    create policy post_likes_insert_own
      on public.post_likes
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_delete_own') then
    create policy post_likes_delete_own
      on public.post_likes
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$policies$;

-- Résumé des j'aime pour une page du fil : compteur et état « aimé par moi ».
create or replace function public.get_post_like_summaries(p_post_ids uuid[])
returns table (post_id uuid, like_count integer, liked_by_me boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    ids.post_id,
    count(l.user_id)::integer as like_count,
    coalesce(bool_or(l.user_id = (select auth.uid())), false) as liked_by_me
  from unnest(coalesce(p_post_ids, '{}'::uuid[])) as ids(post_id)
  left join public.post_likes l on l.post_id = ids.post_id
  group by ids.post_id;
$$;

-- Personnes qui ont aimé une publication (plus récentes d'abord).
create or replace function public.get_post_likers(p_post_id uuid, p_limit integer default 50)
returns table (user_id uuid, display_name text, avatar_url text, liked_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.user_id,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(concat_ws(' ', p.forname, p.family_name)), ''),
      'Utilisateur'
    )::text as display_name,
    p.avatar_url,
    l.created_at as liked_at
  from public.post_likes l
  left join public.user_profiles p on p.user_id = l.user_id
  where l.post_id = p_post_id
  order by l.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

revoke all on function public.get_post_like_summaries(uuid[]) from public, anon;
revoke all on function public.get_post_likers(uuid, integer) from public, anon;
grant execute on function public.get_post_like_summaries(uuid[]) to authenticated;
grant execute on function public.get_post_likers(uuid, integer) to authenticated;
