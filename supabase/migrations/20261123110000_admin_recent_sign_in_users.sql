-- Dashboards admin : comptes connectés sur une période.
--
-- Constat en production (23.11.2026) : 301 comptes sur 326 ont un champ auth.users.aud vide.
-- L'API d'administration ne liste que les comptes « authenticated », soit 25 comptes jamais
-- connectés : le KPI « Connectés (30 jours) » affichait 0 au lieu de 101.
--
-- Cette fonction lit directement last_sign_in_at, sans modifier aucun compte. Elle ne renvoie
-- que des identifiants et n'est exécutable que par le backend (service_role).
-- Migration rejouable et sans opération destructive.

create or replace function public.admin_recent_sign_in_user_ids(p_since timestamptz)
returns table (user_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where u.last_sign_in_at >= p_since
  order by u.id
$$;

revoke all on function public.admin_recent_sign_in_user_ids(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_recent_sign_in_user_ids(timestamptz) to service_role;

comment on function public.admin_recent_sign_in_user_ids(timestamptz) is
  'Identifiants des comptes connectés depuis une date, pour les KPI admin. Accès backend uniquement.';

notify pgrst, 'reload schema';
