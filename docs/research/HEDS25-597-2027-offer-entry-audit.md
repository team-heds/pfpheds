# HEDS25-597 — Audit de saisie des offres 2026-2027

## Périmètre

Audit en lecture seule du parcours `/admin/formation-pratique/places` → table Supabase `places` → `/admin/formation-pratique/gestion-offres`, pour l'année académique 2026-2027 (clé canonique `2027`).

## Parcours vérifié

1. La page des places propose bien `2026-2027` avec la valeur technique `2027` et écrit les cinq capacités dans `PFP1A` à `PFP4` sous la clé JSON `2027` (`src/views/admin/formation-pratique/PlacesViewPHYFP.vue`).
2. Le store écrit et relit directement la table Supabase `places` par `PlaceId` (`src/stores/placesStore.js`).
3. La page Gestion des offres lit les mêmes colonnes `PFP1A` à `PFP4`, accepte les clés `2027` et `2026-2027`, et conserve séparément les propositions dans `pfp1a_proposition` à `pfp4_proposition` (`src/views/admin/pfp/ManagementOffreView.vue`, `src/service/offerProposalMatchingService.js`).
4. Le schéma confirme que les offres, remarques et propositions sont stockées en `jsonb` (`supabase/baseline/public-schema.sql`).
5. Les deux routes sont authentifiées et limitées par la permission `page1.access` (`src/router/routes/pfp.js`).

## Correspondance des cohortes 2027

- PFP1A et PFP1B : BA26
- PFP2 : BA25
- PFP3 et PFP4 : BA24

La règle est identique dans les statistiques des besoins et dans Gestion des offres (`src/service/placementNeedsService.js`, `src/views/admin/pfp/ManagementOffreView.vue`).

## Contrôle de la base de production

La lecture Supabase, sans mutation, a trouvé 111 places :

- 106 valeurs 2027 pour PFP1A, PFP1B et PFP2 ;
- 108 valeurs 2027 pour PFP3 ;
- 107 valeurs 2027 pour PFP4 ;
- aucune clé concurrente `2026-2027` ;
- aucun conflit entre formats d'année ;
- aucune capacité 2027 négative ou non numérique ;
- une place sans `InstitutionId`, à traiter séparément comme qualité de données.

## Blocage confirmé

Le formulaire « Nouvelle place » ne permet que la saisie 2025 et 2026 et construit un payload limité à ces deux années. Une place déjà existante peut être mise à jour correctement pour 2027 depuis le tableau, mais une nouvelle place ne peut pas être créée avec ses capacités 2027 dans le même formulaire (`src/components/admin/places/CreatePlaceDialog.vue`).

## Risques et sécurité

- Aucun changement de schéma ou de donnée n'a été effectué pendant l'audit.
- Les écritures passent par le client Supabase et dépendent donc des politiques RLS existantes ; l'interface exige `page1.access`, mais la sécurité effective reste celle des politiques de la table.
- Les deux formats d'année sont tolérés à la lecture. La saisie doit continuer à utiliser uniquement `2027` pour éviter des valeurs concurrentes.

## Tests à exiger avant mise en ligne

- création d'une place avec des valeurs 2027 et vérification du payload JSON ;
- édition d'une place existante pour 2027 ;
- lecture des mêmes offres dans Gestion des offres ;
- vérification des cohortes BA26/BA25/BA24 ;
- build de production et tests unitaires des services de statistiques et de rapprochement.

## Correction appliquée après l'audit

Le formulaire a été étendu à 2027 pour les cinq PFP et les remarques. Lorsqu'il est ouvert depuis la page réglée sur 2026-2027, l'onglet 2027 est sélectionné automatiquement. Le payload utilise la clé canonique `2027` (`src/components/admin/places/CreatePlaceDialog.vue`).

## Verdict

Le contrat Places → Supabase → Gestion des offres est cohérent pour 2027. Après la correction du formulaire, la saisie des lignes existantes et la création de nouvelles places sont prêtes pour l'année 2026-2027.
