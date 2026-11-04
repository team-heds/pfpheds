# Contrôle navigateur — test.hedsvs.ch

Tests effectués avec Playwright/Chromium, sessions séparées admin et étudiant fictifs, jobs Portly. Aucun clic d'ouverture de votation, de publication, de relance ou de lancement d'algorithme. Aucune modification de production.

## Validé

- Connexion via le formulaire admin et étudiant : redirection vers `/feed`.
- Admin : `/admin/formation-pratique/places` affiche 70 places fictives, année 2026-2027, capacités PFP2 visibles.
- Étudiant : cette route admin redirige vers `/access` ; écran de refus encore rudimentaire.
- Étudiant : `/votation/PFP2` affiche « Votation fermée ».
- Écran actuel `/admin/formation-pratique/votation-pfp` : choix BA25, PFP2, année 2026-2027 disponibles.

## Anomalies et limites

1. Après sélection BA25/PFP2/2026-2027 sur l'écran actuel, les compteurs affichent 0 étudiants et 0 capacité, malgré les fixtures visibles ailleurs (63 étudiants et 70 places). Le rapprochement population/offres/campagne reste à diagnostiquer. Aucun échec HTTP >=400 enregistré pendant ce passage : ne pas conclure automatiquement à une erreur RLS.
2. Le même écran annonce « Capacité suffisante » pour 0 étudiant / 0 place. Cet état ne permet pas de valider une campagne réelle.
3. `/management_votation_etudiants` utilise PFP1A/PFP1B et 2026 par défaut, affichant 126 lignes (63 étudiants × 2 PFP) comme « Total Étudiants ». Un avertissement RLS est affiché pour l'absence de votes sans preuve d'un refus HTTP.
4. `/result_preview_votation` affiche 120 étudiants, 115 votants et 85 premiers choix avec un tableau vide. Ces valeurs sont codées en dur dans `src/views/admin/pfp/ResultPreviewVotationView.vue` : ce ne sont pas des statistiques de test.
5. `/votation_management` conserve des filtres d'anciennes cohortes, sans BA25/BA26.
6. Erreur SQL `get_algorithm_results` signalée précédemment : non retestée directement dans cette campagne de navigation, non corrigée.

## Conclusion

Accès et lecture des places validés. Parcours complet de vote/attribution NON validé : ne pas ouvrir une campagne sur la base de ces compteurs. Corriger ou compléter d'abord le rattachement des fixtures à BA25/PFP2/2026-2027 et vérifier les chiffres, puis tester ouverture, votes, clôture et attribution uniquement sur l'environnement fictif.

Script d'exploration : `browser-check.mjs`. Sa sortie sans exception ne constitue pas une assertion de réussite métier ; les observations ci-dessus font foi.
