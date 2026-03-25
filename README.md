# 🏥 Plateforme HEdS - Formation Pratique Physiothérapie

> **Plateforme éducative et collaborative pour la Haute École de Santé (HEdS) du Valais**  
> Version 0.1.60 | Vue.js 3 + Firebase + Supabase + PrimeVue

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![PrimeVue](https://img.shields.io/badge/PrimeVue-Latest-007ACC?style=flat-square)](https://primefaces.org/primevue/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

---

## 🎯 Vue d'ensemble

La **Plateforme HEdS** est une application web moderne dédiée à la formation pratique en physiothérapie. Elle combine gestion institutionnelle, réseau social éducatif, outils de productivité et gamification pour créer un écosystème d'apprentissage complet.

### 🎓 Objectifs Principaux

- **📚 Formation Pratique (PFP)** : Gestion des stages et formations pratiques
- **🏥 Cartographie Institutionnelle** : Localisation des lieux de stage partenaires
- **👥 Réseau Social Éducatif** : Communication et collaboration entre étudiants/formateurs
- **📝 Outils de Productivité** : Notes, tâches, calendrier, messagerie
- **🎮 Gamification** : Jeux éducatifs et système de progression
- **📊 Administration** : Gestion complète des utilisateurs et institutions

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Git**
- Compte **Firebase** (pour le backend)

### Installation

```bash
# Cloner le repository
git clone https://github.com/your-org/pfpheds.git
cd pfpheds

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Firebase

# Lancer en mode développement
npm run dev
```

### Scripts Disponibles

```bash
npm run dev              # Serveur de développement (port 5172)
npm run build            # Build de production
npm run preview          # Prévisualisation du build
npm run lint             # Linting du code
npm run format           # Formatage du code
npm run clean            # Nettoyage et réinstallation
npm run test:unit        # Tests unitaires (Vitest)
npm run test:unit:watch  # Tests unitaires en mode watch
npm run test:coverage    # Tests avec rapport de couverture
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Tests E2E avec interface graphique
```

---

## 🏗️ Architecture Technique

### Stack Frontend

- **🖼️ Framework** : Vue.js 3 (Composition API)
- **⚡ Build Tool** : Vite.js
- **🎨 UI Library** : PrimeVue + Thème personnalisé
- **🗃️ State Management** : Pinia
- **🛣️ Routing** : Vue Router 4
- **📱 PWA** : Workbox + Service Worker
- **📲 Mobile** : Capacitor + Ionic

### Stack Backend

- **🔐 Authentication** : Firebase Auth + Supabase Auth (PKCE flow)
- **🗄️ Database** : Firebase Realtime Database + Supabase (PostgreSQL)
- **📁 Storage** : Firebase Storage
- **☁️ Hosting** : Firebase Hosting
- **⚡ Functions** : Firebase Cloud Functions + Supabase RPC

> Migration progressive de Firebase vers Supabase en cours.

### Technologies Complémentaires

- **🗺️ Cartographie** : Leaflet.js
- **✏️ Éditeur Riche** : TipTap
- **📊 Graphiques** : Chart.js
- **📅 Calendrier** : FullCalendar
- **🤖 IA/Voice** : ElevenLabs
- **🎨 Styles** : CSS Custom + PrimeVue
- **🚀 Deployment** : Docker + VPS
- **⚙️ CI/CD** : GitHub Actions

---

## 📂 Structure du Projet

```
pfpheds/
├── 📁 public/                    # Assets statiques
│   ├── assets/images/           # Images publiques
│   └── manifest.json           # PWA manifest
├── 📁 src/
│   ├── 📁 assets/              # Assets sources (images, styles, thèmes)
│   ├── 📁 components/          # Composants Vue (~335 fichiers)
│   │   ├── admin/              # Interface d'administration
│   │   ├── social/             # Réseau social (feed, posts)
│   │   ├── gamification/       # Maisons HES, quêtes, badges
│   │   ├── common/             # Composants réutilisables
│   │   ├── tournois/           # Système de tournois
│   │   ├── video/              # Lecteur vidéo Vimeo
│   │   └── ...
│   ├── 📁 views/               # Pages principales (~228 fichiers)
│   │   ├── auth/               # LoginHome, LoginView, Register
│   │   ├── admin/              # Dashboard, modules, planning
│   │   ├── apps/               # Chat, notes, calendrier, mail
│   │   ├── social/             # Feed, communautés, hashtags
│   │   ├── planning/           # Calendriers académiques
│   │   └── ...
│   ├── 📁 composables/         # Composables Vue réutilisables
│   │   ├── useRateLimit.js     # Protection brute-force
│   │   ├── useInputValidation.js # Validation des entrées
│   │   ├── useDebounce.js      # Debounce pour recherches
│   │   ├── useSanitize.js      # Sanitization HTML (DOMPurify)
│   │   ├── useAutoRefresh.js   # Auto-refresh des données
│   │   └── ...
│   ├── 📁 config/              # Configuration centralisée
│   │   └── adminRedirects.js   # Redirections post-login
│   ├── 📁 service/             # Services API (Firebase)
│   ├── 📁 services/            # Services API (Supabase)
│   ├── 📁 stores/              # Stores Pinia (~27 stores)
│   ├── 📁 layout/              # Layout principal (sidebar, topbar)
│   ├── 📁 router/              # Guards de navigation
│   ├── App.vue                 # Composant racine
│   ├── main.js                 # Point d'entrée
│   ├── router.js               # Configuration routing (~290 routes)
│   ├── firebase.js             # Configuration Firebase
│   └── supabase.js             # Configuration Supabase
├── 📁 tests/
│   ├── 📁 unit/                # Tests unitaires Vitest (25 fichiers, 591 tests)
│   ├── 📁 e2e/                 # Tests E2E Playwright
│   └── setup.js                # Configuration des tests
├── vite.config.js              # Configuration Vite + Vitest
├── playwright.config.js        # Configuration Playwright
└── package.json                # Dépendances
```

---

## 🧩 Fonctionnalités Principales

### 🔐 Authentification Multi-Provider

- **Auth** : Email/password
- **Supabase** : Alternative backend / *En développement*
- **Gestion des rôles** : Étudiant, Enseignant, Praticien, Admin
- **Sécurité** : Guards de navigation, permissions

### 👑 Interface d'Administration

- **📊 Dashboard** : Métriques et vue d'ensemble
- **👥 Gestion Utilisateurs** : Étudiants, enseignants, praticiens formateurs
- **🏥 Gestion Institutions** : Lieux de stage partenaires
- **📍 Gestion Places** : Attribution et statistiques
- **✅ Validation** : Validation des PFP
- **🗳️ Votation** : Système de votes

### 💬 Réseau Social Éducatif

- **📱 Feed** : Flux d'actualités personnalisé
- **🏘️ Communautés** : Groupes thématiques
- **💬 Messagerie** : Chat privé et de groupe
- **📸 Médias** : Partage d'images, vidéos, documents
- **#️⃣ Hashtags** : Organisation du contenu
- **👥 Mentions** : Interactions sociales

### 📱 Applications Intégrées

- **📝 Notes** : Éditeur TipTap avec classeurs
- **✅ Tâches** : Gestion de tâches et projets
- **📅 Calendrier** : Planning et événements
- **📧 Mail** : Système de messagerie interne
- **💬 Chat** : Messagerie instantanée
- **📁 Fichiers** : Gestionnaire de documents
- **📝 Blog** : Système de publication

### 🗺️ Cartographie Interactive

- **🏥 Institutions** : Localisation des lieux de stage
- **🔍 Filtres** : Recherche par canton, critères, langues
- **📍 Détails** : Informations complètes par institution
- **🗺️ Navigation** : Intégration Leaflet.js

### 🎮 Gamification

- **🎯 Jeux Éducatifs** : Games (Three.js)
- **🏆 Système de Points** : Progression et récompenses
- **🥇 Classements** : Compétition amicale
- **🎖️ Achievements** : Badges et accomplissements

---

## 🔧 Configuration et Développement

### Variables d'Environnement

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase (optionnel)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Structure Firebase

```json
{
  "users": {
    "userId": {
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "student",
      "profile": { "avatar": "url", "bio": "..." }
    }
  },
  "institutions": {
    "institutionId": {
      "name": "Hôpital du Valais",
      "address": "...",
      "coordinates": { "latitude": 46.22, "longitude": 7.36 }
    }
  },
  "posts": {
    "postId": {
      "authorId": "userId",
      "content": "...",
      "likes": { "userId": true },
      "comments": { "commentId": { "..." } }
    }
  },
  "notes": {
    "userId": {
      "notebooks": {
        "notebookId": {
          "title": "Mon Classeur",
          "pages": { "pageId": { "title": "...", "content": "..." } }
        }
      }
    }
  }
}
```

---

## 🛣️ Routing et Navigation

### Routes Principales

```javascript
// Authentification
/login                    # Connexion
/register                 # Inscription
/forgot-password          # Mot de passe oublié

// Accueil
/                         # Page d'accueil
/dashboard               # Tableau de bord
/map                     # Carte interactive

// Administration (requiresAdmin)
/admin                   # Dashboard admin
/admin/users             # Gestion utilisateurs
/admin/institutions      # Gestion institutions

// Applications (requiresAuth)
/apps/notes              # Système de notes
/apps/chat               # Messagerie
/apps/calendar           # Calendrier
/apps/tasks              # Gestion de tâches

// Social (requiresAuth)
/social                  # Feed principal
/community/:id           # Vue communauté
/profile/:id             # Profil utilisateur
```

### Guards de Navigation

- **requiresAuth** : Authentification requise
- **requiresAdmin** : Droits administrateur
- **requiresRole** : Rôle spécifique requis

---

## 🎨 Conventions de Code

### Nomenclature

- **Composants** : PascalCase (`UserProfile.vue`)
- **Fichiers** : kebab-case (`user-profile.vue`)
- **Variables** : camelCase (`userName`)
- **Constants** : UPPER_SNAKE_CASE (`API_BASE_URL`)

### Structure d'un Composant

```vue
<template>
  <div class="component-container">
    <!-- Template HTML -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// Imports et logique

// Props
const props = defineProps({
  // Props definition
})

// Reactive data
const data = ref(null)

// Computed properties
const computedValue = computed(() => {
  // Logic
})

// Lifecycle
onMounted(() => {
  // Initialization
})
</script>

<style scoped>
/* Styles scopés */
.component-container {
  /* Styles */
}
</style>
```

---

## 🚀 Déploiement

### Environnements

- **Development** : Local (Vite dev server)
- **Staging** : Server Hosting (branch develop)
- **Test** : Server Hosting (branch main)
- **Production** : VPS (branch prod)


### Build et Déploiement

```bash
# Build de production
npm run build

# Déploiement staging
npm run deploy:staging

# Déploiement production
npm run deploy:prod
```

### Déploiement Docker (Production)

Le projet inclut une stack Docker production prête à l'emploi :

- [docker-compose.prod.yml](docker-compose.prod.yml)
- [Dockerfile.frontend.prod](Dockerfile.frontend.prod)
- [deploy/nginx.frontend.prod.conf](deploy/nginx.frontend.prod.conf)

Commandes:

```bash
# depuis la racine du projet
docker compose -f docker-compose.prod.yml up -d --build

# voir les logs
docker compose -f docker-compose.prod.yml logs -f

# arrêter
docker compose -f docker-compose.prod.yml down
```

Prérequis backend:
- fichier `backend/.env` configuré (notamment `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` si utilisé)
- migrations SQL CareConvers appliquées côté Supabase:
  - [sql/create_careconvers_sessions.sql](sql/create_careconvers_sessions.sql)
  - [sql/create_careconvers_interactions.sql](sql/create_careconvers_interactions.sql)

### Configuration Vite

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['primevue'],
          editor: ['@tiptap/vue-3']
        }
      }
    }
  }
})
```

---

## 📊 Performance et Monitoring

### Objectifs de Performance

- **Lighthouse Score** : 90+ (Performance, Accessibility, SEO)
- **Bundle Size** : < 2MB (avec code splitting)
- **First Contentful Paint** : < 2s
- **Time to Interactive** : < 3s

### Monitoring Firebase

- **Analytics** : Suivi d'utilisation
- **Crashlytics** : Rapport d'erreurs
- **Performance** : Métriques de performance

### Optimisations

- **Code Splitting** : Division par routes
- **Lazy Loading** : Chargement à la demande
- **Tree Shaking** : Élimination du code mort
- **Asset Optimization** : Compression des médias

---

## 🧪 Tests et Qualité

### Outils de Qualité

- **ESLint** : Linting JavaScript/Vue
- **Prettier** : Formatage de code
- **Husky** : Git hooks
- **Commitizen** : Commits conventionnels

### Tests

| Type | Outil | Fichiers | Tests | Commande |
|------|-------|----------|-------|----------|
| **Unitaires** | Vitest + jsdom | 25 | 591 | `npm run test:unit` |
| **Couverture** | @vitest/coverage-v8 | — | — | `npm run test:coverage` |
| **E2E** | Playwright | 3 | ~30 | `npm run test:e2e` |

#### Stores testés
- `authStore`, `votesStore`, `trackStore`, `postsStore`, `documentStore`

#### Composables testés
- `useRateLimit`, `useInputValidation`, `useDebounce`, `useAutoRefresh`

#### Sécurité testée
- Sanitization XSS (DOMPurify), rate limiting, validation inputs, guards de navigation

---

## 🔄 Workflow de Développement

### Git Flow

```
main (production)
├── develop (staging)
│   ├── feature/HEDS-123-add-notes-feature
│   ├── bugfix/HEDS-124-fix-login-issue
│   └── hotfix/HEDS-125-critical-fix
```

### Processus de Développement

1. **Jira** : Création de User Stories
2. **Branche** : `HEDS-XXX-description`
3. **Développement** : Commits référencés
4. **Pull Request** : Vers `develop`
5. **Code Review** : Validation par l'équipe
6. **Merge** : Fusion dans `develop`
7. **Test** : Validation en staging dans `main`
8. **Production** : Fusion dans `prod`

---

## 📚 Documentation

### Documentation Technique

- **[Architecture](./ARCHITECTURE-DOCUMENTATION.md)** : Architecture complète
- **[Views](./src/views/README.md)** : Structure des vues
- **[Components](./src/components/README.md)** : Composants réutilisables
- **[Services](./src/service/README.md)** : Services API

### Guides Utilisateur

- **Guide Étudiant** : Utilisation de la plateforme
- **Guide Enseignant** : Gestion des formations
- **Guide Administrateur** : Administration système

---

## 🎯 Roadmap

### Phase 1 (Actuelle) ✅

- ✅ Architecture de base Vue.js 3 + Firebase
- ✅ Authentification multi-provider
- ✅ Interface d'administration complète
- ✅ Réseau social éducatif
- ✅ Système de notes TipTap
- ✅ Cartographie des institutions
- ✅ Applications intégrées (chat, mail, tâches)

### Phase 2 (En cours) 🔄

- 🔄 Optimisation des performances
- 🔄 Tests automatisés complets
- 🔄 PWA avancée (offline, notifications)
- 🔄 Gamification étendue
- 🔄 Analytics et reporting

### Phase 3 (Planifiée) 📋

- 📋 Application mobile native (Capacitor)
- 📋 IA/ML pour recommandations
- 📋 API GraphQL
- 📋 Microservices architecture
- 📋 Intégrations tierces (LMS, ERP)

---

## 🤝 Contribution

### Comment Contribuer

1. **Fork** le repository
2. **Créer** une branche feature
3. **Développer** avec les conventions
4. **Tester** les modifications
5. **Soumettre** une Pull Request

### Standards de Code

- Suivre les conventions ESLint/Prettier
- Documenter les nouvelles fonctionnalités
- Ajouter des tests pour le nouveau code
- Respecter l'architecture existante

---

## 📞 Support et Contact

### Équipe de Développement

- **Lead Developer** : Antoine Quarroz et Loïc Berthod
- **Architecture** : Antoine Quarroz et Loïc Berthod
- **UI/UX** : Antoine Quarroz 

### Support Technique

- **Issues** : [GitHub Issues](https://github.com/your-org/pfpheds/issues)
- **Documentation** : Ce README + docs/

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **HEdS Valais-Wallis** : Pour le soutien institutionnel
- **Équipe de développement** : Pour leur engagement
- **Communauté Open Source** : Vue.js, Firebase, PrimeVue
- **Étudiants et formateurs** : Pour leurs retours précieux

---

*Dernière mise à jour : 11 février 2026*  
*Version : 0.1.60*
