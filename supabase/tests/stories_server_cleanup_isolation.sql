\set ON_ERROR_STOP on
-- Le compte serveur (service_role) peut lire et supprimer les stories expirées ; les droits
-- des étudiants ne changent pas. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('7f000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'cleanup.author@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('7f000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'cleanup.viewer@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.stories (id, user_id, media_path, media_type, lifetime_hours)
values
  ('7f000000-0000-4000-8000-0000000000a1', '7f000000-0000-4000-8000-000000000001', '7f000000-0000-4000-8000-000000000001/ancienne.mp4', 'video', 1),
  ('7f000000-0000-4000-8000-0000000000a2', '7f000000-0000-4000-8000-000000000001', '7f000000-0000-4000-8000-000000000001/active.jpg', 'image', 24);
-- La date d'expiration est fixée par un déclencheur : on vieillit la première story.
alter table public.stories disable trigger stories_set_server_dates;
update public.stories set created_at = now() - interval '3 hours', expires_at = now() - interval '2 hours'
where id = '7f000000-0000-4000-8000-0000000000a1';
alter table public.stories enable trigger stories_set_server_dates;
insert into public.story_views (story_id, viewer_id)
values ('7f000000-0000-4000-8000-0000000000a1', '7f000000-0000-4000-8000-000000000002');

set local role service_role;

do $server$
declare
  v_expired integer;
  v_deleted integer;
begin
  select count(*) into v_expired from public.stories
  where id in ('7f000000-0000-4000-8000-0000000000a1', '7f000000-0000-4000-8000-0000000000a2')
    and expires_at < now() - interval '1 hour';
  if v_expired <> 1 then raise exception 'The server must see exactly the expired story (saw %)', v_expired; end if;

  with removed as (
    delete from public.stories where id = '7f000000-0000-4000-8000-0000000000a1' returning 1
  ) select count(*) into v_deleted from removed;
  if v_deleted <> 1 then raise exception 'The server must be able to delete an expired story'; end if;
end
$server$;

reset role;

do $check$
begin
  if exists (select 1 from public.story_views where story_id = '7f000000-0000-4000-8000-0000000000a1') then
    raise exception 'Views of a deleted story must be removed with it';
  end if;
  if not exists (select 1 from public.stories where id = '7f000000-0000-4000-8000-0000000000a2') then
    raise exception 'The active story must be kept';
  end if;
  if has_table_privilege('authenticated', 'public.stories', 'update')
     or has_table_privilege('anon', 'public.stories', 'select') then
    raise exception 'Student and visitor rights on stories must be unchanged';
  end if;
end
$check$;

rollback;

select 'stories_server_cleanup_isolation_ok' as result;
