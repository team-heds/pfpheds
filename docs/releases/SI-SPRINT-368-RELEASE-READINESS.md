# Soins infirmiers — Sprint 368 — Préparation de release

Date de préparation : 29 septembre 2026  
Périmètre : HEDS25-628 à HEDS25-638  
Environnement validé : `https://test.hedsvs.ch`  
Décision actuelle : **pas encore promouvable en production**

## Résumé de la release

Cette release fiabilise l'administration Soins infirmiers de bout en bout :

- sécurisation RLS des votes de postulation ;
- contexte d'année académique unique ;
- normalisation des identités enseignantes et des feuilles de charge ;
- indicateurs de qualité planning corrigés ;
- rôles, routes et menus SI harmonisés ;
- catalogue de postulation paginé et correctement rattaché ;
- agrégations et requêtes optimisées ;
- responsive mobile/iPad et navigation clavier ;
- tests métier, permissions et isolation SQL ;
- design homogène des six écrans SI.

## État technique vérifié

| Contrôle | Résultat |
| --- | --- |
| Tests métier SI | 48/48 réussis |
| Test de contrat design | 9/9 réussis |
| Isolation SQL des votes | Réussie, transaction annulée |
| Smoke test authentifié | 5 écrans sans erreur 5xx ni erreur JavaScript |
| Contrôle design | 12 vues desktop/mobile sans débordement |
| Contrôle clavier HEDS25-636 | 10 combinaisons réussies |
| Contrôle responsive HEDS25-635 | 15 combinaisons réussies |
| Comptes dédiés RMSoins / EnseignantSoins | Créés sur test, actifs, aucun courriel envoyé |
| Matrice RLS avec les comptes dédiés | Réussie : enseignant = vote personnel, RM = module attribué |
| Routes par rôle dans un vrai navigateur | 7/7 accès ou refus conformes |
| Cycle de vote avec les comptes dédiés | Ajout enseignant, lecture RM, retrait enseignant réussis ; aucun résidu |
| Cycle navigateur complet | Vote, compteur RM, planning ciblé en lecture seule et retrait réussis |
| Protection du build public test | Refus automatique si `localhost:8180` est embarqué |
| Build staging | Réussi |
| Écritures pendant les contrôles navigateur | Aucune |

Version actuellement servie sur le test :

- `index.html` : `e214733f6eb7e8420ac4b6b7fc5cc309e2cdbf80121557075ce076c902036ac9`
- `sw.js` : `7cb0eef37386526535a0b72d6bf4a462a27902198ceab8af697b96e7babe71bd`
- rollback test : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-638-20260929-184412.tar.gz`

## Recette humaine obligatoire

### AdminSoins

- [ ] Le dashboard Secrétariat SI s'ouvre.
- [ ] L'année active est `2026-2027` sur tous les écrans.
- [ ] Les dashboards RM et Enseignant sont consultables en supervision.
- [ ] Le catalogue affiche les cours de postulation de l'année active.
- [ ] Les menus Planning journalier, Feuille de charges et Postulation sont visibles.

### RMSoins

- [x] Le dashboard RM s'ouvre directement après connexion.
- [x] Le dashboard Secrétariat est refusé.
- [ ] Seuls les modules dont la personne est responsable ou coordinatrice apparaissent.
- [x] Seuls les votes des modules gérés sont consultables.
- [ ] Une affectation de votant peut être testée sur un créneau de test, puis annulée.

### EnseignantSoins

- [x] Le dashboard Enseignant s'ouvre directement après connexion.
- [x] Les dashboards Secrétariat et RM sont refusés.
- [x] Le catalogue de postulation est accessible.
- [x] Un vote peut être ajouté puis retiré sur un créneau de test.
- [x] L'enseignant ne voit pas les votes des autres enseignants.
- [x] Le lien planning ouvre la bonne semaine, la bonne classe et le bon jour.

### Responsive et clavier

- [ ] Parcourir au moins Secrétariat, RM et Enseignant sur iPad réel.
- [ ] Parcourir les actions principales au clavier sans perte de focus.
- [ ] Vérifier que la navigation mobile ne masque pas le dernier contenu.

## Blocages avant production

1. **Validation humaine absente** : le cycle technique réel ajout/lecture/retrait est validé, mais son rendu visuel, la supervision RM et l'ouverture ciblée du planning doivent encore être signés manuellement avec les deux comptes dédiés.
2. **Release non isolée** : le répertoire de travail contient de nombreuses modifications hors périmètre SI. Il faut constituer une branche/PR ou un commit de release explicitement revu avant de construire l'artefact production.
3. **Jira non synchronisé** : HEDS25-628 à HEDS25-638 apparaissent encore « À faire » alors que les validations techniques sont documentées. Les statuts ne doivent être changés qu'après la recette correspondante.
4. **Approbation production absente** : aucune promotion ne sera faite sans accord explicite après la recette.

Les identifiants des comptes dédiés sont conservés uniquement dans
`deploy/staging/si-uat-accounts.json` (ignoré par Git, droits locaux `0600`). Le RM de recette est rattaché à un seul module de test ; la valeur d'origine est conservée dans ce même fichier pour permettre un retrait propre après la recette.

## Migration Supabase

Migration requise :

`supabase/migrations/20260929094941_secure_si_postulation_votes.sql`

Effets :

- création de trois fonctions de contrôle SI ;
- remplacement des politiques de `planning_slot_votes` ;
- suppression des droits de `anon` ;
- droits CRUD réservés à `authenticated`, avec filtrage RLS ;
- droits complets conservés pour `service_role`.

Ordre de déploiement recommandé :

1. sauvegarde vérifiée de la base production ;
2. inventaire des politiques et privilèges actuellement actifs ;
3. application de la migration dans une transaction contrôlée ;
4. exécution de la matrice SQL avec comptes de test production dédiés ;
5. publication atomique du frontend ;
6. smoke test des trois rôles ;
7. surveillance des erreurs d'authentification et de vote.

Rollback base : restaurer la sauvegarde vérifiée si la matrice RLS échoue. Ne pas tenter de reconstituer manuellement les anciennes politiques pendant l'incident.

Rollback frontend : conserver une archive du répertoire frontend production avant le remplacement atomique, puis restaurer cette archive si le smoke test échoue.

## Contrat d'environnement production

Vérifier uniquement la présence et la cible de ces variables, jamais leurs valeurs dans un rapport :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_REST_URL`
- `VITE_SUPABASE_KEY`
- `VITE_API_URL`
- `VITE_API_BASE_URL`
- `VITE_BACKEND_URL`
- `VITE_APP_ENV`
- `VITE_SUPABASE_REALTIME`

Les indicateurs Gamification doivent conserver leurs valeurs de production actuelles ; ils ne font pas partie de cette release SI.

## Avertissement opérationnel non bloquant pour le code

Le diagnostic test montre une qualité planning faible (`65/1912` créneaux complets), notamment des salles, enseignants et rattachements de cours manquants. Le nouveau code expose correctement ces problèmes mais ne les corrige pas automatiquement. Cette qualité de données doit être traitée séparément avant de considérer les tableaux de charge comme exhaustifs.

## Condition de passage au vert

La release devient candidate à la production uniquement lorsque :

- les trois parcours par rôle sont signés ;
- un artefact SI isolé et revu est identifié par commit ;
- la sauvegarde production et le rollback sont prêts ;
- l'approbation humaine de mise en production est explicite.
