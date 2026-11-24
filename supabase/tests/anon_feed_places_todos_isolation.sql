\set ON_ERROR_STOP on

begin;

do $$
declare
  t text;
  p text;
begin
  foreach t in array array['posts', 'post_media', 'places', 'todos'] loop
    foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if has_table_privilege('anon', format('public.%I', t), p) then
        raise exception 'anon ne doit pas avoir % sur public.%', p, t;
      end if;
    end loop;
    if not has_table_privilege('authenticated', format('public.%I', t), 'SELECT') then
      raise exception 'les comptes connectés doivent garder la lecture de public.%', t;
    end if;
  end loop;
end $$;

rollback;
