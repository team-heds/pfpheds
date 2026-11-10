-- Stories du fil d'actualité, stockées dans Supabase.
--
-- Avant : les stories vivaient dans Firebase (base temps réel « stories » + Storage) et
-- exigeaient une session Firebase. Les comptes se connectent avec Supabase : la publication
-- échouait toujours et la barre de stories n'était plus affichée.
--
-- Règles :
--   * un utilisateur connecté ne crée et ne supprime que ses propres stories (RLS) ;
--   * aucune modification (pas de UPDATE) ; aucun accès anonyme (table, fonctions, fichiers) ;
--   * la date de création et l'expiration sont posées par le serveur (1 h ou 24 h) ;
--   * une story expirée n'est plus lisible que par son auteur, son fichier aussi ;
--   * « vu » : chacun n'enregistre que ses propres vues, sur la story d'un autre encore active ;
--     l'auteur voit qui a vu ses stories ;
--   * fichiers dans un bucket privé « stories », dossier = identifiant de l'auteur ;
--   * publier une story ne rapporte aucun XP : aucun déclencheur de gamification ici.
-- Migration additive et rejouable : aucune suppression.

create table if not exists public.stories (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  media_path text not null,
  media_type text not null,
  caption text not null default '',
  elements jsonb not null default '[]'::jsonb,
  lifetime_hours smallint not null default 24,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint stories_pkey primary key (id),
  constraint stories_media_path_key unique (media_path),
  -- Le fichier est rangé dans le dossier de l'auteur : impossible de pointer le fichier d'un autre.
  constraint stories_media_path_owner check (
    media_path like user_id::text || '/%' and media_path !~ '\.\.' and char_length(media_path) <= 300
  ),
  constraint stories_media_type check (media_type in ('image', 'video')),
  constraint stories_caption_length check (char_length(caption) <= 100),
  constraint stories_elements_shape check (
    jsonb_typeof(elements) = 'array' and pg_column_size(elements) <= 16384
  ),
  constraint stories_lifetime check (lifetime_hours in (1, 24))
);

comment on table public.stories is
  'Stories du fil : média éphémère (1 h ou 24 h) dans le bucket privé « stories ».';

create index if not exists idx_stories_expires on public.stories (expires_at desc);
create index if not exists idx_stories_user_created on public.stories (user_id, created_at desc);

-- Date et expiration toujours calculées par le serveur.
create or replace function public.stories_set_server_dates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := now();
  new.expires_at := now() + make_interval(hours => new.lifetime_hours);
  return new;
end;
$$;

revoke all on function public.stories_set_server_dates() from public, anon, authenticated;

create or replace trigger stories_set_server_dates
  before insert on public.stories
  for each row
  execute function public.stories_set_server_dates();

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  constraint story_views_pkey primary key (story_id, viewer_id)
);

comment on table public.story_views is
  'Vues des stories : une ligne par personne et par story (marquage « vu »).';

create index if not exists idx_story_views_viewer on public.story_views (viewer_id);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

revoke all on table public.stories from public, anon, authenticated;
revoke all on table public.story_views from public, anon, authenticated;

grant select, delete on table public.stories to authenticated;
-- Ni created_at ni expires_at : le serveur les pose.
grant insert (id, user_id, media_path, media_type, caption, elements, lifetime_hours)
  on table public.stories to authenticated;

grant select on table public.story_views to authenticated;
grant insert (story_id, viewer_id) on table public.story_views to authenticated;

