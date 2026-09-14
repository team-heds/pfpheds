-- The admin dashboard filter catalog is loaded exclusively by the backend
-- service-role client. Browser grants and RLS policies remain unchanged.
grant select on table public.tracks to service_role;
