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
