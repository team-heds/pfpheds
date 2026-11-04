# HEDS25-633 — Rapport de validation test

Date : 2026-09-29  
Environnement modifié : `test.hedsvs.ch` uniquement

## Résultat

- Le catalogue des postulations est partagé par les vues Enseignant SI et RM Soins.
- Les requêtes de créneaux sont paginées et ne s'arrêtent plus à 1 000 lignes.
- Les créneaux sont limités aux classes de l'année académique active.
- Le jour provient de la colonne réelle `planning_time_slots.day`.
- Le titre affiché provient du créneau, avec nettoyage des espaces et retours à la ligne.
- Les associations de cours arbitraires et le cache `localStorage` ont été supprimés.
- Un cours manquant n'est déduit que si le module ne possède qu'un seul identifiant de cours vérifié.
- La vue indique `Lié`, `Lien unique déduit` ou `À vérifier`.
- Aucun schéma et aucune donnée Supabase n'ont été modifiés.

## Audit en lecture seule de la base test

| Mesure | Résultat |
| --- | ---: |
| Année active | 2026-2027 |
| Créneaux chargés avec pagination | 1 912 |
| Créneaux de l'année active | 1 912 |
| Créneaux en postulation | 65 |
| Liens directs au cours | 64 |
| Liens uniques déduits | 1 |
| Liens manquants ou ambigus | 0 |
| Jours manquants | 0 |
| Titres manquants | 0 |

## Preuves automatisées

- 15 tests SI ciblés réussis lors de la validation complète.
- 6 tests HEDS25-633 couvrent la pagination, l'année active, le jour, le nettoyage des titres et la sûreté des liens de cours.
- ESLint ciblé réussi.
- Build général et build isolé test réussis.
- Contrôle navigateur authentifié réussi : 65 créneaux visibles, aucun `pageerror`, titre et jour affichés, lien unique déduit visible.
- Le contrôle navigateur a bloqué l'enregistrement automatique de l'action de connexion gamifiée afin de rester sans mutation ; cela n'affecte pas la page testée.

Capture : `artifacts/HEDS25-633/cours-postulation.png`.

## Déploiement test

- Script : `deploy/staging/deploy-heds633-test.sh`.
- Sauvegarde conservée : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-633-20260929-151105`.
- SHA-256 de `index.html` : `af7301ab622cd82abd9ad97cd8485cb1a1fd2852e412da7f997774018ed5f2b6`.
- SHA-256 du service worker : `fce642b37a67f489a886d6d2b43bec981e750cdd7df7385efca8f83505e3ef39`.
- Une sauvegarde intermédiaire redondante du second passage a été supprimée après validation ; la sauvegarde de retour arrière ci-dessus est conservée.
- Production non modifiée.

## Validation humaine restante

1. Avec un compte `EnseignantSoins`, voter sur un créneau puis retirer le vote.
2. Avec un compte `RMSoins`, confirmer que seuls ses modules sont visibles et assigner un votant sur un créneau de test.
3. Vérifier que l'ouverture du planning cible la bonne semaine, la bonne classe et le bon jour.
4. Ne pas promouvoir en production avant ces trois contrôles.
