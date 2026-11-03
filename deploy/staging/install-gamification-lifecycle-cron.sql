\set ON_ERROR_STOP on

create extension if not exists pg_cron;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'heds25-620-gamification-lifecycle';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule_in_database(
    'heds25-620-gamification-lifecycle',
    '* * * * *',
    'select gamification_private.refresh_lifecycle()',
    'staging',
    null,
    true
  );
end;
$$;

select jobname, schedule, database, username, active
from cron.job
where jobname = 'heds25-620-gamification-lifecycle';
