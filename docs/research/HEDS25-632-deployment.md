# HEDS25-632 — Rapport de validation test

Date : 2026-09-29  
Environnement modifié : `test.hedsvs.ch` uniquement

## Résultat

- Matrice d'accès SI centralisée dans `src/config/siAccess.js`.
- Décision d'accès commune au routeur et au menu via `src/router/accessControl.js`.
- Correction du traitement des besoins définis sous forme de tableau dans la sidebar.
- Distinction explicite entre `AdminSoins`, `RMSoins` et `EnseignantSoins`.
- La permission `auth.redirect.dashboard_rm` ouvre uniquement le dashboard RM ; elle ne donne pas accès à la gestion des modules.
- L'ancienne route `/admin/dashboard-enseignant` redirige vers la route SI canonique et n'accepte plus `EnseignantPhysio`.
- Le lien « Cours en postulation » est présent dans le menu SI pour les publics autorisés.

## Matrice fonctionnelle

| Espace | AdminSoins | RMSoins | EnseignantSoins |
| --- | --- | --- | --- |
| Secrétariat SI | Oui | Non | Non |
| Dashboard RM | Oui | Oui | Non |
| Espace enseignant | Oui | Oui | Oui |
| Cours en postulation | Oui | Oui, supervision | Oui, vote |
| Modules, ressources et planning | Oui | Oui | Non |

`admin`, `page2.access` et `super.all` conservent leurs accès administratifs globaux. Les permissions `editor` et `PlanificateurHoraires` restent limitées aux écrans de planning prévus.

## Preuves automatisées

- 16 tests SI ciblés réussis, dont 6 tests spécifiques à la matrice HEDS25-632.
- ESLint ciblé réussi.
- Build isolé avec les variables de l'environnement test réussi.
- Présence du nouveau lien vérifiée dans les assets réellement servis.

## Déploiement test

- Script : `deploy/staging/deploy-heds632-test.sh`.
- Sauvegarde de retour arrière : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-632-20260929-134026`.
- SHA-256 de `index.html` : `32e6dd8b5c5c6ef87a11ac09801e39822b1d91b2e8247be5e4706ea15b6d6dc4`.
- SHA-256 du service worker : `7de3e27e420bc99203652adcf318d0457facdf6428f4b639342be209e320ed65`.
- Espace libre après nettoyage ciblé : environ 651 Mo.
- Production non modifiée.
- Aucun rôle, aucune permission et aucune donnée Supabase n'ont été modifiés.

Une première construction HEDS25-632 a brièvement été publiée avec une permission de redirection RM trop large. Elle a été immédiatement remplacée par la version ci-dessus ; sa sauvegarde intermédiaire a été supprimée et aucune donnée n'a été modifiée.

## Validation fonctionnelle restante

Contrôler le menu et l'accès direct aux URL avec un compte `AdminSoins`, un compte `RMSoins` et un compte `EnseignantSoins`. La promotion en production reste interdite avant cette validation.

