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

## Mot de la semaine physio

`src/views/apps/tools/WordOfDayView.vue` (route `/mot-de-la-semaine`, l’ancienne adresse
`/mot-du-jour` y renvoie) propose chaque semaine un terme de physiothérapie ou
d’anatomie à trouver en 6 essais, le même pour tous les joueurs, du lundi 00:00 au
dimanche 23:59 (heure de Zurich). Le jeu s’appelait « Mot du jour » à son lancement :
les fichiers, les tables et les appels au serveur ont gardé leur nom `word_of_day`.

- le mot, la validation de chaque essai et les points sont décidés par le serveur
  (`get_my_word_of_day`, `submit_my_word_of_day_guess`) ; le navigateur ne reçoit que la
  longueur du mot et les indices, puis le mot et sa définition une fois la partie finie ;
- une partie par joueur et par semaine, reprise automatique toute la semaine ;
- 30 XP si le mot est trouvé, 15 XP de plus en 3 essais ou moins, une seule fois par
  semaine (clé d’événement `word-of-week:<lundi>`), comptés aussi pour la
  maison ; réservé aux joueurs de la gamification ;
- clavier à l’écran (disposition suisse romande) et clavier physique ; chaque indice a
  une couleur, une icône et un libellé lu par les lecteurs d’écran ;
- la liste des mots et des définitions se relit à la fin de
  `supabase/migrations/20261111110000_gamification_word_of_day.sql` ; un mot se retire
  en base avec `is_active = false` ;
- le passage à la semaine est fait par
  `supabase/migrations/20261112100000_gamification_word_of_week.sql` ;
- le jeu apparaît dans les défis (« Quêtes et défis » de l’accueil et page des défis) : un
  défi « Mot de la semaine » par semaine, créé par
  `scripts/supabase/gamification-defi-mot-de-la-semaine.sql`, sans récompense propre
  (`xp_reward = 0`), dont la carte mène au jeu grâce au lien facultatif des défis
  (`challenges.action_url`, adresse interne, utilisable par n’importe quel défi). Il se
  coche côté serveur quand le mot est trouvé
  (`supabase/migrations/20261112110000_gamification_challenge_action_link.sql`).

L’activation est contrôlée par `VITE_GAMIFICATION_WORD_OF_DAY` (carte dans l’espace
jeux, donc aussi `VITE_GAMIFICATION_GAMES_HUB`).
