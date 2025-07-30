# 💬 SOCIAL & COMMUNICATION - DOCUMENTATION

## 🎯 **STRUCTURE CONSOLIDÉE**

Toutes les pages sociales et de communication sont maintenant centralisées dans `views/social/` pour une meilleure organisation et maintenabilité.

---

## 📂 **STRUCTURE ACTUELLE**

### 💬 **views/social/** - Pages sociales et communication
```
├── FeedView.vue             # 📱 Feed principal (ex: NewsFeed.vue)
├── HashtagView.vue          # #️⃣ Page hashtag (ex: HashtagPage.vue)
├── MentionView.vue          # 👥 Page mentions (ex: MentionGroupPage.vue)
├── CommunitiesView.vue      # 🏘️ Gestion communautés (ex: CommunityManagement.vue)
├── CommunityView.vue        # 🏘️ Une communauté (ex: ManageOneCommunity.vue)
└── CommunityInfoView.vue    # ℹ️ Info communauté (ex: CommunityInfo.vue)
```

### 🧩 **components/Social/** - Composants réutilisables (conservés)
```
├── PostItem.vue             # 📝 Élément de post
├── CommentItem.vue          # 💬 Élément de commentaire
├── CreatePostDialog.vue     # ➕ Dialogue création post
├── CreateNewCommunity.vue   # 🆕 Création communauté
├── CommunitiesList.vue      # 📋 Liste communautés
├── PublicCommunitiesList.vue # 🌐 Liste communautés publiques
├── FilterComponent.vue      # 🔍 Composant de filtre
├── AdvancedSearchFilter.vue # 🔎 Filtre de recherche avancée
├── InfiniteScroll.vue       # ♾️ Défilement infini
└── UserProfile.vue          # 👤 Profil utilisateur social
```

---

## 🔗 **ROUTES SOCIALES**

| Route | Composant | Description | Permissions |
|-------|-----------|-------------|-------------|
| `/feed` | FeedView | Feed principal | Authentifié |
| `/hashtag/:hashtag` | HashtagView | Page hashtag spécifique | Authentifié |
| `/mention/:group` | MentionView | Page mentions de groupe | Authentifié + Rôle |
| `/communities` | CommunitiesView | Gestion des communautés | Authentifié |
| `/communities/:id` | CommunityView | Page d'une communauté | Authentifié |
| `/communities/info/:id` | CommunityInfoView | Informations communauté | Public |

---

## 🔧 **FONCTIONNALITÉS PRINCIPALES**

### 📱 **FeedView** - Feed principal
- Affichage des posts en temps réel
- Système de likes et commentaires
- Filtrage par hashtags et mentions
- Défilement infini

### #️⃣ **HashtagView** - Pages hashtags
- Posts filtrés par hashtag
- Tendances et statistiques
- Navigation entre hashtags

### 👥 **MentionView** - Pages mentions
- Posts mentionnant un groupe
- Gestion des notifications
- Contrôle d'accès par rôle

### 🏘️ **CommunitiesView** - Gestion communautés
- Liste des communautés
- Création de nouvelles communautés
- Gestion des permissions

### 🏘️ **CommunityView** - Page communauté
- Feed spécifique à la communauté
- Gestion des membres
- Modération des contenus

### ℹ️ **CommunityInfoView** - Informations
- Détails de la communauté
- Statistiques et métriques
- Paramètres publics

---

## 🎨 **TECHNOLOGIES UTILISÉES**

### 🔥 **Firebase Realtime Database**
- Stockage des posts et commentaires
- Synchronisation en temps réel
- Gestion des utilisateurs

### 🎨 **Interface**
- **PrimeVue** : Composants UI modernes
- **Vue 3 Composition API** : Réactivité optimisée
- **Responsive Design** : Adaptation mobile

### ⚡ **Fonctionnalités avancées**
- **Infinite Scroll** : Chargement progressif
- **Real-time Updates** : Mises à jour instantanées
- **Advanced Filtering** : Filtres sophistiqués

---

## ✅ **AVANTAGES DE CETTE STRUCTURE**

### 🎯 **Organisation claire**
- Pages sociales dans un seul dossier
- Composants réutilisables séparés
- Logique métier centralisée

### 🔄 **Réutilisabilité**
- Composants modulaires (PostItem, CommentItem)
- Dialogues réutilisables
- Filtres configurables

### 📈 **Scalabilité**
- Structure extensible pour nouvelles fonctionnalités
- Support multi-communautés
- Système de permissions flexible

### 🔒 **Sécurité**
- Contrôle d'accès par rôle
- Validation des permissions
- Modération intégrée

---

## 🚀 **FLUX UTILISATEUR SOCIAL**

### 📱 **Parcours standard** :
1. **`/feed`** → Consultation du feed principal
2. **`/hashtag/:hashtag`** → Exploration par hashtag
3. **`/communities`** → Découverte des communautés
4. **`/communities/:id`** → Participation à une communauté
5. **`/mention/:group`** → Suivi des mentions

### 👑 **Parcours modérateur** :
1. **`/communities`** → Gestion des communautés
2. **`/communities/:id`** → Modération d'une communauté
3. **`/communities/info/:id`** → Configuration des paramètres

---

## 📝 **RÈGLES DE DÉVELOPPEMENT**

### ✅ **À FAIRE**
- Utiliser des noms cohérents avec suffixe `View`
- Centraliser les nouvelles pages sociales dans `views/social/`
- Garder les composants réutilisables dans `components/Social/`
- Documenter les nouvelles routes et permissions

### ❌ **À ÉVITER**
- Mélanger pages et composants réutilisables
- Créer des dépendances circulaires
- Oublier la gestion des permissions
- Négliger la performance (infinite scroll)

---

## 🔄 **MIGRATION RÉALISÉE**

### 📁 **Avant** :
- Toutes les pages dans `components/Social/`
- Mélange pages/composants
- **Difficile à maintenir**

### 📁 **Après** :
- Pages dans `views/social/` (6 fichiers)
- Composants dans `components/Social/` (12 fichiers)
- **Structure claire et scalable**

---

*📅 Dernière mise à jour : 29/07/2025*
*💬 Structure sociale consolidée et optimisée*
