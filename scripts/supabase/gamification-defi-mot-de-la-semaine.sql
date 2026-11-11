-- Défi hebdomadaire « Mot de la semaine » : un défi par semaine (lundi à dimanche), de la
-- semaine en cours jusqu'à la fin de l'année académique. Pour tous les joueurs (BA24–BA26).
--
-- Le défi sert de rappel et de lien vers le jeu (/mot-de-la-semaine). Il ne rapporte rien
-- de plus (xp_reward = 0) : les XP restent ceux du jeu (30 XP, +15 XP en 3 essais ou moins).
-- Il se coche tout seul quand le joueur trouve le mot de la semaine.
--
-- Chaque défi est inséré au statut « scheduled » : le planificateur
-- (install-gamification-scheduler.sql) l'ouvre le lundi et le clôt après le dimanche.
-- Le défi de la semaine en cours est ouvert tout de suite, et les joueurs qui ont déjà
-- trouvé le mot de la semaine le voient coché.
--
-- À lancer après les migrations 20261112100000_gamification_word_of_week.sql et
-- 20261112110000_gamification_challenge_action_link.sql.
-- Usage : psql -X -v ON_ERROR_STOP=1 -f gamification-defi-mot-de-la-semaine.sql
--         (autre date de fin : -v fin=2027-06-20, valeur par défaut)
-- Relançable : un défi (nom + date de début) déjà présent n'est pas recréé.

\set ON_ERROR_STOP on
\if :{?fin}
\else
  \set fin 2027-06-20
\endif

begin;

insert into public.challenges (
  name, description, action_type, target_value, xp_reward, week_number, year,
  start_date, end_date, is_active, status, action_url
)
select
  'Mot de la semaine',
  'Trouve le mot de la semaine physio en 6 essais. Dans le jeu : 30 XP, et 15 XP de plus en 3 essais ou moins.',
  'word_of_week', 1, 0,
  extract(week from w.lundi)::int, extract(isoyear from w.lundi)::int,
  w.lundi, w.lundi + 6, false, 'scheduled', '/mot-de-la-semaine'
from (
  select d::date as lundi
  from generate_series(
    gamification_private.word_of_day_week_start()::timestamp,
    date_trunc('week', (:'fin')::date)::timestamp,
    interval '7 days'
  ) as d
) w
where not exists (
  select 1 from public.challenges c
  where c.name = 'Mot de la semaine' and c.start_date = w.lundi
);

-- Ouvre le défi de la semaine en cours sans attendre le prochain passage du planificateur.
select gamification_private.refresh_lifecycle();

-- Coche le défi pour les joueurs qui ont déjà trouvé le mot (aucun XP versé ici).
select count(*) as progressions_reprises
from (
  select gamification_private.word_of_day_mark_challenge(g.user_id, g.play_date)
  from gamification_private.word_of_day_guesses g
  where g.is_correct
    and g.play_date = date_trunc('week', g.play_date)::date
    and g.play_date >= gamification_private.word_of_day_week_start()
) reprises;

-- ===================== Contrôle =====================
select c.start_date as debut, c.end_date as fin, c.status as statut, c.action_url as lien, c.xp_reward as xp,
       (gamification_private.validate_lifecycle_entity('challenge', c.id) ->> 'valid') as valide,
       (select count(*) from public.user_challenge_progress p where p.challenge_id = c.id and p.completed) as reussis
from public.challenges c
where c.name = 'Mot de la semaine'
order by c.start_date
limit 5;

commit;
