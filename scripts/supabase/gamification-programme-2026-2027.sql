-- Programme gamification 2026-2027 : 7 blocs de défis et de quêtes, du 7 décembre 2026
-- au 20 juin 2027 (pause pendant les vacances de Noël). Pour tous les joueurs (BA24–BA26).
--
-- Tout est inséré au statut « scheduled » : le planificateur (install-gamification-scheduler.sql)
-- ouvre chaque élément à sa date de début et le clôt à sa date de fin. Les quêtes sont
-- attribuées aux joueurs au moment de leur ouverture.
-- Actions comptées par le moteur : connexion (1 par jour), mise à jour du profil
-- (1 par jour), publication (3 par jour). Les étapes d'une quête se font dans l'ordre.
--
-- Usage : psql -X -v ON_ERROR_STOP=1 -v admin_id=<uuid admin> -f gamification-programme-2026-2027.sql
-- Relançable : un défi (nom + date de début) ou une quête (titre + date de début) déjà
-- présent n'est pas recréé.

\set ON_ERROR_STOP on
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'admin_id', 'role', 'authenticated')::text, true);
do $$ begin
  if not (select public.app_is_privileged()) then raise exception 'admin_id n''est pas un compte administrateur'; end if;
end $$;

-- ===================== Défis =====================
with programme(bloc, debut, fin, name, description, action_type, target_value, xp_reward) as (values
  -- Bloc 1 · Fin d'année (7–20 décembre)
  (1, date '2026-12-07', date '2026-12-20', 'Calendrier de l''Avent', 'Connecte-toi 8 jours différents avant les vacances.', 'daily_login', 8, 50),
  (1, date '2026-12-07', date '2026-12-20', 'Partage de fin de semestre', 'Publie 2 messages dans le feed : un souvenir, une ressource, un conseil.', 'create_post', 2, 40),
  (1, date '2026-12-07', date '2026-12-20', 'Profil de fin d''année', 'Mets à jour ton profil avant les fêtes.', 'update_profile', 1, 20),
  -- Bloc 2 · Révisions (4–31 janvier)
  (2, date '2027-01-04', date '2027-01-31', 'Réviser ensemble', 'Publie 3 messages utiles pour les révisions : fiche, astuce, question.', 'create_post', 3, 60),
  (2, date '2027-01-04', date '2027-01-31', 'Rythme de révision', 'Connecte-toi 12 jours différents pendant la session.', 'daily_login', 12, 60),
  (2, date '2027-01-04', date '2027-01-31', 'Bonne reprise', 'Connecte-toi 3 jours différents pour bien démarrer l''année.', 'daily_login', 3, 15),
  -- Bloc 3 · Nouveau semestre (1–28 février)
  (3, date '2027-02-01', date '2027-02-28', 'Profil de printemps', 'Mets ton profil à jour pour le nouveau semestre.', 'update_profile', 1, 25),
  (3, date '2027-02-01', date '2027-02-28', 'Retour en force', 'Connecte-toi 10 jours différents.', 'daily_login', 10, 50),
  (3, date '2027-02-01', date '2027-02-28', 'Bonnes résolutions', 'Publie 2 messages : tes objectifs, une découverte, une question.', 'create_post', 2, 40),
  -- Bloc 4 · Partage d'expérience (1–28 mars)
  (4, date '2027-03-01', date '2027-03-28', 'Retour de stage', 'Publie 2 retours d''expérience de stage ou de cours.', 'create_post', 2, 50),
  (4, date '2027-03-01', date '2027-03-28', 'Fidèle au poste', 'Connecte-toi 12 jours différents.', 'daily_login', 12, 60),
  (4, date '2027-03-01', date '2027-03-28', 'Mentor de maison', 'Publie 4 messages pour aider les autres étudiant·e·s.', 'create_post', 4, 80),
  -- Bloc 5 · Printemps des maisons (29 mars–25 avril)
  (5, date '2027-03-29', date '2027-04-25', 'Présence de printemps', 'Connecte-toi 10 jours différents.', 'daily_login', 10, 50),
  (5, date '2027-03-29', date '2027-04-25', 'La maison s''exprime', 'Publie 3 messages dans le feed.', 'create_post', 3, 60),
  (5, date '2027-03-29', date '2027-04-25', 'Profil à jour', 'Mets à jour ton profil (photo, présentation, coordonnées).', 'update_profile', 1, 20),
  -- Bloc 6 · Esprit d'équipe (26 avril–23 mai)
  (6, date '2027-04-26', date '2027-05-23', 'Marathon', 'Connecte-toi 15 jours différents.', 'daily_login', 15, 80),
  (6, date '2027-04-26', date '2027-05-23', 'Contributeur', 'Publie 5 messages dans le feed.', 'create_post', 5, 90),
  (6, date '2027-04-26', date '2027-05-23', 'Premier pas du mois', 'Publie 1 message dans le feed.', 'create_post', 1, 20),
  -- Bloc 7 · Sprint final (24 mai–20 juin)
  (7, date '2027-05-24', date '2027-06-20', 'Sprint final', 'Connecte-toi 15 jours différents avant la fin de l''année.', 'daily_login', 15, 80),
  (7, date '2027-05-24', date '2027-06-20', 'Dernier partage', 'Publie 3 messages pour clôturer l''année.', 'create_post', 3, 60),
  (7, date '2027-05-24', date '2027-06-20', 'Profil de fin d''année', 'Mets à jour ton profil une dernière fois cette année.', 'update_profile', 1, 25)
)
insert into public.challenges (name, description, action_type, target_value, xp_reward, year, start_date, end_date, is_active, status)
select p.name, p.description, p.action_type, p.target_value, p.xp_reward, extract(year from p.debut)::int, p.debut, p.fin, false, 'scheduled'
from programme p
where not exists (select 1 from public.challenges c where c.name = p.name and c.start_date = p.debut);

