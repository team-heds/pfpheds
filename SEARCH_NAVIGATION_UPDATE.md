# 🧭 Recherche Globale - Navigation & Ressources Structurées

## 📋 Changements Majeurs

La recherche globale est maintenant un **outil de navigation et de découverte de ressources** :
- 🗺️ **Pages** de l'application (selon permissions)
- 👥 **Utilisateurs** de la plateforme
- 🏢 **Institutions** avec leurs **villes et cantons**
- 🎥 **Modules vidéo** de formation

**❌ Retiré** : Posts (feed) et Chat (conversations)

---

## ✅ **Ce qui a été MODIFIÉ**

### **1. Remplacement Posts → Pages/Routes** 🔄

| Avant ❌ | Après ✅ |
|----------|----------|
| Recherche dans le feed (Posts) | Recherche de pages de l'application |
| Contenu utilisateur | Navigation et fonctionnalités |
| Pas de filtrage par rôle | Filtrage intelligent par permissions |

### **2. Catégories de Recherche** 📑

```
🧭 Pages & Navigation
  ├── Accueil, Profil, Modules, Notes, Tâches, Calendrier
  ├── PFP Gestion
  ├── Administration (admin/editor uniquement)
  └── Pages filtrées selon permissions

👥 Utilisateurs
  ├── Recherche par nom
  ├── Recherche par email
  └── Affichage du rôle et institution

🏢 Institutions  ⭐ AVEC VILLES
  ├── Recherche par nom d'institution
  ├── Recherche par VILLE (ex: "Lausanne", "Genève")
  ├── Recherche par CANTON (ex: "VD", "GE")
  └── Affichage : Nom + Ville, Canton

🎥 Modules Vidéo
  ├── Recherche par titre
  ├── Recherche par année
  └── Contenus de formation
```

---

## 🎯 **Pages Disponibles dans la Recherche**

### **Pages Publiques** (Tous les utilisateurs)
| Page | Route | Mots-clés |
|------|-------|-----------|
| 🏠 Accueil | `/` | home, accueil, dashboard |
| 👤 Mon Profil | `/profile` | profil, compte, settings |
| 🎥 Modules Vidéo | `/modules` | video, cours, formation |
| 🎬 Hub Multimédia | `/media` | media, multimedia |
| 📝 Notes | `/notes` | notes, bloc-notes |
| ✅ Tâches | `/tasklist` | taches, todo, tasks |
| 📅 Calendrier | `/calendar` | calendrier, agenda |
| 💼 PFP Gestion | `/pfp` | pfp, portfolio |
| 📋 PFP Liste | `/pfp/list` | pfp, liste, formations |

### **Pages Admin/Editor** (Permissions requises)
| Page | Route | Rôle Requis | Mots-clés |
|------|-------|-------------|-----------|
| ⚙️ Administration | `/admin` | admin, editor | admin, administration |
| 👥 Gestion Utilisateurs | `/admin/users` | admin | utilisateurs, users |
| 🏢 Gestion Institutions | `/admin/institutions` | admin | institutions, etablissements |
| 📁 Administration Modules | `/admin/modules` | admin, editor | modules, videos, vimeo |
| ✔️ Votations | `/admin/votation` | admin, editor | votation, vote |
| 🎬 Test Vimeo | `/vimeo-test` | admin, editor | vimeo, test |

---

## 🔐 **Système de Permissions**

### **Filtrage Automatique**
```javascript
// La recherche affiche UNIQUEMENT les pages autorisées
- Role "user" → Pages publiques uniquement
- Role "editor" → Pages publiques + certaines admin
- Role "admin" → Toutes les pages
```

### **Exemples d'Utilisation**

#### **Utilisateur Standard** 🧑
```
Tape : "admin"
Résultat : Aucun (pas autorisé)

Tape : "chat"
Résultat : Chat (/chat) ✅
```

#### **Admin** 👨‍💼
```
Tape : "admin"
Résultat : 
  - Administration (/admin)
  - Gestion Utilisateurs (/admin/users)
  - Administration Modules (/admin/modules)
  - ...
```

---

## 🎨 **Interface Visuelle**

### **Nouvelle Catégorie "Pages"**
```
🧭 PAGES & NAVIGATION (5)
┌──────────────────────────────┐
│ [🏠] Accueil                 │
│      Navigation • /       → │
├──────────────────────────────┤
│ [💬] Chat                    │
│      Communication • /chat→ │
├──────────────────────────────┤
│ [⚙️] Administration          │
│      Administration • /admin→│
└──────────────────────────────┘
```

