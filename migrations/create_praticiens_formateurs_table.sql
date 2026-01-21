-- Créer la table des praticiens formateurs
create table if not exists public.praticiens_formateurs (
  id bigint not null,
  nom text not null,
  prenom text not null,
  mail text null,
  institution text null,
  localite text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint praticiens_formateurs_new_pkey primary key (id)
) TABLESPACE pg_default;

-- Créer les index pour la recherche
create index if not exists idx_praticiens_nom on public.praticiens_formateurs using btree (nom) TABLESPACE pg_default;
create index if not exists idx_praticiens_prenom on public.praticiens_formateurs using btree (prenom) TABLESPACE pg_default;
create index if not exists idx_praticiens_mail on public.praticiens_formateurs using btree (mail) TABLESPACE pg_default;
