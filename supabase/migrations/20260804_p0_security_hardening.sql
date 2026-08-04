-- P0 security hardening: private student documents, least-privilege RLS and safe RBAC helpers.

create or replace function public.app_is_privileged()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from public.user_profiles up
      where up.user_id = (select auth.uid())
        and (
          lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
          or coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
        )
    )
    or exists (
      select 1
      from public.user_track_roles utr
      where utr.user_id = (select auth.uid())
        and utr.is_active = true
        and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
        and (utr.expires_at is null or utr.expires_at > now())
    );
$$;

revoke all on function public.app_is_privileged() from public, anon;
grant execute on function public.app_is_privileged() to authenticated, service_role;

create or replace function public.app_can_manage_cases()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (select public.app_is_privileged()) or exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.permissions, '{}'::jsonb) ? 'page1.access'
  );
$$;

revoke all on function public.app_can_manage_cases() from public, anon;
grant execute on function public.app_can_manage_cases() to authenticated, service_role;

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
where id = 'student-documents';

drop policy if exists "student_documents_select_public" on storage.objects;
drop policy if exists "student_documents_select_authorized" on storage.objects;
create policy "student_documents_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'student-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.app_is_privileged())
  )
);

do $migration$
begin
  if to_regclass('public.suivi_cas_particuliers') is not null then
    execute 'drop policy if exists "suivi_cas_particuliers_authenticated_all" on public.suivi_cas_particuliers';
    execute 'drop policy if exists "suivi_cas_particuliers_privileged_select" on public.suivi_cas_particuliers';
    execute 'drop policy if exists "suivi_cas_particuliers_privileged_write" on public.suivi_cas_particuliers';
    execute 'create policy "suivi_cas_particuliers_privileged_select" on public.suivi_cas_particuliers for select to authenticated using ((select public.app_can_manage_cases()))';
    execute 'create policy "suivi_cas_particuliers_privileged_write" on public.suivi_cas_particuliers for all to authenticated using ((select public.app_can_manage_cases())) with check ((select public.app_can_manage_cases()))';
  end if;

  if to_regclass('public.cas_particuliers_historique') is not null then
    execute 'drop policy if exists "cas_particuliers_historique_authenticated_all" on public.cas_particuliers_historique';
    execute 'drop policy if exists "cas_particuliers_historique_privileged" on public.cas_particuliers_historique';
    execute 'create policy "cas_particuliers_historique_privileged" on public.cas_particuliers_historique for all to authenticated using ((select public.app_can_manage_cases())) with check ((select public.app_can_manage_cases()))';
  end if;

  if to_regclass('public.planning_history') is not null then
    execute 'drop policy if exists "planning_history_insert_authenticated" on public.planning_history';
    execute 'drop policy if exists "planning_history_privileged_insert" on public.planning_history';
    execute 'create policy "planning_history_privileged_insert" on public.planning_history for insert to authenticated with check ((select public.app_is_privileged()) and (changed_by is null or changed_by = (select auth.uid())))';
  end if;

  if to_regclass('public.planning_validations') is not null then
    execute 'drop policy if exists "planning_validations_insert_authenticated" on public.planning_validations';
    execute 'drop policy if exists "planning_validations_update_authenticated" on public.planning_validations';
    execute 'drop policy if exists "planning_validations_privileged_insert" on public.planning_validations';
    execute 'drop policy if exists "planning_validations_privileged_update" on public.planning_validations';
    execute 'create policy "planning_validations_privileged_insert" on public.planning_validations for insert to authenticated with check ((select public.app_is_privileged()))';
    execute 'create policy "planning_validations_privileged_update" on public.planning_validations for update to authenticated using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()))';
  end if;

  if to_regclass('public.module_hours_budget') is not null then
    execute 'drop policy if exists "module_hours_budget_all_authenticated" on public.module_hours_budget';
    execute 'drop policy if exists "module_hours_budget_privileged_write" on public.module_hours_budget';
    execute 'create policy "module_hours_budget_privileged_write" on public.module_hours_budget for all to authenticated using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()))';
  end if;
end
$migration$;

-- Security-definer helpers must never inherit a caller-controlled search_path.
do $migration$
declare
  function_name text;
begin
  foreach function_name in array array[
    'is_super_admin()',
    'is_global_admin()',
    'has_track_role(text,text)',
    'has_any_track_role(text,text[])',
    'get_user_tracks()',
    'can_access_track(text)',
    'has_track_access_level(text,text)'
  ] loop
    if to_regprocedure('public.' || function_name) is not null then
      execute format('alter function public.%s set search_path = pg_catalog, public', function_name);
      execute format('revoke all on function public.%s from public, anon', function_name);
      execute format('grant execute on function public.%s to authenticated, service_role', function_name);
    end if;
  end loop;
end
$migration$;
