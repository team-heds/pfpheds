-- Complete P0 authorization matrix. Removes every unconditional write policy exposed to
-- public/anon/authenticated and replaces it with explicit privileged or ownership rules.

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (char_length(feature) between 1 and 80),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;
drop policy if exists "ai_usage_events_own_select" on public.ai_usage_events;
create policy "ai_usage_events_own_select"
  on public.ai_usage_events for select to authenticated
  using ((select auth.uid()) = user_id or (select public.app_is_privileged()));

revoke all on table public.ai_usage_events from anon, authenticated;
grant select on table public.ai_usage_events to authenticated;
grant all on table public.ai_usage_events to service_role;

-- Remove all unconditional mutation policies granted to browser-accessible roles.
do $migration$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and cmd <> 'SELECT'
      and (trim(coalesce(qual, '')) = 'true' or trim(coalesce(with_check, '')) = 'true')
      and roles && array['public', 'anon', 'authenticated']::name[]
  loop
    execute format('drop policy if exists %I on %I.%I',
      policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end
$migration$;

-- Administration/reference data: readable policies remain as defined by each domain,
-- while every write requires a trusted role resolved server-side.
do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'academic_years', 'alpinphysio_members', 'capsule_assignments',
    'capsule_evaluations', 'capsule_learning_objectives', 'capsule_modules',
    'capsule_prerequisites', 'classes', 'communities', 'course_modules',
    'institutions', 'modules', 'places', 'planning_cells', 'planning_time_slots',
    'praticiens_formateurs', 'quests', 'votation_sessions', 'todos'
  ] loop
    if to_regclass('public.' || quote_ident(table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists "p0_privileged_write" on public.%I', table_name);
      execute format(
        'create policy "p0_privileged_write" on public.%I for all to authenticated using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()))',
        table_name
      );
    end if;
  end loop;
end
$migration$;

-- Student master data and respondent data are visible only to the owner and privileged staff.
drop policy if exists "Allow authenticated users to read student profiles" on public."StudentsPhysio";
drop policy if exists "Allow authenticated users to select" on public."StudentsPhysio";
drop policy if exists "p0_students_own_or_privileged" on public."StudentsPhysio";
create policy "p0_students_own_or_privileged"
  on public."StudentsPhysio" for all to authenticated
  using ((select auth.uid()) = user_id or (select public.app_is_privileged()))
  with check ((select auth.uid()) = user_id or (select public.app_is_privileged()));

drop policy if exists "Allow read for authenticated users" on public."RepondantPhysioHES";
drop policy if exists "p0_respondents_own_or_privileged" on public."RepondantPhysioHES";
create policy "p0_respondents_own_or_privileged"
  on public."RepondantPhysioHES" for select to authenticated
  using ((select auth.uid()) = user_id or (select public.app_is_privileged()));

-- User profiles form the authenticated directory, but are never anonymously readable.
drop policy if exists "Enable read access for all users" on public.user_profiles;
drop policy if exists "Public read access" on public.user_profiles;
drop policy if exists "read_all_profiles" on public.user_profiles;
drop policy if exists "user_profiles_select_auth" on public.user_profiles;
drop policy if exists "p0_authenticated_profile_directory" on public.user_profiles;
create policy "p0_authenticated_profile_directory"
  on public.user_profiles for select to authenticated using (true);

-- Academic tickets: participants may read; only privileged academic staff may mutate.
drop policy if exists "p0_academic_tickets_select" on public.academic_tickets;
drop policy if exists "p0_academic_tickets_write" on public.academic_tickets;
create policy "p0_academic_tickets_select"
  on public.academic_tickets for select to authenticated
  using ((select public.app_is_privileged()) or created_by = (select auth.uid()) or assigned_to = (select auth.uid()));
create policy "p0_academic_tickets_write"
  on public.academic_tickets for all to authenticated
  using ((select public.app_is_privileged()))
  with check ((select public.app_is_privileged()));

-- Author-owned content.
drop policy if exists "p0_capsules_author_write" on public.capsules;
create policy "p0_capsules_author_write"
  on public.capsules for all to authenticated
  using (author_id = (select auth.uid()) or (select public.app_is_privileged()))
  with check (author_id = (select auth.uid()) or (select public.app_is_privileged()));

drop policy if exists "p0_content_library_select" on public.content_library;
drop policy if exists "p0_content_library_author_write" on public.content_library;
create policy "p0_content_library_select"
  on public.content_library for select to authenticated
  using (is_public or author_id = (select auth.uid()) or (select public.app_is_privileged()));
create policy "p0_content_library_author_write"
  on public.content_library for all to authenticated
  using (author_id = (select auth.uid()) or (select public.app_is_privileged()))
  with check (author_id = (select auth.uid()) or (select public.app_is_privileged()));

drop policy if exists "p0_events_owner_write" on public.events;
create policy "p0_events_owner_write"
  on public.events for all to authenticated
  using (admin_uid = (select auth.uid())::text or (select public.app_is_privileged()))
  with check (admin_uid = (select auth.uid())::text or (select public.app_is_privileged()));

-- User-owned learning and planning state.
do $migration$
declare
  ownership record;
begin
  for ownership in
    select * from (values
      ('capsule_feedback', 'student_id'),
      ('planning_slot_votes', 'teacher_id'),
      ('recap_cpt_evaluation', 'user_id'),
      ('student_capsule_notes', 'student_id'),
      ('student_capsule_progress', 'student_id'),
      ('student_module_responses', 'student_id'),
      ('user_quest_progress', 'user_id')
    ) as rows(table_name, owner_column)
  loop
    if to_regclass('public.' || quote_ident(ownership.table_name)) is not null then
      execute format('alter table public.%I enable row level security', ownership.table_name);
      execute format('drop policy if exists "p0_owner_or_privileged" on public.%I', ownership.table_name);
      execute format(
        'create policy "p0_owner_or_privileged" on public.%I for all to authenticated using (%I = (select auth.uid()) or (select public.app_is_privileged())) with check (%I = (select auth.uid()) or (select public.app_is_privileged()))',
        ownership.table_name, ownership.owner_column, ownership.owner_column
      );
    end if;
  end loop;
end
$migration$;

-- Quest steps inherit authorization from their parent quest.
drop policy if exists "p0_quest_steps_select" on public.quest_steps;
drop policy if exists "p0_quest_steps_write" on public.quest_steps;
create policy "p0_quest_steps_select"
  on public.quest_steps for select to authenticated using (true);
create policy "p0_quest_steps_write"
  on public.quest_steps for all to authenticated
  using ((select public.app_is_privileged()))
  with check ((select public.app_is_privileged()));

-- Authenticated users can read active learning/reference content; writes remain protected above.
do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'capsule_assignments', 'capsule_evaluations', 'capsule_learning_objectives',
    'capsule_modules', 'capsule_prerequisites', 'capsules', 'classes',
    'course_modules', 'modules', 'planning_cells', 'planning_time_slots',
    'praticiens_formateurs', 'quests', 'votation_sessions'
  ] loop
    if to_regclass('public.' || quote_ident(table_name)) is not null then
      execute format('drop policy if exists "p0_authenticated_read" on public.%I', table_name);
      execute format('create policy "p0_authenticated_read" on public.%I for select to authenticated using (true)', table_name);
    end if;
  end loop;
end
$migration$;

-- Push delivery is server-only; service_role bypasses RLS and no browser write policy is recreated.
alter table public.push_outbox enable row level security;

-- FeedbackA identities are always tied to auth.uid() at both API and database layers.
drop policy if exists "feedbackas_author_all" on public.feedbackas;
create policy "feedbackas_author_all"
  on public.feedbackas for all to authenticated
  using (author_id = (select auth.uid())::text or (select public.app_is_privileged()))
  with check (author_id = (select auth.uid())::text or (select public.app_is_privileged()));

drop policy if exists "feedbacka_submissions_student_select" on public.feedbacka_submissions;
drop policy if exists "feedbacka_submissions_student_insert" on public.feedbacka_submissions;
create policy "feedbacka_submissions_student_select"
  on public.feedbacka_submissions for select to authenticated
  using (student_id = (select auth.uid())::text or (select public.app_is_privileged()));
create policy "feedbacka_submissions_student_insert"
  on public.feedbacka_submissions for insert to authenticated
  with check (student_id = (select auth.uid())::text);

-- Enable RLS on every legacy table exposed through the Data API.
do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'badges', 'calendar_cells', 'capsules', 'challenges', 'course_teachers',
    'courses', 'daily_wheel_spins', 'demo_ba00_seed_users', 'dynamic_routes',
    'extensions', 'file_physio_files', 'file_physio_folders',
    'firebase_supabase_mapping', 'function_backups', 'institution_offer_tracking',
    'institutions', 'permissions', 'places', 'planning_cells', 'planning_time_slots',
    'profiles', 'push_outbox', 'recap_cpt_evaluation', 'roles', 'schema_migrations',
    'semesters', 'structures', 'student_data', 'student_documents', 'user_badges',
    'user_challenge_progress', 'user_daily_spins', 'user_profiles', 'user_roles',
    'xp_history'
  ] loop
    if to_regclass('public.' || quote_ident(table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
    end if;
  end loop;
end
$migration$;

-- Reference and teaching data: authenticated read, privileged write.
do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'badges', 'calendar_cells', 'challenges', 'course_teachers', 'courses',
    'dynamic_routes', 'file_physio_files', 'file_physio_folders', 'permissions',
    'roles', 'semesters', 'structures'
  ] loop
    if to_regclass('public.' || quote_ident(table_name)) is not null then
      execute format('drop policy if exists "p0_reference_read" on public.%I', table_name);
      execute format('drop policy if exists "p0_reference_write" on public.%I', table_name);
      execute format('create policy "p0_reference_read" on public.%I for select to authenticated using (true)', table_name);
      execute format('create policy "p0_reference_write" on public.%I for all to authenticated using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()))', table_name);
    end if;
  end loop;
end
$migration$;

-- Identity-owned data.
do $migration$
declare
  ownership record;
begin
  for ownership in
    select * from (values
      ('daily_wheel_spins', 'user_id = (select auth.uid())'),
      ('firebase_supabase_mapping', 'supabase_user_id = (select auth.uid())'),
      ('profiles', 'id = (select auth.uid())'),
      ('student_data', 'user_id = (select auth.uid())'),
      ('student_documents', 'user_id = (select auth.uid())::text'),
      ('user_badges', 'user_id = (select auth.uid())'),
      ('user_challenge_progress', 'user_id = (select auth.uid())'),
      ('user_daily_spins', 'user_id = (select auth.uid())'),
      ('xp_history', 'user_id = (select auth.uid())')
    ) as rows(table_name, owner_expression)
  loop
    if to_regclass('public.' || quote_ident(ownership.table_name)) is not null then
      execute format('drop policy if exists "p0_identity_read" on public.%I', ownership.table_name);
      execute format('drop policy if exists "p0_identity_write" on public.%I', ownership.table_name);
      execute format('create policy "p0_identity_read" on public.%I for select to authenticated using ((%s) or (select public.app_is_privileged()))', ownership.table_name, ownership.owner_expression);
      execute format('create policy "p0_identity_write" on public.%I for all to authenticated using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()))', ownership.table_name);
    end if;
  end loop;
end
$migration$;

drop policy if exists "p0_user_roles_read" on public.user_roles;
drop policy if exists "p0_user_roles_write" on public.user_roles;
create policy "p0_user_roles_read" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.app_is_privileged()));
create policy "p0_user_roles_write" on public.user_roles for all to authenticated
  using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()));

