# Jeux

## Ventriglisse 3D

`Ventriglisse3D.vue` est un jeu amical local accessible depuis la page Jeux.

- 2 à 6 participants saisis localement, avec choix d’un personnage fille ou
  garçon ;
- course reproductible pour une manche donnée ;
- décor historique du Ventriglisse, personnages 3D locaux et scores cumulés par
  session ;
- animation Three.js quand WebGL est disponible ;
- mode de course simplifié et entièrement jouable dans le cas contraire ;
- aucune écriture Supabase, aucun gain d’XP et aucune notification ;
- aucune dépendance à Firebase ou à un service d’avatars distant.

Les deux modèles sont les exports V1 de PhysioTech, basés sur les personnages
Quaternius sous CC0 1.0. Leurs fichiers sont servis depuis l’application ;
voir `assets/avatars/NOTICE.md` pour la provenance exacte.

L’activation est contrôlée par `VITE_GAMIFICATION_GAMES_HUB` et
`VITE_GAMIFICATION_VENTRIGLISSE`. Ces deux indicateurs sont actifs sur
`test.hedsvs.ch` et restent désactivés dans la configuration de production.

## Mot du jour physio

`src/views/apps/tools/WordOfDayView.vue` (route `/mot-du-jour`) propose chaque jour un
terme de physiothérapie ou d’anatomie à trouver en 6 essais, le même pour tous les
joueurs (changement à minuit, heure de Zurich).

- le mot, la validation de chaque essai et les points sont décidés par le serveur
  (`get_my_word_of_day`, `submit_my_word_of_day_guess`) ; le navigateur ne reçoit que la
  longueur du mot et les indices, puis le mot et sa définition une fois la partie finie ;
- une partie par joueur et par jour, reprise automatique si on quitte la page ;
- 10 XP si le mot est trouvé, 5 XP de plus en 3 essais ou moins, comptés aussi pour la
  maison ; réservé aux joueurs de la gamification ;
- clavier à l’écran (disposition suisse romande) et clavier physique ; chaque indice a
  une couleur, une icône et un libellé lu par les lecteurs d’écran ;
- la liste des mots et des définitions se relit à la fin de
  `supabase/migrations/20261111110000_gamification_word_of_day.sql` ; un mot se retire
  en base avec `is_active = false`.

L’activation est contrôlée par `VITE_GAMIFICATION_WORD_OF_DAY` (carte dans l’espace
jeux, donc aussi `VITE_GAMIFICATION_GAMES_HUB`).
