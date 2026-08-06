-- Restore the minimum Data API privilege required by the trusted backend
-- authorization middleware. RLS remains enabled and no browser role receives
-- additional access.

do $migration$
begin
  if to_regclass('public.user_track_roles') is not null then
    grant select on table public.user_track_roles to service_role;
  end if;
end
$migration$;
