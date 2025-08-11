# 🎮 DOCUMENTATION SYSTÈME DE GAMIFICATION HES

## 🧠 CONCEPT PÉDAGOGIQUE GLOBAL

### Vision institutionnelle

L'idée est de transformer le quotidien académique des étudiants en une aventure collective et motivante, en s'appuyant sur :

- 🎯 **La gamification** (points, défis, récompenses, progression)
- 🏘️ **L'esprit d'équipe** (maisons inter-promotionnelles)
- 🧑‍🤝‍🧑 **Le mentorat** (système de parrainage, parrain/marraine-filleul.e)
- 🔄 **L'alternance intégrative** (cours, stages, soft skills, événements)
- 🤝 **Le renforcement des liens** entre étudiants, collaborateurs des différentes filières (physiothérapie, soins infirmiers), et milieu pratique

### 🎯 Pourquoi intégrer la gamification ?

- ✅ **Engagement renforcé** : les activités deviennent plus motivantes et dynamiques
- 🎓 **Apprentissage actif** : les étudiants sont acteurs de leur progression
- 🤼 **Coopétition saine** : l'esprit de maison encourage chacun à donner le meilleur
- 🤝 **Cohésion inter-volées** : les liens entre promotions se créent naturellement
- 🧑‍⚕️ **Cohésion inter-filières** : entre physiothérapie et soins infirmiers
- 🏅 **Reconnaissance des efforts** : chaque action compte et est valorisée

### 🏠 Le système des Maisons - Vision pédagogique

#### Pourquoi créer des Maisons ?
- Renforcer le sentiment d'appartenance
- Créer des équipes inter-volée coopératives
- Encourager une compétition bienveillante
- Valoriser toutes les formes d'implication
- Favoriser le partage de compétences
- Offrir une structure ludique et motivante pour vivre le cursus comme une aventure

#### 👥 Qui intégrera les Maisons ?
- **Tous les étudiants** sont répartis équitablement entre les maisons dès la 1re année
- **Chaque maison** regroupe des étudiants de 1re, 2e et 3e année
- **La répartition** reste stable pendant l'année, remise à zéro chaque nouvelle année
- **Les parrains/marraines** et filleul(e)s intègrent la même maison

---

## 📋 TABLE DES MATIÈRES

