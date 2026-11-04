---
ticket: HEDS25-600
validated: yes
---

# Complément — Choisir la ligne annuelle de l'annuaire

Recherche : `docs/research/HEDS25-600-annuaire.md`.
Plan validé explicitement en conversation le 16 septembre 2026 (« oui »).

- [x] **Sélection backend par année.** Ajouter une option `year` normalisée à
  `/audiences/students` dans `backend/supabase/audienceDirectoryBackend.js` et
  un sélecteur pur dédié sous `backend/domain/`. Pour une campagne explicite,
  ne lire que la ligne annuelle correspondante ; absence signalée, aucun repli
  silencieux sur une autre année. Sans année, sélectionner déterministement la
  dernière année connue pour préserver l'annuaire général. Rejeter les conflits
  de lignes d'une même année plutôt que choisir arbitrairement.
  Tests synthétiques : 2025 vide/2027 renseigné, ordre inversé, année absente,
  doublons, année invalide et alias 2026-2027. Validation : `npm --prefix backend test`.
  Préserver les filtres d'audience et middlewares ; aucune écriture SQL.

- [x] **Propager l'année des campagnes.** Adapter `src/service/studentDirectoryService.js`
  avec cache et requêtes en cours indexés par année normalisée. Passer l'année
  sélectionnée depuis les vues de votation normale et prioritaire. Préserver les
  signatures sans argument pour les autres écrans. Inspecter les autres appels
  de campagne avant modification ; ne pas convertir les écrans non annuels.
  Tests : isolation caches 2026/2027, invalidation, compatibilité sans argument.
  Validation : `npm run test:unit -- tests/unit/studentDirectoryService.spec.js`
  puis suite complète et `npm run build`, via Portly.

- [x] **Contrôler sans modifier les dossiers.** Vérification locale avec fixtures
  et comparaison des résultats par année. Documenter le comportement pour une
  ligne manquante. Revue avant toute livraison séparée sur test puis production.
  Ce plan d'implémentation n'inclut aucun déploiement, aucune ouverture de votation
  et aucune correction de l'historique.

## Sécurité et retour arrière

Pas de migration, changement RLS, stockage, dépendance, route publique ou IA.
Ne jamais importer de comptes ou mots de passe de test en production.
Rollback : retirer uniquement ce complément frontend/backend, sans restauration
de données puisqu'aucune n'est modifiée. Toute règle différente pour les années
manquantes doit être validée avant implémentation.

## Résultat local — 16 septembre 2026

- Sélecteur pur `backend/domain/studentDirectoryYear.mjs` : ordre indifférent,
  année explicite ou dernière année connue. Une ligne sans année valide n'est
  jamais substituée à une ligne annuelle. Doublons de l'année retenue : HTTP 409 ;
  paramètre année invalide : HTTP 400 avant lecture des profils.
- Réponse annuaire : `requested_year`, `physio_year`, `physio_year_status`.
  Si la ligne manque : `physio_year_status: missing`, répondant null, pas de
  réutilisation des indicateurs d'une autre année ; identité du profil conservée.
- Les vues normale et prioritaire transmettent `filterYear.value`. Les autres
  consommateurs restent compatibles sans argument. Le générateur PFP4 et la
  gestion des répondants possèdent aussi leurs propres lectures historiques :
  leur harmonisation complète reste hors de ce correctif ciblé PFP2/annuaire.
- Tests backend : 87 réussis, dont test du handler avec client simulé limité aux
  lectures et fixtures synthétiques. Tests frontend : 1 298 réussis / 120 fichiers.
- ESLint ciblé, compilation Vite/PWA et `git diff --check` réussis. Aucun script
  de typecheck distinct configuré. Avertissements de build existants conservés.
- Aucune lecture/écriture de production pendant cette implémentation, aucune
  migration ni aucun déploiement. Validation navigateur sur test et livraison
  backend + frontend restent des étapes séparées avant disponibilité en ligne.

## Livraison sur test — 16 septembre 2026

Demande explicite « déploie ça », dans le contexte de la validation sur test.
Frontend et backend publiés uniquement sur `test.hedsvs.ch`.

- Backend : image précédente conservée sous
  `pfpheds-staging-backend:before-annual-directory-20260916`, nouvelle image
  `a554cefd3e0b`. Deux fichiers applicatifs remplacés, dépendances inchangées.
- Sauvegardes dans `/opt/pfpheds-staging/backups/` :
  `backend-before-annual-directory-20260916.tar.gz` et
  `frontend-before-annual-directory-20260916.tar.gz`.
- Frontend reconstruit avec les variables de test, l'aperçu admin existant et les
  trois fichiers frontend de ce correctif uniquement. Hash de l'index servi :
  `cd3acfaccc847b342d5816567a3ef21afd7f85146ae4915c91ec7f4228c0a984`.
- API authentifiée : répondants corrects pour les deux dossiers vérifiés en
  2027 / 2026-2027 et sans année ; champs historiques 2025 toujours vides.
  Année invalide rejetée en HTTP 400. Page `/votation` HTTP 200, index identique
  au paquet construit. Aucun vote créé ; 1 session ouverte conservée, 0 vote.
- Écart révélé : annuaire BA25 annuel = 63, ancien calcul = 64. Un dossier ne
  possède une classe BA25 qu'en 2025 et aucune ligne 2027, avec classe de profil
  vide. Identité communiquée à l'utilisateur hors dépôt ; aucun rattachement créé.
  Confirmation métier nécessaire avant de tester 64 étudiants.
- Production et données métier inchangées. Pas de nouveau test navigateur complet
  du parcours étudiant dans cette livraison : validation HTTP/API et build.
- Retour arrière : remettre le tag backend conservé sur `pfpheds-staging-backend`,
  recréer seulement le service backend sans build et restaurer son fichier source
  sauvegardé ; restaurer le frontend sauvegardé. Aucun rollback de base nécessaire.
