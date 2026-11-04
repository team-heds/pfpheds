\pset pager off
\echo '=== PLANNING_YEAR_COLUMN ==='
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'planning_time_slots'
    and column_name = 'academic_year_id'
);

\echo '=== ACTIVE_YEAR_CLASS_CODES ==='
with active_year as (
  select id from public.academic_years where is_active = true limit 1
)
select string_agg(code, ', ' order by code)
from public.classes
where academic_year_id = (select id from active_year);

\echo '=== ACTIVE_YEAR_QUALITY_BASELINE ==='
with active_year as (
  select id from public.academic_years where is_active = true limit 1
), class_aliases as (
  select upper(trim(code)) as code
  from public.classes
  where academic_year_id = (select id from active_year)
  union
  select case
    when upper(trim(code)) ~ '^B[0-9]{2}' then 'BAC' || substring(upper(trim(code)) from 2)
    when upper(trim(code)) ~ '^BAC[0-9]{2}' then 'B' || substring(upper(trim(code)) from 4)
    else upper(trim(code))
  end
  from public.classes
  where academic_year_id = (select id from active_year)
), scoped as (
  select pts.*
  from public.planning_time_slots pts
  where upper(trim(coalesce(pts.class_code, ''))) in (select code from class_aliases)
)
select json_build_object(
  'scoped_slots', count(*),
  'missing_course_link', count(*) filter (where nullif(trim(coalesce(course_id::text, '')), '') is null),
  'missing_activity', count(*) filter (where nullif(trim(coalesce(activity_type, '')), '') is null and nullif(trim(coalesce(activity, '')), '') is null),
  'missing_room_raw', count(*) filter (where nullif(trim(coalesce(room, '')), '') is null),
  'missing_time_raw', count(*) filter (where nullif(trim(coalesce(start_time, '')), '') is null or nullif(trim(coalesce(end_time, '')), '') is null),
  'no_teacher_declared', count(*) filter (where coalesce(cardinality(teachers), 0) = 0)
)
from scoped;
