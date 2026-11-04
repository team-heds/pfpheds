-- A historical import is valid only when its batch and rule version are known.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_badges'::regclass
      and conname = 'user_badges_historical_provenance_check'
  ) then
    alter table public.user_badges
      add constraint user_badges_historical_provenance_check
      check (
        reward_origin <> 'historical_import'
        or (
          historical_batch_id is not null
          and nullif(btrim(reward_rule_version), '') is not null
        )
      );
  end if;
end
$$;
