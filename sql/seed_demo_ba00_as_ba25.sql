-- Seed démo: crée 10 étudiants fictifs "BA00" injectés comme BA25
-- Objectif: pouvoir tester une votation PFP1 avec une classe de démonstration
--
-- Utilisation:
-- 1) Ouvrir Supabase SQL Editor
-- 2) Exécuter ce script
-- 3) Vérifier dans l'app (Admin -> Votation PFP) que les étudiants BA25 apparaissent
--
-- Nettoyage:
-- Exécuter ensuite sql/cleanup_demo_ba00_as_ba25.sql

begin;

create table if not exists public.demo_ba00_seed_users (
  user_id uuid primary key,
  seeded_at timestamptz not null default now()
);

create temporary table demo_name_pool (
  idx int primary key,
  forname text not null,
  family_name text not null
) on commit drop;

insert into demo_name_pool (idx, forname, family_name) values
(1, 'Lucas', 'Martin'),
(2, 'Emma', 'Bernard'),
(3, 'Noah', 'Petit'),
(4, 'Lina', 'Robert'),
(5, 'Ethan', 'Richard'),
(6, 'Jade', 'Durand'),
(7, 'Nathan', 'Moreau'),
(8, 'Chloe', 'Simon'),
(9, 'Milo', 'Laurent'),
(10, 'Lena', 'Michel');

create temporary table demo_ba00_students (
  user_id uuid primary key,
  class_value text not null,
  forname text not null,
  family_name text not null,
  email text not null,
  sae boolean not null default false,
  cas_particulier boolean not null default false
) on commit drop;

create temporary table demo_selected_users (
  user_id uuid primary key,
  email text,
  rn int not null
) on commit drop;

insert into demo_selected_users (user_id, email, rn)
select up.user_id, up.email, row_number() over (order by up.user_id)
from public.user_profiles up
join auth.users au on au.id = up.user_id
where up.user_id is not null
  and (
    lower(coalesce(up.role, '')) like '%student%'
    or lower(coalesce(up.email, '')) like '%@students.hevs.ch'
  )
limit 10;

do $$
declare
  c int;
begin
  select count(*) into c from demo_selected_users;
  if c < 10 then
    raise exception 'Seed démo impossible: seulement % utilisateurs étudiants disponibles (10 requis).', c;
  end if;
end $$;

insert into demo_ba00_students (user_id, class_value, forname, family_name, email, sae, cas_particulier)
select s.user_id,
       'BA00',
       n.forname,
       n.family_name,
       coalesce(s.email, format('ba00.demo%02s@students.hevs.ch', n.idx::text)),
       false,
       false
from demo_selected_users s
join demo_name_pool n on n.idx = s.rn;

delete from public.demo_ba00_seed_users;
insert into public.demo_ba00_seed_users (user_id)
select user_id from demo_ba00_students;

-- Injection robuste dans StudentsPhysio (colonnes variables selon environnement)
do $$
declare
  tbl regclass;
  c_user_id text;
  c_class text;
  c_forname text;
  c_family text;
  c_email text;
  c_year text;
  c_sae text;
  c_cas text;
  t_year text;
  t_sae text;
  t_cas text;
  col_list text;
  sel_list text;
