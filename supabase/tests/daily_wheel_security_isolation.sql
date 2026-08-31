\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (select id::text from auth.users order by created_at limit 1),
  true
);

update gamification_private.feature_flags
set enabled = false, updated_at = now()
where feature_key = 'daily_wheel';

set local role authenticated;

do $disabled$
declare
  v_blocked boolean := false;
begin
  begin
    perform public.get_daily_wheel_status();
  exception when others then
    v_blocked := sqlerrm = 'FEATURE_DISABLED';
  end;
  if not v_blocked then raise exception 'Server feature flag must block the daily wheel'; end if;
end
$disabled$;

reset role;

do $setup$
declare
  v_user_id uuid := current_setting('request.jwt.claim.sub')::uuid;
  v_spin_id uuid := 'd2000000-0000-0000-0000-000000000001';
begin
  if v_user_id is null then raise exception 'Daily wheel test requires an auth user'; end if;

  update gamification_private.feature_flags
  set enabled = true, updated_at = now()
  where feature_key = 'daily_wheel';

  delete from public.daily_wheel_spins
  where user_id = v_user_id
    and spin_date = (statement_timestamp() at time zone 'Europe/Zurich')::date;

  insert into public.daily_wheel_spins (
    id, user_id, spin_date, result_type, prize_details, quiz_status
  ) values (
    v_spin_id,
    v_user_id,
    (statement_timestamp() at time zone 'Europe/Zurich')::date,
    'QUIZ_EASY',
    '{"question":{"prompt":"Test","options":{"sion":"Sion","lausanne":"Lausanne"}}}',
    'pending'
  );

  insert into gamification_private.daily_wheel_quiz_attempts (
    spin_id, question_id, correct_option_id, xp_reward
  ) values (
    v_spin_id,
    'd1000000-0000-0000-0000-000000000001',
    'sion',
    10
  );
end
$setup$;

set local role authenticated;

do $test$
declare
  v_first jsonb;
  v_retry jsonb;
  v_history_count integer;
  v_forbidden boolean := false;
begin
  begin
    insert into public.daily_wheel_spins (user_id, result_type)
    values (auth.uid(), 'XP_BONUS');
  exception when others then
    v_forbidden := true;
  end;
  if not v_forbidden then raise exception 'Direct spin insert must be denied'; end if;

  if has_table_privilege('authenticated', 'public.daily_wheel_spins', 'INSERT')
     or has_table_privilege('authenticated', 'public.daily_wheel_spins', 'UPDATE')
     or has_table_privilege('authenticated', 'public.daily_wheel_spins', 'DELETE')
     or has_table_privilege('authenticated', 'public.daily_wheel_spins', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.daily_wheel_spins', 'TRIGGER')
     or has_table_privilege('authenticated', 'public.daily_wheel_spins', 'REFERENCES') then
    raise exception 'Authenticated must only retain SELECT on daily wheel spins';
  end if;

  v_first := public.submit_daily_wheel_quiz(
    'd2000000-0000-0000-0000-000000000001',
    'sion'
  );
  v_retry := public.submit_daily_wheel_quiz(
    'd2000000-0000-0000-0000-000000000001',
    'sion'
  );

  if not coalesce((v_first ->> 'correct')::boolean, false)
     or (v_first ->> 'xp_added')::integer <> 10 then
    raise exception 'Correct answer must award exactly 10 XP: %', v_first;
  end if;
  if not coalesce((v_retry ->> 'duplicate')::boolean, false)
     or (v_retry ->> 'xp_added')::integer <> 0 then
    raise exception 'Quiz retry must be idempotent: %', v_retry;
  end if;

  select count(*) into v_history_count
  from public.xp_history
  where user_id = auth.uid()
    and event_key = 'daily-wheel-quiz:d2000000-0000-0000-0000-000000000001';
  if v_history_count <> 1 then
    raise exception 'Expected one wheel XP event, got %', v_history_count;
  end if;
end
$test$;

reset role;
rollback;

select 'daily_wheel_security_isolation_ok' as result;
