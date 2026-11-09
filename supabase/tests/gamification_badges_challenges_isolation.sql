begin;

do $$
declare
  v_user uuid;
  v_admin uuid;
  v_badge uuid := gen_random_uuid();
  v_historical_badge uuid := gen_random_uuid();
  v_before_total integer;
  v_after_total integer;
  v_preview jsonb;
  v_progress jsonb;
begin
  if exists (
    select 1 from public.badges b
    where b.is_active = true
      and jsonb_typeof(b.conditions -> 'action_count') = 'object'
  ) then
    raise exception 'Nested active badge conditions remain';
  end if;

  if exists (
    select 1 from public.badges b
    where b.is_active = true
      and not coalesce(
        (gamification_private.validate_badge_conditions(b.conditions) ->> 'valid')::boolean,
        false
      )
  ) then
    raise exception 'Unsupported active badge condition remains';
  end if;

  if has_function_privilege('authenticated', 'gamification_private.validate_badge_conditions(jsonb)', 'execute')
    or has_function_privilege('anon', 'gamification_private.apply_badge_bonus_internal(uuid,uuid,text)', 'execute') then
    raise exception 'A private badge function is executable by an API role';
  end if;

  begin
    insert into public.badges (
      id, name, description, icon, rarity, xp_bonus, conditions, is_active
    ) values (
      gen_random_uuid(), 'TEST invalide HEDS25-619', 'Refus attendu', 'pi pi-ban',
      'common', 1, jsonb_build_object('quiz_complete', true), true
    );
    raise exception 'Unsupported active badge was accepted';
  exception
    when others then
      if sqlerrm = 'Unsupported active badge was accepted' then raise; end if;
  end;

  select gd.user_id into v_user
  from public.gamification_data gd
  join public.user_profiles up on up.user_id = gd.user_id
  limit 1;
  if v_user is null then raise exception 'No gamification fixture user'; end if;

  insert into public.badges (
    id, name, description, icon, rarity, xp_bonus, conditions, is_active
  ) values (
    v_badge, 'TEST HEDS25-619', 'Badge transactionnel', 'pi pi-star',
    'common', 17,
    jsonb_build_object('action_count', true, 'action_type', 'POST', 'count', 1),
    true
  );

  select count(*) into v_before_total
  from public.xp_history
  where user_id = v_user and event_key = 'badge:' || v_badge::text;

  insert into public.user_badges (user_id, badge_id, earned_at)
  values (v_user, v_badge, now());

  insert into public.user_badges (user_id, badge_id, earned_at)
  values (v_user, v_badge, now())
  on conflict (user_id, badge_id) do nothing;

  select count(*) into v_after_total
  from public.xp_history
  where user_id = v_user and event_key = 'badge:' || v_badge::text;

  if v_before_total <> 0 or v_after_total <> 1 then
    raise exception 'Badge bonus is not exactly-once';
  end if;

  if not exists (
    select 1 from public.user_badges ub
    where ub.user_id = v_user and ub.badge_id = v_badge
      and ub.reward_origin = 'earned'
      and ub.reward_rule_version = 'gamification-badges-v1'
  ) then
    raise exception 'Badge provenance was not recorded';
  end if;

  insert into public.badges (
    id, name, description, icon, rarity, xp_bonus, conditions, is_active
  ) values (
    v_historical_badge, 'TEST historique HEDS25-619', 'Sans bonus', 'pi pi-history',
    'common', 99, jsonb_build_object('total_xp', 1), true
  );

  perform gamification_private.apply_badge_bonus_internal(
    v_user, v_historical_badge, 'historical_import'
  );
  if exists (
    select 1 from public.xp_history
    where user_id = v_user and event_key = 'badge:' || v_historical_badge::text
  ) then
    raise exception 'Historical origin incorrectly awarded a bonus';
  end if;

  select up.user_id into v_admin
  from public.user_profiles up
  where lower(coalesce(up.role, '')) in ('admin', 'administrateur', 'superadmin')
  limit 1;
  if v_admin is null then raise exception 'No admin fixture user'; end if;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  v_preview := public.preview_gamification_catalog_alignment();
  if coalesce((v_preview ->> 'write_performed')::boolean, true)
    or coalesce((v_preview ->> 'unsupported_active_badges')::integer, -1) <> 0 then
    raise exception 'Admin catalogue preview is inconsistent: %', v_preview;
  end if;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  v_progress := public.get_my_badge_progress();
  if jsonb_typeof(v_progress) <> 'array' then
    raise exception 'Personal badge progress did not return an array';
  end if;
end;
$$;

rollback;
