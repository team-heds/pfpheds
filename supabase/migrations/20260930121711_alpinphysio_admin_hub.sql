-- Alp'in Physio administration hub
-- One event source powers the public site, the authenticated events area and the feed.

insert into public.tracks (id, label, label_short, description, color, icon, is_active, display_order)
values ('ALPIN', 'Alp''in Physio', 'Alp''in', 'Association étudiante Alp''in Physio', '#168794', 'pi-compass', true, 30)
on conflict (id) do update set
  label = excluded.label,
  label_short = excluded.label_short,
  description = excluded.description,
  color = excluded.color,
  icon = excluded.icon,
  is_active = true;

insert into public.permissions (slug, description) values
  ('alpinphysio.view', 'Accéder à l''espace Alp''in Physio'),
  ('alpinphysio.events.manage', 'Créer et publier les événements Alp''in Physio'),
  ('alpinphysio.attendance.manage', 'Consulter les réponses de présence Alp''in Physio'),
  ('alpinphysio.material.manage', 'Gérer le matériel des événements Alp''in Physio'),
  ('alpinphysio.site.manage', 'Modifier le contenu de la vitrine Alp''in Physio')
on conflict (slug) do update set description = excluded.description;

create or replace function public.app_is_alpinphysio_manager()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (select public.is_global_admin())
    or exists (
      select 1
      from public.user_track_roles utr
      where utr.user_id = (select auth.uid())
        and utr.track_id = 'ALPIN'
        and utr.role in ('ADMIN', 'COORDINATOR')
        and utr.is_active = true
        and (utr.expires_at is null or utr.expires_at > now())
    )
    or exists (
      select 1
      from public.user_profiles up
      where up.user_id = (select auth.uid())
        and up.is_active = true
        and (
          up.role in ('admin', 'superadmin')
          or coalesce(up.permissions, '[]'::jsonb) ?| array[
            'alpinphysio.events.manage',
            'alpinphysio.attendance.manage',
            'alpinphysio.material.manage',
            'alpinphysio.site.manage'
          ]
        )
    );
$$;

revoke all on function public.app_is_alpinphysio_manager() from public;
grant execute on function public.app_is_alpinphysio_manager() to authenticated, service_role;

-- Make the ALPIN track visible to the existing frontend permission store.
create or replace function public.api_my_permissions()
returns table(perm text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  user_role text;
  user_permissions jsonb;
begin
  if current_user_id is null then return; end if;

  select up.role, up.permissions
    into user_role, user_permissions
  from public.user_profiles up
  where up.user_id = current_user_id
  limit 1;

  if user_role is not null and btrim(user_role) <> '' then
    return query select user_role;
  end if;

  if jsonb_typeof(user_permissions) = 'array' then
    return query select jsonb_array_elements_text(user_permissions)::text;
  end if;

  if exists (
    select 1 from public.user_track_roles utr
    where utr.user_id = current_user_id
      and utr.track_id = 'ALPIN'
      and utr.role in ('ADMIN', 'COORDINATOR')
      and utr.is_active = true
      and (utr.expires_at is null or utr.expires_at > now())
  ) then
    return query values
      ('alpinphysio.view'::text),
      ('alpinphysio.events.manage'::text),
      ('alpinphysio.attendance.manage'::text),
      ('alpinphysio.material.manage'::text),
      ('alpinphysio.site.manage'::text);
  end if;
end;
$$;

alter table public.events
  add column if not exists status text not null default 'published',
  add column if not exists show_on_public_site boolean not null default false,
  add column if not exists show_in_feed boolean not null default false,
  add column if not exists registration_deadline timestamptz,
  add column if not exists capacity integer,
  add column if not exists meeting_point text,
  add column if not exists contact_email text,
  add column if not exists published_at timestamptz,
  add column if not exists cancelled_at timestamptz;

update public.events
set status = 'published',
    published_at = coalesce(published_at, created_at),
    show_on_public_site = case when type = 'public' then true else show_on_public_site end
where status = 'published';

alter table public.events alter column status set default 'draft';
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('draft', 'published', 'cancelled'));
alter table public.events drop constraint if exists events_capacity_check;
alter table public.events add constraint events_capacity_check
  check (capacity is null or capacity > 0);

alter table public.event_registrations
  add column if not exists response text not null default 'going',
  add column if not exists note text,
  add column if not exists updated_at timestamptz not null default now();
alter table public.event_registrations drop constraint if exists event_registrations_response_check;
alter table public.event_registrations add constraint event_registrations_response_check
  check (response in ('going', 'maybe', 'not_going'));

create table if not exists public.event_material_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 160),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'to_prepare' check (status in ('to_prepare', 'ready', 'missing')),
  notes text,
  assigned_to text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_material_items_event_idx
  on public.event_material_items (event_id, sort_order, created_at);

