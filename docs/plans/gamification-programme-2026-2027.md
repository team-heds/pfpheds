---
ticket: GAMIFICATION-PROGRAMME-2026-2027
validated: test
environment: programmé sur TEST le 9 novembre 2026, production après validation
---

# Programme gamification 2026-2027

Défis et quêtes programmés jusqu'à fin juin, en blocs de 4 semaines, pour tous les joueurs
(BA24, BA25, BA26). Pause pendant les vacances de Noël (21 décembre – 3 janvier). Les défis
de lancement (9 novembre – 6 décembre) restent en place jusqu'à leur fin.

## Fonctionnement

- Tout est inséré au statut **programmé**. Toutes les 5 minutes, le planificateur
  (`gamification-lifecycle`, pg_cron) appelle `gamification_private.refresh_lifecycle()` :
  il ouvre ce qui arrive à sa date de début et clôt ce qui a dépassé sa date de fin.
  Chaque passage est tracé dans `gamification_private.lifecycle_audit`.
- Une quête est attribuée aux joueurs au moment de son ouverture (migration
  `20261109160000_quest_assignment_players_only.sql` : plus aux étudiants hors public).
- Actions comptées : connexion (1 par jour), mise à jour du profil (1 par jour),
  publication (3 par jour). Les étapes d'une quête se font dans l'ordre.
- Modifier un élément avant son ouverture : console admin (Défis, Quêtes) ou SQL ; il
  reste programmé tant que son statut est `scheduled`.

## Calendrier

| Bloc | Dates | Thème | Défis (objectif → XP) | Quête (étapes → XP) |
| --- | --- | --- | --- | --- |
| 1 | 7 – 20 déc. | Fin d'année | Calendrier de l'Avent (8 connexions → 50) · Partage de fin de semestre (2 publications → 40) · Profil de fin d'année (profil → 20) | Bilan du semestre : 3 connexions, profil, 1 publication → 100 |
| — | 21 déc. – 3 janv. | Vacances | — | — |
| 2 | 4 – 31 janv. | Révisions | Réviser ensemble (3 publications → 60) · Rythme de révision (12 connexions → 60) · Bonne reprise (3 connexions → 15) | Session d'examens : 3 connexions, 1 publication, 7 connexions → 120 |
| 3 | 1 – 28 févr. | Nouveau semestre | Profil de printemps (profil → 25) · Retour en force (10 connexions → 50) · Bonnes résolutions (2 publications → 40) | Prêt·e pour le semestre : profil, 1 publication, 8 connexions → 100 |
| 4 | 1 – 28 mars | Partage d'expérience | Retour de stage (2 publications → 50) · Fidèle au poste (12 connexions → 60) · Mentor de maison (4 publications → 80) | Carnet de stage : 1 publication, 1 publication, 10 connexions → 120 |
| 5 | 29 mars – 25 avr. | Printemps des maisons | Présence de printemps (10 connexions → 50) · La maison s'exprime (3 publications → 60) · Profil à jour (profil → 20) | Pour ma maison : 5 connexions, profil, 2 publications → 100 |
| 6 | 26 avr. – 23 mai | Esprit d'équipe | Marathon (15 connexions → 80) · Contributeur (5 publications → 90) · Premier pas du mois (1 publication → 20) | Esprit d'équipe : 3 publications, 12 connexions → 120 |
| 7 | 24 mai – 20 juin | Sprint final | Sprint final (15 connexions → 80) · Dernier partage (3 publications → 60) · Profil de fin d'année (profil → 25) | Bilan de l'année : profil, 1 publication, 12 connexions → 150 |

Total : 21 défis et 7 quêtes, soit environ 1 900 XP de bonus possibles sur l'année en plus
des gains quotidiens.

## Mise en place

1. Migration `20261109160000_quest_assignment_players_only.sql`.
2. Planificateur, dans la base qui héberge pg_cron (`postgres`) :
   - prod : `psql -d postgres -v target_db=postgres -f scripts/supabase/install-gamification-scheduler.sql`
   - test : `psql -d postgres -v target_db=staging -f scripts/supabase/install-gamification-scheduler.sql`
3. Programme : `psql -d <base> -v admin_id=<uuid admin> -f scripts/supabase/gamification-programme-2026-2027.sql`
   (relançable, sans doublon).

## Vérifié sur TEST (9 novembre 2026)

- 21 défis et 7 quêtes programmés, tous valides selon `validate_lifecycle_entity`.
- Activation simulée (transaction annulée) : les 3 défis du bloc 1 passent actifs, la quête
  « Bilan du semestre » est attribuée aux 189 joueurs et à eux seuls.
- Planificateur installé (`*/5 * * * *`).
