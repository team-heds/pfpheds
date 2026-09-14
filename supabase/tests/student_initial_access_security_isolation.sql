\set ON_ERROR_STOP on

begin;

do $schema$
declare
  v_forbidden_columns integer;
begin
  select count(*) into v_forbidden_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('student_initial_access', 'student_initial_access_events')
    and column_name ~* '(email|password|token|otp|url|secret)';

  if v_forbidden_columns <> 0 then
    raise exception 'Initial-access tables must not contain secret or email columns';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.student_initial_access'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.student_initial_access_events'::regclass) then
    raise exception 'RLS must be enabled on both initial-access tables';
  end if;
end
$schema$;

set local role authenticated;

do $authenticated$
begin
  if has_table_privilege('authenticated', 'public.student_initial_access', 'SELECT')
     or has_table_privilege('authenticated', 'public.student_initial_access', 'INSERT')
     or has_table_privilege('authenticated', 'public.student_initial_access', 'UPDATE')
     or has_table_privilege('authenticated', 'public.student_initial_access', 'DELETE')
     or has_table_privilege('authenticated', 'public.student_initial_access_events', 'SELECT')
     or has_table_privilege('authenticated', 'public.student_initial_access_events', 'INSERT') then
    raise exception 'Authenticated users must have no direct privilege on initial-access tables';
  end if;
end
$authenticated$;

reset role;

do $service_role$
begin
  if not has_table_privilege('service_role', 'public.student_initial_access', 'SELECT,INSERT,UPDATE')
     or not has_table_privilege('service_role', 'public.student_initial_access_events', 'SELECT,INSERT') then
    raise exception 'Service role requires the expected server-only privileges';
  end if;

  if has_table_privilege('service_role', 'public.student_initial_access', 'DELETE')
     or has_table_privilege('service_role', 'public.student_initial_access_events', 'UPDATE')
     or has_table_privilege('service_role', 'public.student_initial_access_events', 'DELETE') then
    raise exception 'Current state cannot be deleted and audit events must be append-only';
  end if;
end
$service_role$;

rollback;

select 'student_initial_access_security_isolation_ok' as result;
