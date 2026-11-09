# SI — Correction contrôlée du planning — Checklist de release

Date de préparation : 30 septembre 2026

Environnement validé : `test.hedsvs.ch` / base `staging`

Production : inchangée

Décision actuelle : **candidate technique, promotion non autorisée**

## Résultat livré

L'écran `/admin/soins-infirmiers/qualite-planning` permet à un administrateur SI
de diagnostiquer le planning de l'année académique active. Une proposition ne
peut être appliquée que si elle possède une preuve unique, après justification
et confirmation explicites. Chaque changement est transactionnel, journalisé,
protégé contre une modification concurrente et annulable.

Aucune correction en masse n'est incluse. Les cas ambigus et manuels restent en
lecture seule.

## Périmètre source à isoler dans la release

### Frontend

- `src/domain/si/planningRemediation.js`
- `src/service/siPlanningRemediationService.js`
- `src/views/admin/soins-infirmiers/PlanningRemediationView.vue`
- intégration de la route et du menu SI dans les fichiers de routage concernés
- `tests/unit/siPlanningRemediation.spec.js`

### API

- `backend/supabase/siPlanningRemediationBackend.js`
- montage de `/api/si/planning-remediations` dans `backend/index.js`
- `backend/test/siPlanningRemediation.test.js`

### Base de données

- `supabase/migrations/20260930060553_secure_si_planning_remediation.sql`
- `supabase/migrations/20260930065312_align_si_course_remediation_evidence.sql`
- `supabase/tests/si_planning_remediation_isolation.sql`

### Recette et exploitation

- `deploy/staging/verify-si-planning-remediation-cycle.mjs`
- `deploy/staging/verify-si-planning-course-remediation.mjs`
- `deploy/staging/verify-si-planning-remediation-authorization.mjs`
- `deploy/staging/verify-si-planning-remediation-release-index.sh`
- `deploy/staging/deploy-si-planning-remediation-db-test.sh`
- `deploy/staging/deploy-si-planning-remediation-backend-test.sh`

## Preuves obtenues sur test

| Contrôle | Résultat |
| --- | --- |
| Domaine frontend | 6/6 tests réussis |
| API | 4/4 tests réussis |
| Lint ciblé | Réussi |
| Build complet | Réussi |
| Isolation SQL | Réussie avec rollback transactionnel |
| Proposition sûre `#4560` | Appliquée, historisée, annulée, restaurée |
| Proposition sûre `#4562` | Appliquée, historisée, annulée, restaurée |
| Lecture historique par étudiant | Refusée avec `403` |
| Application par étudiant | Refusée avec `403` |
| Annulation par étudiant | Refusée avec `403` |
| Production touchée | Non |

Empreintes du paquet actuellement publié sur test :

- `index.html` : `af369a3e13309368cbc5e70aded715d3b6ae0a5619140430e0716b3cca94618a` ;
- `sw.js` : `5bf8f321b90385155baa9e9b9ce32fb57b378ffcbb722b143d58123dcf931805`.

## Conditions obligatoires avant promotion

- [ ] Isoler ce périmètre dans une branche/PR ou un commit de release revu. Le
  répertoire de travail actuel contient d'autres modifications qui ne doivent
  pas être embarquées implicitement.
- [ ] Obtenir l'accord fonctionnel explicite pour la production.
- [ ] Identifier le commit exact déjà validé sur test.
- [ ] Sauvegarder la base production et vérifier que l'archive est lisible.
- [ ] Sauvegarder le backend actuellement exécuté et son image.
- [ ] Sauvegarder le répertoire frontend actuellement servi.
- [ ] Vérifier l'espace disque avant les sauvegardes et le build.
- [ ] Vérifier l'état de santé Supabase/API avant intervention.
- [ ] Fixer une courte fenêtre de surveillance après publication.

## Contrat d'environnement à contrôler

Contrôler la présence et la cible, sans copier les valeurs dans les rapports :

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `VITE_API_URL`
- `VITE_API_BASE_URL`
- `VITE_BACKEND_URL`

Les URL de build doivent toutes viser la production. Aucun secret ni aucune URL
de `test.hedsvs.ch` ou de `localhost` ne doit être présent dans les artefacts.

## Ordre de déploiement recommandé

1. Passer l'application en surveillance renforcée et relever l'état initial.
2. Créer les trois sauvegardes : base, backend et frontend.
3. Appliquer, dans cet ordre, les migrations :
   1. `20260930060553_secure_si_planning_remediation.sql` ;
   2. `20260930065312_align_si_course_remediation_evidence.sql`.
4. Recharger le schéma PostgREST.
5. Vérifier que `authenticated` et `anon` n'ont aucun droit direct sur la table
   d'historique ni sur les deux RPC de modification.
6. Publier le backend contenant la route protégée.
7. Vérifier la santé de l'API et l'authentification avant de publier le frontend.
8. Construire le frontend avec les variables de production contrôlées.
9. Publier le frontend atomiquement.
10. Effectuer la recette post-déploiement ci-dessous.

## Recette post-déploiement sans modifier un créneau métier

- [ ] La connexion administrateur fonctionne.
- [ ] La route de qualité du planning s'ouvre sans erreur console ou HTTP 5xx.
- [ ] L'année académique affichée est l'année active attendue.
- [ ] Les totaux et les filtres se chargent.
- [ ] Le détail d'une proposition sûre montre la valeur actuelle et la source de
  preuve attendues.
- [ ] Le bouton d'application reste désactivé sans justification et confirmation.
- [ ] L'historique se charge pour l'administrateur.
- [ ] La route et l'API sont refusées à un compte étudiant ou enseignant non
  autorisé.
- [ ] Aucun test post-déploiement n'applique une correction sur une vraie donnée
  sans validation métier explicite du créneau choisi.

Une première correction réelle en production devra être surveillée par une
personne métier : contrôler le créneau, appliquer, vérifier le planning et
l'historique. L'annulation doit être réservée à un besoin réel, pas exécutée par
défaut sur une donnée métier correcte.

## Rollback

### Frontend

Restaurer atomiquement l'archive du frontend précédent, puis purger uniquement
les caches prévus par le mécanisme de déploiement et vérifier la route d'accueil.

### Backend

Redémarrer l'image backend précédente et vérifier la santé de l'API. Le frontend
précédent ne doit pas appeler les nouvelles routes.

### Base de données

Les objets ajoutés sont rétrocompatibles et peuvent rester inutilisés si le
frontend et le backend sont restaurés. Ne pas supprimer manuellement la table ou
les fonctions pendant un incident. Restaurer la sauvegarde de base uniquement
si une corruption de données est constatée, avec accord explicite et procédure
de restauration validée.

## Points d'attention Supabase/Postgres

Le changelog Supabase consulté le 30 septembre 2026 mentionne notamment les
versions mineures PostgreSQL 15.19/17.11 et des actions possibles pour certains
index ou extensions (`ltree`, `pgcrypto`, `btree_gist`, opérateurs personnalisés).
Cette fonctionnalité n'en dépend pas directement. Avant une mise à niveau de la
stack autohébergée, inventorier néanmoins ces extensions et index séparément ;
ce n'est pas un motif pour les modifier pendant cette release applicative.

## Décision de release

État technique : **prêt pour une revue de promotion**.

État opérationnel : **bloqué volontairement** jusqu'à l'isolation du commit, aux
sauvegardes production et à l'accord explicite de déploiement.