-- ===================== Quêtes =====================
create temp table programme_quetes (
  bloc int, debut date, fin date, title text, description text, type text, difficulty text, icon text, xp int, etapes jsonb
) on commit drop;

insert into programme_quetes values
  (1, '2026-12-07', '2026-12-20', 'Bilan du semestre', 'Termine le semestre en beauté : passe régulièrement, mets ton profil à jour et partage ton bilan.', 'story', 'EASY', '🎄', 100,
   '[{"t":"Passer 3 jours sur la plateforme","d":"Connecte-toi 3 jours différents.","a":"LOGIN","n":3},
     {"t":"Mettre ton profil à jour","d":"Enregistre une modification de ton profil.","a":"PROFILE_UPDATE","n":1},
     {"t":"Partager ton bilan","d":"Publie dans le feed ce que tu retiens de ce semestre.","a":"POST","n":1}]'),
  (2, '2027-01-04', '2027-01-31', 'Session d''examens', 'Traverse la session avec ta maison : reste présent·e et partage tes ressources.', 'challenge', 'MEDIUM', '📚', 120,
   '[{"t":"Bien démarrer","d":"Connecte-toi 3 jours différents.","a":"LOGIN","n":3},
     {"t":"Partager une ressource","d":"Publie une fiche, une astuce ou une question de révision.","a":"POST","n":1},
     {"t":"Tenir le rythme","d":"Connecte-toi encore 7 jours différents.","a":"LOGIN","n":7}]'),
  (3, '2027-02-01', '2027-02-28', 'Prêt·e pour le semestre', 'Prépare le semestre de printemps : profil à jour, objectifs partagés, présence régulière.', 'progression', 'EASY', '🌱', 100,
   '[{"t":"Mettre ton profil à jour","d":"Enregistre une modification de ton profil.","a":"PROFILE_UPDATE","n":1},
     {"t":"Partager tes objectifs","d":"Publie tes objectifs pour ce semestre.","a":"POST","n":1},
     {"t":"Être présent·e","d":"Connecte-toi 8 jours différents.","a":"LOGIN","n":8}]'),
  (4, '2027-03-01', '2027-03-28', 'Carnet de stage', 'Raconte ton expérience et aide les autres à se préparer.', 'social', 'MEDIUM', '🩺', 120,
   '[{"t":"Premier retour","d":"Publie un premier retour d''expérience.","a":"POST","n":1},
     {"t":"Deuxième retour","d":"Publie un conseil pour les prochains stagiaires.","a":"POST","n":1},
     {"t":"Rester connecté·e","d":"Connecte-toi 10 jours différents.","a":"LOGIN","n":10}]'),
  (5, '2027-03-29', '2027-04-25', 'Pour ma maison', 'Fais gagner ta maison : présence, profil et partages.', 'challenge', 'MEDIUM', '🏠', 100,
   '[{"t":"Être là","d":"Connecte-toi 5 jours différents.","a":"LOGIN","n":5},
     {"t":"Profil soigné","d":"Mets ton profil à jour.","a":"PROFILE_UPDATE","n":1},
     {"t":"Faire parler la maison","d":"Publie 2 messages dans le feed.","a":"POST","n":2}]'),
  (6, '2027-04-26', '2027-05-23', 'Esprit d''équipe', 'Montre l''exemple pendant tout le mois.', 'social', 'HARD', '🤝', 120,
   '[{"t":"Partager","d":"Publie 3 messages dans le feed.","a":"POST","n":3},
     {"t":"Tenir la distance","d":"Connecte-toi 12 jours différents.","a":"LOGIN","n":12}]'),
  (7, '2027-05-24', '2027-06-20', 'Bilan de l''année', 'Clôture l''année académique : profil à jour, bilan partagé, dernière ligne droite.', 'story', 'HARD', '🏆', 150,
   '[{"t":"Mettre ton profil à jour","d":"Enregistre une modification de ton profil.","a":"PROFILE_UPDATE","n":1},
     {"t":"Partager ton bilan","d":"Publie ce que tu retiens de l''année.","a":"POST","n":1},
     {"t":"Finir en force","d":"Connecte-toi 12 jours différents.","a":"LOGIN","n":12}]');

