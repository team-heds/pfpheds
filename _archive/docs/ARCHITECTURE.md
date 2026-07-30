# 📐 Architecture Technique — Plateforme HEdS

**Version:** 0.1.60  
**Dernière mise à jour:** 2026-02-11

---

## 1. Vue d'ensemble

La Plateforme HEdS (PFP) est une **Progressive Web App (PWA)** destinée à la gestion académique de la Haute École de Santé. Elle couvre la gestion des modules, des plannings, des stages (PFP), la gamification, les événements, et la communication sociale.

### Stack technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | Vue 3 (Composition API) + Vite |
| **UI** | PrimeVue + PrimeFlex + SCSS |
| **State** | Pinia |
| **Routing** | Vue Router (routes dynamiques depuis Supabase) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Auth legacy** | Firebase Auth + Realtime Database |
| **Tests** | Vitest (unit) + Playwright (e2e) |
| **PWA** | vite-plugin-pwa + Workbox |

---

## 2. Structure du projet

```
src/
├── main.js                  # Point d'entrée, plugins, auth listener
├── App.vue                  # Composant racine
├── router.js                # Routes (statiques + dynamiques) + guards
├── supabase.js              # Client Supabase (PKCE flow)
├── firebase.js              # Client Firebase (legacy)
│
├── stores/                  # 30 Pinia stores
│   ├── authStore.js         # Auth unifiée (Supabase + Firebase)
│   ├── role.js              # Rôles et permissions (Supabase RLS)
│   ├── userStore.js         # Profil utilisateur
│   ├── eventStore.js        # Événements (CRUD + realtime)
│   ├── placesStore.js       # Lieux de stage PFP
│   ├── praticiensStore.js   # Praticiens formateurs
│   ├── trackStore.js        # Filières (SI, PHY)
│   ├── votesStore.js        # Votation étudiants
│   └── ...                  # Autres stores métier
│
├── service/                 # 44 services métier
│   ├── gamificationServiceSupabase.js  # XP, maisons, niveaux
│   ├── rolesService.js      # Gestion des rôles (Firebase + Supabase)
│   ├── planningService.js   # Planning hebdomadaire
│   ├── vimeoService.js      # Intégration vidéo Vimeo
│   ├── githubService.js     # Intégration GitHub
│   └── ...
│
├── services/                # 6 services dashboard/KPI
│   ├── adminDashboardService.js
│   ├── adminKpiService.js
│   ├── academicKpiService.js
│   ├── enseignantDashboardService.js
│   ├── rmDashboardService.js
│   └── modulePlanningService.js
│
├── composables/             # 8 composables Vue
│   ├── useAcademicYear.js   # Gestion année académique
│   ├── useDynamicRoutes.js  # Routes dynamiques Supabase
│   ├── useKpiManager.js     # Gestion KPI
│   ├── useModulePermissions.js  # Permissions modules
│   └── ...
│
├── components/              # ~339 composants
│   ├── admin/               # Composants admin (listes, sidebar, settings)
│   ├── gamification/        # Maisons, badges, quêtes, défis
│   ├── social/              # Feed, posts, communautés
│   ├── academic/            # Kanban, tickets
│   ├── events/              # Gestion événements
│   ├── editor/              # Éditeur TipTap
│   ├── ui/                  # Composants UI réutilisables
│   └── ...
│
├── views/                   # ~230 vues
│   ├── admin/               # Dashboard admin, modules, planning
│   ├── auth/                # Login, register, reset password
│   ├── planning/            # Planning hebdomadaire
│   ├── social/              # Feed social
│   ├── home/                # Accueil, FAQ, documents
│   └── ...
│
├── router/guards/           # Guards de navigation
│   └── modulePermissionGuard.js  # Vérification propriété module
│
├── config/                  # Configuration
├── database/                # Schémas/migrations
├── hooks/                   # Hooks personnalisés
├── layout/                  # Layouts (sidebar, topbar)
├── assets/                  # Images, icônes, thèmes SCSS
└── utils/                   # Utilitaires
```

---

## 3. Authentification

### Double provider : Supabase + Firebase

L'application supporte deux providers d'authentification en parallèle :

- **Supabase Auth** (principal) : PKCE flow, session persistante, auto-refresh tokens
- **Firebase Auth** (legacy) : pour les utilisateurs existants

Le `authStore` unifie les deux :
```
authStore.user        → utilisateur courant (Supabase ou Firebase)
authStore.authProvider → 'supabase' | 'firebase'
authStore.isLoggedIn  → boolean
```

### Flux d'authentification

