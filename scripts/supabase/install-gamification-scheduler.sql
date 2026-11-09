-- Planificateur de la gamification : toutes les 5 minutes, ouvre les défis et quêtes
-- programmés arrivés à leur date de début et clôt ceux qui ont dépassé leur date de fin
-- (gamification_private.refresh_lifecycle, auditée dans lifecycle_audit).
--
-- À exécuter dans la base qui héberge pg_cron (cron.database_name, « postgres ») :
--   prod : psql -d postgres -v target_db=postgres -f install-gamification-scheduler.sql
--   test : psql -d postgres -v target_db=staging  -f install-gamification-scheduler.sql
-- Relançable : la tâche existante est remplacée.

\set ON_ERROR_STOP on
create extension if not exists pg_cron;

select set_config('gamification.scheduler_target', :'target_db', false);

do $$
declare
  v_job bigint;
begin
  select jobid into v_job from cron.job where jobname = 'gamification-lifecycle';
  if v_job is not null then
    perform cron.unschedule(v_job);
  end if;

  perform cron.schedule_in_database(
    'gamification-lifecycle',
    '*/5 * * * *',
    'select gamification_private.refresh_lifecycle()',
    current_setting('gamification.scheduler_target'),
    null,
    true
  );
end;
$$;

select jobname, schedule, database, active from cron.job where jobname = 'gamification-lifecycle';