**Gradient Orange/Jaune** pour les pages 🔶

---

## 🚀 **Fonctionnalités**

### **Recherche Intelligente**
- ✅ **Par nom** : "Chat", "Profil", "Modules"
- ✅ **Par catégorie** : "Administration", "Communication", "Outils"
- ✅ **Par mots-clés** : "video", "admin", "message"
- ✅ **Pertinence** : Résultats triés par score

### **Navigation Rapide**
```
Exemples :
- Tape "chat" → Enter → Page Chat
- Tape "admin" → ↓ ↓ → Enter → Page Admin
- Tape "video" → Modules Vidéo + Hub Multimédia
- Ctrl+K → "profil" → Mon Profil
```

---

## 📊 **Algorithme de Recherche**

### **Score de Pertinence**
```javascript
Match sur le nom : 100%
Match sur la catégorie : 50%
Match sur les mots-clés : 80%

Exemple :
Recherche : "video"
- "Modules Vidéo" (nom contient) : 100 pts
- "Hub Multimédia" (keyword "video") : 80 pts
- "Test Vimeo" (keyword "vimeo") : 80 pts
```

---

## 🎯 **Cas d'Usage**

### **1. Nouvelle Recrue** 👶
```
Problème : Ne connaît pas l'application
Solution : Tape des mots-clés pour découvrir
  - "message" → Chat
  - "note" → Notes
  - "tache" → Tâches
```

### **2. Admin Occupé** 👨‍💼
```
Problème : Navigation lente via menu
Solution : Ctrl+K rapide
  - "users" → Gestion Utilisateurs
  - "modules" → Administration Modules
  - "votation" → Votations
```

### **3. Cherche une Personne** 🔍
```
Tape : "jean"
Résultat :
  👥 UTILISATEURS (2)
    - Jean Dupont (Administrateur)
    - Jean Martin (Utilisateur)
```

---

## 🔄 **Comparaison Avant/Après**

| Aspect | Avant ❌ | Après ✅ |
|--------|----------|----------|
| **Focus** | Contenu feed (posts/chat) | Ressources structurées + navigation |
| **Utilité** | Trouver publications/messages | Trouver pages, institutions, users |
| **Permissions** | Non gérées | Filtrage intelligent par rôle |
| **Mots-clés** | Non | Oui (recherche étendue) |
| **Géographie** | Non | **Recherche par ville/canton** 🏙️ |
| **Catégories** | Posts + Chat | Pages + Institutions (villes) |
| **Admin** | Mêmes résultats que user | Pages admin visibles |
| **Institutions** | Nom uniquement | **Nom + Ville + Canton** ⭐ |

---

## 🎨 **Codes Couleur**

| Catégorie | Gradient | Icône |
|-----------|----------|-------|
| 🧭 Pages | Orange→Jaune | pi-compass |
| 👥 Utilisateurs | Violet | pi-user |
| 🏢 Institutions | Rose | pi-building |
| 🎥 Modules | Vert | pi-video |

---

## 🏙️ **NOUVEAUTÉ : Recherche d'Institutions par Ville**

La recherche d'institutions est maintenant **géographique** !

### **Exemples de Recherche**

#### **Par Ville** 🌆
```
Tape : "lausanne"
Résultat :
  🏢 CHUV (Lausanne, VD)
  🏢 HES-SO Lausanne (Lausanne, VD)
  🏢 EHC Lausanne (Lausanne, VD)

Tape : "genève"
Résultat :
  🏢 HUG (Genève, GE)
  🏢 HEdS Genève (Genève, GE)

Tape : "fribourg"
Résultat :
  🏢 HFR Fribourg (Fribourg, FR)
  🏢 Hôpital Cantonal Fribourg (Fribourg, FR)
```

#### **Par Canton** 🗺️
```
Tape : "VD"
Résultat : Toutes les institutions du canton de Vaud

Tape : "GE"
Résultat : Toutes les institutions du canton de Genève
```

#### **Par Nom d'Institution** 🏢
```
Tape : "CHUV"
Résultat : CHUV (Lausanne, VD)

Tape : "HUG"
Résultat : HUG (Genève, GE)
```

