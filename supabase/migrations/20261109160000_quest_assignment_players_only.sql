-- Les quêtes ne sont attribuées qu'aux joueurs de la gamification (public de récompenses),
-- et plus à tous les comptes étudiants : un étudiant hors public (ex. BA23 diplômé) voyait
-- une quête qu'il ne pouvait pas faire avancer.

create or replace function gamification_private.assign_eligible_quest_users(p_quest_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  insert into public.user_quest_progress (
    user_id, quest_id, status, progress, current_step, created_at, updated_at
  )
  select
    up.user_id, q.id, 'not_started', 0, 0, now(), now()
  from public.quests q
  join public.user_profiles up
    on coalesce(up.is_active, true)
   and lower(coalesce(up.role, '')) in ('etudiantphysio', 'etudiant', 'student')
  left join public.gamification_data gd on gd.user_id = up.user_id
  left join public.houses h on h.id = gd.house_id
  where q.id = p_quest_id
    and gamification_private.is_rollout_member(up.user_id)
    and coalesce(gd.current_level, 1) >= coalesce(q.min_level, 1)
    and (q.max_level is null or coalesce(gd.current_level, 1) <= q.max_level)
    and (
      coalesce(array_length(q.target_houses, 1), 0) = 0
      or exists (
        select 1 from unnest(q.target_houses) target_house(name)
        where lower(target_house.name) = lower(coalesce(h.name, ''))
      )
    )
  on conflict (user_id, quest_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function gamification_private.assign_eligible_quest_users(uuid) from public, anon, authenticated;
