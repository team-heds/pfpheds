# Recherche — Validation du résultat des PFP

## Objectif observé

Permettre au secrétariat et aux administrateurs autorisés de qualifier chaque stage publié avec un résultat exclusif : **réussi**, **échec**, **arrêt** ou **en attente**, puis de retrouver et filtrer ces résultats de façon fiable.

## Parcours existant vérifié

- La route `/admin/formation-pratique/validation-pfp` charge `src/views/admin/pfp/ValidationPFP.vue` et demande actuellement `requiresAuth: true` avec `page1.access` dans `src/router/routes/pfp.js`.
- Le menu expose cette route sous « Validation PFP » dans `src/config/adminMenu.js`.
- `ValidationPFP.vue` lit les affectations publiées dans `student_result_vote`, enrichit les lignes avec l'annuaire étudiant fourni par `src/service/studentDirectoryService.js`, puis lit `places`, `institutions` et `praticiens_formateurs` directement via le client Supabase.
- Les trois états sont stockés dans `student_result_vote.pfp_validee`, `pfp_echec` et `pfp_arret`; le motif d'arrêt est stocké dans `commentaire_arret`. Ces colonnes figurent dans `supabase/baseline/public-schema.sql` et le contrat frontend dans `src/service/supabaseContracts.js`.
- Les profils et vues de secrétariat consomment déjà ces états dans `src/utils/profileStages.js`, `src/components/user/details/VotationResultProfil.vue`, `src/components/user/details/ResumStageUserProfile.vue` et `src/views/admin/formation-pratique/secretariat/VueDEnsembleFP.vue`.
- Les alertes d'échec et d'arrêt reposent sur les mêmes colonnes dans `src/service/pfpAlertsService.js`.

## État réel des données au 1er septembre 2026

Une lecture seule via le backend configuré pour l'environnement HEdS retourne 299 affectations :

- 108 réussies, 6 en échec et 4 arrêtées;
- aucune ligne ne porte actuellement plusieurs résultats contradictoires;
- 181 lignes restent sans résultat, principalement PFP2/PFP3/PFP4 et les affectations 2027;
- les années présentes vont de 2024 à 2027, alors que `ValidationPFP.vue` limite encore le filtre à 2025/2026;
- les classes du composant sont limitées à BA23/BA24/BA25 et n'incluent pas BA26.

## Problèmes confirmés

1. **Écriture immédiate et peu visible.** Chaque case déclenche une écriture dès le clic dans `ValidationPFP.vue`; il n'existe ni brouillon, ni bouton « Enregistrer », ni confirmation individuelle.
2. **Absence de retour arrière.** `saveValidation` journalise seulement l'erreur dans la console. L'interface garde la nouvelle valeur même si Supabase refuse la mise à jour.
3. **Exclusivité uniquement côté interface.** La table possède trois booléens mais aucune contrainte SQL ne garantit qu'un seul soit vrai. Une autre page ou un script peut donc produire un état incohérent.
4. **Double source non transactionnelle.** Après `student_result_vote`, le composant réécrit `StudentsPhysio.pfp_valided`. Si la seconde écriture échoue, les profils et les affectations peuvent diverger.
5. **Correspondance legacy trop large.** La synchronisation recherche d'abord une entrée par `pfp_type`, sans inclure systématiquement l'année; un stage homonyme d'une autre année peut être remplacé.
6. **Historique non probant.** L'historique des actions est conservé dans `localStorage`; il n'est ni partagé entre administrateurs ni exploitable comme piste d'audit serveur.
7. **Droits trop génériques dans la route.** `page1.access` ouvre la page, tandis que les politiques RLS de `student_result_vote` s'appuient sur les rôles `admin`/`superadmin` de `user_profiles`. L'interface ne reflète pas clairement ce droit d'écriture.
8. **Chargement coûteux.** La page sélectionne toutes les colonnes de toutes les affectations publiées, tous les praticiens, puis filtre localement. Les années/PFP/classes devraient provenir des données et les requêtes être bornées par le contexte choisi.
9. **Tests partiellement représentatifs.** `tests/unit/validationPFP.spec.js` recopie plusieurs helpers au lieu de tester le vrai service d'écriture; il ne couvre ni erreur Supabase, ni concurrence, ni exclusivité en base, ni permissions.

## Contraintes de compatibilité

- `student_result_vote` doit rester la source canonique du résultat, car les profils, alertes et vues de secrétariat la lisent déjà.
- `StudentsPhysio.pfp_valided` contient des données historiques et de critères. Il ne doit pas être supprimé ni réécrit en masse dans ce ticket.
- La règle métier existante qui ne crédite que DE/FR lors d'un échec et aucun critère lors d'un arrêt doit être préservée tant qu'une décision métier contraire n'est pas validée.
- Les nouvelles tables ou fonctions publiques devront recevoir des `GRANT` explicites et une protection RLS adaptée, conformément au changement Supabase 2026 sur l'exposition Data API.

## Sécurité et autorisation

- Toute mutation doit passer par le backend authentifié et non par une écriture directe depuis le navigateur.
- Le backend doit dériver l'acteur du JWT et vérifier un rôle administratif/secretariat autorisé côté serveur.
- Le résultat doit être modifié par identifiant exact d'affectation; aucune mise à jour large par année/PFP n'est acceptable hors action de masse explicitement confirmée.
- Une piste d'audit serveur doit enregistrer l'ancien résultat, le nouveau résultat, l'acteur et la date, sans exposer de données personnelles aux étudiants.

## Tests à conserver et à compléter

- Conserver les scénarios de filtrage et de statistiques de `tests/unit/validationPFP.spec.js`.
- Ajouter des tests du service canonique pour les quatre états, l'exclusivité, le motif obligatoire d'un arrêt, le rollback visuel et les erreurs API.
- Ajouter des tests backend pour authentification, permissions, identifiant exact et écriture de l'audit.
- Ajouter un test de contrat/migration empêchant plusieurs booléens vrais.
- Vérifier manuellement les combinaisons BA26/PFP1A-PFP1B/2027, BA25/PFP2/2027 et BA24/PFP3-PFP4/2027.

## Risques

- Une migration ajoutant une contrainte échouera si des données contradictoires apparaissent avant son application; un contrôle préalable en lecture seule est requis.
- Le remplacement brutal de `pfp_valided` casserait les critères historiques. Ce ticket doit uniquement arrêter les nouvelles doubles écritures non transactionnelles et conserver la lecture legacy.
- Une action de masse peut modifier de nombreuses affectations; elle doit rester désactivée sans année + PFP + confirmation indiquant le nombre exact de lignes.

## Questions non bloquantes retenues comme hypothèses conservatrices

- « Réussi » correspond à `pfp_validee=true`, « Échec » à `pfp_echec=true`, « Arrêt » à `pfp_arret=true`, et les trois faux signifient « En attente ».
- Un arrêt exige un motif; un échec peut recevoir une remarque facultative.
- Les anciennes entrées `pfp_valided` restent lisibles mais ne sont pas la source canonique des nouveaux résultats.