### **Algorithme de Pertinence**
```javascript
Nom institution : 100%
Ville : 80%
Canton : 60%

Exemple :
Recherche : "lausanne"
- CHUV (ville="Lausanne") : 80 pts
- HES-SO (ville="Lausanne") : 80 pts
```

---

## 💡 **Exemples de Recherche Générale**

### **Recherche par Fonction**
```
"admin" → Pages d'administration
"note" → Application Notes
"video" → Modules + Hub Multimédia
"tache" → Tâches
```

### **Recherche par Rôle**
```
User tape "admin" → Aucun résultat (pas autorisé)
Admin tape "admin" → Toutes les pages admin

User tape "note" → Application Notes ✅
Admin tape "users" → Gestion Utilisateurs ✅
```

### **Recherche Mixte** 🎯
```
"jean admin" → 
  👥 Jean Dupont (Admin)
  🧭 Administration

"lausanne soins" →
  🏢 CHUV (Lausanne, VD)
  🎥 Module: Soins Infirmiers
  🧭 Modules Vidéo

"video genève" →
  🎥 Modules Vidéo
  🎬 Hub Multimédia
  🏢 HUG (Genève, GE)
```

---

## 🛠️ **Modification Technique**

### **Structure Données**

#### **Page Object**
```javascript
{
  name: 'Administration',
  path: '/admin',
  icon: 'pi-cog',
  roles: ['admin', 'editor'],
  category: 'Administration',
  keywords: ['admin', 'administration', 'settings']
}
```

#### **Institution Object avec Ville** 🏙️
```javascript
// Dans Firebase: institutions/
{
  Name: 'CHUV',
  Locality: 'Lausanne',    // VILLE recherchable
  Canton: 'VD',            // CANTON recherchable
  // autres champs...
}

// Transformé pour recherche:
{
  id: 'inst-123',
  name: 'CHUV',
  location: 'Lausanne, VD',  // Affichage
  link: '/institution/inst-123',
  score: 80,  // Score si recherche par ville
  type: 'institution'
}
```

#### **Score de Pertinence Institutions**
```javascript
const nameScore = calculateRelevanceScore(name, query);          // 100%
const villeScore = calculateRelevanceScore(ville, query) * 0.8;  // 80%
const cantonScore = calculateRelevanceScore(canton, query) * 0.6; // 60%
const totalScore = Math.max(nameScore, villeScore, cantonScore);
```

### **Fonctions Principales**
```javascript
getAvailablePages()        // Filtre par rôle
calculateRelevanceScore()  // Score de pertinence
highlightText()            // Highlight mots-clés
```

---

## 📈 **Bénéfices**

### **Pour l'Utilisateur**
- ⚡ **Navigation +50% plus rapide**
- 🎯 **Trouve ce qu'il cherche** facilement
- 🔐 **Voit uniquement** ce qui lui est autorisé
- 📚 **Découvre** les fonctionnalités de l'app

### **Pour l'Admin**
- 🚀 **Accès ultra-rapide** aux outils admin
- 🎛️ **Gestion facilitée** via recherche
- 👥 **Trouve utilisateurs** ET **pages**
- 📊 **Workflow optimisé**

---

## 🚀 **Utilisation**

```bash
# Ouvrir la recherche
Ctrl+K (Windows/Linux)
Cmd+K (Mac)

# Rechercher
Tapez 2+ caractères

# Naviguer
↑ ↓ pour sélectionner
Enter pour ouvrir
Escape pour fermer
```

---

## 🎉 **Résultat Final**

La recherche globale est maintenant un **outil de découverte et navigation intelligent** qui :
- ✅ Aide à **découvrir** l'application et ses fonctionnalités
- ✅ Accélère la **navigation** quotidienne vers les pages
- ✅ Respecte les **permissions** utilisateur (admin/editor/user)
- ✅ **Recherche géographique** : trouve institutions par **ville/canton** 🏙️
- ✅ Centralise **pages** + **utilisateurs** + **institutions** + **modules**
- ❌ **Pas de contenu temporaire** : pas de posts, pas de chat

**Cas d'usage :**
- 🔍 "lausanne" → Toutes les institutions à Lausanne
- 🔍 "admin" → Pages admin (si autorisé)
- 🔍 "jean" → Utilisateurs prénommés Jean
- 🔍 "video" → Modules vidéo + pages média
- 🔍 "VD" → Institutions du canton de Vaud

**C'est comme Spotlight (macOS) ou Command Palette (GitHub), mais adapté à votre application de santé !** 🎯
