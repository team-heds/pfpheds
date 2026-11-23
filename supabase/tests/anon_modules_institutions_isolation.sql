\set ON_ERROR_STOP on

begin;

do $$
begin
  if not has_column_privilege('anon', 'public.modules', 'title', 'SELECT') then
    raise exception 'anon doit garder les colonnes publiques de modules';
  end if;
  if has_column_privilege('anon', 'public.modules', 'responsable', 'SELECT')
    or has_column_privilege('anon', 'public.modules', 'responsable_email', 'SELECT')
    or has_column_privilege('anon', 'public.modules', 'coordinateur', 'SELECT') then
    raise exception 'anon ne doit pas lire les responsables de modules';
  end if;
  if has_table_privilege('anon', 'public.institutions', 'SELECT')
    or has_column_privilege('anon', 'public.institutions', 'MailChef', 'SELECT')
    or has_column_privilege('anon', 'public.institutions', 'PhoneChef', 'SELECT') then
    raise exception 'anon ne doit pas lire les institutions';
  end if;
  if not has_column_privilege('authenticated', 'public.modules', 'responsable_email', 'SELECT')
    or not has_table_privilege('authenticated', 'public.institutions', 'SELECT') then
    raise exception 'les comptes connectés doivent garder leur accès';
  end if;
end $$;

rollback;
