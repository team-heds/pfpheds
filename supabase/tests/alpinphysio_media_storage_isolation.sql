\set ON_ERROR_STOP on

-- Vérifie que seuls les responsables Alp'in Physio peuvent déposer, remplacer
-- ou retirer un fichier de l'espace « alpinphysio ». Tout est annulé à la fin.

begin;

select set_config('heds_test.media_manager_uid',
  (select id::text from auth.users order by created_at, id limit 1), true);
select set_config('heds_test.media_student_uid',
  (select id::text from auth.users order by created_at, id offset 1 limit 1), true);

do $setup$
begin
  if coalesce(current_setting('heds_test.media_student_uid'), '') = '' then
    raise exception 'Media test requires two auth users';
  end if;
  if not exists (select 1 from storage.buckets where id = 'alpinphysio' and public) then
    raise exception 'The public alpinphysio bucket must exist';
  end if;

  insert into public.user_track_roles (user_id, track_id, role, is_active)
  values (current_setting('heds_test.media_manager_uid')::uuid, 'ALPIN', 'COORDINATOR', true)
  on conflict (user_id, track_id, role) do update set is_active = true;
  -- Le second compte ne doit avoir aucun accès Alp'in Physio pendant le test.
  update public.user_track_roles set is_active = false
  where user_id = current_setting('heds_test.media_student_uid')::uuid and track_id = 'ALPIN';
end
$setup$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('heds_test.media_manager_uid'), true);

do $manager$
begin
  if not public.app_is_alpinphysio_manager() then
    raise exception 'Test setup: first account must be an Alp''in manager';
  end if;
  insert into storage.objects (bucket_id, name, owner)
  values ('alpinphysio', 'tests/isolation-photo.webp', auth.uid());
end
$manager$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.media_student_uid'), true);

do $student$
declare
  v_refused boolean := false;
  v_changed integer;
  v_visible integer;
begin
  if public.app_is_alpinphysio_manager() then
    raise exception 'Test setup: second account must not be an Alp''in manager (use a student account)';
  end if;

  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('alpinphysio', 'tests/isolation-forbidden.webp', auth.uid());
  exception when insufficient_privilege or check_violation then
    v_refused := true;
  end;
  if not v_refused then
    raise exception 'A student must not upload to the alpinphysio bucket';
  end if;

  with changed as (
    update storage.objects set name = 'tests/isolation-renamed.webp'
    where bucket_id = 'alpinphysio' and name = 'tests/isolation-photo.webp'
    returning 1
  ) select count(*) into v_changed from changed;
  if v_changed <> 0 then
    raise exception 'A student must not replace an alpinphysio file';
  end if;

  with removed as (
    delete from storage.objects
    where bucket_id = 'alpinphysio' and name = 'tests/isolation-photo.webp'
    returning 1
  ) select count(*) into v_changed from removed;
  if v_changed <> 0 then
    raise exception 'A student must not remove an alpinphysio file';
  end if;

  select count(*) into v_visible from storage.objects
  where bucket_id = 'alpinphysio' and name = 'tests/isolation-photo.webp';
  if v_visible <> 1 then
    raise exception 'alpinphysio files must stay readable';
  end if;
end
$student$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.media_manager_uid'), true);

do $cleanup$
declare
  v_changed integer;
begin
  with removed as (
    delete from storage.objects
    where bucket_id = 'alpinphysio' and name = 'tests/isolation-photo.webp'
    returning 1
  ) select count(*) into v_changed from removed;
  if v_changed <> 1 then
    raise exception 'A manager must be able to remove an alpinphysio file';
  end if;
end
$cleanup$;

reset role;
rollback;

select 'alpinphysio_media_storage_isolation_ok' as result;
