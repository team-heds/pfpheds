---
title: Catalogue des routes frontend
---

## Objectif

Cette page sert de carte de navigation technique. Elle relie chaque famille de routes a ses vues principales.

## Regle de lecture

Le point d'entree du routing est:

- `src/router.js`
- `src/router/routes/index.js`

Les routes sont ensuite regroupees par domaines dans `src/router/routes/*.js`.

## Familles de routes

### `auth.js`

Vues principales:

- `auth/LoginHome.vue`
- `auth/RegisterView.vue`
- `pages/ResetPassword.vue`
- `auth/VerificationView.vue`
- `auth/LockScreenView.vue`
- `auth/AccessView.vue`
- `auth/AuthErrorView.vue`

Usage:

- authentification
- recovery
- erreurs et accès refusés

### `pages.js`

Vues principales:

- `home/MapView.vue`
- `institutions/Institution.vue`
- `institutions/PlaceListView.vue`
- `home/FaqView.vue`
- `home/TermsView.vue`
- `home/InfoExterneView.vue`
- `home/HistoryView.vue`
- `home/DocumentsView.vue`
- `home/PushView.vue`
- `home/RoleManagement.vue`
- `home/RouterView.vue`
- `home/PermissionsView.vue`
- `pages/FeedbackaStudentView.vue`
- `associations/AlpinPhysioView.vue`
- `documentation/PrimeVueDocsView.vue`

Usage:

- pages transverses et institutionnelles

### `admin.js`

Bloc le plus volumineux du routeur.

Sous-domaines couverts:

- dashboards admin
- role management
- planning admin
- soins infirmiers
- academic
- courses
- tools
- gamification admin

Exemples de vues:

- `admin/DashboardView.vue`
- `admin/DashboardRMView.vue`
- `admin/planning/WeeklyPlanningAdminView.vue`
- `admin/academic/AcademicKanbanView.vue`
- `admin/gamification/UserManagementView.vue`

### `pfp.js`

Bloc critique formation pratique.

Sous-domaines couverts:

- gestion PFP historique
- formation pratique physio
- secretariat
- votations
- affectations
- validations

Exemples de vues:

- `admin/pfp/ManagementOffreView.vue`
- `admin/pfp/PlacesAssignedView.vue`
- `admin/formation-pratique/EtudiantsViewPHYFP.vue`
- `admin/formation-pratique/VotationPFPViewPHYFP.vue`
- `admin/formation-pratique/secretariat/VueDEnsembleFP.vue`

### `calendar.js`

Vues principales:

- `planning/HomePlanning.vue`
- `planning/CalendrierFormationPlein.vue`
- `planning/CalendrierSemestriel.vue`
- `planning/CalendrierModule.vue`
- `planning/CalendrierEnseignant.vue`
- `planning/CalendarMyCourses.vue`
- `planning/CalendarMyModules.vue`

### `media.js`

Vues principales:

- `media/MediaHubPage.vue`
- `media/ModulesPage.vue`
- `media/ModuleVideosPage.vue`
- `media/VideoValidationPage.vue`
- `admin/ModuleAdminPage.vue`
- `media/VimeoTestPage.vue`

### `social.js`

Vues principales:

- `social/FeedView.vue`
- `social/MentionView.vue`
- `social/HashtagView.vue`
- `social/CommunitiesView.vue`
- `social/CommunityView.vue`
- `social/CommunityInfoView.vue`

### `apps.js`

Vues principales:

- `apps/tasklist/Index.vue`
- `apps/chat/IndexChat.vue`
- `apps/files/FilesView.vue`
- `apps/mail/Index.vue`
- `apps/notes/NotesWorkspaceView.vue`
- `apps/events/EventManagementView.vue`
- `apps/tools/ToolsView.vue`
- `apps/tools/ChatBotView.vue`
- `apps/rom-runner/RomRunnerView.vue`
- `pages/CareConvers.vue`
- bloc `capsulesInsuffiance/*`

### `users.js`

Vues principales:

- `admin/users/UserListView.vue`
- `admin/users/StudentListView.vue`
- `admin/users/TeacherListView.vue`
- `admin/institutions/InstitutionListView.vue`

### `votations.js`

Vues principales:

- `admin/votations/VotationGenericView.vue`
- `admin/votations/VotationManagementView.vue`
- `admin/places/PlaceAssignmentView.vue`
- `admin/validation/ValidationView.vue`
- `admin/validation/ReceptionView.vue`

## Regle de debug

Quand tu cherches une page:

1. trouve sa route dans `src/router/routes/*.js`
2. ouvre la vue correspondante
3. repere les stores et services importes
4. vérifie ensuite auth, rôles et source de données