insert into public.quests (title, description, type, difficulty, icon, points, xp_reward, status, start_date, end_date, created_by)
select q.title, q.description, q.type, q.difficulty, q.icon, q.xp, q.xp, 'scheduled',
       q.debut::timestamp at time zone 'Europe/Zurich',
       (q.fin + 1)::timestamp at time zone 'Europe/Zurich' - interval '1 second',
       (current_setting('request.jwt.claims')::json ->> 'sub')::uuid
from programme_quetes q
where not exists (
  select 1 from public.quests x
  where x.title = q.title and x.start_date = q.debut::timestamp at time zone 'Europe/Zurich'
);

insert into public.quest_steps (quest_id, step_order, title, description, action_type, target_value, required)
select x.id, e.ordinality, e.value ->> 't', e.value ->> 'd', e.value ->> 'a', (e.value ->> 'n')::int, true
from programme_quetes q
join public.quests x on x.title = q.title and x.start_date = q.debut::timestamp at time zone 'Europe/Zurich'
cross join lateral jsonb_array_elements(q.etapes) with ordinality e
where not exists (select 1 from public.quest_steps s where s.quest_id = x.id);

-- ===================== Contrôle =====================
select 'défi' as type, c.start_date as debut, c.end_date as fin, c.name as titre, c.target_value as objectif, c.xp_reward as xp,
       (gamification_private.validate_lifecycle_entity('challenge', c.id) ->> 'valid') as valide
from public.challenges c where c.status = 'scheduled'
union all
select 'quête', (x.start_date at time zone 'Europe/Zurich')::date, (x.end_date at time zone 'Europe/Zurich')::date, x.title,
       (select count(*) from public.quest_steps s where s.quest_id = x.id), x.xp_reward,
       (gamification_private.validate_lifecycle_entity('quest', x.id) ->> 'valid')
from public.quests x where x.status = 'scheduled'
order by 2, 1, 4;

commit;