1. [Concept pédagogique global](#concept-pédagogique-global)
2. [Vue d'ensemble technique](#vue-densemble-technique)
3. [Architecture du système](#architecture-du-système)
4. [Configuration Firebase](#configuration-firebase)
5. [Composants principaux](#composants-principaux)
6. [Service de gamification](#service-de-gamification)
7. [Intégration dans l'application](#intégration-dans-lapplication)
8. [Système de niveaux et XP](#système-de-niveaux-et-xp)
9. [Système de streak](#système-de-streak)
10. [Fonctionnalités avancées](#fonctionnalités-avancées)
11. [Guide d'implémentation](#guide-dimplémentation)
12. [Maintenance et évolutions](#maintenance-et-évolutions)

---

## 🎯 VUE D'ENSEMBLE TECHNIQUE

Le système de gamification HES est conçu pour motiver l'engagement des utilisateurs à travers :

- **4 Maisons HES** : Harmonis, Elaris, Doloris, Solencia
- **20 Niveaux de progression** avec noms inspirés du domaine médical
- **Système d'XP** avec reset annuel
- **Streaks de connexion** style Snapchat
- **Interface visuelle** immersive avec animations

### 🎨 Maisons HES - Approche thématique

Les 4 maisons reflètent les valeurs fondamentales du soin et de la thérapie :

| Maison | Thématique | Valeurs | Devise | Couleur |
|--------|------------|---------|--------|---------|
| **Harmonis** | Équilibre corps-esprit, cohérence thérapeutique | Stabilité, alignement, sérénité | "L'équilibre soigne" | Vert (#2E8B57) |
| **Elaris** | Clarté du soin, guidance thérapeutique | Lumière, intention, guidance intérieure | "Clarifier, guider, apaiser" | Rouge (#DC143C) |
| **Doloris** | Compréhension et gestion de la douleur | Précision, soulagement, compassion | "Comprendre la douleur, c'est déjà soigner" | Jaune (#FFD700) |
| **Solencia** | Apaisement émotionnel, réconfort thérapeutique | Douceur, calme, soutien affectif | "Apaiser pour mieux guérir" | Bleu (#4169E1) |

#### 🎯 Attribution des maisons
- **Quiz de personnalité** : 16 questions pour déterminer la maison la plus adaptée
- **Répartition équilibrée** : Algorithme pour maintenir l'équilibre entre les maisons
- **Stabilité annuelle** : Attribution maintenue pendant toute l'année académique
- **Reset annuel** : Nouvelle attribution possible chaque rentrée

---

## 🏗️ ARCHITECTURE DU SYSTÈME

```
src/
├── service/
│   └── hesHousesService.js          # Service principal de gamification
├── components/
│   ├── gamification/
│   │   ├── BandeauMaison.vue       # Affichage maison + niveau + streak
│   │   └── XPBar.vue               # Barre de progression XP
│   └── user/
│       ├── profile/
│       │   └── HESHouseQuiz.vue    # Quiz d'attribution des maisons
│       └── library/
│           └── CardNameProfile.vue  # Intégration dans le profil
└── views/
    └── users/
        └── HESHouseQuizView.vue    # Page du quiz
```

---

## 🔥 CONFIGURATION FIREBASE

### Structure de la base de données

```javascript
Users/
  {userId}/
    gamification/
      maison: "harmonis|elaris|doloris|solencia"
      niveau: 1-20
      xp: 0-∞                    # XP dans le niveau actuel
      totalXP: 0-∞               # XP total accumulé
      xpToNext: 0-∞              # XP restant pour niveau suivant
      dateSelection: "ISO_DATE"
      lastXPGain: {
        amount: 10,
        action: "LOGIN",
        description: "Connexion quotidienne",
        timestamp: "ISO_DATE"
      }
      achievements: {}
      stats: {
        quizCompleted: 1,
        totalActions: 0,
        loginStreak: 0,          # Jours consécutifs de connexion
        lastLogin: "ISO_DATE",
        totalLogins: 0
      }
      xpHistory/                 # Historique de tous les gains d'XP
        {pushId}: {
          amount: 10,
          action: "LOGIN",
          description: "Connexion quotidienne",
          timestamp: "ISO_DATE",
          totalXPAfter: 10
        }

globalStats/
  houses/
    harmonis: { count: 25, percentage: 25 }
    elaris: { count: 30, percentage: 30 }
    doloris: { count: 20, percentage: 20 }
    solencia: { count: 25, percentage: 25 }
    lastUpdated: "ISO_DATE"
```

### Règles de sécurité Firebase

```javascript
{
  "rules": {
    "Users": {
      "$userId": {
        "gamification": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "globalStats": {
      ".read": "auth != null",
      ".write": false  # Mise à jour uniquement par les fonctions
    }
  }
}
```

---

## 🧩 COMPOSANTS PRINCIPAUX

### 1. BandeauMaison.vue

**Responsabilité** : Affichage de la maison, niveau et streak

**Props** :
```javascript
{
  maison: String,      # Nom de la maison
  niveau: Number,      # Niveau actuel (1-20)
  loginStreak: Number  # Jours de streak
}
```

**Fonctionnalités** :
- Affichage du nom et devise de la maison
- Image de fond spécifique à chaque maison
- Animation de particules
- Streak avec flamme animée (🔥)
- Boutons d'action (profil, statistiques)

### 2. XPBar.vue

**Responsabilité** : Affichage de la progression XP

**Props** :
```javascript
{
  xp: Number,        # XP dans le niveau actuel
  xpToNext: Number,  # XP restant pour niveau suivant
  niveau: Number,    # Niveau actuel
  maison: String     # Nom de la maison
}
```

**Fonctionnalités** :
- Barre de progression animée
- Badge de niveau avec icône
- Affichage des gains d'XP récents
- Couleurs adaptées à la maison

### 3. HESHouseQuiz.vue

**Responsabilité** : Quiz d'attribution des maisons

**Fonctionnalités** :
- 16 questions avec 4 réponses chacune
- Calcul automatique de la maison dominante
- Sauvegarde dans Firebase
- Attribution de 10 XP
- Redirection vers le profil

---

## ⚙️ SERVICE DE GAMIFICATION

### Fichier : `src/service/hesHousesService.js`

#### Fonctions principales

```javascript
# Configuration
export const LEVEL_CONFIG = { /* 20 niveaux */ }
export const XP_ACTIONS = { /* Actions et XP */ }
export const HES_HOUSES = { /* Configuration des maisons */ }

# Gestion des maisons
export function getHouseInfo(houseName)
export function getAllHouses()
export async function saveUserHouse(userId, houseName)
export async function getUserHouse(userId)

# Gestion de l'XP et des niveaux
export function calculateLevel(totalXP)
export async function addUserXP(userId, action, customXP = null)
export async function getUserGamificationData(userId)

# Initialisation
export async function initializeUserGamification(userId, houseName)

# Streaks
export async function updateLoginStreak(userId)

# Statistiques
export async function getHouseStatistics()
export async function updateGlobalHouseStats()
```

#### Actions XP disponibles

```javascript
# Actions de base
LOGIN: 5 XP                    # Connexion quotidienne
QUIZ_COMPLETE: 10 XP          # Quiz de maison terminé
PROFILE_UPDATE: 15 XP         # Mise à jour profil
COMMENT: 8 XP                 # Commentaire ajouté
POST: 25 XP                   # Publication créée
LIKE: 1 XP                    # Like donné
SHARE: 12 XP                  # Partage effectué

# Bonus et achievements
ACHIEVEMENT: 200 XP           # Achievement débloqué
DAILY_STREAK_3: 50 XP         # 3 jours consécutifs
DAILY_STREAK_7: 150 XP        # 7 jours consécutifs
DAILY_STREAK_30: 500 XP       # 30 jours consécutifs

# Actions académiques
COURSE_COMPLETION: 300 XP     # Cours terminé
COMMUNITY_EVENT: 200 XP       # Participation événement
```

---

## 📊 SYSTÈME DE NIVEAUX ET XP

### Progression des niveaux (Reset annuel)

| Niveau | Nom | XP Requis | XP pour Suivant |
|--------|-----|-----------|-----------------|
| 1 | Étudiant·e | 0 | 50 |
| 2 | Stagiaire | 50 | 75 |
| 3 | Assistant·e | 125 | 100 |
| 4 | Praticien·ne Junior | 225 | 150 |
| 5 | Soignant·e | 375 | 200 |
| 6 | Thérapeute | 575 | 275 |
| 7 | Clinicien·ne | 850 | 350 |
| 8 | Spécialiste | 1,200 | 450 |
| 9 | Expert·e Clinique | 1,650 | 600 |
| 10 | Référent·e | 2,250 | 750 |
| 11 | Mentor·e | 3,000 | 950 |
| 12 | Superviseur·se | 3,950 | 1,200 |
| 13 | Coordinateur·trice | 5,150 | 1,500 |
| 14 | Chef·fe de Service | 6,650 | 1,900 |
| 15 | Directeur·trice Adjoint·e | 8,550 | 2,400 |
| 16 | Directeur·trice | 10,950 | 3,000 |
| 17 | Expert·e Reconnu·e | 13,950 | 3,800 |
| 18 | Maître·sse de la Discipline | 17,750 | 4,750 |
| 19 | Sage de la Maison | 22,500 | 6,000 |
| 20 | Légende Vivante | 28,500 | - |

### Estimations de progression (365 jours)

- **Utilisateur casual** (20 XP/jour) : Niveau 14 (Chef·fe de Service)
- **Utilisateur actif** (50 XP/jour) : Niveau 18 (Maître·sse de la Discipline)
- **Utilisateur très actif** (80 XP/jour) : Niveau 20 (Légende Vivante)

---

## 🔥 SYSTÈME DE STREAK

### Fonctionnement

1. **Calcul automatique** lors de la connexion
2. **Logique** :
   - Première connexion : streak = 1
   - Connexion hier : streak += 1
   - Connexion plus ancienne : streak = 1 (reset)
   - Même jour : pas de changement

3. **Bonus XP automatiques** :
   - 3 jours : +50 XP
   - 7 jours : +150 XP
   - 30 jours : +500 XP

### Affichage visuel

- **Flamme orange** (1-2 jours) : animation normale
- **Flamme rouge** (3+ jours) : animation intense
- **Texte adaptatif** : "1 jour" vs "X jours de connexion"

---

## 🚀 GUIDE D'IMPLÉMENTATION

### Étape 1 : Installation des fichiers

1. **Copier les fichiers** dans l'arborescence appropriée
2. **Importer les assets** des maisons (images de fond)
3. **Configurer Firebase** avec la structure de données

### Étape 2 : Configuration des routes

```javascript
// Dans router.js
{
  path: '/hes-house-quiz',
  name: 'HESHouseQuiz',
  component: HESHouseQuizView,
  meta: { requiresAuth: true }
},
{
  path: '/houses/:houseName/stats',
  component: HouseStatsPage,
  name: 'HouseStatsPage',
  props: true,
  meta: { requiresAuth: true }
},
{
  path: '/houses/ranking',
  component: HousesRankingPage,
  name: 'HousesRankingPage',
  meta: { requiresAuth: true }
}
```

### Étape 3 : Intégration dans les profils

```vue
<!-- Dans CardNameProfile.vue -->
<BandeauMaison
  v-if="hasValidHouse"
  :maison="userGamification.maison"
  :niveau="userGamification.niveau"
  :loginStreak="userGamification.loginStreak"
/>

<XPBar
  v-if="hasValidHouse"
  :xp="userGamification.xp"
  :xpToNext="userGamification.xpToNext"
  :niveau="userGamification.niveau"
  :maison="userGamification.maison"
/>
```

### Étape 4 : Gestion des événements XP

```javascript
// Exemples d'intégration
import { addUserXP, updateLoginStreak } from '@/service/hesHousesService'

// Lors de la connexion
await updateLoginStreak(userId)

// Lors d'actions utilisateur
await addUserXP(userId, 'POST')
await addUserXP(userId, 'COMMENT')
await addUserXP(userId, 'PROFILE_UPDATE')
```

### Étape 5 : Validation et tests

1. **Tester le quiz** : Attribution correcte des maisons
2. **Vérifier l'XP** : Calculs et affichage corrects
3. **Tester les streaks** : Logique de connexion
4. **Valider Firebase** : Structure et sécurité

---

## 🔧 MAINTENANCE ET ÉVOLUTIONS

### Ajout de nouvelles actions XP

```javascript
// Dans hesHousesService.js
export const XP_ACTIONS = {
  // Actions existantes...
  NEW_ACTION: { xp: 25, description: 'Nouvelle action' }
}
```

### Modification des niveaux

```javascript
// Ajuster LEVEL_CONFIG selon les besoins
// Attention : impact sur les utilisateurs existants
```

### Ajout d'achievements

```javascript
// Structure suggérée pour les achievements
achievements: {
  first_post: {
    unlocked: true,
    date: "ISO_DATE",
    xp_awarded: 50
  }
}
```

### Monitoring et analytics

- **Suivi des progressions** utilisateurs
- **Statistiques d'engagement** par maison
- **Analyse des patterns** de connexion
- **Optimisation** des seuils XP

### Reset annuel

```javascript
// Fonction à implémenter pour le reset annuel
export async function resetAnnualProgress() {
  // Sauvegarder les statistiques de l'année
  // Remettre à zéro les XP et niveaux
  // Conserver les maisons et achievements
}
```

---

## 📚 RESSOURCES ADDITIONNELLES

### Dépendances

- **Firebase** : Realtime Database, Authentication
- **Vue 3** : Composition API
- **PrimeVue** : Composants UI et icônes

### Assets requis

```
src/assets/maisons/
├── FondHarmonis.png
├── FondElaris.png
├── FondDoloris.png
└── FondSolencia.png
```

### Variables CSS personnalisables

```css
:root {
  --harmonis-color: #2E8B57;
  --elaris-color: #DC143C;
  --doloris-color: #FFD700;
  --solencia-color: #4169E1;
}
```

---

## 🎯 BONNES PRATIQUES

1. **Validation des données** avant sauvegarde Firebase
2. **Gestion d'erreurs** robuste dans toutes les fonctions
3. **Optimisation** des requêtes Firebase (cache local)
4. **Tests unitaires** pour les calculs critiques
5. **Documentation** des modifications futures
6. **Sauvegarde** des configurations importantes

---

## 📞 SUPPORT

Pour toute question ou problème :

1. **Vérifier la console** pour les erreurs JavaScript
2. **Contrôler Firebase** : structure et règles de sécurité
3. **Valider les props** passées aux composants
4. **Tester les fonctions** individuellement dans le service

---

## 🏆 CATÉGORIES DE POINTS ET ACTIONS

### 🎯 Comment gagner des points pour ta Maison ?

Le système d'XP est organisé en catégories qui reflètent les différents aspects de la formation :

| Catégorie | Exemples d'actions | XP Attribués |
|-----------|-------------------|--------------|
| **Formation pratique** | Validation d'objectif, retour positif, validation de stage | 25-300 XP |
| **Mentorat** | Suivi du/de la filleul·e, participation duo, activité inter-volée | 50-100 XP |
| **Défis & événements** | Participation maison, organisation, victoire d'équipe | 150-500 XP |
| **Initiatives** | Animation des communautés, implication extra-scolaire, activité sur la plateforme | 15-200 XP |
| **Engagement quotidien** | Connexion, interactions, partages | 1-25 XP |

### 📊 Actions XP détaillées (implémentées)

```javascript
// Actions de base
LOGIN: 5 XP                    // Connexion quotidienne
QUIZ_COMPLETE: 10 XP          // Quiz de maison terminé
PROFILE_UPDATE: 15 XP         // Mise à jour profil
COMMENT: 8 XP                 // Commentaire ajouté
POST: 25 XP                   // Publication créée
LIKE: 1 XP                    // Like donné
SHARE: 12 XP                  // Partage effectué

// Bonus et achievements
ACHIEVEMENT: 200 XP           // Achievement débloqué
DAILY_STREAK_3: 50 XP         // 3 jours consécutifs
DAILY_STREAK_7: 150 XP        // 7 jours consécutifs
DAILY_STREAK_30: 500 XP       // 30 jours consécutifs

// Actions académiques
COURSE_COMPLETION: 300 XP     // Cours terminé
COMMUNITY_EVENT: 200 XP       // Participation événement
```

---

## 🚀 FONCTIONNALITÉS AVANCÉES

### 🃏 Cartes de quêtes hebdomadaires (À implémenter)

**Concept** : Mini-défis tirés au sort chaque semaine pour dynamiser l'engagement

**Exemples de quêtes** :
- "Aide un camarade sur une difficulté" → +50 XP
- "Propose un résumé de cours" → +75 XP
- "Participe à un événement inter-maison" → +100 XP
- "Crée du contenu éducatif" → +150 XP

**Structure technique suggérée** :
```javascript
weeklyQuests: {
  week_2024_01: {
    quest1: {
      id: "help_classmate",
      title: "Aide un camarade",
      description: "Apporte ton aide à un étudiant en difficulté",
      xp: 50,
      category: "MENTORING",
      active: true,
      completedBy: ["userId1", "userId2"]
    }
  }
}
```

### 🎖️ Système de badges personnels (À implémenter)

**Concept** : Badges numériques à collectionner pour chaque compétence ou mission réussie

**Catégories de badges** :
- **Académiques** : "Premier de stage", "Mentor exemplaire", "Théoricien"
- **Sociaux** : "Ambassadeur", "Connecteur", "Animateur"
- **Spéciaux** : "Pionnier", "Innovateur", "Leader"

**Structure technique suggérée** :
```javascript
badges: {
  academic: {
    first_internship: {
      name: "Premier pas",
      description: "Validation du premier stage",
      icon: "pi-graduation-cap",
      xp_bonus: 100,
      rarity: "common"
    }
  }
}
```

### 🎉 Événements inter-maisons (À implémenter)

**Concept** : Soirées et événements annuels avec épreuves ludiques ou culturelles

**Types d'événements** :
- **Tournoi de connaissances** : Quiz inter-maisons
- **Défis créatifs** : Création de contenu, vidéos, présentations
- **Événements caritatifs** : Actions solidaires avec bonus XP
- **Compétitions sportives** : Tournois inter-promotions

### 📁 Boîte à outils partagée (À implémenter)

**Concept** : Ressources partagées par les maisons, plus on partage = plus on gagne

**Fonctionnalités** :
- **Bibliothèque de ressources** : Fiches pratiques, liens utiles
- **Système de contribution** : XP pour chaque ressource ajoutée
- **Système de notation** : Les meilleures ressources donnent plus d'XP
- **Accès inter-maisons** : Partage entre toutes les maisons

### 🗳️ Vote étudiant pour points bonus (À implémenter)

**Concept** : Les étudiants élisent un camarade ou un duo utile → bonus de points

**Mécanisme "Angel's Order"** :
- **Vote mensuel** : Chaque étudiant peut voter pour un camarade exemplaire
- **Catégories** : "Aide la plus précieuse", "Mentor de l'année", "Innovateur"
- **Récompenses** : Bonus XP significatifs (200-500 XP)
- **Reconnaissance** : Badge spécial et mise en avant

---

## 🗓️ ROADMAP ET ÉVOLUTIONS

### 📅 Phase 1 : Système de base (✅ TERMINÉ)
- [x] Quiz d'attribution des maisons (16 questions)
- [x] Système de niveaux (20 niveaux avec noms thématiques)
- [x] Système d'XP avec actions de base
- [x] Streaks de connexion avec flamme animée
- [x] Interface visuelle (BandeauMaison, XPBar)
- [x] Intégration Firebase et sécurité
- [x] Documentation technique complète

### 📅 Phase 2 : Fonctionnalités académiques (🔄 EN COURS)
- [ ] **Actions XP académiques** : Validation de stage, retours positifs
- [ ] **Système de mentorat** : Parrain/marraine-filleul·e avec bonus XP
- [ ] **Intégration inter-filières** : Physiothérapie et soins infirmiers
- [ ] **Tableau de bord enseignant** : Suivi des progressions étudiants

### 📅 Phase 3 : Gamification avancée (🔮 FUTUR)
- [ ] **Cartes de quêtes hebdomadaires** : Défis dynamiques
- [ ] **Système de badges** : Collections et achievements
- [ ] **Événements inter-maisons** : Compétitions et collaborations
- [ ] **Boîte à outils partagée** : Ressources communautaires
- [ ] **Vote "Angel's Order"** : Reconnaissance par les pairs

### 📅 Phase 4 : Écosystème complet (🔮 VISION LONG TERME)
- [ ] **Application mobile** : Notifications et engagement mobile
- [ ] **Intégration LMS** : Connexion avec les systèmes d'apprentissage
- [ ] **Analytics avancées** : Tableaux de bord et insights
- [ ] **Système de récompenses physiques** : Goodies, événements
- [ ] **Partenariats externes** : Milieu professionnel et stages

---

## 🎓 IMPACT PÉDAGOGIQUE ATTENDU

### 📈 Objectifs mesurables

- **Engagement étudiant** : +40% de participation aux activités
- **Cohésion inter-promotions** : Réduction de 50% des conflits
- **Réussite académique** : +15% de validation des stages
- **Satisfaction étudiante** : Score de 4.5/5 minimum
- **Rétention étudiante** : Réduction de 20% des abandons

### 🎯 Indicateurs de succès

1. **Participation active** : 80% des étudiants connectés hebdomadairement
2. **Mentorat efficace** : 90% des paires mentor/mentee actives
3. **Collaboration inter-filières** : 50% des étudiants impliqués
4. **Événements inter-maisons** : 4 événements majeurs par an
5. **Ressources partagées** : 100+ ressources dans la boîte à outils

---

## 🏠 **SYSTÈME DE NIVEAUX DES MAISONS**

### **Concept de Progression Collective**

En plus de la progression individuelle, chaque maison possède son propre système de niveaux basé sur l'XP cumulé de tous ses membres. Cette approche favorise l'esprit d'équipe et la collaboration inter-étudiants.

### **Calcul des Niveaux de Maisons**

**Base de calcul :** 47,5 étudiants par maison (estimation)
**Formule :** Seuil individuel × 47,5 = Seuil collectif

#### **Configuration des 20 Niveaux de Maisons**

| Niveau | Nom de la Maison | XP Requis | XP pour Niveau Suivant |
|--------|------------------|-----------|------------------------|
| 1 | Maison Naissante | 0 | 2,375 |
| 2 | Maison Émergente | 2,375 | 3,563 |
| 3 | Maison Croissante | 5,938 | 4,750 |
| 4 | Maison Prometteuse | 10,688 | 7,125 |
| 5 | Maison Établie | 17,813 | 9,500 |
| 6 | Maison Respectée | 27,313 | 13,063 |
| 7 | Maison Reconnue | 40,375 | 16,625 |
| 8 | Maison Experte | 57,000 | 21,375 |
| 9 | Maison Éminente | 78,375 | 28,500 |
| 10 | Maison Référente | 106,875 | 35,625 |
| 11 | Maison Mentore | 142,500 | 45,125 |
| 12 | Maison Superviseure | 187,625 | 57,000 |
| 13 | Maison Coordinatrice | 244,625 | 71,250 |
| 14 | Maison Dirigeante | 315,875 | 90,250 |
| 15 | Maison Directrice | 406,125 | 114,000 |
| 16 | Maison Magistrale | 520,125 | 142,500 |
| 17 | Maison Experte Reconnue | 662,625 | 180,500 |
| 18 | Maison Maîtresse | 843,125 | 225,625 |
| 19 | Maison Sage | 1,068,750 | 285,000 |
| 20 | Maison Légendaire | 1,353,750 | MAX LEVEL |

### **Fonctionnalités de Classement**

#### **1. Page Statistiques de Maison**
- **Niveau actuel** de la maison avec progression visuelle
- **Classement des membres** par XP total
- **Statistiques collectives** : XP total, XP moyen, niveau moyen
- **Top 10** des contributeurs
- **Progression vers niveau suivant**

#### **2. Page Classement Global**
- **Podium des 3 premières** maisons avec design spécial
- **Classement complet** des 4 maisons
- **Métriques comparatives** : XP total, membres, moyennes
- **Mise à jour en temps réel**
- **Progression visuelle** pour chaque maison

### **Navigation et Accès**

#### **Depuis BandeauMaison.vue**
```vue
<!-- Boutons d'accès -->
<button @click="navigateToProfile">Mon Profil</button>
<button @click="navigateToHouseStats">Ma Maison</button>
<button @click="navigateToGlobalRanking">Classement</button>
```

#### **Routes Suggérées**
```javascript
// Routes à ajouter au router
{
  path: '/houses/:houseName/stats',
  component: HouseStatsPage
},
{
  path: '/houses/ranking',
  component: HousesRankingPage
}
```

---

## 🛠️ **FONCTIONS DE SERVICE ÉTENDUES**

### **Nouvelles Fonctions pour les Maisons**

#### **calculateHouseLevel(totalHouseXP)**
```javascript
// Calcule le niveau d'une maison basé sur l'XP total
const houseLevel = calculateHouseLevel(150000)
// Retourne: { niveau: 8, name: 'Maison Experte', xpRequired: 57000, xpToNext: 21375 }
```

#### **getHouseDetailedStats(houseName)**
```javascript
// Récupère les statistiques complètes d'une maison
const stats = await getHouseDetailedStats('harmonis')
// Retourne: {
//   houseName: 'harmonis',
//   houseInfo: { name: 'Harmonis', color: '#2E8B57', ... },
//   houseLevel: { niveau: 8, name: 'Maison Experte', ... },
//   totalMembers: 47,
//   totalXP: 150000,
//   averageXP: 3191,
//   averageLevel: 6.2,
//   members: [...], // Tous les membres triés par XP
//   topMembers: [...] // Top 10
// }
```

#### **getHousesRanking()**
```javascript
// Récupère le classement global des maisons
const ranking = await getHousesRanking()
// Retourne: {
//   ranking: [
//     {
//       name: 'harmonis',
//       displayName: 'Harmonis',
//       position: 1,
//       level: 12,
//       levelName: 'Maison Superviseure',
//       totalXP: 250000,
//       totalMembers: 48,
//       averageXP: 5208,
//       xpToNext: 15000
//     },
//     // ... autres maisons
//   ],
//   totalUsers: 190,
//   lastUpdated: '2024-01-06T10:00:00.000Z'
// }
```

#### **updateGlobalHouseStats()**
```javascript
// Met à jour les statistiques globales dans Firebase
const stats = await updateGlobalHouseStats()
// Sauvegarde automatiquement dans globalStats/houses
```

### **Structure Firebase Étendue**

```javascript
// Structure des données globales
globalStats: {
  houses: {
    ranking: [
      {
        name: 'harmonis',
        displayName: 'Harmonis',
        position: 1,
        level: 12,
        totalXP: 250000,
        totalMembers: 48,
        averageXP: 5208
      }
    ],
    lastUpdated: '2024-01-06T10:00:00.000Z',
    totalUsers: 190
  }
}

```

Follow these instructions to make the following change to my code document.

Instruction: Fix the documentation structure by restoring the missing sections

Code Edit:
```
```

---

## 🎯 **IMPACT PÉDAGOGIQUE DES NIVEAUX DE MAISONS**

### **Objectifs Éducatifs**

#### **1. Esprit d'Équipe Renforcé**
- **Responsabilité collective** : Chaque action individuelle impacte la maison
- **Entraide naturelle** : Les membres s'encouragent mutuellement
- **Fierté d'appartenance** : Identification forte à sa maison

#### **2. Collaboration Inter-Niveaux**
- **Mentorat spontané** : Les étudiants avancés aident les nouveaux
- **Partage de connaissances** : Création de groupes d'étude
- **Soutien mutuel** : Solidarité dans les difficultés

#### **3. Engagement à Long Terme**
- **Vision collective** : Objectifs communs sur l'année
- **Motivation persistante** : Même les petites actions comptent
- **Célébration des succès** : Réussites partagées

### **Métriques de Succès Attendues**

#### **Engagement Collectif**
- **+60% de participation** aux activités inter-maisons
- **+45% d'interactions** entre étudiants de différents niveaux
- **+30% de création** de groupes d'étude spontanés

#### **Performance Académique**
- **+25% de réussite** aux évaluations collectives
- **+40% de projets collaboratifs** menés à terme
- **+35% de satisfaction** concernant l'ambiance de classe

#### **Cohésion Sociale**
- **90% des étudiants** connaissent leur niveau de maison
- **80% participent activement** à l'amélioration du classement
- **75% développent** des liens durables inter-volées

---

## 🚀 **ROADMAP MISE À JOUR - PHASE 2 TERMINÉE**

### **Phase 2 : Fonctionnalités Collectives** ✅ **TERMINÉ**

#### **✅ Système de Niveaux de Maisons**
- Configuration des 20 niveaux collectifs
- Calcul automatique basé sur l'XP cumulé
- Noms thématiques inspirés de la progression académique

#### **✅ Pages de Statistiques**
- Page détaillée par maison avec classement des membres
- Page de classement global inter-maisons
- Métriques comparatives et progression visuelle

#### **✅ Navigation Intégrée**
- Boutons d'accès depuis BandeauMaison
- Routes dédiées pour les statistiques
- Interface responsive et moderne

#### **✅ Fonctions de Service**
- `calculateHouseLevel()` pour le calcul des niveaux
- `getHouseDetailedStats()` pour les statistiques complètes
- `getHousesRanking()` pour le classement global
- `updateGlobalHouseStats()` pour la synchronisation

#### **✅ Routes Ajoutées au Router**
```javascript
// Routes gamification ajoutées dans src/router.js

// Imports
import HouseStatsPage from '@/components/gamification/HouseStatsPage.vue'
import HousesRankingPage from '@/components/gamification/HousesRankingPage.vue'

// Routes
{ 
  path: '/houses/:houseName/stats', 
  component: HouseStatsPage, 
  name: 'HouseStatsPage', 
  props: true, 
  meta: { requiresAuth: true } 
},
{ 
  path: '/houses/ranking', 
  component: HousesRankingPage, 
  name: 'HousesRankingPage', 
  meta: { requiresAuth: true } 
}
```

### **Phase 3 : Gamification Avancée** 🔄 **PROCHAINE ÉTAPE**

#### **🔮 Événements Inter-Maisons**
- Tournois mensuels avec défis spéciaux
- Compétitions créatives (projets, présentations)
- Événements caritatifs avec bonus XP

#### **🔮 Système de Quêtes Collectives**
- Objectifs de maison hebdomadaires
- Défis collaboratifs inter-niveaux
- Récompenses exclusives pour les maisons

#### **🔮 Badges et Achievements de Maison**
- Badges collectifs pour les accomplissements
- Titres honorifiques pour les maisons leaders
- Historique des performances annuelles

---

*Documentation enrichie le 06/01/2024 - Version 2.0*
*Système de gamification HES - Vision pédagogique intégrée* 🎓🚀
