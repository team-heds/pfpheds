-- PFP outcomes are stored on the historical three-boolean model. Keep this
-- representation for compatibility, while enforcing a single canonical state.
do $$
begin
  if exists (
    select 1
    from public.student_result_vote
    where coalesce(pfp_validee, false)::integer
        + coalesce(pfp_echec, false)::integer
        + coalesce(pfp_arret, false)::integer > 1
  ) then
    raise exception 'Cannot install PFP outcome constraint: contradictory rows exist';
  end if;
end
$$;

alter table public.student_result_vote
  add constraint student_result_vote_single_pfp_outcome
  check (
    coalesce(pfp_validee, false)::integer
      + coalesce(pfp_echec, false)::integer
      + coalesce(pfp_arret, false)::integer <= 1
  );

create table if not exists public.pfp_outcome_audit (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.student_result_vote(id) on delete cascade,
  actor_user_id uuid not null,
  previous_outcome text not null,
  next_outcome text not null,
  comment text not null default '',
  created_at timestamptz not null default now(),
  constraint pfp_outcome_audit_previous_outcome_check
    check (previous_outcome in ('pending', 'passed', 'failed', 'stopped')),
  constraint pfp_outcome_audit_next_outcome_check
    check (next_outcome in ('pending', 'passed', 'failed', 'stopped')),
  constraint pfp_outcome_audit_stopped_comment_check
    check (next_outcome <> 'stopped' or length(btrim(comment)) > 0)
);

create index if not exists pfp_outcome_audit_assignment_created_idx
  on public.pfp_outcome_audit (assignment_id, created_at desc);

alter table public.pfp_outcome_audit enable row level security;
revoke all on table public.pfp_outcome_audit from public, anon, authenticated;
grant select, insert on table public.pfp_outcome_audit to service_role;

create or replace function public.set_pfp_outcome(
  p_assignment_id uuid,
  p_outcome text,
  p_comment text,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_row public.student_result_vote%rowtype;
  previous_outcome text;
  normalized_comment text := case
    when p_outcome = 'stopped' then btrim(coalesce(p_comment, ''))
    else ''
  end;
  updated_row public.student_result_vote%rowtype;
begin
  if p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'Actor is required';
  end if;

  if p_outcome is null or p_outcome not in ('pending', 'passed', 'failed', 'stopped') then
    raise exception using errcode = '22023', message = 'Invalid PFP outcome';
  end if;

  if p_outcome = 'stopped' and normalized_comment = '' then
    raise exception using errcode = '22023', message = 'A stop reason is required';
  end if;

  select *
  into current_row
  from public.student_result_vote
  where id = p_assignment_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'PFP assignment not found';
  end if;

  previous_outcome := case
    when coalesce(current_row.pfp_validee, false) then 'passed'
    when coalesce(current_row.pfp_echec, false) then 'failed'
    when coalesce(current_row.pfp_arret, false) then 'stopped'
    else 'pending'
  end;

  update public.student_result_vote
  set pfp_validee = p_outcome = 'passed',
      pfp_echec = p_outcome = 'failed',
      pfp_arret = p_outcome = 'stopped',
      commentaire_arret = normalized_comment,
      updated_at = now()
  where id = p_assignment_id
  returning * into updated_row;

  if previous_outcome is distinct from p_outcome
     or coalesce(current_row.commentaire_arret, '') is distinct from normalized_comment then
    insert into public.pfp_outcome_audit (
      assignment_id,
      actor_user_id,
      previous_outcome,
      next_outcome,
      comment
    ) values (
      p_assignment_id,
      p_actor_user_id,
      previous_outcome,
      p_outcome,
      normalized_comment
    );
  end if;

  return jsonb_build_object(
    'id', updated_row.id,
    'pfp_validee', updated_row.pfp_validee,
    'pfp_echec', updated_row.pfp_echec,
    'pfp_arret', updated_row.pfp_arret,
    'commentaire_arret', updated_row.commentaire_arret,
    'updated_at', updated_row.updated_at
  );
end;
$$;

revoke all on function public.set_pfp_outcome(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.set_pfp_outcome(uuid, text, text, uuid)
  to service_role;
