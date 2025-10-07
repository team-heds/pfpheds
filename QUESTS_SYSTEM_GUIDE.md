# 🎯 SYSTÈME DE QUÊTES - GUIDE COMPLET

## 📋 VUE D'ENSEMBLE

Système de quêtes dynamiques complet connecté à Supabase avec interface admin et affichage temps réel pour les utilisateurs.

---

## 🎉 SYSTÈME COMPLÈTEMENT FONCTIONNEL !

### ✅ CE QUI A ÉTÉ RÉALISÉ

1. **Base de données Supabase** : Tables `quests`, `quest_steps`, `user_quest_progress` avec RLS
2. **Service Admin** : Création, modification, suppression de quêtes
3. **Service Utilisateur** : Récupération et progression en temps réel
4. **Interface Admin** : Panel de gestion complet
5. **Interface Utilisateur** : Pages dédiées + sidebar avec realtime
6. **Synchronisation** : Attribution automatique aux utilisateurs

---

## 🚀 DÉMARRAGE RAPIDE

### Étape 1 : Configurer la base de données Supabase

```bash
# Dans le SQL Editor de Supabase Dashboard
# Exécutez le fichier : supabase_quests_schema.sql
```

Ce script crée :
- ✅ Tables (quests, quest_steps, user_quest_progress, user_quest_step_progress)
- ✅ Index pour performance
- ✅ Triggers pour updated_at
- ✅ Row Level Security (RLS) policies
- ✅ Fonctions helper (assign_quest_to_user, complete_quest)
- ✅ Vues utiles (quests_with_steps, user_quest_progress_detailed)
- ✅ 2 quêtes d'exemple

### Étape 2 : Tester le système

1. **Créer une quête (Admin)**
   - Aller sur `/admin/gamification/quests`
   - Cliquer sur "Nouvelle Quête"
   - Remplir le formulaire
   - **Status "Active"** = Attribution automatique à tous les utilisateurs !

2. **Voir les quêtes (Utilisateur)**
   - Les quêtes apparaissent dans `/quests`
   - Les nouvelles quêtes apparaissent dans le sidebar (temps réel)
   - Cliquer sur une quête pour la démarrer

---

## 📂 ARCHITECTURE DU SYSTÈME

### **Services**

```
src/service/
├── adminQuestsService.js       # Gestion admin (CRUD quêtes)
└── userQuestsService.js        # Gestion utilisateur (progression, realtime)
```

### **Composants**

```
src/components/
├── admin/
│   └── QuestManagement.vue     # Interface admin de gestion
└── gamification/
    ├── QuestsPage.vue          # Page principale des quêtes
    ├── QuestCard.vue           # Carte d'affichage d'une quête
    └── QuestsSidebarCard.vue   # Widget sidebar avec realtime
```

### **Base de données**

```sql
quests                        # Quêtes créées par les admins
├── id (UUID)
├── title, description
├── type, difficulty
├── points, xp_reward
├── status (draft/active/archived)
└── created_by, created_at

quest_steps                   # Étapes des quêtes
├── id (UUID)
├── quest_id (FK)
├── step_order
└── title, description

user_quest_progress           # Progression utilisateur
├── id (UUID)
├── user_id, quest_id (FK)
├── status (not_started/in_progress/completed/failed)
├── progress (0-100)
└── started_at, completed_at
```

---

## 🎮 UTILISATION ADMIN

### Créer une Quête

```javascript
// Via interface /admin/gamification/quests
{
  title: "Ma Première Quête",
  description: "Description détaillée",
  type: "daily",           // daily, weekly, achievement, exploration, social, challenge
  difficulty: "easy",       // easy, medium, hard, expert
  category: "Découverte",
  points: 50,
  status: "active",         // draft, active, archived
  steps: [
    { title: "Étape 1", description: "...", required: true },
    { title: "Étape 2", description: "...", required: true }
  ]
}
```

### Statuts de Quête

| Statut | Description | Comportement |
|--------|-------------|--------------|
| **draft** | Brouillon | Visible seulement admin, pas assignée |
| **active** | Active | ✅ **Assignée automatiquement à TOUS les utilisateurs** |
| **archived** | Archivée | Plus assignée aux nouveaux users |

### Attribution Automatique

Quand vous créez/modifiez une quête avec `status: "active"` :

```javascript
// Le système fait automatiquement :
1. Récupère tous les utilisateurs
2. Crée une entrée user_quest_progress pour chacun
3. Status initial = 'not_started'
4. Les utilisateurs voient la quête immédiatement !
```

---

## 👤 UTILISATION UTILISATEUR

### Affichage des Quêtes

**Page principale** `/quests` :
- Onglets : Actives / Complétées / Toutes
- Filtres : Recherche, Difficulté, Type
- Statistiques : Progression globale, XP total
- Action : Démarrer/Continuer une quête

**Sidebar** (QuestsSidebarCard) :
- Affiche les 3 quêtes les plus récentes
- Badge "NEW" pour quêtes < 7 jours
- Mise à jour en **temps réel** via Supabase Realtime
- Clic → Navigation vers `/quests`

