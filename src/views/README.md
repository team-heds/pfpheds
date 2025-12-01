# 📁 Documentation des Vues - Plateforme HEdS

## 🎯 Vue d'ensemble

Le dossier `/src/views/` contient toutes les **pages principales** de l'application. Chaque vue correspond à une route spécifique et représente une interface utilisateur complète. Cette organisation sépare clairement les pages (views) des composants réutilisables (components).

---

## 📂 Structure Générale

```
views/
├── 📁 admin/              # Administration et gestion
├── 📁 apps/               # Applications intégrées
├── 📁 auth/               # Authentification
├── 📁 home/               # Pages d'accueil
├── 📁 institutions/       # Gestion des institutions
├── 📁 pages/              # Pages statiques
├── 📁 social/             # Réseau social
├── 📁 template/           # Templates de base
├── 📁 users/              # Gestion des utilisateurs
└── 📄 README.md           # Cette documentation
```

---

## 🔐 Authentication (`/views/auth/`)

Module d'authentification complet avec Firebase Auth et Supabase.

```
auth/
├── 📄 AccessView.vue           # Page d'accès générale
├── 📄 AuthErrorView.vue        # Gestion des erreurs d'auth
├── 📄 ForgotPasswordView.vue   # Mot de passe oublié
├── 📄 LockScreenView.vue       # Écran de verrouillage
├── 📄 LoginHome.vue            # Page de connexion unifiée (Supabase)
├── 📄 LoginView.vue            # Page de connexion legacy (Firebase)
├── 📄 NewPasswordView.vue      # Définition nouveau mot de passe
├── 📄 RegisterView.vue         # Page d'inscription
├── 📄 VerificationView.vue     # Vérification email/SMS
└── 📄 README.md                # Documentation auth
```

### Fonctionnalités
- **Multi-provider** : Firebase Auth + Supabase
- **Sécurité** : Validation, vérification email
- **UX** : Écran de verrouillage, gestion d'erreurs
- **Responsive** : Interface adaptative mobile/desktop

---

## 👑 Administration (`/views/admin/`)

Interface d'administration complète pour la gestion de la plateforme.

```
admin/
├── 📄 DashboardView.vue        # Tableau de bord principal
├── 📄 ProfileAdminView.vue     # Profil administrateur
├── 📁 institutions/            # Gestion des institutions
│   ├── InstitutionListView.vue     # Liste des institutions
│   └── InstitutionDetailView.vue   # Détails d'une institution
├── 📁 places/                  # Gestion des places de stage
│   ├── PlaceManagementView.vue     # Gestion des places
│   ├── PlaceAssignmentView.vue     # Attribution des places
│   └── PlaceStatsView.vue          # Statistiques des places
├── 📁 users/                   # Gestion des utilisateurs
│   ├── UserListView.vue            # Liste des utilisateurs
│   ├── StudentListView.vue         # Liste des étudiants
│   ├── TeacherListView.vue         # Liste des enseignants
│   └── TrainerListView.vue         # Liste des praticiens
├── 📁 validation/              # Validation de contenu
│   ├── ContentValidationView.vue   # Validation des contenus
│   └── DocumentValidationView.vue  # Validation des documents
├── 📁 votations/               # Système de votes
│   ├── VotationListView.vue        # Liste des votations
│   ├── VotationCreateView.vue      # Création de votation
│   └── VotationResultsView.vue     # Résultats des votes
└── 📄 README.md                # Documentation admin
```

### Fonctionnalités
- **Dashboard** : Vue d'ensemble avec métriques
- **CRUD** : Gestion complète des entités
- **Validation** : Modération de contenu
- **Statistiques** : Rapports et analytics
- **Permissions** : Contrôle d'accès par rôle

---

## 📱 Applications (`/views/apps/`)

Applications intégrées et outils spécialisés.

