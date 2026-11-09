-- Secure, auditable SI postulation assignment workflow for module managers.

create table if not exists public.si_postulation_assignment_history (
  id uuid primary key default gen_random_uuid(),
  slot_id bigint not null references public.planning_time_slots(id) on delete cascade,
  module_code text not null,
  assigned_by uuid not null references auth.users(id),
  assigned_teacher_ids uuid[] not null,
  assigned_teacher_labels text[] not null,
  previous_teachers text[] not null default '{}'::text[],
  previous_voter_ids uuid[] not null default '{}'::uuid[],
  status text not null default 'assigned' check (status in ('assigned', 'undone')),
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  undone_by uuid references auth.users(id)
);

create index if not exists si_postulation_assignment_history_slot_created_idx
  on public.si_postulation_assignment_history (slot_id, created_at desc);
create index if not exists si_postulation_assignment_history_actor_created_idx
  on public.si_postulation_assignment_history (assigned_by, created_at desc);

alter table public.si_postulation_assignment_history enable row level security;

drop policy if exists si_postulation_assignment_history_select_scoped
  on public.si_postulation_assignment_history;
create policy si_postulation_assignment_history_select_scoped
  on public.si_postulation_assignment_history
  for select
  to authenticated
  using ((select public.app_can_manage_si_postulation_slot(slot_id)));

revoke all on table public.si_postulation_assignment_history from public, anon, authenticated;
grant select on table public.si_postulation_assignment_history to authenticated;
grant all on table public.si_postulation_assignment_history to service_role;

create or replace function public.assign_si_postulation_teachers(
  p_slot_id bigint,
  p_teacher_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_module_code text;
  v_previous_teachers text[];
  v_previous_voters uuid[];
  v_teacher_ids uuid[];
  v_teacher_labels text[];
  v_assignment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  if p_slot_id is null or coalesce(cardinality(p_teacher_ids), 0) = 0 then
    raise exception 'Slot and at least one teacher are required';
  end if;

  if not (select public.app_can_manage_si_postulation_slot(p_slot_id)) then
    raise exception 'Insufficient privileges';
  end if;

  select pts.module_code, coalesce(pts.teachers, '{}'::text[])
  into v_module_code, v_previous_teachers
  from public.planning_time_slots pts
  where pts.id = p_slot_id
  for update;

  if not found then
    raise exception 'Planning slot not found';
  end if;

  select coalesce(array_agg(v.teacher_id order by v.teacher_id), '{}'::uuid[])
  into v_previous_voters
  from public.planning_slot_votes v
  where v.slot_id = p_slot_id;

  select
    coalesce(array_agg(source.teacher_id order by source.ord), '{}'::uuid[]),
    coalesce(array_agg(source.teacher_label order by source.ord), '{}'::text[])
  into v_teacher_ids, v_teacher_labels
  from (
    select distinct on (requested.teacher_id)
      requested.teacher_id,
      requested.ord,
      coalesce(
        nullif(trim(up.email), ''),
        nullif(trim(up.display_name), ''),
        nullif(trim(p.name), ''),
        nullif(trim(concat_ws(' ', up.forname, up.family_name)), '')
      ) as teacher_label
    from unnest(p_teacher_ids) with ordinality requested(teacher_id, ord)
    join public.planning_slot_votes vote
      on vote.slot_id = p_slot_id
     and vote.teacher_id = requested.teacher_id
    left join public.profiles p on p.id = requested.teacher_id
    left join lateral (
      select candidate.email, candidate.display_name, candidate.forname, candidate.family_name
      from public.user_profiles candidate
      where candidate.user_id = requested.teacher_id
      limit 1
    ) up on true
    order by requested.teacher_id, requested.ord
  ) source
  where nullif(trim(source.teacher_label), '') is not null;

  if cardinality(v_teacher_ids) <> cardinality(array(select distinct unnest(p_teacher_ids))) then
    raise exception 'Every selected teacher must have a current vote and a resolvable profile';
  end if;

  update public.planning_time_slots
  set teachers = v_teacher_labels
  where id = p_slot_id;

  delete from public.planning_slot_votes
  where slot_id = p_slot_id;

  insert into public.si_postulation_assignment_history (
    slot_id,
    module_code,
    assigned_by,
    assigned_teacher_ids,
    assigned_teacher_labels,
    previous_teachers,
    previous_voter_ids
  ) values (
    p_slot_id,
    coalesce(v_module_code, ''),
    v_actor,
    v_teacher_ids,
    v_teacher_labels,
    v_previous_teachers,
    v_previous_voters
  )
  returning id into v_assignment_id;

  return jsonb_build_object(
    'assignment_id', v_assignment_id,
    'slot_id', p_slot_id,
    'module_code', v_module_code,
    'teacher_ids', to_jsonb(v_teacher_ids),
    'teacher_labels', to_jsonb(v_teacher_labels),
    'previous_teachers', to_jsonb(v_previous_teachers)
  );
end;
$$;

create or replace function public.undo_si_postulation_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_history public.si_postulation_assignment_history%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_history
  from public.si_postulation_assignment_history history
  where history.id = p_assignment_id
  for update;

  if not found then
    raise exception 'Assignment not found';
  end if;

  if v_history.status <> 'assigned' then
    raise exception 'Assignment already undone';
  end if;

  if not (select public.app_can_manage_si_postulation_slot(v_history.slot_id)) then
    raise exception 'Insufficient privileges';
  end if;

  update public.planning_time_slots
  set teachers = coalesce(v_history.previous_teachers, '{}'::text[])
  where id = v_history.slot_id;

  insert into public.planning_slot_votes (slot_id, teacher_id)
  select v_history.slot_id, voter_id
  from unnest(coalesce(v_history.previous_voter_ids, '{}'::uuid[])) voter_id
  on conflict (slot_id, teacher_id) do nothing;

  update public.si_postulation_assignment_history
  set status = 'undone',
      undone_at = now(),
      undone_by = v_actor
  where id = v_history.id;

  return jsonb_build_object(
    'assignment_id', v_history.id,
    'slot_id', v_history.slot_id,
    'status', 'undone',
    'restored_teachers', to_jsonb(v_history.previous_teachers),
    'restored_voter_count', cardinality(v_history.previous_voter_ids)
  );
end;
$$;

revoke all on function public.assign_si_postulation_teachers(bigint, uuid[]) from public, anon;
revoke all on function public.undo_si_postulation_assignment(uuid) from public, anon;
grant execute on function public.assign_si_postulation_teachers(bigint, uuid[]) to authenticated, service_role;
grant execute on function public.undo_si_postulation_assignment(uuid) to authenticated, service_role;
