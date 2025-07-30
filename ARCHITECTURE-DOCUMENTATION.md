# 🏗️ Architecture Documentation - Plateforme HEdS

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Structure des Dossiers](#structure-des-dossiers)
4. [Composants Principaux](#composants-principaux)
5. [Services et API](#services-et-api)
6. [Gestion d'État](#gestion-détat)
7. [Routing et Navigation](#routing-et-navigation)
8. [Authentification et Sécurité](#authentification-et-sécurité)
9. [Base de Données](#base-de-données)
10. [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

La **Plateforme HEdS** est une application web moderne développée pour la Haute École de Santé (HEdS) du Valais. Elle sert de plateforme éducative et collaborative pour les étudiants, enseignants et praticiens formateurs dans le domaine de la physiothérapie.

### Objectifs Principaux
- 📚 Gestion des formations pratiques (PFP)
- 🏥 Cartographie des institutions partenaires
- 👥 Réseau social éducatif
- 📝 Système de notes et documentation
- 🎮 Gamification de l'apprentissage
- 📊 Administration et suivi

---

## 🏛️ Architecture Technique

### Stack Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite.js
- **UI Library**: PrimeVue + Custom Theme
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **PWA**: Workbox + Service Worker
- **Mobile**: Capacitor + Ionic

### Stack Backend
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting
- **Functions**: Firebase Cloud Functions

### Technologies Complémentaires
- **Maps**: Leaflet.js
- **Rich Text Editor**: TipTap
- **Charts**: Chart.js
- **Calendar**: FullCalendar
- **AI/Voice**: ElevenLabs
- **CSS Framework**: Custom + PrimeVue Theme

---

## 📁 Structure des Dossiers

```
pfpheds/
├── 📁 public/                    # Assets statiques
│   ├── assets/images/           # Images publiques
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker
├── 📁 src/
│   ├── 📁 assets/              # Assets sources
│   │   ├── images/            # Images, logos, icônes
│   │   ├── styles/            # Styles globaux
│   │   └── theme/             # Thème PrimeVue
│   ├── 📁 components/         # Composants Vue
│   │   ├── admin/             # Interface d'administration
│   │   ├── common/            # Composants réutilisables
│   │   ├── editor/            # Éditeurs (TipTap, notes)
│   │   ├── events/            # Gestion d'événements
│   │   ├── games/             # Gamification
│   │   ├── home/              # Page d'accueil
│   │   ├── institutions/      # Gestion des institutions
│   │   ├── social/            # Réseau social
│   │   ├── ui/                # Composants UI génériques
│   │   └── user/              # Gestion utilisateurs
│   ├── 📁 hooks/              # Composables Vue
│   ├── 📁 layout/             # Layouts de l'application
│   ├── 📁 service/            # Services API
│   ├── 📁 stores/             # Stores Pinia
│   ├── 📁 views/              # Pages/Vues principales
│   │   ├── admin/             # Vues administration
│   │   ├── apps/              # Applications intégrées
│   │   ├── auth/              # Authentification
│   │   ├── home/              # Accueil
│   │   ├── institutions/      # Institutions
│   │   ├── social/            # Social
│   │   └── users/             # Utilisateurs
│   ├── App.vue                # Composant racine
│   ├── main.js                # Point d'entrée
│   └── router.js              # Configuration routing
├── 📁 backend/                # Backend Node.js (optionnel)
├── 📁 nginx/                  # Configuration Nginx
├── firebase.js                # Configuration Firebase
├── vite.config.js            # Configuration Vite
└── package.json              # Dependencies
```

---

## 🧩 Composants Principaux

### 1. Administration (`/src/components/admin/`)
```
admin/
├── forms/                    # Formulaires d'administration
│   ├── AddEtudiant.vue      # Ajout d'étudiants
│   ├── AddInstitution.vue   # Ajout d'institutions
│   └── AddPraticien.vue     # Ajout de praticiens
├── lists/                   # Listes d'administration
│   ├── AdminSidebar.vue     # Navigation admin
│   ├── ListEtudiant.vue     # Liste des étudiants
│   └── ListInstitution.vue  # Liste des institutions
└── modals/                  # Modales d'administration
    ├── EditModal.vue        # Édition générique
    └── DeleteModal.vue      # Confirmation suppression
```

### 2. Social (`/src/components/social/`)
```
social/
├── library/                 # Bibliothèque sociale
│   ├── LeftSidebar.vue     # Navigation sociale
│   ├── PostItem.vue        # Élément de post
│   ├── StoryCarousel.vue   # Carrousel d'histoires
│   └── UserProfile.vue     # Profil utilisateur
├── posts/                  # Gestion des posts
│   ├── CreatePost.vue      # Création de post
│   ├── PostEditor.vue      # Éditeur de post
│   └── PostList.vue        # Liste des posts
└── messaging/              # Messagerie
    ├── ChatWindow.vue      # Fenêtre de chat
    └── MessageList.vue     # Liste des messages
```

### 3. Éditeur (`/src/components/editor/`)
```
editor/
├── notes/                  # Système de notes
│   ├── TiptapSimpleEditor.vue    # Éditeur TipTap
│   ├── NotebookSidebar.vue       # Sidebar des classeurs
│   ├── PageList.vue              # Liste des pages
│   └── NotesWorkspaceView.vue    # Espace de travail
├── rich-text/              # Éditeur riche
│   ├── MenuBar.vue         # Barre d'outils
│   ├── Extensions/         # Extensions TipTap
│   └── Toolbar.vue         # Toolbar personnalisée
└── markdown/               # Support Markdown
    └── MarkdownEditor.vue  # Éditeur Markdown
```

### 4. Commun (`/src/components/common/`)
```
common/
├── filters/                # Composants de filtrage
│   ├── FiltreMap.vue      # Carte avec filtres
│   ├── FilterSidebar.vue  # Sidebar de filtres
│   └── filter.json        # Configuration filtres
├── utils/                 # Utilitaires
│   ├── Navbar.vue         # Navigation principale
│   ├── HeaderIcons.vue    # Icônes d'en-tête
│   └── LoadingSpinner.vue # Spinner de chargement
└── forms/                 # Formulaires génériques
    ├── FormField.vue      # Champ de formulaire
    └── FormValidator.vue  # Validation
```

---

## 🔧 Services et API

### Structure des Services (`/src/service/`)
```javascript
service/
├── authService.js          # Authentification Firebase
├── databaseService.js      # Base de données
├── storageService.js       # Stockage de fichiers
├── notesService.js         # Gestion des notes
├── institutionService.js   # Gestion des institutions
├── userService.js          # Gestion des utilisateurs
├── postService.js          # Gestion des posts
├── gameService.js          # Gamification
└── notificationService.js  # Notifications
```

### Exemple de Service
```javascript
// notesService.js
import { db } from '../firebase'
import { ref, push, set, get, remove } from 'firebase/database'

export const notesService = {
  // Créer un nouveau classeur
  async createNotebook(userId, notebookData) {
    const notebooksRef = ref(db, `notes/${userId}/notebooks`)
    const newNotebookRef = push(notebooksRef)
    await set(newNotebookRef, {
      ...notebookData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    return newNotebookRef.key
  },

  // Récupérer les classeurs
  async getNotebooks(userId) {
    const notebooksRef = ref(db, `notes/${userId}/notebooks`)
    const snapshot = await get(notebooksRef)
    return snapshot.val() || {}
  },

  // Créer une nouvelle page
  async createPage(userId, notebookId, pageData) {
    const pagesRef = ref(db, `notes/${userId}/notebooks/${notebookId}/pages`)
    const newPageRef = push(pagesRef)
    await set(newPageRef, {
      ...pageData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    return newPageRef.key
  }
}
```

---

## 🗃️ Gestion d'État (Pinia)

### Structure des Stores (`/src/stores/`)
```javascript
stores/
├── auth.js                 # État d'authentification
├── user.js                 # Données utilisateur
└── app.js                  # État global de l'app
```

### Store d'Authentification
```javascript
// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const login = async (email, password) => {
    loading.value = true
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      user.value = result.user
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login
  }
})
```

---

## 🛣️ Routing et Navigation

### Configuration Router (`router.js`)
```javascript
const routes = [
  // Routes publiques
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  
  // Routes protégées
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  
  // Routes admin
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'users', component: UserListView },
      { path: 'institutions', component: InstitutionListView }
    ]
  },
  
  // Applications intégrées
  {
    path: '/apps',
    children: [
      { path: 'notes', component: NotesWorkspaceView },
      { path: 'social', component: SocialView },
      { path: 'games', component: GamesView }
    ]
  }
]
```

### Guards de Navigation
```javascript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/unauthorized')
  } else {
    next()
  }
})
```

---

## 🔐 Authentification et Sécurité

### Firebase Auth Configuration
```javascript
// firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
```

### Rôles et Permissions
```javascript
// Rôles utilisateur
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PRACTITIONER: 'practitioner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

// Permissions par rôle
const PERMISSIONS = {
  [USER_ROLES.STUDENT]: ['read_posts', 'create_posts', 'read_notes'],
  [USER_ROLES.TEACHER]: ['read_posts', 'create_posts', 'moderate_posts'],
  [USER_ROLES.ADMIN]: ['*'] // Toutes les permissions
}
```

---

## 🗄️ Base de Données (Firebase Realtime Database)

### Structure de la Base de Données
```json
{
  "users": {
    "userId": {
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "student",
      "profile": {
        "avatar": "url",
        "bio": "Description",
        "institution": "institutionId"
      },
      "preferences": {
        "theme": "light",
        "notifications": true
      }
    }
  },
  "institutions": {
    "institutionId": {
      "name": "Hôpital du Valais",
      "address": "Avenue de la Gare 10",
      "city": "Sion",
      "canton": "VS",
      "coordinates": {
        "latitude": 46.2276,
        "longitude": 7.3467
      },
      "contact": {
        "phone": "+41 27 603 40 00",
        "email": "info@hopitalvs.ch",
        "website": "https://hopitalvs.ch"
      }
    }
  },
  "posts": {
    "postId": {
      "authorId": "userId",
      "content": "Contenu du post",
      "createdAt": 1640995200000,
      "likes": {
        "userId": true
      },
      "comments": {
        "commentId": {
          "authorId": "userId",
          "content": "Commentaire",
          "createdAt": 1640995200000
        }
      }
    }
  },
  "notes": {
    "userId": {
      "notebooks": {
        "notebookId": {
          "title": "Mon Classeur",
          "pages": {
            "pageId": {
              "title": "Ma Page",
              "content": "Contenu JSON TipTap",
              "createdAt": 1640995200000,
              "updatedAt": 1640995200000
            }
          }
        }
      }
    }
  },
  "games": {
    "userId": {
      "scores": {
        "gameType": {
          "score": 1500,
          "level": 5,
          "achievements": ["first_win", "streak_10"]
        }
      }
    }
  }
}
```

---

## 🚀 Déploiement

### Environnements
- **Development**: Local (Vite dev server)
- **Staging**: Firebase Hosting (branch develop)
- **Production**: Firebase Hosting (branch main)

### Configuration Vite
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

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
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['primevue'],
          editor: ['@tiptap/vue-3', '@tiptap/starter-kit']
        }
      }
    }
  }
})
```

### Scripts de Déploiement
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy:staging": "npm run build && firebase deploy --only hosting:staging",
    "deploy:prod": "npm run build && firebase deploy --only hosting:production"
  }
}
```

---

## 📊 Métriques et Monitoring

### Performance
- **Lighthouse Score**: 90+ (Performance, Accessibility, SEO)
- **Bundle Size**: < 2MB (avec code splitting)
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 3s

### Monitoring
- **Firebase Analytics**: Suivi d'utilisation
- **Firebase Crashlytics**: Rapport d'erreurs
- **Firebase Performance**: Métriques de performance

---

## 🔧 Outils de Développement

### Qualité de Code
- **ESLint**: Linting JavaScript/Vue
- **Prettier**: Formatage de code
- **Husky**: Git hooks
- **Commitizen**: Commits conventionnels

### Testing (À implémenter)
- **Vitest**: Tests unitaires
- **Vue Test Utils**: Tests de composants
- **Cypress**: Tests E2E

---

## 📚 Documentation Technique

### Conventions de Code
- **Naming**: camelCase pour JS, kebab-case pour Vue
- **Components**: PascalCase
- **Files**: kebab-case
- **Constants**: UPPER_SNAKE_CASE

### Git Workflow
```
main (production)
├── develop (staging)
│   ├── feature/HEDS-123-add-notes-feature
│   ├── bugfix/HEDS-124-fix-login-issue
│   └── hotfix/HEDS-125-critical-fix
```

---

## 🎯 Roadmap Technique

### Phase 1 (Actuelle)
- ✅ Architecture de base
- ✅ Authentification Firebase
- ✅ Interface d'administration
- ✅ Système de notes
- ✅ Réseau social

### Phase 2 (En cours)
- 🔄 Optimisation des performances
- 🔄 Tests automatisés
- 🔄 PWA avancée
- 🔄 Notifications push

### Phase 3 (Planifiée)
- 📋 Application mobile native
- 📋 IA/ML pour recommandations
- 📋 API GraphQL
- 📋 Microservices

---

*Documentation mise à jour le 30 janvier 2025*
