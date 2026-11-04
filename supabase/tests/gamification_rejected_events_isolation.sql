\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.student_uid',
  (
    select up.user_id::text from public.user_profiles up
    where lower(coalesce(up.role, '')) not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
      and not (coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
    order by up.user_id limit 1
  ), true
);
select set_config(
  'heds_test.admin_uid',
  (
    select up.user_id::text from public.user_profiles up
    where lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
       or coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
    order by up.user_id limit 1
  ), true
);

select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $student$
declare
  result jsonb;
  private_read_forbidden boolean := false;
begin
  result := public.record_my_gamification_action('UNKNOWN_ACTION', null, '{}'::jsonb);
  if coalesce((result ->> 'awarded')::boolean, true)
     or result ->> 'reason' <> 'rule_unavailable' then
    raise exception 'Unknown action must be rejected without XP: %', result;
  end if;

  begin
    perform count(*) from gamification_private.rejected_action_events;
  exception when others then
    private_read_forbidden := true;
  end;
  if not private_read_forbidden then
    raise exception 'Student must not read private rejection events';
  end if;
end
$student$;

reset role;

do $private_audit$
begin
  if not exists (
    select 1 from gamification_private.rejected_action_events rae
    where rae.user_id = current_setting('heds_test.student_uid')::uuid
      and rae.action_code = 'UNKNOWN_ACTION'
      and rae.rejection_reason = 'rule_unavailable'
  ) then
    raise exception 'Rejected event was not journaled';
  end if;
end
$private_audit$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

do $admin$
declare
  preview jsonb;
begin
  preview := public.preview_gamification_admin_console();
  if preview #>> '{activity,rejected_events_status}' <> 'ok'
     or coalesce((preview #>> '{activity,rejected_events}')::integer, 0) < 1
     or coalesce((preview #>> '{activity,rejected_events_by_reason,rule_unavailable}')::integer, 0) < 1
     or preview::text ~* '(user_id|email|firstname|lastname)' then
    raise exception 'Aggregate rejection preview is invalid: %', preview;
  end if;
end
$admin$;

reset role;

do $grants$
begin
  if has_function_privilege(
       'anon', 'public.record_my_gamification_action(text,uuid,jsonb)', 'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated', 'public.record_my_gamification_action(text,uuid,jsonb)', 'EXECUTE'
     ) then
    raise exception 'Unexpected audited action wrapper grants';
  end if;
end
$grants$;

rollback;