### Démarrer une Quête

```javascript
// Automatique via le bouton "Démarrer"
await userQuestsService.startQuest(userId, questId)

// Effet :
- status → 'in_progress'
- started_at → maintenant
- progress → 0
```

### Progression

Structure de données :

```javascript
{
  ...quest,                    // Données de la quête
  userProgress: {
    status: 'in_progress',     // État actuel
    progress: 45,              // Pourcentage 0-100
    current_step: 2,           // Étape actuelle
    started_at: '2025-01-...',
    completed_at: null
  },
  steps: [...]                 // Étapes de la quête
}
```

---

## 🔄 TEMPS RÉEL (REALTIME)

### Comment ça marche ?

Le `QuestsSidebarCard` s'abonne aux changements :

```javascript
// Abonnement automatique au montage
realtimeChannel = userQuestsService.subscribeToQuestUpdates(userId, (payload) => {
  console.log('🔄 Changement détecté')
  loadNewQuests() // Recharge les quêtes
})

// Désabonnement automatique au démontage
userQuestsService.unsubscribeFromQuestUpdates(realtimeChannel)
```

### Événements détectés

- ✅ **INSERT** : Nouvelle quête assignée par l'admin
- ✅ **UPDATE** : Progression mise à jour
- ✅ **DELETE** : Quête supprimée (rare)

### Notification automatique

Quand l'admin crée une quête active :
1. Admin clique "Créer" avec status="active"
2. Backend assigne à tous les utilisateurs
3. **Sidebar se met à jour automatiquement** (< 1 seconde)
4. Badge "NEW" apparaît
5. Utilisateur voit la nouvelle quête !

---

## 🔐 SÉCURITÉ (RLS)

### Policies Quests

```sql
-- Lecture : Tout le monde voit les quêtes actives
CREATE POLICY "Anyone can view active quests"
USING (status = 'active');

-- Création/Modification : Admins uniquement
CREATE POLICY "Admins can create quests"
WITH CHECK (
  -- Vérifie table user_roles OU user_metadata
  EXISTS (SELECT 1 FROM user_roles WHERE role_name IN ('admin', 'game_master'))
  OR
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'roles'->>'admin' = 'true')
);
```

### Policies User Progress

```sql
-- Lecture : Voir SA propre progression
CREATE POLICY "Users can view own progress"
USING (user_id = auth.uid());

-- Modification : Gérer SA propre progression
CREATE POLICY "Users can manage own progress"
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

## 📊 STATISTIQUES

### Admin : Statistiques d'une Quête

```javascript
const stats = await adminQuestsService.getQuestStatistics(questId)

// Retourne :
{
  total: 150,              // Total participants
  notStarted: 80,          // Pas commencé
  inProgress: 50,          // En cours
  completed: 18,           // Complétées
  failed: 2,               // Échouées
  averageProgress: 32      // Progression moyenne %
}
```

### Utilisateur : Ses Statistiques

```javascript
const stats = await userQuestsService.getQuestStats(userId)

// Retourne :
{
  total: 25,               // Total de quêtes
  notStarted: 10,
  inProgress: 12,
  completed: 3,
  failed: 0,
  totalXP: 350,            // XP gagné via quêtes
  averageProgress: 45      // Progression moyenne
}
```

---

## 🛠️ FONCTIONS UTILES

### Admin Service

```javascript
import adminQuestsService from '@/service/adminQuestsService'

// CRUD
await adminQuestsService.createQuest(questData)
await adminQuestsService.updateQuest(questId, questData)
await adminQuestsService.deleteQuest(questId)
await adminQuestsService.getQuests()
await adminQuestsService.getQuestById(questId)

// Gestion
await adminQuestsService.changeQuestStatus(questId, 'active')
await adminQuestsService.duplicateQuest(questId)
await adminQuestsService.assignQuestToAllUsers(questId)
await adminQuestsService.getQuestStatistics(questId)
```

### User Service

```javascript
import userQuestsService from '@/service/userQuestsService'

// Récupération
await userQuestsService.getUserQuests(userId)
await userQuestsService.getNewQuests(userId)
await userQuestsService.getActiveQuests(userId)
await userQuestsService.getQuestStats(userId)

// Actions
await userQuestsService.startQuest(userId, questId)
await userQuestsService.updateQuestProgress(userId, questId, progress, step)
await userQuestsService.completeQuest(userId, questId)