```
apps/
├── 📁 blog/                    # Système de blog
│   ├── BlogListView.vue            # Liste des articles
│   ├── BlogDetailView.vue          # Détail d'un article
│   └── BlogCreateView.vue          # Création d'article
├── 📁 calendar/                # Calendrier
│   └── CalendarView.vue            # Interface calendrier
├── 📁 chat/                    # Messagerie
│   ├── ChatView.vue                # Interface de chat
│   ├── ChatListView.vue            # Liste des conversations
│   ├── ChatRoomView.vue            # Salle de chat
│   ├── ChatGroupView.vue           # Chat de groupe
│   ├── ChatPrivateView.vue         # Chat privé
│   ├── ChatSettingsView.vue        # Paramètres chat
│   └── ChatArchiveView.vue         # Archives des messages
├── 📁 events/                  # Gestion d'événements
│   └── EventManagementView.vue     # Gestion des événements
├── 📁 files/                   # Gestionnaire de fichiers
│   └── FileManagerView.vue         # Interface de gestion
├── 📁 mail/                    # Système de mail
│   ├── MailInboxView.vue           # Boîte de réception
│   ├── MailComposeView.vue         # Rédaction d'email
│   ├── MailDetailView.vue          # Détail d'un email
│   ├── MailSentView.vue            # Emails envoyés
│   ├── MailDraftView.vue           # Brouillons
│   └── MailTrashView.vue           # Corbeille
├── 📁 notes/                   # Système de notes
│   └── NotesWorkspaceView.vue      # Espace de travail notes
├── 📁 tasklist/                # Gestion de tâches
│   ├── TaskListView.vue            # Liste des tâches
│   ├── TaskCreateView.vue          # Création de tâche
│   └── TaskDetailView.vue          # Détail d'une tâche
├── 📁 tools/                   # Outils utilitaires
│   ├── ToolsView.vue               # Hub des outils
│   ├── GameView.vue                # Interface de jeu
│   ├── ChatBotView.vue             # ChatBot IA
│   ├── MobileToolsView.vue         # Outils mobile
│   ├── CalculatorView.vue          # Calculatrice
│   └── ConverterView.vue           # Convertisseur
└── 📄 README.md                # Documentation apps
```

### Fonctionnalités
- **Productivité** : Notes, tâches, calendrier, mail
- **Communication** : Chat, messagerie, événements
- **Outils** : Calculatrice, convertisseur, jeux
- **IA** : ChatBot intégré
- **Fichiers** : Gestionnaire de documents

---

## 🏠 Accueil (`/views/home/`)

Pages d'accueil et navigation principale.

```
home/
├── 📄 DashboardView.vue        # Tableau de bord utilisateur
├── 📄 HistoryView.vue          # Historique d'activité
├── 📄 HomeView.vue             # Page d'accueil principale
├── 📄 MapView.vue              # Carte interactive
├── 📄 ProfileView.vue          # Profil utilisateur
└── 📄 ToolsView.vue            # Vue des outils
```

### Fonctionnalités
- **Dashboard** : Vue d'ensemble personnalisée
- **Navigation** : Accès rapide aux fonctionnalités
- **Carte** : Localisation des institutions
- **Profil** : Gestion du compte utilisateur

---

## 🏥 Institutions (`/views/institutions/`)

Gestion et affichage des institutions partenaires.

```
institutions/
├── 📄 InstitutionListView.vue  # Liste des institutions
├── 📄 InstitutionView.vue      # Détail d'une institution
├── 📄 InstitutionMapView.vue   # Carte des institutions
└── 📄 InstitutionSearchView.vue # Recherche d'institutions
```

### Fonctionnalités
- **Catalogue** : Liste complète des institutions
- **Détails** : Informations complètes par institution
- **Cartographie** : Localisation géographique
- **Recherche** : Filtres avancés

---

## 📄 Pages (`/views/pages/`)

Pages statiques et contenu informatif.

```
pages/
└── 📄 LandingView.vue          # Page de destination
```

### Fonctionnalités
- **Landing** : Page d'atterrissage marketing
- **Contenu** : Pages informatives statiques

---

## 💬 Social (`/views/social/`)

Réseau social et fonctionnalités communautaires.

