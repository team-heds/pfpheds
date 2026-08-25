-- HEDS25-589 hotfix: resolve historical Firebase profile links without
-- weakening the Supabase profile authorization rules.

create or replace function public.resolve_accessible_user_profile_id(
  p_target_identifier text
)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select profile.user_id
  from public.user_profiles profile
  where (select auth.uid()) is not null
    and nullif(btrim(coalesce(p_target_identifier, '')), '') is not null
    and (
      profile.user_id::text = btrim(p_target_identifier)
      or profile.firebase_id = btrim(p_target_identifier)
    )
    and public.app_can_view_user_profile(profile.user_id)
  limit 1;
$$;

revoke all on function public.resolve_accessible_user_profile_id(text) from public, anon;
grant execute on function public.resolve_accessible_user_profile_id(text) to authenticated, service_role;

comment on function public.resolve_accessible_user_profile_id(text) is
  'HEDS25-589 compatibility resolver for authorized UUID or legacy Firebase profile identifiers.';
