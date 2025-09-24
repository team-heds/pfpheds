# 🎮 Documentation Système Gamification - PFP HEdS

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Services et composants](#services-et-composants)
4. [Système de notifications](#système-de-notifications)
5. [Badges automatiques](#badges-automatiques)
6. [Structure Firebase](#structure-firebase)
7. [Guide d'utilisation](#guide-dutilisation)
8. [Maintenance et évolution](#maintenance-et-évolution)

---

## 🎯 Vue d'ensemble

Le système gamification PFP HEdS est un écosystème complet qui transforme l'expérience utilisateur en ajoutant des éléments de jeu motivants : XP, niveaux, badges, quêtes, défis et maisons HES.

### ✨ Fonctionnalités principales

- **🏠 Système de maisons HES** : 4 maisons (Harmonis, Elaris, Doloris, Solencia)
- **⭐ Système XP/Niveaux** : 20 niveaux avec progression personnalisée
- **🏆 Badges automatiques** : Débloquage basé sur les actions utilisateur
- **🎯 Quêtes dynamiques** : Missions narratives et de progression
- **💪 Défis hebdomadaires** : Challenges temporaires avec récompenses
- **🔔 Notifications temps réel** : Feedback immédiat pour toutes les actions
- **📊 Widgets admin** : Interface de gestion et statistiques

---

## 🏗️ Architecture technique

### Structure générale
```
🎮 SYSTÈME GAMIFICATION
├── 🔔 Notifications (App.vue)
├── 🎯 Services Unifiés (Firebase Users/)
├── 🏆 Badges Automatiques (Action-based)
├── 📊 Widgets Temps Réel (Admin Dashboard)
├── 🏠 Maisons HES (Quiz + Assignation)
└── 🔄 Synchronisation Firebase
```

### Technologies utilisées
- **Vue 3** avec Composition API
- **Firebase Realtime Database** pour la persistance
- **PrimeVue** pour l'interface utilisateur
- **Service Pattern** pour l'architecture modulaire

---

## 🛠️ Services et composants

### 1. Service Gamification Unifié (`gamificationService.js`)

**Rôle** : Service centralisé pour toutes les données gamification

**Fonctionnalités principales** :
```javascript
// Récupération des données utilisateur
await gamificationService.getUserGamificationData(userId)

// Abonnements temps réel
const listenerId = gamificationService.subscribeToStats(callback)

// Gestion des statistiques
const stats = await gamificationService.getGamificationStats()
```

**Méthodes clés** :
- `getUserGamificationData(userId)` : Données complètes utilisateur
- `subscribeToStats(callback)` : Abonnement statistiques temps réel
- `subscribeToActivity(callback)` : Abonnement activité récente
- `subscribeToUser(userId, callback)` : Abonnement utilisateur spécifique

### 2. Service HES Houses (`hesHousesService.js`)

**Rôle** : Gestion des maisons HES et progression XP

**Fonctionnalités principales** :
```javascript
// Ajout d'XP avec notifications automatiques
await addUserXP(userId, 'LOGIN', customXP)

// Récupération des données gamification
const data = await getUserGamificationData(userId)

// Gestion des streaks de connexion
const streak = await updateLoginStreak(userId)
```

**Actions XP disponibles** :
- `LOGIN` : +10 XP (connexion quotidienne)
- `QUIZ_COMPLETE` : +50 XP (quiz HES terminé)
- `DAILY_STREAK_3` : +25 XP (3 jours consécutifs)
- `DAILY_STREAK_7` : +50 XP (7 jours consécutifs)
- `DAILY_STREAK_30` : +100 XP (30 jours consécutifs)

### 3. Service Badges (`badgesService.js`)

**Rôle** : Gestion des badges et débloquage automatique

**Fonctionnalités principales** :
```javascript
// Vérification automatique des badges
const newBadges = await checkAndUnlockActionBadges(userId, action, context)

// Débloquage manuel d'un badge
await unlockBadge(userId, badgeConfig)

// Récupération des badges utilisateur
const badges = await getUserBadges(userId)
```

**Types de badges** :
- **Démarrage** : Premiers pas, première connexion
- **Progression** : Milestones XP (100, 500, 1000)
- **Engagement** : Streaks de connexion (7, 30 jours)
- **Exploration** : Quêtes et défis complétés
- **Maîtrise** : Niveaux atteints (5, 10, 15, 20)

### 4. Service Quêtes (`questsService.js`)

**Rôle** : Gestion des quêtes dynamiques et progression

**Fonctionnalités principales** :
```javascript
// Complétion d'une quête avec notifications
const result = await completeQuest(userId, questId)

// Mise à jour du progrès
await updateQuestProgress(userId, questId, stepId, progress)

// Récupération des quêtes utilisateur
const quests = await getUserQuests(userId)
```

**Types de quêtes** :
- **Story** : Quêtes narratives liées aux maisons
- **Progression** : Objectifs de développement
- **Exploration** : Découverte de fonctionnalités
- **Social** : Interactions communautaires

### 5. Service Défis (`challengesService.js`)

**Rôle** : Gestion des défis hebdomadaires

**Fonctionnalités principales** :
```javascript
// Mise à jour du progrès avec notifications
const completed = await updateChallengeProgress(userId, type, increment)

// Génération des défis hebdomadaires
const challenges = generateWeeklyChallenges()

// Récupération des défis actifs
const active = await getUserActiveChallenges(userId)
```

**Types de défis** :
- `XP_GAIN` : Gagner X points d'expérience
- `LOGIN_STREAK` : Se connecter X jours consécutifs
- `QUIZ_COMPLETE` : Terminer X quiz
- `BADGE_UNLOCK` : Débloquer X badges

---

## 🔔 Système de notifications

### Architecture
Le système de notifications est intégré dans `App.vue` et utilise le `notificationService.js` pour gérer les notifications temps réel.

### Composants
- **GamificationNotification.vue** : Composant d'affichage des notifications
- **notificationService.js** : Service de gestion centralisé

### Types de notifications
```javascript
// Notification XP
{
  type: 'xp',
  title: 'XP Gagné !',
  message: '+50 XP',
  data: { xp: 50, source: 'Quiz HES' }
}

// Notification niveau
{
  type: 'level_up',
  title: 'Niveau Supérieur !',
  message: 'Vous êtes maintenant Praticien·ne Junior',
  data: { level: 5, levelName: 'Praticien·ne Junior' }
}

// Notification badge
{
  type: 'badge',
  title: 'Nouveau Badge !',
  message: 'Badge "Explorateur" débloqué !',
  data: { badgeId: 'QUEST_EXPLORER', badgeName: 'Explorateur' }
}
```

### Déclenchement automatique
Les notifications sont automatiquement déclenchées lors de :
- Gain d'XP (toutes sources)
- Montée de niveau
- Débloquage de badge
- Complétion de quête
- Réussite de défi

---

## 🏆 Badges automatiques

### Système de déclenchement
Les badges sont automatiquement vérifiés et débloqués via `checkAndUnlockActionBadges()` lors de chaque action utilisateur.

### Badges disponibles

#### 🌟 Badges de Démarrage
- **FIRST_STEPS** : Compléter son profil et rejoindre une maison
- **FIRST_LOGIN** : Première connexion à l'application
- **FIRST_QUEST** : Première quête terminée
- **FIRST_CHALLENGE** : Premier défi relevé

#### ⭐ Badges de Progression
- **XP_MILESTONE_100** : Atteindre 100 XP total
- **XP_MILESTONE_500** : Atteindre 500 XP total
- **XP_MILESTONE_1000** : Atteindre 1000 XP total
- **LEVEL_5** : Atteindre le niveau 5
- **LEVEL_10** : Atteindre le niveau 10

#### 🔥 Badges d'Engagement
- **LOGIN_STREAK_7** : 7 jours de connexion consécutifs
- **LOGIN_STREAK_30** : 30 jours de connexion consécutifs
- **QUEST_EXPLORER** : 5 quêtes terminées
- **CHALLENGE_MASTER** : 5 défis relevés

### Configuration des badges
```javascript
// Exemple de configuration badge
FIRST_STEPS: {
  id: 'FIRST_STEPS',
  name: 'Premiers Pas',
  description: 'Complétez votre profil et rejoignez une maison',
  icon: '👶',
  color: '#4CAF50',
  rarity: 'COMMON',
  category: 'STARTER',
  xpBonus: 25
}
```

---

## 🗄️ Structure Firebase

### Chemin principal : `Users/{userId}/gamification/`

```json
{
  "Users": {
    "{userId}": {
      "gamification": {
        "maison": "harmonis|elaris|doloris|solencia",
        "niveau": 1,
        "xp": 0,
        "totalXP": 0,
        "xpToNext": 100,
        "loginStreak": 0,
        "totalLogins": 0,
        "dateSelection": "2024-01-01T00:00:00.000Z",
        "lastXPGain": {
          "amount": 10,
          "action": "LOGIN",
          "description": "Connexion quotidienne",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        "badges": {
          "FIRST_STEPS": {
            "id": "FIRST_STEPS",
            "name": "Premiers Pas",
            "unlockedAt": "2024-01-01T00:00:00.000Z"
          }
        },
        "quests": {
          "{questId}": {
            "id": "questId",
            "status": "active|completed",
            "progress": {},
            "startedAt": "2024-01-01T00:00:00.000Z"
          }
        },
        "challenges": {
          "week_{weekNumber}": {
            "{challengeId}": {
              "type": "XP_GAIN",
              "progress": 50,
              "target": 100,
              "completed": false
            }
          }
        },
        "xpHistory": {
          "{pushId}": {
            "amount": 10,
            "action": "LOGIN",
            "timestamp": "2024-01-01T00:00:00.000Z",
            "totalXPAfter": 10
          }
        }
      }
    }
  }
}
```

### Chemins globaux
- `gamification/logs/` : Logs d'activité globaux
- `quests/` : Configuration des quêtes disponibles
- `challenges/` : Templates des défis

---

## 📖 Guide d'utilisation

### Pour les développeurs

#### 1. Ajouter de l'XP à un utilisateur
```javascript
import { addUserXP } from '@/service/hesHousesService'

// Ajouter XP avec action prédéfinie
await addUserXP(userId, 'LOGIN')

// Ajouter XP personnalisé
await addUserXP(userId, 'CUSTOM_ACTION', 25)
```

#### 2. Vérifier les badges automatiquement
```javascript
import badgesService from '@/service/badgesService'

// Vérification basée sur une action
const newBadges = await badgesService.checkAndUnlockActionBadges(
  userId, 
  'XP_GAINED', 
  { userStats }
)
```

#### 3. Utiliser les widgets gamification
```vue
<template>
  <!-- Widget statistiques admin -->
  <GamificationStatsWidget 
    :show-admin-actions="true"
    @navigate-to="handleNavigation"
  />
  
  <!-- Widget activité récente -->
  <GamificationActivityWidget 
    :max-items="10"
    :show-filters="true"
  />
</template>
```

#### 4. S'abonner aux mises à jour temps réel
```javascript
import gamificationService from '@/service/gamificationService'

// Abonnement aux statistiques
const listenerId = gamificationService.subscribeToStats((stats) => {
  console.log('Nouvelles statistiques:', stats)
})

// Désabonnement
gamificationService.unsubscribe(listenerId)
```

### Pour les administrateurs

#### Interface d'administration
- **Dashboard** : Vue d'ensemble avec widgets temps réel
- **Gestion des défis** : Création et modification des défis
- **Gestion des quêtes** : Configuration des quêtes disponibles
- **Statistiques** : Analyse des données gamification

#### Actions disponibles
- Créer/modifier/supprimer des défis
- Configurer les quêtes par maison
- Consulter les statistiques utilisateur
- Gérer les badges et récompenses

---

## 🔧 Maintenance et évolution

### Ajout d'un nouveau badge

1. **Configurer le badge** dans `badgesService.js` :
```javascript
NEW_BADGE: {
  id: 'NEW_BADGE',
  name: 'Nouveau Badge',
  description: 'Description du badge',
  icon: '🎯',
  color: '#FF5722',
  rarity: 'RARE',
  category: 'ACHIEVEMENT',
  xpBonus: 50
}
```

2. **Ajouter la logique de débloquage** dans `checkAndUnlockActionBadges()` :
```javascript
case 'NEW_ACTION':
  if (!userBadges.NEW_BADGE && condition) {
    newBadges.push(BADGES_CONFIG.NEW_BADGE)
  }
  break
```

### Ajout d'une nouvelle action XP

1. **Configurer l'action** dans `hesHousesService.js` :
```javascript
NEW_ACTION: {
  xp: 30,
  description: 'Description de l\'action'
}
```

2. **Utiliser l'action** :
```javascript
await addUserXP(userId, 'NEW_ACTION')
```

### Ajout d'un nouveau type de quête

1. **Définir le type** dans `questsService.js` :
```javascript
export const QUEST_TYPES = {
  // ... types existants
  NEW_TYPE: 'new_type'
}
```

2. **Créer les quêtes** correspondantes dans la configuration.

### Optimisations recommandées

#### Performance
- Utiliser le cache du service gamification pour les données fréquemment consultées
- Limiter les abonnements temps réel aux vues actives
- Paginer les listes d'activité et d'historique

#### Sécurité
- Valider toutes les données côté serveur
- Implémenter des règles Firebase Security Rules
- Limiter les actions par utilisateur (rate limiting)

#### Évolutivité
- Séparer les données par périodes (mensuel/annuel)
- Archiver les anciennes données
- Optimiser les requêtes Firebase avec des index

---

## 📊 Métriques et monitoring

### Données à surveiller
- Nombre d'utilisateurs actifs avec gamification
- Taux de complétion des quêtes par maison
- Distribution des niveaux utilisateur
- Fréquence de débloquage des badges
- Engagement sur les défis hebdomadaires

### Outils recommandés
- Firebase Analytics pour les métriques de base
- Logs personnalisés pour les actions gamification
- Dashboard admin pour le monitoring temps réel

---

## 🎯 Conclusion

Le système gamification PFP HEdS est maintenant complet et opérationnel avec :

✅ **Architecture unifiée** avec services modulaires  
✅ **Notifications temps réel** pour tous les événements  
✅ **Badges automatiques** basés sur les actions  
✅ **Interface admin** avec widgets dynamiques  
✅ **Documentation complète** pour la maintenance  

Le système est prêt pour la production et peut être étendu facilement avec de nouvelles fonctionnalités selon les besoins futurs.

---

*Documentation générée le 18 septembre 2024*  
*Version du système : 1.0.0*  
*Dernière mise à jour : Intégration complète avec notifications et badges automatiques*
