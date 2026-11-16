\set ON_ERROR_STOP on
-- Notifications push : un anonyme ne peut plus diffuser à tous, un étudiant ne voit ni ne
-- modifie que ses propres notifications, les liens externes sont refusés, seule
-- l'administration peut diffuser. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('7b000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'push.student@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('7b000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'push.admin@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('7b000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'push.other@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, forname, family_name, display_name, classe, role, is_active)
values
  ('7b000000-0000-4000-8000-000000000001', 'push.student@example.invalid', 'Eve', 'Etudiante', 'Eve Etudiante', 'BA25', 'user', true),
  ('7b000000-0000-4000-8000-000000000002', 'push.admin@example.invalid', 'Ada', 'Admin', 'Ada Admin', null, 'admin', true),
  ('7b000000-0000-4000-8000-000000000003', 'push.other@example.invalid', 'Oscar', 'Autre', 'Oscar Autre', 'BA25', 'user', true)
on conflict (user_id) do update
  set role = excluded.role, is_active = true, classe = excluded.classe;

-- Une diffusion légitime en attente, écrite par le serveur.
insert into public.push_outbox (id, user_id, title, body, url)
values ('7b000000-0000-4000-8000-0000000000b1', null, 'Information', 'Diffusion officielle', '/annonces');

-- 1. Visiteur anonyme : aucune écriture, aucune lecture.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $anon$
declare
  v_refused boolean := false;
begin
  begin
    insert into public.push_outbox (title, body, url)
    values ('Sécurité', 'Changez votre mot de passe', 'https://hameconnage.invalid/login');
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'An anonymous visitor must not queue a broadcast push'; end if;

  v_refused := false;
  begin
    update public.push_subscriptions set endpoint = 'https://hijack.invalid' where user_id is null;
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'An anonymous visitor must not modify guest subscriptions'; end if;
end
$anon$;

reset role;

-- 2. Étudiant : seulement ses propres notifications, liens internes uniquement.
set local role authenticated;
select set_config('request.jwt.claim.sub', '7b000000-0000-4000-8000-000000000001', true);

do $student$
declare
  v_refused boolean := false;
  v_count integer;
begin
  begin
    insert into public.push_outbox (user_id, title, body, url) values (null, 'Tous', 'Spam', '/');
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'A student must not broadcast to everyone'; end if;

  v_refused := false;
  begin
    insert into public.push_outbox (user_id, title, body, url)
    values ('7b000000-0000-4000-8000-000000000003', 'Salut', 'Message', '/');
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'A student must not push to another account'; end if;

  v_refused := false;
  begin
    insert into public.push_outbox (user_id, title, body, url)
    values ('7b000000-0000-4000-8000-000000000001', 'Test', 'Lien externe', 'https://hameconnage.invalid');
  exception when check_violation then v_refused := true;
  end;
  if not v_refused then raise exception 'An external link must be refused'; end if;

  v_refused := false;
  begin
    insert into public.push_outbox (user_id, title, body, url)
    values ('7b000000-0000-4000-8000-000000000001', 'Test', 'Lien protocole relatif', '//hameconnage.invalid');
  exception when check_violation then v_refused := true;
  end;
  if not v_refused then raise exception 'A protocol-relative link must be refused'; end if;

  -- Une notification à soi-même avec un lien interne reste possible.
  insert into public.push_outbox (user_id, title, body, url)
  values ('7b000000-0000-4000-8000-000000000001', 'Test', 'Mon appareil', '/reglages');

  select count(*) into v_count from public.push_outbox where user_id is null;
  if v_count <> 0 then raise exception 'A student must not see broadcast rows (saw %)', v_count; end if;

  with changed as (
    update public.push_outbox set url = '/piege' where id = '7b000000-0000-4000-8000-0000000000b1' returning 1
  ) select count(*) into v_count from changed;
  if v_count <> 0 then raise exception 'A student must not rewrite a pending broadcast'; end if;

  with removed as (
    delete from public.push_outbox where id = '7b000000-0000-4000-8000-0000000000b1' returning 1
  ) select count(*) into v_count from removed;
  if v_count <> 0 then raise exception 'A student must not delete a broadcast'; end if;
end
$student$;

reset role;

do $check$
begin
  if (select url from public.push_outbox where id = '7b000000-0000-4000-8000-0000000000b1') <> '/annonces' then
    raise exception 'The pending broadcast was modified';
  end if;
end
$check$;

-- 3. Administration : peut diffuser, toujours avec un lien interne.
set local role authenticated;
select set_config('request.jwt.claim.sub', '7b000000-0000-4000-8000-000000000002', true);

do $admin$
declare
  v_refused boolean := false;
begin
  insert into public.push_outbox (user_id, title, body, url) values (null, 'Annonce', 'Pour tous', '/annonces');
  insert into public.push_outbox (user_id, title, body, url)
  values ('7b000000-0000-4000-8000-000000000003', 'Rappel', 'Pour Oscar', '/mentorat');

  begin
    insert into public.push_outbox (user_id, title, body, url) values (null, 'Annonce', 'Externe', 'https://example.invalid');
  exception when check_violation then v_refused := true;
  end;
  if not v_refused then raise exception 'Even an admin broadcast must use an internal link'; end if;
end
$admin$;

reset role;

rollback;

select 'push_outbox_security_isolation_ok' as result;
