alter table public.institutions
add column if not exists is_hidden boolean not null default false;

comment on column public.institutions.is_hidden is 'Masque une institution des vues publiques sans la supprimer.';
