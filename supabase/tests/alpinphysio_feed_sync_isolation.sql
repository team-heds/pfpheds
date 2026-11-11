\set ON_ERROR_STOP on

-- Vérifie que la publication du fil d'actualité d'un événement Alp'in Physio
-- est tenue à jour par la base, y compris quand un second responsable modifie
-- l'événement. Tout est annulé à la fin (rollback).

begin;

select set_config(
  'heds_test.alpin_owner_uid',
  (select id::text from auth.users order by created_at, id limit 1),
  true
);
select set_config(
  'heds_test.alpin_colleague_uid',
  (select id::text from auth.users where id <> current_setting('heds_test.alpin_owner_uid')::uuid order by created_at, id limit 1),
  true
);

do $setup$
declare
  owner_uid uuid := current_setting('heds_test.alpin_owner_uid')::uuid;
  colleague_uid uuid := current_setting('heds_test.alpin_colleague_uid')::uuid;
begin
  if owner_uid is null or colleague_uid is null then
    raise exception 'Alp''in feed test requires two auth users';
  end if;

  insert into public.user_track_roles (user_id, track_id, role, is_active)
  values (owner_uid, 'ALPIN', 'COORDINATOR', true), (colleague_uid, 'ALPIN', 'COORDINATOR', true)
  on conflict (user_id, track_id, role) do update set is_active = true;
end
$setup$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('heds_test.alpin_owner_uid'), true);

do $owner$
declare
  v_post public.posts%rowtype;
  v_count integer;
begin
  insert into public.events (
    id, title, description, lieu, start_date, end_date, type, association_id,
    admin_uid, status, show_on_public_site, show_in_feed
  ) values (
    'a1200000-0000-0000-0000-000000000001',
    'Course <b>test</b> & co',
    'Massages <script>alert(1)</script>',
    'Zinal',
    '2027-08-14 06:00:00+00',
    '2027-08-14 15:00:00+00',
    'alpinphysio', 'alpinphysio', auth.uid()::text, 'published', true, true
  );

  select * into v_post from public.posts where event_id = 'a1200000-0000-0000-0000-000000000001';
  if not found then
    raise exception 'A published Alp''in event must create its feed post';
  end if;
  if v_post.user_id <> auth.uid() then
    raise exception 'The feed post must belong to the event creator';
  end if;
  if v_post.content like '%<b>%' or v_post.content like '%<script>%' then
    raise exception 'Event text must be escaped in the feed post: %', v_post.content;
  end if;
  if v_post.content not like '%Course &lt;b&gt;test&lt;/b&gt; &amp; co%' then
    raise exception 'Escaped title missing from the feed post: %', v_post.content;
  end if;
  if v_post.content not like '%14.08.2027 à 08:00 · Zinal%' then
    raise exception 'Local date and place missing from the feed post: %', v_post.content;
  end if;

  -- Un brouillon ne publie rien.
  insert into public.events (
    id, title, start_date, end_date, type, association_id, admin_uid, status, show_in_feed
  ) values (
    'a1200000-0000-0000-0000-000000000002', 'Brouillon', now() + interval '2 days',
    now() + interval '2 days 2 hours', 'alpinphysio', 'alpinphysio', auth.uid()::text, 'draft', true
  );
  select count(*) into v_count from public.posts where event_id = 'a1200000-0000-0000-0000-000000000002';
  if v_count <> 0 then
    raise exception 'A draft event must not create a feed post';
  end if;
end
$owner$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.alpin_colleague_uid'), true);

do $colleague$
declare
  v_post public.posts%rowtype;
  v_count integer;
begin
  -- Un second responsable modifie l'événement : la publication suit.
  update public.events set title = 'Course renommée'
  where id = 'a1200000-0000-0000-0000-000000000001';

  select * into v_post from public.posts where event_id = 'a1200000-0000-0000-0000-000000000001';
  if v_post.content not like '%Course renommée%' then
    raise exception 'A colleague''s edit must refresh the feed post: %', v_post.content;
  end if;
  if v_post.user_id::text <> current_setting('heds_test.alpin_owner_uid') then
    raise exception 'The feed post must keep the event creator as author';
  end if;
  select count(*) into v_count from public.posts where event_id = 'a1200000-0000-0000-0000-000000000001';
  if v_count <> 1 then
    raise exception 'Exactly one feed post per event expected, got %', v_count;
  end if;

  -- Il publie le brouillon du collègue : la publication apparaît.
  update public.events set status = 'published'
  where id = 'a1200000-0000-0000-0000-000000000002';
  select count(*) into v_count from public.posts where event_id = 'a1200000-0000-0000-0000-000000000002';
  if v_count <> 1 then
    raise exception 'Publishing a colleague''s draft must create the feed post';
  end if;

  -- Il annule l'événement : la publication disparaît.
  update public.events set status = 'cancelled'
  where id = 'a1200000-0000-0000-0000-000000000001';
  select count(*) into v_count from public.posts where event_id = 'a1200000-0000-0000-0000-000000000001';
  if v_count <> 0 then
    raise exception 'A cancelled event must remove its feed post';
  end if;

  -- Il retire l'autre du fil d'actualité.
  update public.events set show_in_feed = false
  where id = 'a1200000-0000-0000-0000-000000000002';
  select count(*) into v_count from public.posts where event_id = 'a1200000-0000-0000-0000-000000000002';
  if v_count <> 0 then
    raise exception 'Unticking the feed option must remove the feed post';
  end if;

  -- Les fonctions internes ne sont pas appelables directement.
  begin
    perform public.alpinphysio_html_escape('<b>');
    raise exception 'alpinphysio_html_escape must not be callable by users';
  exception when insufficient_privilege then null;
  end;
end
$colleague$;

reset role;
rollback;

select 'alpinphysio_feed_sync_isolation_ok' as result;
