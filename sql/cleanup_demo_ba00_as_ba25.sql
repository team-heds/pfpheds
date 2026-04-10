-- Cleanup démo: supprime les 10 étudiants fictifs BA00 injectés comme BA25
-- Exécuter après la présentation.

begin;

create temporary table demo_ba00_ids (
  user_id uuid primary key
) on commit drop;

insert into demo_ba00_ids (user_id)
select user_id
from public.demo_ba00_seed_users;

-- Supprimer d'abord les résultats/votes liés
-- (tolérant si table absente)
do $$
begin
  if to_regclass('public.student_result_vote') is not null then
    execute 'delete from public.student_result_vote where user_id in (select user_id from demo_ba00_ids)';
  end if;

  if to_regclass('public.student_votes') is not null then
    execute 'delete from public.student_votes where user_id in (select user_id from demo_ba00_ids)';
  end if;

  if to_regclass('public.votation_results') is not null then
    execute 'delete from public.votation_results where user_id in (select user_id from demo_ba00_ids)';
  end if;
end $$;

-- Nettoyer StudentsPhysio
-- (nom de table potentiellement avec casse)
do $$
declare
  tbl regclass;
  c_user_id text;
begin
  tbl := coalesce(to_regclass('public."StudentsPhysio"'), to_regclass('public.studentsphysio'));
  if tbl is not null then
    select attname into c_user_id
    from pg_attribute
    where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) = 'user_id'
    limit 1;

    if c_user_id is not null then
      execute format('delete from %s where %I in (select user_id from demo_ba00_ids)', tbl, c_user_id);
    end if;
  end if;
end $$;

delete from public.demo_ba00_seed_users;

commit;
