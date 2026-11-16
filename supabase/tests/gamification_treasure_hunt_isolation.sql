\set ON_ERROR_STOP on
-- Chasse au trésor : seuls les organisateurs créent chasses, étapes et codes ; le serveur
-- décide de tout (chasse ouverte, classe visée, ordre imposé, code désactivé, double scan),
-- les points ne sont donnés qu'une fois par étape, le bonus une fois par chasse, et les
-- codes inconnus sont limités à 20 par heure. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('73000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'hunt.staff@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'hunt.player@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'hunt.guest@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'hunt.player2@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, forname, family_name, display_name, classe, role, is_active)
values
  ('73000000-0000-4000-8000-000000000001', 'hunt.staff@example.invalid', 'Odile', 'Organisatrice', 'Odile Organisatrice', null, 'admin', true),
  ('73000000-0000-4000-8000-000000000002', 'hunt.player@example.invalid', 'Paul', 'Joueur', 'Paul Joueur', 'BA25', 'user', true),
  ('73000000-0000-4000-8000-000000000003', 'hunt.guest@example.invalid', 'Ines', 'Invitee', 'Ines Invitee', 'BA23', 'user', true),
  ('73000000-0000-4000-8000-000000000005', 'hunt.player2@example.invalid', 'Lea', 'Joueuse', 'Lea Joueuse', 'BA26', 'user', true)
on conflict (user_id) do update
  set role = excluded.role, is_active = true, forname = excluded.forname, family_name = excluded.family_name,
      display_name = excluded.display_name, classe = excluded.classe;

insert into gamification_private.rollout_config (singleton, rewards_enabled, audience_mode)
values (true, true, 'allowlist')
on conflict (singleton) do update set rewards_enabled = true, audience_mode = 'allowlist';

insert into gamification_private.rollout_audience (user_id, added_by)
values
  ('73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000001'),
  ('73000000-0000-4000-8000-000000000005', '73000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

-- 1. Aucun accès direct : ni anonyme sur les fonctions, ni personne sur les tables.
do $grants$
declare
  v_table text;
  v_function text;
begin
  foreach v_table in array array['treasure_hunts', 'treasure_hunt_steps', 'treasure_hunt_completions', 'scan_codes', 'scan_redemptions'] loop
    if has_table_privilege('authenticated', 'gamification_private.' || v_table, 'select')
      or has_table_privilege('authenticated', 'gamification_private.' || v_table, 'insert')
      or has_table_privilege('anon', 'gamification_private.' || v_table, 'select') then
      raise exception 'Direct access left on gamification_private.%', v_table;
    end if;
    if not (select c.relrowsecurity from pg_class c where c.oid = ('gamification_private.' || v_table)::regclass) then
      raise exception 'RLS disabled on gamification_private.%', v_table;
    end if;
  end loop;

  foreach v_function in array array[
    'public.redeem_scan_code(text)',
    'public.list_treasure_hunts()',
    'public.get_treasure_hunt(uuid)',
    'public.manage_list_treasure_hunts()',
    'public.manage_get_treasure_hunt(uuid)',
    'public.save_treasure_hunt(uuid, text, text, timestamptz, timestamptz, text[], boolean)',
    'public.set_treasure_hunt_published(uuid, boolean)',
    'public.delete_treasure_hunt(uuid)',
    'public.save_treasure_hunt_step(uuid, uuid, text, text, integer)',
    'public.delete_treasure_hunt_step(uuid)',
    'public.reorder_treasure_hunt_steps(uuid, uuid[])',
    'public.renew_treasure_hunt_step_code(uuid, boolean)'
  ] loop
    if has_function_privilege('anon', v_function, 'execute') then
      raise exception 'Anonymous can execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'Authenticated cannot execute %', v_function;
    end if;
  end loop;

  if has_function_privilege('authenticated', 'gamification_private.redeem_treasure_code(uuid, uuid, text)', 'execute') then
    raise exception 'Internal helper exposed to authenticated';
  end if;
end
$grants$;

-- 2. Un étudiant ne crée pas de chasse et ne voit pas la gestion.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000002', true);
set local role authenticated;

do $student_forbidden$
declare
  v_denied integer := 0;
begin
  begin
    perform public.save_treasure_hunt(null, 'Chasse pirate', '', now(), now() + interval '1 day', '{}', false);
  exception when others then v_denied := v_denied + 1;
  end;
  if v_denied <> 1 then
    raise exception 'A student created a hunt';
  end if;
  if (public.manage_list_treasure_hunts() ->> 'allowed')::boolean then
    raise exception 'A student reached the management list';
  end if;
end
$student_forbidden$;

-- 3. L'organisatrice crée une chasse ordonnée de 3 étapes pour BA25 et BA26.
reset role;
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $organizer$
declare
  v_hunt uuid;
  v_detail jsonb;
  v_failed integer := 0;
begin
  v_hunt := (public.save_treasure_hunt(
    null, 'Chasse de test', 'Trois QR codes cachés.', now() - interval '1 hour', now() + interval '7 days',
    array['ba25', ' BA26 '], true
  ) ->> 'id')::uuid;
  perform set_config('heds_test.hunt', v_hunt::text, true);

  begin
    perform public.set_treasure_hunt_published(v_hunt, true);
  exception when others then v_failed := v_failed + 1;
  end;
  begin
    perform public.save_treasure_hunt_step(null, v_hunt, 'Trop cher', 'Indice', 80);
  exception when others then v_failed := v_failed + 1;
  end;
  begin
    perform public.save_treasure_hunt(v_hunt, 'Chasse de test', '', now(), now() - interval '1 day', '{}', true);
  exception when others then v_failed := v_failed + 1;
  end;
  if v_failed <> 3 then
    raise exception 'Empty publish, 80 XP step and reversed dates must be refused';
  end if;

  perform public.save_treasure_hunt_step(null, v_hunt, 'Bibliothèque', 'Là où dorment les livres.', 10);
  perform public.save_treasure_hunt_step(null, v_hunt, 'Cafétéria', 'Là où l''on prend un café.', 15);
  perform public.save_treasure_hunt_step(null, v_hunt, 'Salle de pratique', 'Les tables de massage.', 20);
  perform public.set_treasure_hunt_published(v_hunt, true);

  v_detail := public.manage_get_treasure_hunt(v_hunt);
  if jsonb_array_length(v_detail -> 'steps') <> 3
    or (v_detail #>> '{hunt,target_classes}') <> '["BA25", "BA26"]'
    or exists (
      select 1 from jsonb_array_elements(v_detail -> 'steps') s
      where not (s ->> 'code_active')::boolean or s ->> 'token' !~ '^[0-9a-f]{32}$'
         or s ->> 'short_code' !~ '^[A-HJ-NP-Z2-9]{6}$'
    ) then
    raise exception 'Unexpected organizer view: %', v_detail;
  end if;

  perform set_config('heds_test.step1', v_detail #>> '{steps,0,id}', true);
  perform set_config('heds_test.step3', v_detail #>> '{steps,2,id}', true);
  perform set_config('heds_test.token1', v_detail #>> '{steps,0,token}', true);
  perform set_config('heds_test.short2', v_detail #>> '{steps,1,short_code}', true);
  perform set_config('heds_test.token3', v_detail #>> '{steps,2,token}', true);
end
$organizer$;

-- 4. Hors classe visée : la chasse n'apparaît pas et ses codes ne valent rien.
reset role;
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $guest$
declare
  v_result jsonb;
begin
  if jsonb_array_length(public.list_treasure_hunts() -> 'hunts') <> 0 then
    raise exception 'BA23 must not see a BA25/BA26 hunt';
  end if;
  v_result := public.redeem_scan_code(current_setting('heds_test.token1'));
  if v_result ->> 'status' <> 'not_eligible' then
    raise exception 'Non-targeted class must be refused: %', v_result;
  end if;
end
$guest$;

-- 5. Le joueur : ordre imposé, gain unique, double scan, bonus de fin.
reset role;
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000002', true);
set local role authenticated;

do $player$
declare
  v_result jsonb;
  v_detail jsonb;
  v_hunt uuid := current_setting('heds_test.hunt')::uuid;
begin
  v_detail := public.get_treasure_hunt(v_hunt);
  if not (v_detail ->> 'found')::boolean
    or v_detail #>> '{steps,0,hint}' is null
    or v_detail #>> '{steps,1,hint}' is not null
    or not (v_detail #>> '{steps,1,locked}')::boolean
    or v_detail #>> '{steps,0,name}' is not null then
    raise exception 'Ordered hunt must only reveal the next hint: %', v_detail;
  end if;

  v_result := public.redeem_scan_code(current_setting('heds_test.token3'));
  if v_result ->> 'status' <> 'order_required' or (v_result ->> 'expected_position')::integer <> 1 then
    raise exception 'Step 3 before step 1 must be refused: %', v_result;
  end if;

  v_result := public.redeem_scan_code(current_setting('heds_test.token1'));
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 10
    or (v_result ->> 'found')::integer <> 1 or (v_result ->> 'total')::integer <> 3 then
    raise exception 'Step 1 must give 10 XP: %', v_result;
  end if;

  v_result := public.redeem_scan_code(current_setting('heds_test.token1'));
  if v_result ->> 'status' <> 'already' then
    raise exception 'Double scan must be refused: %', v_result;
  end if;

  -- Code court saisi à la main, avec espaces et minuscules.
  v_result := public.redeem_scan_code(' ' || lower(current_setting('heds_test.short2')) || ' ');
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 15 then
    raise exception 'Step 2 by short code must give 15 XP: %', v_result;
  end if;

  v_result := public.redeem_scan_code(current_setting('heds_test.token3'));
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 20
    or not (v_result ->> 'completed')::boolean or (v_result ->> 'bonus_xp')::integer <> 20 then
    raise exception 'Last step must give 20 XP and the 20 XP bonus: %', v_result;
  end if;

  v_detail := public.get_treasure_hunt(v_hunt);
  if v_detail -> 'completed_at' = 'null'::jsonb
    or (v_detail #>> '{ranking,me,rank}')::integer <> 1
    or (v_detail #>> '{ranking,me,points}')::integer <> 65
    or v_detail #>> '{steps,0,name}' <> 'Bibliothèque' then
    raise exception 'Completed hunt view is wrong: %', v_detail;
  end if;

  if (public.list_treasure_hunts() #>> '{hunts,0,found_count}')::integer <> 3 then
    raise exception 'List must show 3 found steps';
  end if;
end
$player$;

reset role;

do $player_totals$
begin
  if (
    select count(*) from public.xp_history h
    where h.user_id = '73000000-0000-4000-8000-000000000002'
      and h.action in ('TREASURE_HUNT', 'TREASURE_HUNT_COMPLETE')
  ) <> 4 then
    raise exception 'Exactly 3 step rows and 1 bonus row expected';
  end if;
  if (
    select gd.total_xp = 65 and gd.house_points = 65 from public.gamification_data gd
    where gd.user_id = '73000000-0000-4000-8000-000000000002'
  ) is not true then
    raise exception 'XP and house points must both increase by 65';
  end if;
end
$player_totals$;

-- 6. Code photographié et partagé : l'organisatrice régénère l'étape 1 ; l'ancien code
--    est refusé, le nouveau fonctionne. Puis elle désactive l'étape 3.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $renew$
declare
  v_detail jsonb;
  v_denied integer := 0;
begin
  perform public.renew_treasure_hunt_step_code(current_setting('heds_test.step1')::uuid, false);
  perform public.renew_treasure_hunt_step_code(current_setting('heds_test.step3')::uuid, true);
  v_detail := public.manage_get_treasure_hunt(current_setting('heds_test.hunt')::uuid);
  if v_detail #>> '{steps,0,token}' = current_setting('heds_test.token1')
    or not (v_detail #>> '{steps,0,code_active}')::boolean
    or (v_detail #>> '{steps,2,code_active}')::boolean
    or (v_detail #>> '{steps,0,find_count}')::integer <> 1 then
    raise exception 'Renew/disable failed: %', v_detail;
  end if;
  perform set_config('heds_test.newtoken1', v_detail #>> '{steps,0,token}', true);

  begin
    perform public.delete_treasure_hunt_step(current_setting('heds_test.step1')::uuid);
  exception when others then v_denied := v_denied + 1;
  end;
  begin
    perform public.delete_treasure_hunt(current_setting('heds_test.hunt')::uuid);
  exception when others then v_denied := v_denied + 1;
  end;
  if v_denied <> 2 then
    raise exception 'Found steps and started hunts must not be deleted';
  end if;
end
$renew$;

reset role;
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000005', true);
set local role authenticated;

do $player2$
declare
  v_result jsonb;
  v_detail jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token1'));
  if v_result ->> 'status' <> 'code_revoked' then
    raise exception 'Old code must be refused: %', v_result;
  end if;
  v_result := public.redeem_scan_code(current_setting('heds_test.newtoken1'));
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 10 then
    raise exception 'New code must work: %', v_result;
  end if;

  v_detail := public.get_treasure_hunt(current_setting('heds_test.hunt')::uuid);
  if (v_detail #>> '{ranking,me,rank}')::integer <> 2
    or (v_detail #>> '{ranking,player_count}')::integer <> 2
    or v_detail #>> '{ranking,players,0,name}' <> 'Paul J.' then
    raise exception 'Ranking is wrong: %', v_detail -> 'ranking';
  end if;
end
$player2$;

-- 7. Chasse terminée : plus aucun gain.
reset role;
update gamification_private.treasure_hunts
set starts_at = now() - interval '3 days', ends_at = now() - interval '1 day'
where id = current_setting('heds_test.hunt')::uuid;

set local role authenticated;

do $ended$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.short2'));
  if v_result ->> 'status' <> 'hunt_ended' then
    raise exception 'Ended hunt must be refused: %', v_result;
  end if;
end
$ended$;

-- 8. Deviner des codes : au 21e code inconnu de l'heure, refus même pour un vrai code.
reset role;
delete from gamification_private.scan_attempts where user_id = '73000000-0000-4000-8000-000000000005';
insert into gamification_private.scan_attempts (user_id, outcome, attempted_at)
select '73000000-0000-4000-8000-000000000005', 'invalid', now() - interval '50 minutes' + (n || ' seconds')::interval
from generate_series(1, 20) n;

set local role authenticated;

do $rate_limit$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.short2'));
  if v_result ->> 'status' <> 'rate_limited' or v_result ->> 'retry_at' is null then
    raise exception '20 invalid codes in an hour must block: %', v_result;
  end if;
end
$rate_limit$;

reset role;

select 'gamification_treasure_hunt_isolation_ok' as result;

rollback;
