\set ON_ERROR_STOP on

begin;

do $test$
begin
  if not has_table_privilege('service_role', 'public.tracks', 'select') then
    raise exception 'service_role must be able to read public.tracks for admin dashboard filters';
  end if;
end
$test$;

rollback;

select 'admin_dashboard_filter_catalog_access_ok' as result;
