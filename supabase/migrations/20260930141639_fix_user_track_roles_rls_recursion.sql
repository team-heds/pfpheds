-- Avoid recursive RLS evaluation on user_track_roles.
-- The legacy policies queried user_track_roles from policies attached to that
-- same table, which makes every authenticated SELECT fail with PostgreSQL 42P17.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_active_track_role(
  target_track_id text,
  accepted_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_track_roles utr
      where utr.user_id = (select auth.uid())
        and (target_track_id is null or utr.track_id = target_track_id)
        and utr.role::text = any(accepted_roles)
        and utr.is_active = true
        and (utr.expires_at is null or utr.expires_at > now())
    );
$$;

revoke all on function private.has_active_track_role(text, text[]) from public;
grant execute on function private.has_active_track_role(text, text[])
  to authenticated, service_role;

drop policy if exists "Admin can manage track roles" on public.user_track_roles;
create policy "Admin can manage track roles"
on public.user_track_roles
for all
to authenticated
using (
  role::text <> 'SUPER_ADMIN'
  and private.has_active_track_role(
    user_track_roles.track_id,
    array['ADMIN', 'SECRETARIAT']::text[]
  )
)
with check (
  role::text <> 'SUPER_ADMIN'
  and private.has_active_track_role(
    user_track_roles.track_id,
    array['ADMIN', 'SECRETARIAT']::text[]
  )
);

drop policy if exists "Admin can view track roles" on public.user_track_roles;
create policy "Admin can view track roles"
on public.user_track_roles
for select
to authenticated
using (
  private.has_active_track_role(
    user_track_roles.track_id,
    array['ADMIN', 'SECRETARIAT', 'RF']::text[]
  )
);

drop policy if exists "SuperAdmin can manage all roles" on public.user_track_roles;
create policy "SuperAdmin can manage all roles"
on public.user_track_roles
for all
to authenticated
using (
  private.has_active_track_role(null, array['SUPER_ADMIN']::text[])
)
with check (
  private.has_active_track_role(null, array['SUPER_ADMIN']::text[])
);

drop policy if exists "SuperAdmin can view all roles" on public.user_track_roles;
create policy "SuperAdmin can view all roles"
on public.user_track_roles
for select
to authenticated
using (
  private.has_active_track_role(null, array['SUPER_ADMIN']::text[])
);