```
social/
├── 📄 CommunitiesView.vue      # Gestion des communautés
├── 📄 CommunityInfoView.vue    # Informations communauté
├── 📄 CommunityView.vue        # Vue d'une communauté
├── 📄 FeedView.vue             # Flux social principal
├── 📄 HashtagView.vue          # Page des hashtags
├── 📄 MentionView.vue          # Page des mentions
└── 📄 README.md                # Documentation social
```

### Fonctionnalités
- **Feed** : Flux d'actualités social
- **Communautés** : Groupes thématiques
- **Interactions** : Mentions, hashtags, commentaires
- **Modération** : Gestion du contenu

---

## 🎨 Templates (`/views/template/`)

Templates de base et layouts réutilisables.

```
template/
└── (Templates de base pour nouvelles vues)
```

---

## 👥 Utilisateurs (`/views/users/`)

Gestion des profils et utilisateurs.

```
users/
├── 📄 UserProfileView.vue      # Profil utilisateur détaillé
└── 📄 UserSettingsView.vue     # Paramètres utilisateur
```

### Fonctionnalités
- **Profil** : Affichage et édition du profil
- **Paramètres** : Configuration personnelle

---

## 🛣️ Routing et Navigation

### Structure des Routes
```javascript
// Exemple de configuration des routes
const routes = [
  // Authentification
  { path: '/login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', component: () => import('@/views/auth/RegisterView.vue') },
  
  // Accueil
  { path: '/', component: () => import('@/views/home/HomeView.vue') },
  { path: '/dashboard', component: () => import('@/views/home/DashboardView.vue') },
  
  // Administration
  { 
    path: '/admin', 
    component: () => import('@/views/admin/DashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  
  // Applications
  { path: '/apps/notes', component: () => import('@/views/apps/notes/NotesWorkspaceView.vue') },
  { path: '/apps/chat', component: () => import('@/views/apps/chat/ChatView.vue') },
  
  // Social
  { path: '/social', component: () => import('@/views/social/FeedView.vue') },
  { path: '/community/:id', component: () => import('@/views/social/CommunityView.vue') }
]
```

### Guards de Navigation
- **requiresAuth** : Authentification requise
- **requiresAdmin** : Droits administrateur
- **requiresRole** : Rôle spécifique requis

---

## 🎨 Conventions de Développement

### Nomenclature
- **Fichiers** : PascalCase + "View.vue" (ex: `DashboardView.vue`)
- **Composants** : Nom descriptif de la page
- **Dossiers** : kebab-case pour les modules

### Structure d'une Vue
```vue
<template>
  <div class="page-container">
    <!-- Contenu de la page -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// Imports des composants et services

// Logique de la vue
</script>

<style scoped>
/* Styles spécifiques à la vue */
</style>
```

### Bonnes Pratiques
- **Lazy Loading** : Import dynamique des vues
- **Meta Tags** : Titre et description pour SEO
- **Error Handling** : Gestion des erreurs
- **Loading States** : États de chargement
- **Responsive** : Adaptation mobile/desktop

---

## 📊 Métriques et Performance

### Optimisations
- **Code Splitting** : Division par routes
- **Lazy Loading** : Chargement à la demande
- **Caching** : Cache des vues fréquentes
- **Bundle Analysis** : Analyse de la taille

### Monitoring
- **Page Views** : Suivi des visites
- **Performance** : Temps de chargement
- **Erreurs** : Tracking des erreurs
- **UX** : Métriques d'expérience utilisateur

---

## 🔄 Évolution et Maintenance

### Ajout d'une Nouvelle Vue
1. Créer le fichier dans le bon dossier
2. Ajouter la route dans `router.js`
3. Configurer les guards si nécessaire
4. Tester la navigation
5. Mettre à jour cette documentation

### Refactoring
- Identifier les vues similaires
- Extraire les composants communs
- Optimiser les imports
- Maintenir la cohérence

---

## 📚 Documentation Complémentaire

- **Components** : `/src/components/README.md`
- **Services** : `/src/service/README.md`
- **Stores** : `/src/stores/README.md`
- **Architecture** : `/ARCHITECTURE-DOCUMENTATION.md`

---

*Documentation mise à jour le 30 janvier 2025*
