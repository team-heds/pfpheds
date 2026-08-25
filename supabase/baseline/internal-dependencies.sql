-- Dépendance applicative située dans le schéma Supabase interne auth.
-- À appliquer uniquement sur une stack éphémère/neuve avant public-schema.sql.
do $baseline$
begin
  if not exists (select 1 from pg_extension where extname = 'citext') then
    execute 'create extension "citext" with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='citext' and n.nspname='public'
  ) then
    execute 'alter extension "citext" set schema public';
  end if;
end
$baseline$;
do $baseline$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    execute 'create extension "pg_net" with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='pg_net' and n.nspname='public'
  ) then
    raise exception 'Extension pg_net déjà installée hors de public et non déplaçable';
  end if;
end
$baseline$;
do $baseline$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute 'create extension "pg_trgm" with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='pg_trgm' and n.nspname='public'
  ) then
    execute 'alter extension "pg_trgm" set schema public';
  end if;
end
$baseline$;
do $baseline$
begin
  if not exists (select 1 from pg_extension where extname = 'pgcrypto') then
    execute 'create extension "pgcrypto" with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='pgcrypto' and n.nspname='public'
  ) then
    execute 'alter extension "pgcrypto" set schema public';
  end if;
end
$baseline$;
do $baseline$
begin
  if not exists (select 1 from pg_extension where extname = 'uuid-ossp') then
    execute 'create extension "uuid-ossp" with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='uuid-ossp' and n.nspname='public'
  ) then
    execute 'alter extension "uuid-ossp" set schema public';
  end if;
end
$baseline$;
alter table storage.buckets add column if not exists id text not null;
alter table storage.buckets add column if not exists name text not null;
alter table storage.buckets add column if not exists owner uuid;
alter table storage.buckets add column if not exists created_at timestamp with time zone default now();
alter table storage.buckets add column if not exists updated_at timestamp with time zone default now();
alter table storage.buckets add column if not exists public boolean default false;
alter table storage.buckets add column if not exists avif_autodetection boolean default false;
alter table storage.buckets add column if not exists file_size_limit bigint;
alter table storage.buckets add column if not exists allowed_mime_types text[];
alter table storage.buckets add column if not exists owner_id text;
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$
;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$
;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$
;

CREATE OR REPLACE FUNCTION auth.uuid_eq_text(u uuid, t text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$ SELECT u = t::uuid; $function$
;
