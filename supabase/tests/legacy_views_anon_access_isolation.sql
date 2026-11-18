\set ON_ERROR_STOP on
-- Les anciennes vues qui contournent la RLS ne sont plus lisibles sans connexion, et les vues
-- de données personnelles inutilisées ne le sont plus non plus pour un compte connecté.

begin;

set local role anon;

do $anon$
declare
  v_view text;
  v_refused boolean;
begin
  foreach v_view in array array[
    'academic_tickets_stats', 'buckets', 'capsules_with_stats', 'house_leaderboard',
    'popular_badges', 'responsable_stats', 'result_statistics', 'student_progress_details',
    'studentsphysio_with_profiles', 'v_role_permissions', 'vote_place_aggregation', 'vote_statistics'
  ] loop
    v_refused := false;
    begin
      execute format('select count(*) from public.%I', v_view);
    exception when insufficient_privilege then v_refused := true;
    end;
    if not v_refused then
      raise exception 'An anonymous visitor must not read public.%', v_view;
    end if;
  end loop;
end
$anon$;

reset role;
set local role authenticated;

do $authenticated$
declare
  v_view text;
  v_refused boolean;
begin
  foreach v_view in array array['studentsphysio_with_profiles', 'student_progress_details', 'responsable_stats'] loop
    v_refused := false;
    begin
      execute format('select count(*) from public.%I', v_view);
    exception when insufficient_privilege then v_refused := true;
    end;
    if not v_refused then
      raise exception 'A signed-in account must not read public.%', v_view;
    end if;
  end loop;

  -- Les vues encore utilisées par l'application restent lisibles une fois connecté.
  perform count(*) from public.vote_statistics;
  perform count(*) from public.vote_place_aggregation;
  perform count(*) from public.result_statistics;
  perform count(*) from public.buckets;
end
$authenticated$;

reset role;

rollback;

select 'legacy_views_anon_access_isolation_ok' as result;
