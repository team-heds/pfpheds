\pset pager off
\echo '=== ACTIVE_ACADEMIC_YEAR ==='
select id, name, start_date, end_date
from public.academic_years
where is_active = true;

\echo '=== CANONICAL_SI_TEACHERS ==='
select user_id, lower(trim(coalesce(email, ''))) as email, trim(coalesce(display_name, concat_ws(' ', forname, family_name))) as display_name
from public.user_profiles
where role = 'EnseignantSoins'
order by display_name;

\echo '=== RAW_PLANNING_TEACHERS ==='
select trim(raw_teacher) as raw_teacher, count(*) as slot_occurrences
from public.planning_time_slots pts
cross join lateral unnest(coalesce(pts.teachers, array[]::text[])) raw_teacher
where pts.archived_at is null
  and trim(coalesce(raw_teacher, '')) <> ''
group by trim(raw_teacher)
order by slot_occurrences desc, raw_teacher
limit 300;

