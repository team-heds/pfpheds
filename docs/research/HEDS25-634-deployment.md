# HEDS25-634 — Rapport de validation test

Date : 2026-09-29  
Environnement modifié : `test.hedsvs.ch` uniquement

## Résultat

- Les dashboards Secrétariat SI, RM Soins et Enseignant SI partagent désormais un chargement paginé du planning de l'année académique active.
- Le Secrétariat calcule ses KPI et son contrôle qualité depuis le même instantané.
- Le dashboard Enseignant réutilise cet instantané pour les cours, la semaine, les séances à venir et la charge.
- Le dashboard RM réutilise cet instantané pour les enseignants, les postulations, les cours personnels, les conflits, les heures et le contrôle qualité.
- Le cache court déduplique les chargements simultanés et le rafraîchissement RM force une donnée fraîche.
- Les lectures de secours sont paginées au-delà de la limite Supabase de 1 000 lignes.
- La détection de conflits compare uniquement les créneaux d'une même semaine et d'un même jour.
- Aucun schéma et aucune donnée Supabase n'ont été modifiés.

## Mesure navigateur authentifiée

| Parcours | Créneaux de l'année active | Requêtes `planning_time_slots` |
| --- | ---: | ---: |
| Dashboard Secrétariat SI | 1 912 | 2 pages |
| Dashboard RM Soins | 1 912 | 2 pages |
| Ouverture d'un profil Enseignant depuis le Secrétariat | 1 912 réutilisés | 0 nouvelle requête |

Les trois parcours ont terminé sans erreur JavaScript. Les requêtes annexes annulées au moment de fermer les contextes navigateur (`places`, `institutions`, `praticiens_formateurs`) ne concernent pas le planning et ne bloquent aucun écran.

Captures :

- `artifacts/HEDS25-634/secretariat.png`
- `artifacts/HEDS25-634/rm.png`
- `artifacts/HEDS25-634/teacher-preview.png`

## Preuves automatisées

- 27 tests SI ciblés réussis.
- Tests spécifiques des agrégations : filtrage des modules, durées valides et conflits enseignants.
- Test de pagination vérifié au-delà de 1 000 lignes.
- Build général réussi.
- Build isolé avec les variables test réussi.
- Vérification navigateur authentifiée réussie sur les trois rôles/vues.

## Déploiement test

- Script : `deploy/staging/deploy-heds634-test.sh`.
- SHA-256 de `index.html` : `b24072cb580f030df0f0153510e60ab211368f22516d94b4ab9adb904faba850`.
- SHA-256 du service worker : `abec6cf67356acef311fe5aefafb8bfb0a64c6d7058ef41d88155d76e2a5cd20`.
- Retour arrière conservé : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-633-20260929-151105`.
- Production non modifiée.

## Incident de publication maîtrisé

Un premier paquet avait été construit avec les variables locales et pointait vers l'API de production ; la CSP test l'a immédiatement bloqué. La validation navigateur a détecté le problème avant clôture. Le paquet a été reconstruit avec `deploy/staging/build-current-test.mjs`, puis republié et validé.

Le second envoi a rencontré un disque VPS plein. Les trois sauvegardes HEDS25-634 intermédiaires et inutilisables ainsi que le paquet temporaire ont été supprimés, tout en conservant la sauvegarde saine HEDS25-633. La publication finale a ensuite réussi.

## Validation humaine restante

1. Ouvrir les trois dashboards avec les comptes métier habituels.
2. Vérifier un changement de semaine sur le dashboard RM.
3. Vérifier un export de planning Enseignant.
4. Comparer un conflit et un total d'heures avec un exemple connu.
5. Ne pas promouvoir en production avant ces contrôles.

