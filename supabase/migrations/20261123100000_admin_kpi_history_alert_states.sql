-- Dashboards admin : historique quotidien des KPI de stock et état des alertes.
--
-- Avant : les KPI de stock (comptes, institutions, places, modules...) n'ont aucun
-- historique, donc aucune comparaison possible, et la résolution d'une alerte
-- n'existe qu'en mémoire du navigateur.
--
-- Après :
--   * admin_kpi_snapshots : une valeur agrégée par jour et par KPI ;
--   * admin_alert_states : la dernière résolution de chaque règle d'alerte.
--
-- Ces tables ne contiennent que des agrégats et l'identifiant de l'admin qui a résolu.
-- Elles sont lues et écrites uniquement par le backend (service_role) : RLS active,
-- aucune règle pour anon ou authenticated.
-- Migration rejouable et sans opération destructive.

create table if not exists public.admin_kpi_snapshots (
  snapshot_date date not null,
  domain text not null check (domain in ('general', 'pfp', 'academic', 'gamification')),
  metric text not null check (char_length(metric) between 1 and 64),
  value numeric not null check (value >= 0),
  captured_at timestamptz not null default now(),
  primary key (snapshot_date, domain, metric)
);

create table if not exists public.admin_alert_states (
  alert_key text primary key check (char_length(alert_key) between 1 and 120),
  resolved_value numeric,
  resolved_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null
);

create index if not exists admin_alert_states_resolved_by_idx
  on public.admin_alert_states (resolved_by);

alter table public.admin_kpi_snapshots enable row level security;
alter table public.admin_alert_states enable row level security;

revoke all on table public.admin_kpi_snapshots from public, anon, authenticated;
revoke all on table public.admin_alert_states from public, anon, authenticated;
grant select, insert, update on table public.admin_kpi_snapshots to service_role;
grant select, insert, update, delete on table public.admin_alert_states to service_role;

comment on table public.admin_kpi_snapshots is
  'Valeurs quotidiennes agrégées des KPI de stock des dashboards admin. Accès backend uniquement.';
comment on table public.admin_alert_states is
  'Dernière résolution des alertes admin. Une alerte se rouvre si sa valeur change. Accès backend uniquement.';
