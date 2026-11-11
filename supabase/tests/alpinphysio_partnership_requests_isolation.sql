\set ON_ERROR_STOP on

-- Vérifie le dépôt public des demandes de partenariat Alp'in Physio et leur
-- confidentialité. Tout est annulé à la fin (rollback).

begin;

select set_config('heds_test.pr_manager_uid',
  (select id::text from auth.users order by created_at, id limit 1), true);
select set_config('heds_test.pr_student_uid',
  (select id::text from auth.users order by created_at, id offset 1 limit 1), true);

do $setup$
begin
  if coalesce(current_setting('heds_test.pr_student_uid'), '') = '' then
    raise exception 'Partnership test requires two auth users';
  end if;
  insert into public.user_track_roles (user_id, track_id, role, is_active)
  values (current_setting('heds_test.pr_manager_uid')::uuid, 'ALPIN', 'COORDINATOR', true)
  on conflict (user_id, track_id, role) do update set is_active = true;
  update public.user_track_roles set is_active = false
  where user_id = current_setting('heds_test.pr_student_uid')::uuid and track_id = 'ALPIN';
end
$setup$;

-- Visiteur sans compte.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $visitor$
declare
  v_refused boolean;
begin
  if not public.submit_alpinphysio_partnership_request(jsonb_build_object(
    'organization', '  Trail des Tests  ', 'contact_name', 'Camille Exemple',
    'email', '  Camille@Example.INVALID ', 'phone', '+41 79 000 00 00',
    'event_date', '2027-08-14', 'location', 'Zinal', 'masseurs_count', '8',
    'message', 'Arrivée prévue dès 11h.'
  )) then
    raise exception 'A valid request must be accepted';
  end if;

  -- Champ piège rempli : réponse positive, rien d'enregistré (vérifié plus bas).
  perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
    'organization', 'Robot', 'contact_name', 'Robot', 'email', 'robot@example.invalid', 'website', 'http://spam.invalid'
  ));

  v_refused := false;
  begin
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Course', 'contact_name', 'Personne', 'email', 'pas-une-adresse'));
  exception when others then v_refused := sqlstate = '22023';
  end;
  if not v_refused then raise exception 'An invalid e-mail must be refused'; end if;

  v_refused := false;
  begin
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Course', 'contact_name', 'Personne', 'email', 'a@example.invalid', 'masseurs_count', 'beaucoup'));
  exception when others then v_refused := sqlstate = '22023';
  end;
  if not v_refused then raise exception 'A non-numeric count must be refused'; end if;

  -- Ni lecture ni écriture directe.
  v_refused := false;
  begin
    perform 1 from public.alpinphysio_partnership_requests;
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'A visitor must not read partnership requests'; end if;

  v_refused := false;
  begin
    insert into public.alpinphysio_partnership_requests (organization, contact_name, email)
    values ('Direct', 'Direct', 'direct@example.invalid');
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'A visitor must not insert directly'; end if;
end
$visitor$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('heds_test.pr_student_uid'), true);

do $student$
declare
  v_visible integer;
  v_changed integer;
begin
  select count(*) into v_visible from public.alpinphysio_partnership_requests;
  if v_visible <> 0 then
    raise exception 'A student must not see partnership requests';
  end if;
  with changed as (
    update public.alpinphysio_partnership_requests set status = 'archived' returning 1
  ) select count(*) into v_changed from changed;
  if v_changed <> 0 then
    raise exception 'A student must not update partnership requests';
  end if;
end
$student$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.pr_manager_uid'), true);

do $manager$
declare
  v_row public.alpinphysio_partnership_requests%rowtype;
  v_count integer;
begin
  select count(*) into v_count from public.alpinphysio_partnership_requests where email like '%@example.invalid';
  if v_count <> 1 then
    raise exception 'Exactly one stored request expected (honeypot and invalid ones dropped), got %', v_count;
  end if;

  select * into v_row from public.alpinphysio_partnership_requests where email = 'camille@example.invalid';
  if v_row.organization <> 'Trail des Tests' or v_row.masseurs_count <> 8
     or v_row.event_date <> date '2027-08-14' or v_row.status <> 'new' then
    raise exception 'Stored request is not cleaned as expected: %', row_to_json(v_row);
  end if;

  update public.alpinphysio_partnership_requests
  set status = 'in_progress', internal_notes = 'Rappeler lundi', handled_by = auth.uid()
  where id = v_row.id;
  if not found then
    raise exception 'A manager must be able to update a request';
  end if;
end
$manager$;

reset role;

-- Garde-fou contre l'envoi en masse.
do $flood$
declare
  v_refused boolean := false;
begin
  insert into public.alpinphysio_partnership_requests (organization, contact_name, email)
  select 'Lot ' || n, 'Contact ' || n, 'lot' || n || '@example.invalid' from generate_series(1, 30) n;
  begin
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Une de trop', 'contact_name', 'Personne', 'email', 'trop@example.invalid'));
  exception when raise_exception then v_refused := true;
  end;
  if not v_refused then
    raise exception 'More than 30 requests per hour must be refused';
  end if;
end
$flood$;

rollback;

select 'alpinphysio_partnership_requests_isolation_ok' as result;