begin
  tbl := coalesce(to_regclass('public."StudentsPhysio"'), to_regclass('public.studentsphysio'));

  if tbl is null then
    raise exception 'Table StudentsPhysio introuvable.';
  end if;

  select attname into c_user_id
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) = 'user_id'
  limit 1;

  select attname into c_class
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) in ('class', 'classe')
  order by case when lower(attname) = 'class' then 0 else 1 end
  limit 1;

  if c_user_id is null or c_class is null then
    raise exception 'Colonnes minimales manquantes dans StudentsPhysio (user_id, class/classe).';
  end if;

  select attname into c_forname
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) in ('forname', 'prenom')
  order by case when lower(attname) = 'forname' then 0 else 1 end
  limit 1;

  select attname into c_family
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) in ('family_name', 'nom')
  order by case when lower(attname) = 'family_name' then 0 else 1 end
  limit 1;

  select attname into c_email
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) in ('email', 'mail')
  order by case when lower(attname) = 'email' then 0 else 1 end
  limit 1;

  select attname into c_year
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) = 'year'
  limit 1;

  if c_year is not null then
    execute format('select pg_catalog.format_type(a.atttypid, a.atttypmod)
                    from pg_attribute a
                    where a.attrelid = %L::regclass and a.attname = %L and a.attnum > 0 and not a.attisdropped',
                    tbl::text, c_year)
    into t_year;
  end if;

  select attname into c_sae
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) = 'sae'
  limit 1;

  if c_sae is not null then
    execute format('select pg_catalog.format_type(a.atttypid, a.atttypmod)
                    from pg_attribute a
                    where a.attrelid = %L::regclass and a.attname = %L and a.attnum > 0 and not a.attisdropped',
                    tbl::text, c_sae)
    into t_sae;
  end if;

  select attname into c_cas
  from pg_attribute
  where attrelid = tbl and attnum > 0 and not attisdropped and lower(attname) = 'cas_particulier'
  limit 1;

  if c_cas is not null then
    execute format('select pg_catalog.format_type(a.atttypid, a.atttypmod)
                    from pg_attribute a
                    where a.attrelid = %L::regclass and a.attname = %L and a.attnum > 0 and not a.attisdropped',
                    tbl::text, c_cas)
    into t_cas;
  end if;

  if c_year is not null then
    if t_year ilike '%int%' or t_year ilike '%numeric%' then
      execute format('delete from %s where %I in (select user_id from demo_ba00_students) and %I = 2026', tbl, c_user_id, c_year);
    else
      execute format('delete from %s where %I in (select user_id from demo_ba00_students) and %I = ''2026''', tbl, c_user_id, c_year);
    end if;
  else
    execute format('delete from %s where %I in (select user_id from demo_ba00_students)', tbl, c_user_id);
  end if;

  col_list := format('%I, %I', c_user_id, c_class);
  sel_list := 'd.user_id, d.class_value';

  if c_forname is not null then
    col_list := col_list || format(', %I', c_forname);
    sel_list := sel_list || ', d.forname';
  end if;

  if c_family is not null then
    col_list := col_list || format(', %I', c_family);
    sel_list := sel_list || ', d.family_name';
  end if;

  if c_email is not null then
    col_list := col_list || format(', %I', c_email);
    sel_list := sel_list || ', d.email';
  end if;

  if c_year is not null then
    col_list := col_list || format(', %I', c_year);
    if t_year ilike '%int%' or t_year ilike '%numeric%' then
      sel_list := sel_list || ', 2026';
    else
      sel_list := sel_list || ', ''2026''';
    end if;
  end if;

  if c_sae is not null then
    col_list := col_list || format(', %I', c_sae);
    if t_sae ilike '%int%' or t_sae ilike '%numeric%' then
      sel_list := sel_list || ', (case when d.sae then 1 else 0 end)';
    elsif t_sae ilike '%bool%' then
      sel_list := sel_list || ', d.sae';
    else
      sel_list := sel_list || ', (case when d.sae then ''true'' else ''false'' end)';
    end if;
  end if;

  if c_cas is not null then
    col_list := col_list || format(', %I', c_cas);
    if t_cas ilike '%int%' or t_cas ilike '%numeric%' then
      sel_list := sel_list || ', (case when d.cas_particulier then 1 else 0 end)';
    elsif t_cas ilike '%bool%' then
      sel_list := sel_list || ', d.cas_particulier';
    else
      sel_list := sel_list || ', (case when d.cas_particulier then ''true'' else ''false'' end)';
    end if;
  end if;

  execute format('insert into %s (%s) select %s from demo_ba00_students d', tbl, col_list, sel_list);

  raise notice 'Seed BA00->BA25 injecté dans %', tbl::text;
end $$;

commit;
