-- HEDS25-628: least-privilege access for SI teacher postulation votes.

create or replace function public.app_is_si_postulation_teacher()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, true)
      and (
        lower(coalesce(up.role, '')) = 'enseignantsoins'
        or coalesce(up.permissions, '[]'::jsonb) ? 'EnseignantSoins'
      )
  );
$$;

create or replace function public.app_is_si_postulation_manager()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, true)
      and (
        lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminsoins')
        or coalesce(up.permissions, '[]'::jsonb) ?| array['admin', 'super.all']
      )
  ) or exists (
    select 1
    from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, true)
      and (
        lower(coalesce(up.role, '')) = 'rmsoins'
        or coalesce(up.permissions, '[]'::jsonb) ? 'RMSoins'
      )
  );
$$;

create or replace function public.app_can_manage_si_postulation_slot(p_slot_id bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from public.user_profiles admin_profile
      where admin_profile.user_id = (select auth.uid())
        and coalesce(admin_profile.is_active, true)
        and (
          lower(coalesce(admin_profile.role, '')) in ('admin', 'super.all', 'adminsoins')
          or coalesce(admin_profile.permissions, '[]'::jsonb) ?| array['admin', 'super.all']
        )
    )
    or exists (
      select 1
      from public.user_profiles up
      join public.planning_time_slots pts on pts.id = p_slot_id
      join public.modules m on lower(trim(m.code)) = lower(trim(pts.module_code))
      where up.user_id = (select auth.uid())
        and coalesce(up.is_active, true)
        and (
          lower(coalesce(up.role, '')) = 'rmsoins'
          or coalesce(up.permissions, '[]'::jsonb) ? 'RMSoins'
        )
        and nullif(trim(up.email), '') is not null
        and (
          lower(trim(coalesce(m.responsable_email, ''))) = lower(trim(up.email))
          or lower(coalesce(m.coordinateur, '')) like '%' || lower(trim(up.email)) || '%'
        )
    );
$$;

revoke all on function public.app_is_si_postulation_teacher() from public, anon;
revoke all on function public.app_is_si_postulation_manager() from public, anon;
revoke all on function public.app_can_manage_si_postulation_slot(bigint) from public, anon;
grant execute on function public.app_is_si_postulation_teacher() to authenticated, service_role;
grant execute on function public.app_is_si_postulation_manager() to authenticated, service_role;
grant execute on function public.app_can_manage_si_postulation_slot(bigint) to authenticated, service_role;

alter table public.planning_slot_votes enable row level security;

drop policy if exists planning_slot_votes_select_auth on public.planning_slot_votes;
drop policy if exists p0_owner_or_privileged on public.planning_slot_votes;
drop policy if exists planning_slot_votes_select_scoped on public.planning_slot_votes;
drop policy if exists planning_slot_votes_insert_own on public.planning_slot_votes;
drop policy if exists planning_slot_votes_update_own on public.planning_slot_votes;
drop policy if exists planning_slot_votes_delete_scoped on public.planning_slot_votes;

create policy planning_slot_votes_select_scoped
  on public.planning_slot_votes
  for select
  to authenticated
  using (
    (
      (select public.app_is_si_postulation_teacher())
      and teacher_id = (select auth.uid())
    )
    or (select public.app_can_manage_si_postulation_slot(slot_id))
  );

create policy planning_slot_votes_insert_own
  on public.planning_slot_votes
  for insert
  to authenticated
  with check (
    (select public.app_is_si_postulation_teacher())
    and teacher_id = (select auth.uid())
  );

create policy planning_slot_votes_update_own
  on public.planning_slot_votes
  for update
  to authenticated
  using (
    (select public.app_is_si_postulation_teacher())
    and teacher_id = (select auth.uid())
  )
  with check (
    (select public.app_is_si_postulation_teacher())
    and teacher_id = (select auth.uid())
  );

create policy planning_slot_votes_delete_scoped
  on public.planning_slot_votes
  for delete
  to authenticated
  using (
    (
      (select public.app_is_si_postulation_teacher())
      and teacher_id = (select auth.uid())
    )
    or (select public.app_can_manage_si_postulation_slot(slot_id))
  );

revoke all on table public.planning_slot_votes from anon, authenticated;
grant select, insert, update, delete on table public.planning_slot_votes to authenticated;
grant all on table public.planning_slot_votes to service_role;
