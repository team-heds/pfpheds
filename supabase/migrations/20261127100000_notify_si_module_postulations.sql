-- Notify the module responsible when a new SI postulation vote is created.
-- Push delivery is handled asynchronously by the existing push_outbox worker.

create or replace function public.notify_si_module_postulation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_module_code text;
  v_module_title text;
  v_course_title text;
  v_class_code text;
  v_week_number integer;
  v_start_time text;
  v_end_time text;
  v_responsible_email text;
  v_recipient_id uuid;
  v_profile_count bigint;
  v_slot_label text;
begin
  select
    pts.module_code,
    nullif(trim(m.title), ''),
    coalesce(nullif(trim(pts.course_title), ''), nullif(trim(m.title), ''), nullif(trim(pts.module_code), '')),
    coalesce(nullif(trim(pts.class_code), ''), case when cardinality(pts.class_codes) > 0 then array_to_string(pts.class_codes, ', ') end),
    pts.week_number,
    pts.start_time::text,
    pts.end_time::text,
    nullif(lower(trim(m.responsable_email)), ''),
    up.user_id,
    up.profile_count
  into
    v_module_code,
    v_module_title,
    v_course_title,
    v_class_code,
    v_week_number,
    v_start_time,
    v_end_time,
    v_responsible_email,
    v_recipient_id,
    v_profile_count
  from public.planning_time_slots pts
  left join public.modules m
    on lower(trim(m.code)) = lower(trim(pts.module_code))
  left join lateral (
    select min(profile.user_id) as user_id, count(*) as profile_count
    from public.user_profiles profile
    where lower(trim(profile.email)) = lower(trim(m.responsable_email))
      and coalesce(profile.is_active, true)
  ) up on true
  where pts.id = new.slot_id;

  if v_responsible_email is null or v_profile_count <> 1 or v_recipient_id is null then
    return new;
  end if;

  v_slot_label := concat_ws(
    ' ',
    coalesce(v_course_title, v_module_code, 'Cours'),
    case when v_class_code is not null then concat('· ', v_class_code) end,
    case when v_week_number is not null then concat('· S', v_week_number) end,
    case
      when nullif(trim(coalesce(v_start_time, '')), '') is not null
        and nullif(trim(coalesce(v_end_time, '')), '') is not null
      then concat('· ', left(v_start_time, 5), '–', left(v_end_time, 5))
      else null
    end
  );

  insert into public.push_outbox (user_id, title, body, url)
  values (
    v_recipient_id,
    'Nouvelle postulation',
    left(concat_ws(' / ', coalesce(v_module_title, v_module_code, 'Module'), v_slot_label), 400),
    '/admin/soins-infirmiers/cours-postulation'
  );

  return new;
exception
  when others then
    -- The postulation is the primary operation; push delivery must not block it.
    raise warning 'SI postulation push enqueue failed for slot %: %', new.slot_id, sqlerrm;
    return new;
end;
$$;

revoke all on function public.notify_si_module_postulation() from public, anon, authenticated;
grant execute on function public.notify_si_module_postulation() to service_role;

drop trigger if exists planning_slot_vote_notify_module_responsible on public.planning_slot_votes;
create trigger planning_slot_vote_notify_module_responsible
after insert on public.planning_slot_votes
for each row
execute function public.notify_si_module_postulation();
