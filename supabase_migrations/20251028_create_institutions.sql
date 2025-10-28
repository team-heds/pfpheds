-- Migration: création de la table institutions et activation RLS
-- Date: 2025-10-28

-- 1. S'assurer que la fonction de mise à jour du timestamp existe
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  if to_jsonb(new) ? 'UpdatedAt' then
    new."UpdatedAt" = now();
  end if;
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

-- 2. Créer la table si elle n'existe pas
create table if not exists public.institutions (
  "InstitutionId" text primary key,
  "Name" text not null,
  "Category" text,
  "Address" text,
  "Locality" text,
  "Canton" text,
  "NPA" text,
  "Language" text,
  "Description" text,
  "URL" text,
  "CyberleanURL" text,
  "MailChef" text,
  "NomChef" text,
  "PhoneChef" text,
  "IdResponsablePhysio" text,
  "AccordCadreDate" date,
  "AccordCadrePDF" text,
  "ConventionDate" date,
  "ConventionPDF" text,
  "ImageURL" jsonb default '[]'::jsonb,
  "Latitude" numeric,
  "Longitude" numeric,
  "CreatedAt" timestamptz default now(),
  "UpdatedAt" timestamptz default now()
);

-- 3. Déclencheur pour mettre à jour UpdatedAt automatiquement
create trigger institutions_set_updated_at
  before update on public.institutions
  for each row
  execute procedure public.set_current_timestamp_updated_at();

-- 4. Activer RLS
alter table public.institutions enable row level security;

-- 5. Politique de lecture (ouverte)
drop policy if exists "Institutions read access" on public.institutions;
create policy "Institutions read access"
  on public.institutions
  for select
  using (true);

-- 6. Politique d'insertion (à restreindre selon besoin)
drop policy if exists "Institutions insert service role" on public.institutions;
create policy "Institutions insert service role"
  on public.institutions
  for insert
  with check (auth.role() = 'service_role');

-- 7. Politique de mise à jour (service role uniquement par défaut)
drop policy if exists "Institutions update service role" on public.institutions;
create policy "Institutions update service role"
  on public.institutions
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 8. Politique de suppression (service role uniquement par défaut)
drop policy if exists "Institutions delete service role" on public.institutions;
create policy "Institutions delete service role"
  on public.institutions
  for delete
  using (auth.role() = 'service_role');
