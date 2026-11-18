\set ON_ERROR_STOP on
-- 1. Un étudiant ne peut pas supprimer sa propre fiche profil (ni son historique d'XP).
-- 2. Formulaire Alp'in Physio : 5 demandes par heure et par IP, 3 par jour et par e-mail ;
--    un robot sur une seule connexion ne bloque plus les autres visiteurs.
-- Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('7e000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'self.student@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, forname, family_name, display_name, classe, role, is_active)
values ('7e000000-0000-4000-8000-000000000001', 'self.student@example.invalid', 'Eve', 'Etudiante', 'Eve Etudiante', 'BA25', 'user', true)
on conflict (user_id) do update set role = excluded.role, is_active = true, classe = excluded.classe;

insert into public.xp_history (user_id, amount, action, description, event_key)
values ('7e000000-0000-4000-8000-000000000001', 25, 'WORD_OF_DAY', 'Test', 'self-service-test:1');

set local role authenticated;
select set_config('request.jwt.claim.sub', '7e000000-0000-4000-8000-000000000001', true);

do $student$
declare
  v_deleted integer;
begin
  with removed as (
    delete from public.user_profiles where user_id = '7e000000-0000-4000-8000-000000000001' returning 1
  ) select count(*) into v_deleted from removed;
  if v_deleted <> 0 then raise exception 'A student must not delete their own profile'; end if;
end
$student$;

reset role;

do $check$
begin
  if not exists (select 1 from public.user_profiles where user_id = '7e000000-0000-4000-8000-000000000001') then
    raise exception 'The profile must still exist';
  end if;
  if not exists (select 1 from public.xp_history where event_key = 'self-service-test:1') then
    raise exception 'The XP history must still exist';
  end if;
end
$check$;

-- Formulaire public : visiteur anonyme derrière la passerelle.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $robot$
declare
  v_refused boolean := false;
  i integer;
begin
  -- Le client tente de falsifier l'en-tête ; seule la dernière adresse (passerelle) compte.
  perform set_config('request.headers', '{"x-forwarded-for": "198.51.100.1, 203.0.113.7"}', true);
  for i in 1..5 loop
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Robot ' || i, 'contact_name', 'Robot', 'email', 'robot' || i || '@example.invalid'));
  end loop;

  perform set_config('request.headers', '{"x-forwarded-for": "198.51.100.99, 203.0.113.7"}', true);
  begin
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Robot 6', 'contact_name', 'Robot', 'email', 'robot6@example.invalid'));
  exception when raise_exception then v_refused := true;
  end;
  if not v_refused then raise exception 'A 6th request from the same connection within an hour must be refused'; end if;

  -- Un autre visiteur n'est pas bloqué par le robot.
  perform set_config('request.headers', '{"x-forwarded-for": "192.0.2.10"}', true);
  if not public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Club réel', 'contact_name', 'Vraie Personne', 'email', 'club@example.invalid')) then
    raise exception 'A legitimate visitor must still be able to send a request';
  end if;

  -- Même adresse e-mail : 3 par jour, depuis des connexions différentes.
  perform set_config('request.headers', '{"x-forwarded-for": "192.0.2.11"}', true);
  perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
    'organization', 'Club réel', 'contact_name', 'Vraie Personne', 'email', 'Club@example.invalid'));
  perform set_config('request.headers', '{"x-forwarded-for": "192.0.2.12"}', true);
  perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
    'organization', 'Club réel', 'contact_name', 'Vraie Personne', 'email', 'club@example.invalid'));
  v_refused := false;
  perform set_config('request.headers', '{"x-forwarded-for": "192.0.2.13"}', true);
  begin
    perform public.submit_alpinphysio_partnership_request(jsonb_build_object(
      'organization', 'Club réel', 'contact_name', 'Vraie Personne', 'email', 'club@example.invalid'));
  exception when raise_exception then v_refused := true;
  end;
  if not v_refused then raise exception 'A 4th request for the same e-mail within a day must be refused'; end if;
end
$robot$;

reset role;

do $stored$
begin
  if exists (
    select 1 from public.alpinphysio_partnership_requests
    where email like '%@example.invalid' and client_key is not null and client_key !~ '^[0-9a-f]{32}$'
  ) then
    raise exception 'Only a hashed client key may be stored';
  end if;
  if (select count(*) from public.alpinphysio_partnership_requests where client_key = md5('alpinphysio-partnership:203.0.113.7')) <> 5 then
    raise exception 'The gateway address must be used for the per-connection limit';
  end if;
end
$stored$;

rollback;

select 'profile_delete_and_partnership_limits_isolation_ok' as result;
