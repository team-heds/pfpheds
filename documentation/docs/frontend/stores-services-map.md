---
title: Cartographie stores et services
---

## Objectif

Cette page sert à retrouver rapidement quelle couche est touchée pour une fonctionnalité donnée :

- store Pinia
- service métier
- composable
- éventuel backend

## Règle de lecture

En pratique :

1. la vue orchestre
2. le store porte l'état partagé
3. le service porte la logique métier et les requêtes
4. le backend n'intervient que pour certains flux

## Stores critiques

| Store | Rôle principal | Dépendances directes |
| --- | --- | --- |
| `authStore.js` | session multi-provider | Firebase Auth, Supabase Auth |
| `role.js` | permissions runtime | Supabase RPC `api_my_permissions`, `user_profiles` |
| `userStore.js` | session Supabase + profil temps réel | `user_profiles`, Realtime Supabase |
| `placesStore.js` | gestion des places | services PFP / tables places |
| `praticiensStore.js` | praticiens formateurs | flux PFP |
| `postsStore.js` | feed social | social backend / Supabase |
| `eventStore.js` | événements | services événements |
| `documentStore.js` | documents et fichiers | storage / services documents |
| `votesStore.js` | votations | services votation |

## Trio auth / session / permissions

### `authStore.js`

Responsabilités :

- connexion Firebase
- connexion Supabase
- restauration de session
- refresh session
- monitoring session

Point critique :

- il décide du provider actif et influence toute la navigation

### `role.js`

Responsabilités :

- charger les permissions de l'utilisateur
- exposer `can()`
- gérer `isSuper`

Point critique :

- s'appuie d'abord sur la RPC `api_my_permissions`, puis fallback sur `user_profiles`

### `userStore.js`

Responsabilités :

- maintenir la session Supabase locale
- charger le profil `user_profiles`
- s'abonner aux mises à jour temps réel du profil

Point critique :

- plus centré sur le profil que sur l'auth globale

## Services critiques

| Service | Rôle |
| --- | --- |
| `rolesService.js` | compatibilité rôle Firebase / Supabase |
| `studentsService.js` | logique étudiant / cohortes |
| `planningService.js` | logique planning |
| `academicYearService.js` | année académique |
| `resultatVotationService.js` | résultats de votation |
| `pfpAlertsService.js` | alertes PFP |
| `gamificationServiceSupabase.js` | XP, maisons, stats, classement |
| `notificationService.js` | notifications |
| `videoLibraryService.js` | bibliothèque vidéo |
| `supabaseStorageService.js` | stockage Supabase |

## Exemple de chaînes typiques

### Login et droits

```text
Vue login
→ authStore
→ router.js
→ roleStore
→ RPC Supabase / user_profiles
```

### Feed social

```text
Vue social
→ postsStore
→ service / backend social
→ posts / hashtags / communities
```

### Formation pratique

```text
Vue admin PFP
→ placesStore / praticiensStore / votesStore
→ services PFP
→ Supabase / backend / scripts selon le flux
```

## Règle de modification

Si tu modifies :

- l'état partagé : store
- les appels données : service
- la logique d'accès : authStore, roleStore, router
- l'effet visuel local : vue ou composant