-- Règles créées seulement si absentes (migration rejouable, sans suppression).
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'stories' and policyname = 'stories_select_active_or_own') then
    create policy stories_select_active_or_own
      on public.stories
      for select
      to authenticated
      using (expires_at > now() or (select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'stories' and policyname = 'stories_insert_own') then
    create policy stories_insert_own
      on public.stories
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'stories' and policyname = 'stories_delete_own') then
    create policy stories_delete_own
      on public.stories
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  -- On voit ses propres vues, et l'auteur voit les vues de ses stories.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'story_views' and policyname = 'story_views_select_own_or_author') then
    create policy story_views_select_own_or_author
      on public.story_views
      for select
      to authenticated
      using (
        (select auth.uid()) = viewer_id
        or exists (
          select 1 from public.stories s
          where s.id = story_views.story_id
            and s.user_id = (select auth.uid())
        )
      );
  end if;

  -- On ne marque « vu » que pour soi, sur la story active de quelqu'un d'autre.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'story_views' and policyname = 'story_views_insert_own') then
    create policy story_views_insert_own
      on public.story_views
      for insert
      to authenticated
      with check (
        (select auth.uid()) = viewer_id
        and exists (
          select 1 from public.stories s
          where s.id = story_views.story_id
            and s.expires_at > now()
            and s.user_id <> (select auth.uid())
        )
      );
  end if;
end
$policies$;

-- Stories actives avec leur auteur et l'état « vu » pour la personne connectée.
create or replace function public.get_active_stories(p_limit integer default 200)
returns table (
  id uuid,
  user_id uuid,
  media_path text,
  media_type text,
  caption text,
  elements jsonb,
  created_at timestamptz,
  expires_at timestamptz,
  display_name text,
  avatar_url text,
  seen boolean,
  view_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id,
    s.user_id,
    s.media_path,
    s.media_type,
    s.caption,
    s.elements,
    s.created_at,
    s.expires_at,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(concat_ws(' ', p.forname, p.family_name)), ''),
      'Utilisateur'
    )::text as display_name,
    p.avatar_url,
    (
      s.user_id = (select auth.uid())
      or exists (
        select 1 from public.story_views v
        where v.story_id = s.id and v.viewer_id = (select auth.uid())
      )
    ) as seen,
    -- Visible uniquement pour l'auteur (la RLS de story_views filtre les autres lignes).
    (select count(*)::integer from public.story_views v where v.story_id = s.id) as view_count
  from public.stories s
  left join public.user_profiles p on p.user_id = s.user_id
  where s.expires_at > now()
  order by s.created_at desc, s.id
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

-- Qui a vu une story : réservé à son auteur (la RLS ne renvoie rien aux autres).
create or replace function public.get_story_viewers(p_story_id uuid)
returns table (
  viewer_id uuid,
  viewed_at timestamptz,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    v.viewer_id,
    v.viewed_at,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(concat_ws(' ', p.forname, p.family_name)), ''),
      'Utilisateur'
    )::text as display_name,
    p.avatar_url
  from public.story_views v
  join public.stories s on s.id = v.story_id and s.user_id = (select auth.uid())
  left join public.user_profiles p on p.user_id = v.viewer_id
  where v.story_id = p_story_id
  order by v.viewed_at desc;
$$;

revoke all on function public.get_active_stories(integer) from public, anon;
revoke all on function public.get_story_viewers(uuid) from public, anon;
grant execute on function public.get_active_stories(integer) to authenticated;
grant execute on function public.get_story_viewers(uuid) to authenticated;

-- Bucket privé : les fichiers ne sont lus qu'au travers d'URL signées, par des personnes connectées.
do $bucket$
begin
  if not exists (select 1 from storage.buckets where id = 'stories') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'stories',
      'stories',
      false,
      31457280,
      array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
    );
  end if;
end
$bucket$;

do $storage_policies$
begin
  -- Lire : son propre dossier, ou le fichier d'une story encore active.
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'stories_media_select_active_or_own') then
    create policy stories_media_select_active_or_own
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'stories'
        and (
          (storage.foldername(name))[1] = (select auth.uid())::text
          or exists (
            select 1 from public.stories s
            where s.media_path = objects.name
              and s.expires_at > now()
          )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'stories_media_insert_own_folder') then
    create policy stories_media_insert_own_folder
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'stories'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'stories_media_delete_own_folder') then
    create policy stories_media_delete_own_folder
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'stories'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;
end
$storage_policies$;
