-- Badges à seuil (total d'XP ou niveau) : attribués quel que soit le gain qui fait franchir
-- le seuil.
--
-- Avant : seul le moteur d'actions (connexion, profil, publication) vérifiait ces badges,
-- en comparant l'état avant et après l'action. Un seuil franchi par un autre gain (bonus de
-- série, mot du jour, quiz, mentorat, présence, attribution de maison…) ne donnait pas le
-- badge ; et à l'action suivante le seuil était « déjà atteint avant », donc le badge
-- n'était jamais attribué.
--
-- Maintenant : gamification_award_xp_internal, par où passent tous les gains d'XP, vérifie
-- les badges à seuil au moment exact où le total ou le niveau franchit le seuil.
--   - Seul un franchissement compte (ancien total < seuil <= nouveau total) : un total déjà
--     au-dessus du seuil n'est jamais récompensé après coup.
--   - Réservé au public de la gamification, comme le moteur d'actions.
--   - Le bonus du badge reste payé une seule fois par le déclencheur existant sur
--     user_badges ; un bonus peut à son tour faire franchir un autre seuil.
--
-- Migration idempotente, sans écriture sur les données existantes.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create or replace function gamification_private.unlock_threshold_badges(
  p_user_id uuid,
  p_old_total integer,
  p_new_total integer,
  p_old_level integer,
  p_new_level integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge record;
  v_threshold integer;
  v_crossed boolean;
  v_unlocked jsonb := '[]'::jsonb;
begin
  if p_user_id is null
     or (coalesce(p_new_total, 0) <= coalesce(p_old_total, 0)
         and coalesce(p_new_level, 1) <= coalesce(p_old_level, 1))
     or not gamification_private.is_rollout_member(p_user_id) then
    return v_unlocked;
  end if;

  for v_badge in
    select b.id, b.name, b.rarity, coalesce(b.xp_bonus, 0) as xp_bonus,
           coalesce(b.conditions, '{}'::jsonb) as conditions
    from public.badges b
    where b.is_active = true
      and (b.conditions ? 'total_xp' or b.conditions ? 'level')
      and not exists (
        select 1 from public.user_badges ub
        where ub.user_id = p_user_id and ub.badge_id = b.id
      )
    order by b.created_at, b.id
  loop
    v_crossed := false;

    if v_badge.conditions ? 'total_xp'
       and coalesce(v_badge.conditions ->> 'total_xp', '') ~ '^[0-9]{1,9}$' then
      v_threshold := (v_badge.conditions ->> 'total_xp')::integer;
      v_crossed := coalesce(p_old_total, 0) < v_threshold
        and coalesce(p_new_total, 0) >= v_threshold;
    elsif v_badge.conditions ? 'level'
       and coalesce(v_badge.conditions ->> 'level', '') ~ '^[0-9]{1,9}$' then
      v_threshold := (v_badge.conditions ->> 'level')::integer;
      v_crossed := coalesce(p_old_level, 1) < v_threshold
        and coalesce(p_new_level, 1) >= v_threshold;
    end if;

    if v_crossed then
      -- Le déclencheur existant sur user_badges paie le bonus du badge, une seule fois.
      insert into public.user_badges (user_id, badge_id, earned_at)
      values (p_user_id, v_badge.id, now())
      on conflict (user_id, badge_id) do nothing;

      if found then
        v_unlocked := v_unlocked || jsonb_build_array(jsonb_build_object(
          'id', v_badge.id,
          'name', v_badge.name,
          'rarity', v_badge.rarity,
          'xp_bonus', v_badge.xp_bonus
        ));
      end if;
    end if;
  end loop;

  return v_unlocked;
end;
$$;

revoke all on function gamification_private.unlock_threshold_badges(uuid, integer, integer, integer, integer)
  from public, anon, authenticated;

-- Même fonction qu'avant, avec la vérification des badges à seuil après l'écriture du gain.
create or replace function public.gamification_award_xp_internal(
  p_user_id uuid,
  p_action text,
  p_amount integer,
  p_event_key text,
  p_source_type text default null,
  p_source_id uuid default null,
  p_description text default null
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_history_id uuid;
  v_old_level integer;
  v_new_level integer;
  v_old_total integer;
  v_new_total integer;
  v_badges jsonb := '[]'::jsonb;
  v_result jsonb;
begin
  if p_user_id is null or p_amount <= 0 or nullif(btrim(p_event_key), '') is null then
    raise exception 'Invalid gamification award';
  end if;

  insert into public.gamification_data (
    user_id,
    email,
    total_xp,
    current_level,
    house_points
  )
  values (
    p_user_id,
    coalesce((select email from auth.users where id = p_user_id), ''),
    0,
    1,
    0
  )
  on conflict (user_id) do nothing;

  select gd.current_level, gd.total_xp
  into v_old_level, v_new_total
  from public.gamification_data gd
  where gd.user_id = p_user_id
  for update;

  insert into public.xp_history (
    user_id,
    amount,
    action,
    description,
    source_type,
    source_id,
    total_xp_after,
    event_key
  )
  values (
    p_user_id,
    p_amount,
    upper(p_action),
    p_description,
    p_source_type,
    p_source_id,
    v_new_total,
    p_event_key
  )
  on conflict (user_id, event_key) where event_key is not null do nothing
  returning id into v_history_id;

  if v_history_id is null then
    return jsonb_build_object(
      'awarded', false,
      'duplicate', true,
      'xp_gained', 0,
      'total_xp', v_new_total,
      'current_level', v_old_level
    );
  end if;

  v_old_total := v_new_total;
  v_new_total := v_new_total + p_amount;
  v_new_level := public.calculate_level_from_xp(v_new_total);

  update public.gamification_data
  set total_xp = v_new_total,
      current_level = v_new_level,
      house_points = coalesce(house_points, 0) + p_amount,
      updated_at = now()
  where user_id = p_user_id;

  update public.xp_history
  set total_xp_after = v_new_total
  where id = v_history_id;

  v_result := jsonb_build_object(
    'awarded', true,
    'duplicate', false,
    'xp_gained', p_amount,
    'total_xp', v_new_total,
    'old_level', v_old_level,
    'current_level', v_new_level,
    'level_up', v_new_level > v_old_level
  );

  -- Badges à seuil franchis par ce gain. Un incident ici ne doit jamais annuler le gain.
  begin
    v_badges := gamification_private.unlock_threshold_badges(
      p_user_id, v_old_total, v_new_total, v_old_level, v_new_level
    );
  exception when others then
    raise warning 'threshold badges skipped for %: %', p_user_id, sqlerrm;
    v_badges := '[]'::jsonb;
  end;

  if jsonb_array_length(v_badges) > 0 then
    -- Le bonus des badges a pu faire évoluer le total : on renvoie l'état à jour.
    select gd.total_xp, gd.current_level
    into v_new_total, v_new_level
    from public.gamification_data gd
    where gd.user_id = p_user_id;

    v_result := v_result || jsonb_build_object(
      'total_xp', v_new_total,
      'current_level', v_new_level,
      'level_up', v_new_level > v_old_level,
      'badges_unlocked', v_badges
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.gamification_award_xp_internal(uuid, text, integer, text, text, uuid, text)
  from public, anon, authenticated;

notify pgrst, 'reload schema';
