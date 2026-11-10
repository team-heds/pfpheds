\set ON_ERROR_STOP on
-- Isolation des stories : chacun ne crée et ne supprime que ses propres stories, aucune
-- modification, aucun accès anonyme, dates posées par le serveur, stories expirées invisibles
-- des autres, « vu » enregistré uniquement pour soi, fichiers du bucket privé « stories »
-- limités au dossier de l'auteur. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('73000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'story.one@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'story.two@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, is_active)
values
  ('73000000-0000-4000-8000-000000000001', 'story.one@example.invalid', 'Story One', true),
  ('73000000-0000-4000-8000-000000000002', 'story.two@example.invalid', 'Story Two', true)
on conflict (user_id) do update set display_name = excluded.display_name;

-- Stories de l'utilisateur 2 (créées en tant que propriétaire de la base) : une active, une expirée.
insert into public.stories (id, user_id, media_path, media_type, caption)
values
  ('73000000-0000-4000-8000-0000000000a1', '73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000002/active.jpg', 'image', 'Active'),
  ('73000000-0000-4000-8000-0000000000a2', '73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000002/expired.jpg', 'image', 'Expirée');
-- Le déclencheur pose les dates à l'insertion ; on vieillit ensuite la seconde story.
alter table public.stories disable trigger stories_set_server_dates;
update public.stories set expires_at = now() - interval '1 minute' where id = '73000000-0000-4000-8000-0000000000a2';
alter table public.stories enable trigger stories_set_server_dates;

insert into storage.objects (bucket_id, name, owner)
values
  ('stories', '73000000-0000-4000-8000-000000000002/active.jpg', '73000000-0000-4000-8000-000000000002'),
  ('stories', '73000000-0000-4000-8000-000000000002/expired.jpg', '73000000-0000-4000-8000-000000000002'),
  ('stories', '73000000-0000-4000-8000-000000000002/orphan.jpg', '73000000-0000-4000-8000-000000000002');

do $grants$
begin
  if has_table_privilege('anon', 'public.stories', 'select')
     or has_table_privilege('anon', 'public.stories', 'insert')
     or has_table_privilege('anon', 'public.stories', 'delete')
     or has_table_privilege('anon', 'public.story_views', 'select')
     or has_table_privilege('anon', 'public.story_views', 'insert') then
    raise exception 'anon must not access stories';
  end if;
  if has_table_privilege('authenticated', 'public.stories', 'update')
     or has_table_privilege('authenticated', 'public.story_views', 'update')
     or has_table_privilege('authenticated', 'public.story_views', 'delete') then
    raise exception 'authenticated must not update stories or views';
  end if;
  if has_column_privilege('authenticated', 'public.stories', 'created_at', 'insert')
     or has_column_privilege('authenticated', 'public.stories', 'expires_at', 'insert')
     or has_column_privilege('authenticated', 'public.story_views', 'viewed_at', 'insert') then
    raise exception 'authenticated must not choose dates';
  end if;
  if has_function_privilege('anon', 'public.get_active_stories(integer)', 'execute')
     or has_function_privilege('anon', 'public.get_story_viewers(uuid)', 'execute') then
    raise exception 'anon must not read stories';
  end if;
  if (select public from storage.buckets where id = 'stories') is distinct from false then
    raise exception 'stories bucket must be private';
  end if;
end
$grants$;

-- Anonyme : aucun fichier lisible dans le bucket.
set local role anon;
do $anon$
begin
  if exists (select 1 from storage.objects where bucket_id = 'stories') then
    raise exception 'anon reads story files';
  end if;
end
$anon$;
reset role;

select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $user_one$
declare
  v_rows integer;
  v_rejected boolean;
  v_story public.stories%rowtype;
  v_count integer;
  v_seen boolean;
  v_author text;
