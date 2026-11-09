# HEDS25-614 — Rapport de simulation de reprise historique

Date : 21 septembre 2026  
Environnement : `test.hedsvs.ch` uniquement  
Mode : lecture seule, aucune attribution appliquée

## Résumé

| Mesure | Valeur |
| --- | ---: |
| Utilisateurs évalués | 196 |
| Badges actifs évalués | 13 |
| Attributions potentiellement éligibles | 68 |
| Attributions déjà présentes | 207 |
| Conditions non remplies | 1 685 |
| Cas mis en quarantaine | 588 |
| Variation XP | 0 |
| Variation points de maison | 0 |

Le rapport est agrégé et ne contient ni nom, ni adresse e-mail, ni identifiant
d'utilisateur. Aucun lot réel n'a été appliqué à l'issue de cette simulation.

## Détail par badge

| Badge | Éligibles | Déjà présents | Non éligibles | Quarantaine |
| --- | ---: | ---: | ---: | ---: |
| Ambassadeur de Maison | 2 | 1 | 193 | 0 |
| Apprenti Déterminé | 10 | 1 | 185 | 0 |
| Compagnon Expérimenté | 6 | 1 | 189 | 0 |
| Contributeur Actif | 0 | 0 | 0 | 196 |
| Créateur de Contenu | 0 | 0 | 0 | 196 |
| Expert Reconnu | 6 | 1 | 189 | 0 |
| Force Montante | 2 | 1 | 193 | 0 |
| Maître de l'XP | 2 | 1 | 193 | 0 |
| Membre de Maison | 0 | 196 | 0 | 0 |
| Montée en Puissance | 2 | 1 | 193 | 0 |
| Novice Confirmé | 21 | 2 | 173 | 0 |
| Première Étape | 17 | 2 | 177 | 0 |
| Premier Post | 0 | 0 | 0 | 196 |

## Lecture du résultat

- Les 207 badges existants sont conservés sous la provenance
  `legacy_unclassified` ; aucun bonus n'est rejoué.
- Les 68 attributions éligibles sont seulement des candidats. Elles ne seront
  créées qu'après choix explicite des badges à reprendre.
- Les 588 quarantaines proviennent de trois règles non interprétables de manière
  sûre. Elles ne produisent aucune attribution par défaut.
- Une future application créera un lot audité et des lignes
  `historical_import`, avec une variation garantie de 0 XP et 0 point de maison.
