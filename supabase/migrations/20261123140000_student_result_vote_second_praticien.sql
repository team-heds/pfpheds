-- Un stage peut être encadré par deux praticiens formateurs.
-- assigned_praticien_id reste le PF principal lu par les écrans existants.
alter table public.student_result_vote
  add column if not exists assigned_praticien_2_id bigint;

alter table public.student_result_vote
  add constraint student_result_vote_distinct_praticiens
  check (
    assigned_praticien_2_id is null
    or (
      assigned_praticien_id is not null
      and assigned_praticien_2_id <> assigned_praticien_id
    )
  );

notify pgrst, 'reload schema';
