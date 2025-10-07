# 🎯 SYSTÈME DE NIVEAUX - EXPLICATION

## 📊 FORMULE

```javascript
Niveau = Math.floor(Math.sqrt(XP / 50)) + 1
```

## 📈 TABLE DES NIVEAUX

| Niveau | XP Min | XP Max | XP Requis |
|--------|--------|--------|-----------|
| 1      | 0      | 49     | 50        |
| 2      | 50     | 149    | 100       |
| 3      | 150    | 299    | 150       |
| 4      | 300    | 499    | 200       |
| 5      | 500    | 749    | 250       |
| 10     | 4,050  | 4,549  | 500       |
| 20     | 18,050 | 18,649 | 1,000     |
| 50     | 120,050| 120,549| 2,500     |
| 100    | 490,050| 490,549| 5,000     |

## 🔧 PROBLÈME ACTUEL

**Symptôme** : Le niveau ne change pas quand l'XP augmente

**Cause** : Le niveau n'était que lu depuis la DB, jamais recalculé

## ✅ SOLUTION IMPLÉMENTÉE

### **1. Calcul automatique côté Vue**
```javascript
// Fonction ajoutée dans GamificationProfilePage.vue
const calculateLevel = (totalXP) => {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1
}

const updateLevelFromXP = async (newTotalXP) => {
  const newLevel = calculateLevel(newTotalXP)
  // Met à jour Supabase + affiche notification
}
```

### **2. Mise à jour automatique**
- Quand l'XP change, le niveau est recalculé
- Si le niveau augmente → notification toast
- Mise à jour dans Supabase

## 🚀 UTILISATION

### **Recalculer tous les niveaux dans la base**

1. Ouvre Supabase SQL Editor
2. Exécute `recalculer_niveaux.sql`
3. Tous les niveaux seront corrigés automatiquement

### **Ajouter de l'XP manuellement (test)**

```sql
-- Ajouter 500 XP à un utilisateur
UPDATE gamification_data
SET 
  total_xp = total_xp + 500,
  current_level = FLOOR(SQRT((total_xp + 500) / 50.0)) + 1
WHERE user_id = 'ton-user-id';
```

## 📱 DANS L'APPLICATION

Maintenant, quand tu :
- ✅ Complètes un défi → XP ajouté → niveau recalculé
- ✅ Complètes une quête → XP ajouté → niveau recalculé
- ✅ Débloque un badge → XP ajouté → niveau recalculé

**Le niveau sera automatiquement mis à jour avec une notification !** 🎉

## 🧪 TESTER

1. Note ton XP actuel
2. Complète un défi/quête
3. Vérifie la console : `🎉 NIVEAU UP ! X → Y`
4. Une notification toast apparaît
5. Ton niveau est mis à jour

## ⚙️ CONFIGURATION

Pour changer la formule de calcul, modifie dans `GamificationProfilePage.vue` :

```javascript
// Plus facile (niveaux plus rapides)
return Math.floor(Math.sqrt(totalXP / 30)) + 1

// Plus difficile (niveaux plus lents)  
return Math.floor(Math.sqrt(totalXP / 100)) + 1
```
