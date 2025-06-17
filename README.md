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

- **VPS** :  Infomaniak - Node.js / Python
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

# Architecture des Données & Usage Applicatif

## Vue d’ensemble

L’application repose sur une base de données structurée en JSON autour de collections principales représentant les acteurs (utilisateurs, enseignants, étudiants), les contenus (posts, fichiers, stories), les interactions (votes, conversations, événements) et les entités organisationnelles (institutions, communautés, places).


---


## Schéma des Collections Principales

| Collection            | Description                                                                                 |
|-----------------------|---------------------------------------------------------------------------------------------|
| **Users**             | Profils utilisateurs (étudiants, enseignants, praticiens, etc.)                             |
| **Students**          | Données spécifiques aux étudiants                                                           |
| **Enseignants**       | Profils enseignants, gestion des encadrants                                                 |
| **PraticienFormateurs** | Profils hybrides praticiens/enseignants                                                   |
| **Communities**       | Groupes d’intérêt, communautés thématiques                                                  |
| **Institutions**      | Établissements partenaires, lieux d’affectation                                             |
| **Places**            | Lieux physiques (salles, cabinets, etc.)                                                    |
| **Posts**             | Publications des utilisateurs                                                               |
| **Stories**           | Contenus temporaires à la manière des réseaux sociaux                                       |
| **FilePFPPhysio**     | Fichiers pédagogiques et ressources                                                         |
| **HashTags**          | Système de tags pour catégoriser et filtrer les contenus                                    |
| **Votation**          | Processus de vote, sessions de sondage                                                      |
| **VotationLese**      | Votes consultés ou réservés à certains rôles                                                |
| **VotationsResult**   | Résultats des votes                                                                         |
| **ResultatVotationAlgo** | Résultats calculés par des algorithmes de vote                                           |
| **ValidationEnAttente** | Éléments en attente de validation (inscriptions, signatures, etc.)                        |
| **SignatureAssigments** | Assignations de signatures électroniques                                                  |
| **Answer**            | Réponses à des sondages, quiz, ou évaluations                                               |
| **Conversations**     | Messages privés ou discussions de groupe                                                    |
| **Events**            | Événements (cours, réunions, webinaires, etc.)                                              |


---
## 5. 🚦 Workflow Git & Stratégie de branches

### Branches principales

- `develop` : branche de travail principale (intégration continue, toutes les features sont mergées ici)
- `main` : branche stable, pré-production (merge validé depuis `develop`)
- `prod` : branche de production (release officielle, merge validé depuis `main`)

### Branches secondaires

- `newBranch` : nouvelles fonctionnalités, partent de `develop`
- `newBranchFix` : corrections de bugs
- `newBranchHotFix` : corrections urgentes en production (partent de `prod`)

### Exemple de cycle

```
newBranch   ──┐
              ├─> develop ──┬─> main ─┬─> prod
newBranch   ──┘             │         │
   (PR + review)         (PR + review)│
                                      │
                                  (PR + review)
```

### Protection des branches sur GitHub

1. Va dans **Settings > Branches** de ton repo GitHub
2. Ajoute une règle de protection pour chaque branche :
   - `develop`
   - `main`
   - `prod`
3. Configure les protections suivantes :
   - Require a pull request before merging
   - Require approvals (1 ou 2 reviewers)
   - Require status checks to pass before merging (lint/tests si existants)
   - Require branches to be up to date before merging
   - Include administrators

👉 [Guide officiel GitHub](https://docs.github.com/fr/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/configuring-protected-branches)

---


---

## 6. 🛠️ Installation et lancement

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

## 7. 🔒 Sécurité & bonnes pratiques

- Ne jamais partager les clés Firebase/publics sensibles.
- Toujours passer par des Pull Requests pour valider le code.
- Documentation des composants et services obligatoire.

---
