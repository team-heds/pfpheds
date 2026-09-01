---
ticket: PFP-OUTCOME-VALIDATION
validated: no
---

# Plan — Fiabiliser la validation des résultats PFP

## Critères d'acceptation

- [ ] Chaque affectation publiée possède exactement un état visible : En attente, Réussi, Échec ou Arrêt.
- [ ] Une modification reste locale tant que l'utilisateur n'a pas choisi « Enregistrer ».
- [ ] Un arrêt exige un motif; les erreurs d'enregistrement sont visibles et l'ancien état est restauré.
- [ ] Les filtres année, classe, PFP et résultat proviennent des données réelles et couvrent 2027/BA26.
- [ ] Les mutations sont autorisées côté serveur et portent sur les identifiants exacts.
- [ ] Chaque modification est auditée côté serveur.
- [ ] Les profils, alertes et vues de secrétariat reflètent le résultat enregistré.

## 1. Créer le modèle canonique et ses tests

- **Objectif :** centraliser la conversion entre les trois booléens existants et un état métier exclusif.
- **Fichiers attendus :** `src/service/pfpOutcomeService.js`, `tests/unit/pfpOutcomeService.spec.js`.
- **Autorisé :** helpers purs, validation du motif d'arrêt, construction de payload exact.
- **Interdit :** écriture Supabase ou changement de schéma à cette étape.
- **Tests :** quatre états, valeurs legacy contradictoires, motif obligatoire, payload sans champs étrangers.
- **Validation :** `npm run test:unit -- tests/unit/pfpOutcomeService.spec.js`.
- **Rollback :** suppression du service et du test, sans impact sur les données.

## 2. Ajouter le garde-fou SQL et l'audit

- **Objectif :** garantir l'exclusivité en base et conserver une piste d'audit serveur.
- **Fichiers attendus :** une migration créée par `supabase migration new`, contrat Supabase mis à jour si nécessaire.
- **Autorisé :** contrainte `<= 1` sur les trois booléens; table d'audit protégée par RLS; grants explicites au `service_role`; index sur l'affectation et la date.
- **Interdit :** exposition à `anon`, politique `authenticated USING(true)`, suppression ou réécriture de `StudentsPhysio.pfp_valided`.
- **Tests :** audit inaccessible aux utilisateurs ordinaires; combinaison contradictoire rejetée; contrôle préalable des données existantes.
- **Validation :** contrôle du schéma, tests sécurité backend et `npm run db:schema:check`.
- **Sécurité :** l'acteur vient du JWT backend; aucune donnée d'audit n'est renvoyée aux étudiants.
- **Rollback :** retirer la contrainte puis la table d'audit; aucune colonne métier historique supprimée.

## 3. Exposer une mutation backend autorisée

- **Objectif :** supprimer les écritures directes depuis le navigateur et enregistrer résultat + audit de manière contrôlée.
- **Fichiers attendus :** route backend dédiée, montage dans `backend/index.js`, tests backend.
- **Autorisé :** `PATCH` par UUID exact; validation des valeurs; permission admin/secretariat; réponse minimale.
- **Interdit :** identités fournies par le client, mise à jour large implicite, service-role dans le frontend.
- **Tests :** 401 anonyme, 403 rôle insuffisant, 400 payload invalide, 404 affectation absente, succès et audit pour rôle autorisé.
- **Validation :** `npm --prefix backend test`.
- **Rollback :** retirer le montage de route; la lecture existante continue de fonctionner.

## 4. Refaire l'interaction de la page Validation PFP

- **Objectif :** remplacer les trois cases immédiates par un choix exclusif lisible et une sauvegarde explicite.
- **Fichiers attendus :** `src/views/admin/pfp/ValidationPFP.vue`, éventuellement un petit composant commun de sélection d'état.
- **Autorisé :** boutons En attente/Réussi/Échec/Arrêt, ligne modifiée, Enregistrer/Annuler, motif d'arrêt, états chargement/succès/erreur, filtres issus des données.
- **Interdit :** modification automatique au clic, validation d'une ligne sans identifiant d'affectation, réécriture directe de `StudentsPhysio`.
- **Tests :** interaction clavier, exclusivité, annulation, échec réseau, recherche et filtres 2027/BA26.
- **Validation :** tests unitaires ciblés puis test manuel localhost desktop/tablette/mobile.
- **Accessibilité :** groupe de boutons nommé, focus visible, message d'erreur associé, aucune information portée uniquement par la couleur.
- **Rollback :** rétablir l'ancien composant; le backend et la contrainte restent compatibles.

## 5. Vérifier les consommateurs et l'action de masse

- **Objectif :** confirmer que profils, alertes et secrétariat lisent le résultat canonique et sécuriser la validation en masse.
- **Fichiers attendus :** tests ciblés autour de `profileStages`, `pfpAlertsService`, `VueDEnsembleFP`; adaptation minimale si une divergence est confirmée.
- **Autorisé :** lecture prioritaire de `student_result_vote`; confirmation affichant année, PFP et nombre exact.
- **Interdit :** backfill global de données historiques, changement des règles de critères DE/FR sans validation métier.
- **Tests :** résultat identique dans la page, le profil, les alertes et la vue d'ensemble; aucune ligne hors filtre modifiée.
- **Validation :** suite ciblée, build production, contrôle navigateur local sur des données de test.
- **Rollback :** désactiver l'action de masse; les validations individuelles restent disponibles.

## Ordre de livraison

1. Service et tests purs.
2. Migration locale uniquement, non appliquée en production.
3. Backend et tests d'autorisation.
4. Interface et tests d'interaction.
5. Vérification transversale, build et PR vers `prod`.

La migration, la fusion et le déploiement resteront séparés et ne seront pas exécutés sans validation explicite.
