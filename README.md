# 📚 Documentation de la Plateforme HEdS

Bienvenue dans la documentation technique et méthodologique de la plateforme HEdS. Ce document sert de guide pour comprendre notre fonctionnement en équipe, notre stack technologique, ainsi que la structure de l'application.

---

## 1. 🚀 Fonctionnement général de l'équipe (Workflow)

L'équipe suit une méthode Agile afin d'assurer un développement itératif, collaboratif et de qualité. Le processus est structuré autour d'outils fiables et d'une communication fluide.

### 🛠️ Outils principaux

- **Jira** : gestion des sprints, backlog, tâches, et suivi des livrables.
- **GitHub** : gestion du code source, revue de code.

### 🔧 Étapes du workflow technique

1. Création de User Stories (avec sous-tâches Frontend / Backend) dans Jira.
2. Le développeur prend une tâche "À faire", l'assigne, et la passe en "En cours".
3. Création d'une branche Git : `feature/JIRA-xxx-nom-tache`
4. Développement avec commits référencés Jira.
5. Création d'une Pull/Merge Request vers `develop`, puis revue de code.
6. Une fois validée, fusion dans `develop`, puis regroupement dans `prod` pour test.
7. Après validation finale, fusion dans `main` pour mise en production.

### ⚙️ Automatisations

Des automatisations synchronisent les statuts Jira en fonction des actions sur GitHub/GitLab (ex : PR ouverte → "Code Review").

---

## 2. 🧱 Stack & structure technique de la plateforme

### 🖥️ Frontend

- **Framework** : Vue.js 3 + Composition API
- **UI Library** : PrimeVue (custom theme)
- **Bundler** : Vite.js
- **PWA** : manifest.json + Service Worker intégré
- **Mobile** : Capacitor & Ionic (intégration mobile native)

### 🔙 Backend

- **API** : Firebase Cloud Functions (Node.js)
- **Auth** : Firebase Auth (email/password)
- **Database** : Firestore Realtime DB
- **Fichiers** : Firebase Storage

### 🚀 Déploiement

- **FileZilla** (FTP)
- **Hébergement** : Infomaniak

---

## 3. 🗂️ Arborescence de l’application

```
.
├── public/                       # Fichiers statiques
├── src/
│   ├── App.vue                   # Composant racine Vue
│   ├── main.js                   # Point d’entrée JS
│   ├── router.js                 # Définition des routes
│   ├── assets/                   # Images, styles, etc.
│   ├── components/               # Composants réutilisables
│   │   ├── Bibliotheque/
│   │   ├── Dashboard/
│   │   ├── Filters/
│   │   ├── Home/
│   │   ├── Institutions/
│   │   ├── Social/
│   │   ├── Template/
│   │   ├── UserProfile/
│   │   ├── Utils/
│   │   └── plugins/
│   ├── layout/                   # Composants de layout (sidebar, topbar, etc.)
│   ├── service/                  # Services JS (API, data, etc.)
│   ├── stores/                   # Gestion d’état (Pinia ou Vuex)
│   ├── ventriglisse3d/           # Module spécifique
│   └── views/                    # Pages principales (routes)
│       ├── apps/
│       ├── dashboards/
│       ├── e-commerce/
│       ├── pages/
│       ├── uikit/
│       ├── user-management/
│       └── utilities/
├── package.json                  # Dépendances
├── vite.config.js                # Config Vite
├── index.html                    # Entrée HTML
├── firebase.js                   # Connexion Firebase
├── .eslintrc.cjs, .prettierrc.json, etc. # Configs outils
└── README.md                     # Document racine du projet
```

---

## 4. 🧩 Structure des données principales (Firestore Realtime DB)

> À compléter selon les collections/documents utilisés (exemple):
>
> - `/users` : profils utilisateurs, rôles, infos personnelles
> - `/documents` : fichiers partagés, métadonnées, droits d’accès
> - `/offers` : offres de stage/emploi
> - `/votes` : résultats et paramètres de votation
> - `/notifications` : messages temps réel

---

## 5. 🛠️ Installation et lancement

```bash
git clone <repo>
cd pfpheds
npm install
npm run dev
```

### Build production

```bash
npm run build
```

## 6. 🔒 Sécurité & bonnes pratiques

- Ne jamais partager les clés Firebase/publics sensibles.
- Toujours passer par des Pull Requests pour valider le code.
- Documentation des composants et services obligatoire.

---