create table if not exists public.alpinphysio_site_content (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.alpinphysio_site_content (id, content, is_published)
values ('main', '{}'::jsonb, true)
on conflict (id) do nothing;

alter table public.posts add column if not exists event_id uuid references public.events(id) on delete cascade;
create unique index if not exists posts_event_id_unique on public.posts (event_id);

drop view if exists public.events_with_counts;
create view public.events_with_counts
with (security_invoker = true)
as
select
  e.*,
  coalesce(r.registration_count, 0)::bigint as registration_count,
  coalesce(r.going_count, 0)::bigint as going_count,
  coalesce(r.maybe_count, 0)::bigint as maybe_count,
  coalesce(r.not_going_count, 0)::bigint as not_going_count,
  coalesce(l.likes_count, 0)::bigint as likes_count
from public.events e
left join (
  select event_id,
    count(*) as registration_count,
    count(*) filter (where response = 'going') as going_count,
    count(*) filter (where response = 'maybe') as maybe_count,
    count(*) filter (where response = 'not_going') as not_going_count
  from public.event_registrations
  group by event_id
) r on r.event_id = e.id
left join (
  select event_id, count(*) as likes_count
  from public.event_likes
  group by event_id
) l on l.event_id = e.id;

alter table public.event_material_items enable row level security;
alter table public.alpinphysio_site_content enable row level security;

drop policy if exists alpin_track_manager_read on public.user_track_roles;
create policy alpin_track_manager_read on public.user_track_roles
for select to authenticated
using (
  track_id = 'ALPIN'
  and (select public.app_is_alpinphysio_manager())
);

drop policy if exists alpin_track_manager_add_coordinators on public.user_track_roles;
create policy alpin_track_manager_add_coordinators on public.user_track_roles
for insert to authenticated
with check (
  track_id = 'ALPIN'
  and role = 'COORDINATOR'
  and (select public.app_is_alpinphysio_manager())
);

drop policy if exists alpin_track_manager_update_coordinators on public.user_track_roles;
create policy alpin_track_manager_update_coordinators on public.user_track_roles
for update to authenticated
using (
  track_id = 'ALPIN'
  and role = 'COORDINATOR'
  and (select public.app_is_alpinphysio_manager())
)
with check (
  track_id = 'ALPIN'
  and role = 'COORDINATOR'
  and (select public.app_is_alpinphysio_manager())
);

-- Replace the legacy broad event policies with explicit ownership and Alp'in management rules.
do $$
declare p record;
begin
  for p in select polname from pg_policy where polrelid = 'public.events'::regclass loop
    execute format('drop policy %I on public.events', p.polname);
  end loop;
  for p in select polname from pg_policy where polrelid = 'public.event_registrations'::regclass loop
    execute format('drop policy %I on public.event_registrations', p.polname);
  end loop;
end $$;

create policy events_public_read on public.events
for select to anon
using (
  status = 'published'
  and (type = 'public' or (type = 'alpinphysio' and show_on_public_site))
);

create policy events_authenticated_read on public.events
for select to authenticated
using (
  status = 'published'
  or admin_uid = (select auth.uid())::text
  or (select public.app_is_privileged())
  or (type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
);

create policy events_authenticated_insert on public.events
for insert to authenticated
with check (
  admin_uid = (select auth.uid())::text
  and (
    type <> 'alpinphysio'
    or (select public.app_is_alpinphysio_manager())
  )
);

create policy events_owner_or_alpin_manager_update on public.events
for update to authenticated
using (
  admin_uid = (select auth.uid())::text
  or (select public.app_is_privileged())
  or (type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
)
with check (
  admin_uid = (select auth.uid())::text
  or (select public.app_is_privileged())
  or (type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
);

create policy events_owner_or_alpin_manager_delete on public.events
for delete to authenticated
using (
  admin_uid = (select auth.uid())::text
  or (select public.app_is_privileged())
  or (type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
);

create policy event_responses_read_own_or_manager on public.event_registrations
for select to authenticated
using (
  user_uid = (select auth.uid())::text
  or exists (
    select 1 from public.events e
    where e.id = event_id
      and (
        e.admin_uid = (select auth.uid())::text
        or (select public.app_is_privileged())
        or (e.type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
      )
  )
);

create policy event_responses_insert_own on public.event_registrations
for insert to authenticated
with check (
  user_uid = (select auth.uid())::text
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and (e.registration_deadline is null or e.registration_deadline >= now())
  )
);

create policy event_responses_update_own on public.event_registrations
for update to authenticated
using (user_uid = (select auth.uid())::text)
with check (
  user_uid = (select auth.uid())::text
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and (e.registration_deadline is null or e.registration_deadline >= now())
  )
);

create policy event_responses_delete_own on public.event_registrations
for delete to authenticated
using (user_uid = (select auth.uid())::text);

create policy event_material_read on public.event_material_items
for select to authenticated
using (true);
create policy event_material_manage on public.event_material_items
for all to authenticated
using ((select public.app_is_alpinphysio_manager()))
with check ((select public.app_is_alpinphysio_manager()));

create policy alpin_site_public_read on public.alpinphysio_site_content
for select to anon, authenticated
using (is_published);
create policy alpin_site_manager_read on public.alpinphysio_site_content
for select to authenticated
using ((select public.app_is_alpinphysio_manager()));
create policy alpin_site_manager_write on public.alpinphysio_site_content
for all to authenticated
using ((select public.app_is_alpinphysio_manager()))
with check ((select public.app_is_alpinphysio_manager()));

revoke all on table public.event_material_items from anon;
grant select, insert, update, delete on table public.event_material_items to authenticated;
grant all on table public.event_material_items to service_role;

grant select on table public.alpinphysio_site_content to anon, authenticated;
grant insert, update, delete on table public.alpinphysio_site_content to authenticated;
grant all on table public.alpinphysio_site_content to service_role;

grant select, insert, update on table public.user_track_roles to authenticated;
grant select on table public.user_profiles to authenticated;

grant select on table public.events_with_counts to anon, authenticated;
grant all on table public.events_with_counts to service_role;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists event_material_items_updated_at on public.event_material_items;
create trigger event_material_items_updated_at before update on public.event_material_items
for each row execute function public.set_updated_at();

drop trigger if exists alpinphysio_site_content_updated_at on public.alpinphysio_site_content;
create trigger alpinphysio_site_content_updated_at before update on public.alpinphysio_site_content
for each row execute function public.set_updated_at();
