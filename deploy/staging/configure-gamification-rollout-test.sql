\set ON_ERROR_STOP on

begin;
select set_config(
  'request.jwt.claim.sub',
  (select admin_user_id::text from gamification_private.pilot_runs order by created_at desc limit 1),
  true
);
select set_config(
  'heds_test.student_uid',
  (select student_user_id::text from gamification_private.pilot_runs order by created_at desc limit 1),
  true
);
set local role authenticated;
select public.set_gamification_rollout_member(
  current_setting('heds_test.student_uid')::uuid,
  true,
  'Activation du compte étudiant fictif pour le pilote test'
);
select public.configure_gamification_rollout(
  true,
  'allowlist',
  'Activation test limitée au compte étudiant fictif du pilote'
);
commit;
