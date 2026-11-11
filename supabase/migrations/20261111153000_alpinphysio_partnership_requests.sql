-- Alp'in Physio : demandes de partenariat envoyées depuis la page publique.
--
-- Un organisateur de course remplit un formulaire sans compte. La demande est
-- enregistrée par une fonction contrôlée (pas d'écriture directe dans la
-- table) et n'est lisible que par les responsables Alp'in Physio.

create table if not exists public.alpinphysio_partnership_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization text not null check (length(btrim(organization)) between 2 and 160),
  contact_name text not null check (length(btrim(contact_name)) between 2 and 120),
  email text not null check (length(email) between 5 and 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or length(phone) <= 40),
  event_date date,
  location text check (location is null or length(location) <= 160),
  masseurs_count integer check (masseurs_count is null or masseurs_count between 1 and 200),
  message text check (message is null or length(message) <= 2000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'archived')),
  internal_notes text check (internal_notes is null or length(internal_notes) <= 2000),
  handled_by uuid references auth.users(id) on delete set null
);

create index if not exists alpinphysio_partnership_requests_status_idx
  on public.alpinphysio_partnership_requests (status, created_at desc);

alter table public.alpinphysio_partnership_requests enable row level security;

-- Aucun accès anonyme ni étudiant : seuls les responsables lisent et traitent.
revoke all on table public.alpinphysio_partnership_requests from public, anon, authenticated;
grant select, update on table public.alpinphysio_partnership_requests to authenticated;
grant all on table public.alpinphysio_partnership_requests to service_role;

create policy alpin_partnership_manager_read on public.alpinphysio_partnership_requests
for select to authenticated
using ((select public.app_is_alpinphysio_manager()));

create policy alpin_partnership_manager_update on public.alpinphysio_partnership_requests
for update to authenticated
using ((select public.app_is_alpinphysio_manager()))
with check ((select public.app_is_alpinphysio_manager()));

create or replace trigger alpinphysio_partnership_requests_updated_at
before update on public.alpinphysio_partnership_requests
for each row execute function public.set_updated_at();

-- Dépôt d'une demande depuis la page publique (visiteur sans compte).
-- Les valeurs sont nettoyées ici ; les contraintes de la table font foi.
-- Garde-fou contre l'envoi en masse : 30 demandes par heure au maximum.
create or replace function public.submit_alpinphysio_partnership_request(p_request jsonb)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_recent integer;
  v_count text := nullif(btrim(coalesce(p_request->>'masseurs_count', '')), '');
  v_date text := nullif(btrim(coalesce(p_request->>'event_date', '')), '');
begin
  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception 'Demande invalide.' using errcode = '22023';
  end if;

  -- Champ piège invisible pour les personnes : un robot qui le remplit reçoit
  -- une réponse positive, mais rien n'est enregistré.
  if nullif(btrim(coalesce(p_request->>'website', '')), '') is not null then
    return true;
  end if;

  select count(*) into v_recent
  from public.alpinphysio_partnership_requests
  where created_at > now() - interval '1 hour';
  if v_recent >= 30 then
    raise exception 'Trop de demandes reçues pour le moment. Merci de réessayer plus tard ou d''écrire à alpinphysio@hevs.ch.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  if v_count is not null and v_count !~ '^\d{1,3}$' then
    raise exception 'Le nombre de masseurs doit être un nombre entier.' using errcode = '22023';
  end if;
  if v_date is not null and v_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'La date de l''événement est invalide.' using errcode = '22023';
  end if;

  insert into public.alpinphysio_partnership_requests (
    organization, contact_name, email, phone, event_date, location, masseurs_count, message
  ) values (
    btrim(coalesce(p_request->>'organization', '')),
    btrim(coalesce(p_request->>'contact_name', '')),
    lower(btrim(coalesce(p_request->>'email', ''))),
    nullif(btrim(coalesce(p_request->>'phone', '')), ''),
    v_date::date,
    nullif(btrim(coalesce(p_request->>'location', '')), ''),
    v_count::integer,
    nullif(btrim(coalesce(p_request->>'message', '')), '')
  );

  return true;
exception
  when check_violation then
    raise exception 'Merci de vérifier les champs du formulaire (nom, organisation et adresse e-mail valides).'
      using errcode = '22023';
end;
$$;

revoke all on function public.submit_alpinphysio_partnership_request(jsonb) from public;
grant execute on function public.submit_alpinphysio_partnership_request(jsonb) to anon, authenticated, service_role;