1. `main.js` → `authStore.initializeAuth()` vérifie la session Supabase
2. `onAuthStateChanged(firebase)` écoute les changements Firebase
3. Le router `beforeEach` vérifie :
   - `meta.need` → permissions Supabase (`roleStore.can()`)
   - `meta.requiresAuth` → authentification requise
   - `meta.requiredRole` → rôle spécifique requis

---

## 4. Gestion des rôles et permissions

### Modèle Supabase

```
user_roles       → { user_email, role }
user_track_roles → { user_id, track_id, role, is_active }
user_profiles    → { user_id, email, role, permissions }
```

### Niveaux d'accès (meta.need)

| Valeur | Description |
|--------|------------|
| `'public'` / `'anonymous'` | Accès libre |
| `'authenticated'` | Tout utilisateur connecté |
| `'admin'` | Administrateur |
| `'EnseignantSoins'` | Enseignant SI |
| `'RM'` | Responsable de module |

---

## 5. Gamification

### Architecture

Le système de gamification est géré par `gamificationServiceSupabase.js` (singleton) :

- **4 maisons** : Harmonis, Elaris, Doloris, Solencia
- **Niveaux** : `niveau = min(20, max(1, floor(sqrt(XP / 100))))`
- **Cache** : Map en mémoire avec TTL de 5 minutes
- **Tables** : `gamification_data`, `houses`

### Intégration

`gamificationIntegration.js` déclenche l'ajout d'XP lors d'événements :
- Connexion quotidienne
- Complétion de quêtes
- Participation aux défis

---

## 6. Routes dynamiques

Les routes sont chargées dynamiquement depuis Supabase au premier `beforeEach` :

```
useDynamicRoutes.js → addDynamicRoutesToRouter(router)
```

Cela permet d'ajouter des pages sans redéployer l'application.

---

## 7. Conventions de code

### Stores (Pinia)

- **Composition API** (`setup()` function) pour les nouveaux stores
- **Options API** pour certains stores legacy
- Pattern : `loading`, `error`, `items` comme state de base
- Actions async avec `try/catch/finally` et gestion de `loading`

### Services

- Deux dossiers : `service/` (métier) et `services/` (dashboard/KPI)
- Les services retournent des données formatées, les stores gèrent l'état
- Logs de debug protégés par `import.meta.env.DEV`

### Composants

- Nommage : PascalCase (ex: `CardNameProfile.vue`)
- Props typées avec `defineProps()`
- Émissions typées avec `defineEmits()`

### Tests

- Dossier : `tests/unit/`
- Convention : `[nom].spec.js`
- Mock Supabase avec `vi.mock('@/supabase')` + `vi.hoisted()`
- Mock Pinia avec `setActivePinia(createPinia())`

---

## 8. Variables d'environnement

| Variable | Usage |
|----------|-------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_KEY` | Clé anonyme Supabase |
| `VITE_FIREBASE_API_KEY` | Clé API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine auth Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket storage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID messaging Firebase |
| `VITE_FIREBASE_APP_ID` | ID app Firebase |
| `VITE_FIREBASE_DATABASE_URL` | URL Realtime DB Firebase |
| `VITE_VIMEO_ACCESS_TOKEN` | Token API Vimeo |

Toutes les variables sont dans `.env` (gitignored). Jamais de secrets hardcodés.

---

## 9. Build et déploiement

### Commandes

```bash
npm run dev          # Serveur dev (port 5172, HMR désactivé)
npm run build        # Build production
npm run preview      # Preview du build
npm run test:unit    # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run lint         # ESLint
npm run format       # Prettier
```

### Chunks de build

Le build Vite sépare les dépendances en chunks :
- `vendor` : Vue, Vue Router, Pinia
- `primevue` : Composants PrimeVue
- `supabase` : Client Supabase
- `firebase` : SDK Firebase

---

## 10. Tests

### Couverture actuelle

| Fichier de test | Tests | Scope |
|----------------|-------|-------|
| `gamificationServiceSupabase.spec.js` | 45 | XP, niveaux, maisons, cache |
| `placesStore.spec.js` | 22 | CRUD places, getters, search |
| `eventStore.spec.js` | 20 | CRUD events, realtime, likes |
| `praticiensStore.spec.js` | ~20 | CRUD praticiens, normalisation |
| `weeklyPlanningAdminView.spec.js` | 24 | Planning admin, duplication |
| + autres | ~312 | Divers |
| **Total** | **443** | |

### Exécution

```bash
npm run test:unit         # Run once
npm run test:unit:watch   # Watch mode
```