drop policy if exists "p0_offer_tracking" on public.institution_offer_tracking;
create policy "p0_offer_tracking" on public.institution_offer_tracking for all to authenticated
  using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()));

-- Internal migration/backup tables are server-only.
revoke all on table public.demo_ba00_seed_users from anon, authenticated;
revoke all on table public.extensions from anon, authenticated;
revoke all on table public.function_backups from anon, authenticated;
revoke all on table public.schema_migrations from anon, authenticated;

-- Gamification rows are self-readable, but XP and rewards cannot be directly mutated by clients.
drop policy if exists "Allow public read access to gamification_data" on public.gamification_data;
drop policy if exists "Lecture publique gamification_data" on public.gamification_data;
drop policy if exists "p0_gamification_select" on public.gamification_data;
drop policy if exists "p0_gamification_insert" on public.gamification_data;
drop policy if exists "p0_gamification_update" on public.gamification_data;
drop policy if exists "p0_gamification_privileged" on public.gamification_data;
create policy "p0_gamification_select" on public.gamification_data for select to authenticated
  using (user_id = (select auth.uid()) or (select public.app_is_privileged()));
create policy "p0_gamification_privileged" on public.gamification_data for all to authenticated
  using ((select public.app_is_privileged())) with check ((select public.app_is_privileged()));

