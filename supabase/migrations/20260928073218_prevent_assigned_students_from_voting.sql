create or replace function public.prevent_assigned_student_vote()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  canonical_year text;
  academic_range text;
begin
  canonical_year := case
    when new.year ~ '^[1-9][0-9]{3}$' then new.year
    when new.year ~ '^[1-9][0-9]{3}-[1-9][0-9]{3}$' then split_part(new.year, '-', 2)
    else new.year
  end;
  academic_range := case
    when canonical_year ~ '^[1-9][0-9]{3}$'
      then ((canonical_year::integer - 1)::text || '-' || canonical_year)
    else canonical_year
  end;

  if exists (
    select 1
    from public.student_result_vote as assignment
    where assignment.user_id = new.user_id
      and upper(assignment.pfp_type) = upper(new.pfp_type)
      and assignment.assigned_place_id is not null
      and btrim(assignment.assigned_place_id) <> ''
      and assignment.year in (canonical_year, academic_range)
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'VOTE_NOT_ALLOWED_ALREADY_ASSIGNED';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_assigned_student_vote() from public;

drop trigger if exists prevent_assigned_student_vote on public.student_votes;
create trigger prevent_assigned_student_vote
before insert or update of user_id, pfp_type, year, choices
on public.student_votes
for each row
execute function public.prevent_assigned_student_vote();

comment on function public.prevent_assigned_student_vote() is
  'Refuse un vote lorsqu une place est deja attribuee au meme etudiant pour la meme campagne PFP.';