begin
  -- Publier pour soi : accepté, user_id par défaut = auth.uid(), dates posées par le serveur.
  insert into public.stories (id, media_path, media_type, caption, lifetime_hours)
  values ('73000000-0000-4000-8000-0000000000b1', '73000000-0000-4000-8000-000000000001/mine.jpg', 'image', 'À moi', 1);
  select * into v_story from public.stories where id = '73000000-0000-4000-8000-0000000000b1';
  if v_story.user_id <> '73000000-0000-4000-8000-000000000001' then raise exception 'author not defaulted'; end if;
  if abs(extract(epoch from (v_story.expires_at - v_story.created_at)) - 3600) > 1 then
    raise exception 'lifetime not applied by the server';
  end if;

  -- Publier au nom d'un autre : refusé.
  v_rejected := false;
  begin
    insert into public.stories (user_id, media_path, media_type)
    values ('73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000002/usurp.jpg', 'image');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'story published on behalf of another user'; end if;

  -- Pointer le fichier d'un autre : refusé.
  v_rejected := false;
  begin
    insert into public.stories (media_path, media_type)
    values ('73000000-0000-4000-8000-000000000002/active.jpg', 'image');
  exception when check_violation or unique_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'story points to another user file'; end if;

  -- Choisir sa date d'expiration : refusé (pas de droit sur expires_at).
  v_rejected := false;
  begin
    insert into public.stories (media_path, media_type, expires_at)
    values ('73000000-0000-4000-8000-000000000001/forever.jpg', 'image', now() + interval '10 years');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'expires_at accepted from client'; end if;

  -- Durée hors 1 h / 24 h : refusée.
  v_rejected := false;
  begin
    insert into public.stories (media_path, media_type, lifetime_hours)
    values ('73000000-0000-4000-8000-000000000001/long.jpg', 'image', 48);
  exception when check_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'lifetime 48 h accepted'; end if;

  -- Modifier : refusé.
  v_rejected := false;
  begin
    update public.stories set caption = 'Modifiée' where id = '73000000-0000-4000-8000-0000000000b1';
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'update accepted'; end if;

  -- La story expirée d'un autre est invisible ; l'active est visible.
  if exists (select 1 from public.stories where id = '73000000-0000-4000-8000-0000000000a2') then
    raise exception 'expired story of another user visible';
  end if;
  select count(*) into v_count from public.get_active_stories() where user_id = '73000000-0000-4000-8000-000000000002';
  if v_count <> 1 then raise exception 'active stories of user two: %', v_count; end if;

  select display_name, seen into v_author, v_seen from public.get_active_stories() where id = '73000000-0000-4000-8000-0000000000a1';
  if v_author <> 'Story Two' then raise exception 'author wrong: %', v_author; end if;
  if v_seen then raise exception 'story seen before viewing'; end if;

  -- Marquer « vu » pour soi : accepté, et l'état suit.
  insert into public.story_views (story_id) values ('73000000-0000-4000-8000-0000000000a1');
  select seen into v_seen from public.get_active_stories() where id = '73000000-0000-4000-8000-0000000000a1';
  if not v_seen then raise exception 'seen flag not updated'; end if;

  -- Marquer « vu » au nom d'un autre : refusé.
  v_rejected := false;
  begin
    insert into public.story_views (story_id, viewer_id)
    values ('73000000-0000-4000-8000-0000000000a1', '73000000-0000-4000-8000-000000000002');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'view recorded on behalf of another user'; end if;

  -- Marquer « vu » une story expirée ou la sienne : refusé.
  v_rejected := false;
  begin
    insert into public.story_views (story_id) values ('73000000-0000-4000-8000-0000000000a2');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'view on expired story accepted'; end if;

  v_rejected := false;
  begin
    insert into public.story_views (story_id) values ('73000000-0000-4000-8000-0000000000b1');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'view on own story accepted'; end if;

  -- Lister les spectateurs de la story d'un autre : rien.
  if exists (select 1 from public.get_story_viewers('73000000-0000-4000-8000-0000000000a1')) then
    raise exception 'viewers of another user story visible';
  end if;

  -- Fichiers : la story active d'un autre est lisible ; l'expirée et l'orpheline non.
  if not exists (select 1 from storage.objects where bucket_id = 'stories' and name = '73000000-0000-4000-8000-000000000002/active.jpg') then
    raise exception 'active story file not readable';
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'stories' and name in (
    '73000000-0000-4000-8000-000000000002/expired.jpg', '73000000-0000-4000-8000-000000000002/orphan.jpg')) then
    raise exception 'expired or orphan file of another user readable';
  end if;

  -- Déposer un fichier dans le dossier d'un autre : refusé ; dans le sien : accepté.
  v_rejected := false;
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('stories', '73000000-0000-4000-8000-000000000002/intrus.jpg', '73000000-0000-4000-8000-000000000001');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'upload into another user folder accepted'; end if;

  insert into storage.objects (bucket_id, name, owner)
  values ('stories', '73000000-0000-4000-8000-000000000001/mine.jpg', '73000000-0000-4000-8000-000000000001');

  -- Supprimer le fichier d'un autre : aucune ligne touchée.
  delete from storage.objects where bucket_id = 'stories' and name = '73000000-0000-4000-8000-000000000002/active.jpg';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'deleted another user file'; end if;

  -- Supprimer la story d'un autre : aucune ligne touchée.
  delete from public.stories where id = '73000000-0000-4000-8000-0000000000a1';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'deleted another user story'; end if;

  -- Supprimer sa propre story.
  delete from public.stories where id = '73000000-0000-4000-8000-0000000000b1';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'own delete removed % rows', v_rows; end if;
end
$user_one$;

reset role;

-- L'auteur voit qui a vu sa story, et le nombre de vues.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $author$
declare
  v_name text;
  v_count integer;
begin
  select display_name into v_name from public.get_story_viewers('73000000-0000-4000-8000-0000000000a1');
  if v_name is distinct from 'Story One' then raise exception 'author cannot see viewers: %', v_name; end if;
  select view_count into v_count from public.get_active_stories() where id = '73000000-0000-4000-8000-0000000000a1';
  if v_count <> 1 then raise exception 'view count wrong: %', v_count; end if;
  -- L'auteur relit sa story expirée (pour la supprimer).
  if not exists (select 1 from public.stories where id = '73000000-0000-4000-8000-0000000000a2') then
    raise exception 'author cannot read own expired story';
  end if;
end
$author$;
reset role;

-- Supprimer une story supprime ses vues ; aucun déclencheur de gamification.
delete from public.stories where id = '73000000-0000-4000-8000-0000000000a1';
do $cascade$
begin
  if exists (select 1 from public.story_views where story_id = '73000000-0000-4000-8000-0000000000a1') then
    raise exception 'views not removed with their story';
  end if;
  if exists (
    select 1 from pg_trigger
    where tgrelid in ('public.stories'::regclass, 'public.story_views'::regclass)
      and not tgisinternal
      and tgname <> 'stories_set_server_dates'
  ) then
    raise exception 'stories must not carry other triggers (stories give no XP)';
  end if;
end
$cascade$;

rollback;

select 'stories isolation: passed' as result;