-- Public SECURITY DEFINER functions are API endpoints: default-deny all of them.
do $migration$
declare
  function_record record;
begin
  for function_record in
    select p.proname, pg_get_function_identity_arguments(p.oid) as arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', function_record.proname, function_record.arguments);
    execute format('grant execute on function public.%I(%s) to service_role', function_record.proname, function_record.arguments);
  end loop;
end
$migration$;

create or replace function public.get_student_vote(p_user_id uuid, p_pfp_type text, p_year text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or ((select auth.uid()) <> p_user_id and not (select public.app_is_privileged())) then
    raise exception 'Insufficient privileges';
  end if;
  select to_jsonb(vote.*) into result from public.student_votes vote
  where vote.user_id = p_user_id and vote.pfp_type = p_pfp_type and vote.year = p_year;
  return result;
end;
$$;

create or replace function public.get_student_result(p_user_id uuid, p_pfp_type text, p_year text)
returns public.student_result_vote
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare result public.student_result_vote;
begin
  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role'
     and ((select auth.uid()) is null or ((select auth.uid()) <> p_user_id and not (select public.app_is_privileged()))) then
    raise exception 'Insufficient privileges';
  end if;
  select * into result from public.student_result_vote vote
  where vote.user_id = p_user_id and vote.pfp_type = p_pfp_type and vote.year = p_year;
  return result;
end;
$$;

create or replace function public.get_all_gamification_users()
returns setof public.gamification_data
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not (select public.app_is_privileged()) then raise exception 'Insufficient privileges'; end if;
  return query select * from public.gamification_data;
end;
$$;

create or replace function public.assign_quest_to_all_users(p_quest_id uuid)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare affected integer := 0;
begin
  if not (select public.app_is_privileged()) then raise exception 'Insufficient privileges'; end if;
  if not exists (select 1 from public.quests where id = p_quest_id) then raise exception 'Quest not found'; end if;
  insert into public.user_quest_progress (user_id, quest_id, status, progress)
    select id, p_quest_id, 'not_started', 0 from auth.users
    on conflict (user_id, quest_id) do nothing;
  get diagnostics affected = row_count;
  update public.quests set participants_count = participants_count + affected where id = p_quest_id;
  return affected;
end;
$$;

create or replace function public.get_daily_wheel_status()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare current_user_id uuid := (select auth.uid()); last_spin record;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into last_spin from public.daily_wheel_spins
    where user_id = current_user_id and spin_date = current_date;
  return jsonb_build_object('can_spin', last_spin is null, 'last_result', case when last_spin is null then null else last_spin.prize_details end);
end;
$$;

create or replace function public.spin_daily_wheel()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := (select auth.uid()); random_value integer;
  result_type text; prize_details jsonb; xp_bonus integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.daily_wheel_spins where user_id = current_user_id and spin_date = current_date) then
    raise exception 'ALREADY_SPUN_TODAY';
  end if;
  random_value := floor(random() * 100 + 1);
  if random_value <= 35 then result_type := 'QUIZ_EASY'; xp_bonus := 2; prize_details := '{"xp":10,"difficulty":"easy","label":"Quiz Facile"}'::jsonb;
  elsif random_value <= 60 then result_type := 'XP_BONUS'; xp_bonus := 5; prize_details := '{"xp":5,"label":"Bonus +5 XP"}'::jsonb;
  elsif random_value <= 75 then result_type := 'QUIZ_HARD'; xp_bonus := 5; prize_details := '{"xp":20,"difficulty":"hard","label":"Quiz Difficile"}'::jsonb;
  elsif random_value <= 90 then result_type := 'HELP_CHALLENGE'; prize_details := '{"xp":15,"mission":"help","label":"Défi Entraide"}'::jsonb;
  else result_type := 'REROLL'; prize_details := '{"token":1,"label":"Jeton Rejouer"}'::jsonb;
  end if;
  insert into public.daily_wheel_spins (user_id, result_type, prize_details) values (current_user_id, result_type, prize_details);
  insert into public.gamification_data (user_id, email, total_xp, current_level)
    values (current_user_id, coalesce((select auth.jwt() ->> 'email'), ''), xp_bonus, 1)
    on conflict (user_id) do update set total_xp = public.gamification_data.total_xp + xp_bonus, updated_at = now();
  return jsonb_build_object('result_type', result_type, 'prize_details', prize_details, 'xp_added', xp_bonus, 'status', 'SUCCESS');
