-- Lancement de la gamification pour l'année académique 2026-2027.
--
-- Usage (une seule transaction, arrêt à la première erreur) :
--   psql -X -v ON_ERROR_STOP=1 -v admin_id=<uuid admin> -v launch_date=2026-11-16 -f gamification-launch-2026-2027.sql
--
-- Prérequis : migrations de la PR #237 et 20261109090000_gamification_season_reset.sql appliquées.
-- Effets :
--   1. archive puis remet à 0 l'XP, les niveaux et les points des maisons (maisons et badges conservés) ;
--   2. clôt les anciens défis, les quêtes échues et désactive les badges du pilote ;
--   3. publie les 4 défis de lancement, ouverts 4 semaines à partir de launch_date ;
--   4. ouvre les récompenses aux étudiants BA24, BA25 et BA26 (liste nominative, auditée).
-- Relançable : la remise à 0 n'est faite qu'une fois par saison, les défis ne sont pas dupliqués.

\set ON_ERROR_STOP on
begin;

-- Les fonctions d'administration exigent un compte administrateur authentifié.
select set_config('request.jwt.claims', json_build_object('sub', :'admin_id', 'role', 'authenticated')::text, true);
select set_config('gamification.launch_date', :'launch_date', true);

do $$
begin
  if not (select public.app_is_privileged()) then
    raise exception 'admin_id n''est pas un compte administrateur';
  end if;
  if current_setting('gamification.launch_date')::date < current_date - 7 then
    raise exception 'launch_date trop ancienne';
  end if;
end $$;

\echo '== Avant remise à zéro'
select jsonb_pretty(public.preview_gamification_season_reset('2026-2027'));

\echo '== 1. Remise à zéro de la saison 2026-2027'
select jsonb_pretty(public.apply_gamification_season_reset(
  '2026-2027',
  'Lancement de la gamification 2026-2027 : XP et points des maisons remis à zéro'
))
where not (public.preview_gamification_season_reset('2026-2027') ->> 'already_reset')::boolean;

\echo '== 2. Clôture des anciens défis, des quêtes échues et des badges du pilote'
update public.challenges
set is_active = false,
    status = 'archived',
    archived_at = coalesce(archived_at, now())
where status <> 'archived'
  and coalesce(start_date, '-infinity'::date) < current_setting('gamification.launch_date')::date;

update public.quests
set status = 'completed',
    completed_at = coalesce(completed_at, now())
where status = 'active'
  and end_date < now();

-- Les badges du pilote fermé (« TEST — … ») ne doivent pas être gagnés par les étudiants.
update public.badges
set is_active = false
where is_active
  and name ilike 'TEST%';

\echo '== 3. Défis de lancement'
with launch as (select current_setting('gamification.launch_date')::date as d),
catalog(name, description, action_type, target_value, xp_reward) as (
  values
    ('Profil à jour',
     'Complète ou mets à jour ton profil (photo, présentation, coordonnées).',
     'update_profile', 1, 25),
    ('Présence régulière',
     'Connecte-toi à la plateforme 5 jours différents.',
     'daily_login', 5, 30),
    ('Premier partage',
     'Publie un message dans le feed : une expérience, une question, une ressource.',
     'create_post', 1, 40),
    ('Pilier de la maison',
     'Connecte-toi 12 jours différents et fais vivre ta maison.',
     'daily_login', 12, 60)
)
insert into public.challenges (
  name, description, action_type, target_value, xp_reward,
  year, start_date, end_date, is_active, status, published_at
)
select c.name, c.description, c.action_type, c.target_value, c.xp_reward,
       2026, l.d, l.d + 27, true, 'active', now()
from catalog c cross join launch l
where not exists (
  select 1 from public.challenges x
  where x.name = c.name and x.start_date = l.d
);

select name, action_type, target_value, xp_reward, start_date, end_date, status
from public.challenges
where status = 'active'
order by xp_reward;

\echo '== 4. Public : étudiants BA24, BA25, BA26'
select count(*) filter (where (r ->> 'write_performed')::boolean) as ajoutes, count(*) as eligibles
from (
  select public.set_gamification_rollout_member(
    up.user_id, true, 'Lancement gamification 2026-2027 : BA24 à BA26'
  ) as r
  from public.user_profiles up
  where up.classe in ('BA24', 'BA25', 'BA26')
    and up.role = 'EtudiantPhysio'
    and coalesce(up.is_active, true)
) s;

select jsonb_pretty(public.configure_gamification_rollout(
  true, 'allowlist', 'Lancement gamification 2026-2027 : récompenses actives pour BA24 à BA26'
));

\echo '== Contrôle final'
select
  (select coalesce(sum(total_xp), 0) from public.gamification_data) as xp_total,
  (select coalesce(sum(total_xp), 0) from public.houses) as points_maisons,
  (select count(*) from public.challenges where status = 'active') as defis_actifs,
  (select count(*) from gamification_private.rollout_audience) as public_recompenses;

commit;
