-- Quand la place attribuée n'a qu'un seul praticien formateur, il devient le PF principal.
create or replace function public.fill_student_result_vote_single_praticien()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_praticiens text[];
begin
  if new.assigned_praticien_id is not null or nullif(btrim(new.assigned_place_id), '') is null then
    return new;
  end if;

  select p."praticiensFormateurs"
    into v_praticiens
  from public.places p
  where p."PlaceId" = new.assigned_place_id
  limit 1;

  if cardinality(v_praticiens) = 1 and btrim(v_praticiens[1]) ~ '^[0-9]+$' then
    new.assigned_praticien_id := btrim(v_praticiens[1])::bigint;
  end if;

  return new;
end;
$$;

create trigger trg_fill_student_result_vote_single_praticien
  before insert or update of assigned_place_id, assigned_praticien_id
  on public.student_result_vote
  for each row
  execute function public.fill_student_result_vote_single_praticien();

-- Enregistre les PF uniques jusqu'ici seulement affichés comme « auto-assignés ».
update public.student_result_vote v
set assigned_praticien_id = btrim(p."praticiensFormateurs"[1])::bigint
from public.places p
where p."PlaceId" = v.assigned_place_id
  and v.assigned_praticien_id is null
  and cardinality(p."praticiensFormateurs") = 1
  and btrim(p."praticiensFormateurs"[1]) ~ '^[0-9]+$';
