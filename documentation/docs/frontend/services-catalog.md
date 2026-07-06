---
title: Catalogue des services métier
---

## Objectif

Donner une vue d'ensemble du dossier `src/service/` pour savoir où chercher selon le problème.

## Services par grandes familles

### Auth, rôles et profils

- `rolesService.js`
- `userProfileAutoCreation.js`
- `notificationService.js`

### Planning, académique et charge

- `planningService.js`
- `academicPlanningService.js`
- `academicYearService.js`
- `modulePlanningService.js`
- `moduleService.js`
- `modulesService.js`
- `workloadService.js`
- `ticketService.js`

### Dashboards et KPI

- `dashboardService.js`
- `dashboardSupabaseService.js`
- `dashboardQuickStatsService.js`
- `adminDashboardService.js`
- `adminKpiService.js`
- `academicKpiService.js`
- `enseignantDashboardService.js`
- `rmDashboardService.js`

### Formation pratique et votations

- `studentsService.js`
- `resultatVotationService.js`
- `votationSessionService.js`
- `votesBackendService.js`
- `pfpAlertsService.js`
- `pfpStatsService.js`
- `intelligentAlertsService.js`
- `periodComparisonService.js`
- `dataQualityService.js`

### Gamification

- `gamificationServiceSupabase.js`
- `gamificationService.js`
- `gamificationIntegration.js`
- `badgesService.js`
- `challengesService.js`
- `questsService.js`
- `questExpirationService.js`
- `userQuestsService.js`
- `adminQuestsService.js`
- `hesHousesService.js`
- `defisService.js`

### Media et contenus

- `mediaService.js`
- `institutionMediaService.js`
- `videoLibraryService.js`
- `vimeoService.js`
- `notesService.js`

### Stockage et données

- `supabaseStorageService.js`

### Intégrations et divers

- `githubService.js`
- `EventService.js`

## Services à connaître absolument

### `rolesService.js`

Pont entre le monde Firebase legacy et le monde Supabase pour les rôles.

### `planningService.js`

Service central pour la logique de planning côté métier.

### `studentsService.js`

Service structurant du domaine étudiants / PFP.

### `resultatVotationService.js`

Service critique pour les résultats et calculs liés aux votations.

### `gamificationServiceSupabase.js`

Service dense, avec :

- lecture utilisateur
- maisons
- calculs de niveaux
- classement des maisons
- cache mémoire

## Règle de modification

Quand une fonctionnalité devient importante :

- la vue ne doit pas porter le calcul principal
- le service doit devenir la source de logique
- le store doit rester centré sur l'état et l'orchestration