end;
$$;

create or replace function public.assign_my_house(p_house_id uuid)
returns public.gamification_data
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare current_user_id uuid := (select auth.uid()); result public.gamification_data;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.houses where id = p_house_id) then raise exception 'House not found'; end if;
  insert into public.gamification_data (user_id, email, house_id, total_xp, current_level, house_points, gamification_metadata)
    values (current_user_id, coalesce((select auth.jwt() ->> 'email'), ''), p_house_id, 50, 1, 50,
      jsonb_build_object('quiz_completed', true, 'quiz_date', now()))
    on conflict (user_id) do update set
      house_id = case when public.gamification_data.house_id is null then excluded.house_id else public.gamification_data.house_id end,
      total_xp = coalesce(public.gamification_data.total_xp, 0) + case when public.gamification_data.house_id is null then 50 else 0 end,
      house_points = coalesce(public.gamification_data.house_points, 0) + case when public.gamification_data.house_id is null then 50 else 0 end,
      gamification_metadata = coalesce(public.gamification_data.gamification_metadata, '{}'::jsonb) || excluded.gamification_metadata,
      updated_at = now()
    returning * into result;
  return result;
end;
$$;

revoke all on function public.assign_my_house(uuid) from public, anon;
grant execute on function public.assign_my_house(uuid) to service_role;

-- Re-enable only reviewed, identity-aware browser RPCs.
do $migration$
declare function_name text;
begin
  foreach function_name in array array[
    'api_my_permissions()', 'api_my_track_permissions()', 'api_my_track_roles()',
    'app_can_manage_cases()', 'app_is_privileged()', 'can_access_track(text)',
    'copy_previous_year_place_propositions(text,text)', 'delete_student_vote(uuid,text,text)',
    'get_all_gamification_users()', 'get_daily_wheel_status()',
    'get_student_result(uuid,text,text)', 'get_student_vote(uuid,text,text)',
    'get_user_tracks()', 'has_any_track_role(text,text[])',
    'has_track_access_level(text,text)', 'has_track_role(text,text)',
    'is_admin()', 'is_global_admin()', 'is_super_admin()',
    'spin_daily_wheel()', 'assign_my_house(uuid)', 'assign_quest_to_all_users(uuid)',
    'upsert_student_vote(uuid,text,text,jsonb)'
  ] loop
    if to_regprocedure('public.' || function_name) is not null then
      execute format('grant execute on function public.%s to authenticated', function_name);
    end if;
  end loop;
end
$migration$;