// Realtime
const channel = userQuestsService.subscribeToQuestUpdates(userId, callback)
userQuestsService.unsubscribeFromQuestUpdates(channel)
```

---

## 🎨 PERSONNALISATION

### Types de Quêtes

```javascript
const types = [
  'daily',        // Quotidienne
  'weekly',       // Hebdomadaire
  'achievement',  // Succès
  'exploration',  // Exploration
  'social',       // Social
  'challenge'     // Défi
]
```

### Difficultés

```javascript
const difficulties = [
  'easy',         // Facile (50 XP)
  'medium',       // Moyen (100 XP)
  'hard',         // Difficile (200 XP)
  'expert'        // Expert (500 XP)
]
```

### Couleurs par Maison

Les quêtes utilisent les couleurs des maisons HES :

```javascript
const houseColors = {
  'Harmonis': '#2E8B57',  // Vert
  'Elaris': '#DC143C',    // Rouge
  'Doloris': '#FFD700',   // Or
  'Solencia': '#4169E1'   // Bleu
}
```

---

## 🧪 TESTS & DEBUGGING

### Tester la Création Admin

1. Connexion admin `/login`
2. Aller sur `/admin/gamification/quests`
3. Créer une quête avec status "Active"
4. Console devrait afficher :
```
✅ Quête créée: xxx-xxx-xxx
📢 Attribution de la quête xxx à N utilisateurs...
✅ Quête assignée à N utilisateurs
```

### Tester l'Affichage Utilisateur

1. Connexion utilisateur
2. Ouvrir `/quests`
3. Console devrait afficher :
```
✅ X quêtes chargées depuis Supabase
📊 Stats quêtes: { total: X, ... }
```

4. Vérifier le sidebar :
```
🔍 Chargement des nouvelles quêtes pour: user-id
✅ X quêtes chargées (Y nouvelles)
🔔 Abonnement aux nouvelles quêtes pour: user-id
```

### Tester le Realtime

1. **Fenêtre 1** : Utilisateur sur `/feed` (sidebar visible)
2. **Fenêtre 2** : Admin sur `/admin/gamification/quests`
3. Admin crée une nouvelle quête active
4. **Fenêtre 1** devrait automatiquement :
   - Afficher un log `🔄 Changement de quête détecté`
   - Recharger les quêtes
   - Afficher la nouvelle quête dans le sidebar

---

## 🐛 DÉPANNAGE

### "Aucune quête trouvée"

**Vérifications :**
1. Quêtes créées avec status "active" ?
2. RLS policies correctement configurées ?
3. Utilisateur bien authentifié ?
4. Console : erreurs dans `getUserQuests()` ?

### "Permission denied" lors de création

**Solution :**
1. Vérifier que vous êtes admin (user_metadata ou table user_roles)
2. Exécuter les policies RLS du fichier SQL
3. Vérifier logs Supabase Dashboard → Logs

### Realtime ne fonctionne pas

**Vérifications :**
1. Supabase Realtime activé dans Dashboard ?
2. User ID correct (uid Firebase vs id Supabase) ?
3. Console : logs d'abonnement présents ?
4. Tester avec `subscribeToQuestUpdates` manuel

### Les quêtes ne s'affichent pas

**Debug :**
```javascript
// Dans la console navigateur
const { data, error } = await supabase
  .from('user_quest_progress')
  .select('*')
  .eq('user_id', 'YOUR_USER_ID')

console.log('Quêtes DB:', data, error)
```

---

## 📈 ÉVOLUTIONS FUTURES

### Idées d'amélioration

- [ ] **Récompenses** : Items, badges spéciaux
- [ ] **Quêtes conditionnelles** : Prérequis (niveau, maison, autre quête)
- [ ] **Quêtes communautaires** : Progression partagée
- [ ] **Quêtes événementielles** : Date de début/fin
- [ ] **Leaderboard** : Classement par quêtes complétées
- [ ] **Notifications push** : Nouvelle quête assignée
- [ ] **Quêtes répétables** : Reset quotidien/hebdomadaire
- [ ] **Progression partielle** : Validation étape par étape

---

## 📚 RESSOURCES

### Fichiers Importants

- `supabase_quests_schema.sql` : Structure complète de la DB
- `SUPABASE_ROLES_SETUP.md` : Configuration des rôles admin
- `src/service/adminQuestsService.js` : Service admin complet
- `src/service/userQuestsService.js` : Service utilisateur complet

### Documentation Supabase

- [Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Exécuter `supabase_quests_schema.sql` dans Supabase
- [ ] Configurer au moins 1 admin (voir `SUPABASE_ROLES_SETUP.md`)
- [ ] Vérifier les RLS policies
- [ ] Activer Supabase Realtime dans Dashboard
- [ ] Créer 2-3 quêtes de test
- [ ] Tester le flux complet : création → affichage → progression
- [ ] Vérifier les logs console (pas d'erreurs)
- [ ] Tester le realtime (création admin → sidebar utilisateur)
- [ ] Documenter vos types de quêtes personnalisés

---

## 🎉 CONCLUSION

Le système de quêtes est **100% fonctionnel** avec :

✅ Base de données Supabase robuste avec RLS
✅ Interface admin intuitive pour créer des quêtes
✅ Attribution automatique aux utilisateurs
✅ Affichage en temps réel avec Realtime
✅ Progression utilisateur complète
✅ Services modulaires et réutilisables
✅ Design cohérent avec le système de gamification

**Prêt pour la production ! 🚀**

---

**Créé avec ❤️ pour pfpheds**
*Version 1.0 - Système de Quêtes Supabase*
