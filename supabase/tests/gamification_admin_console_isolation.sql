\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.admin_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
       or coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
    order by up.user_id
    limit 1
  ),
  true
);

select set_config(
  'heds_test.student_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
      and not (coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
    order by up.user_id
    limit 1
  ),
  true
);

do $setup$
begin
  if nullif(current_setting('heds_test.admin_uid', true), '') is null
     or nullif(current_setting('heds_test.student_uid', true), '') is null then
    raise exception 'Admin console test requires one admin and one student';
  end if;
end
$setup$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

do $admin$
declare
  result jsonb;
  history_before bigint;
  history_after bigint;
begin
  select count(*) into history_before from public.xp_history;
  result := public.preview_gamification_admin_console();
  select count(*) into history_after from public.xp_history;

  if result ->> 'version' <> '1'
     or coalesce((result ->> 'contains_personal_data')::boolean, true)
     or coalesce((result ->> 'write_performed')::boolean, true)
     or jsonb_typeof(result -> 'rules') <> 'array'
     or result #>> '{activity,rejected_events_status}' <> 'ok'
     or jsonb_typeof(result #> '{activity,rejected_events_by_reason}') <> 'object'
     or not (result ? 'quality') then
    raise exception 'Invalid aggregate admin console contract: %', result;
  end if;

  if history_before <> history_after then
    raise exception 'Admin console must remain read-only';
  end if;

  if result::text ~* '(email|firstname|lastname|user_id)' then
    raise exception 'Admin console must not expose personal fields';
  end if;
end
$admin$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $student$
declare
  forbidden boolean := false;
begin
  begin
    perform public.preview_gamification_admin_console();
  exception when others then
    forbidden := true;
  end;
  if not forbidden then
    raise exception 'A student must not access the admin console RPC';
  end if;
end
$student$;

reset role;

do $grants$
begin
  if has_function_privilege('anon', 'public.preview_gamification_admin_console()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.preview_gamification_admin_console()', 'EXECUTE') then
    raise exception 'Unexpected admin console function grants';
  end if;
end
$grants$;

rollback;
