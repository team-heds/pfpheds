# 🔧 FIX - SYSTÈME DE NIVEAUX

## ❌ PROBLÈME INITIAL

**Les niveaux ne changeaient pas** même quand l'XP augmentait.

**Cause** :
- Le niveau était simplement lu depuis la DB
- Aucun recalcul automatique
- Aucune mise à jour quand l'XP change

---

## ✅ SOLUTION IMPLÉMENTÉE

### **1. Fonction de calcul du niveau**
```javascript
const calculateLevel = (totalXP) => {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1
}
```

### **2. Fonction de mise à jour automatique**
```javascript
const updateLevelFromXP = async (newTotalXP) => {
  const newLevel = calculateLevel(newTotalXP)
  const oldLevel = userStats.value.niveau
  
  if (newLevel !== oldLevel) {
    // Mise à jour Supabase
    await supabase.from('gamification_data').update({...})
    
    // Notification toast
    showToast.value = true
    toastData.value = {
      type: 'levelup',
      title: 'Niveau Supérieur !',
      message: `Tu es maintenant niveau ${newLevel} !`
    }
  }
}
```

### **3. Watcher automatique**
```javascript
watch(() => userStats.value?.xp, (newXP, oldXP) => {
  if (newXP !== oldXP) {
    const expectedLevel = calculateLevel(newXP)
    if (expectedLevel !== userStats.value.niveau) {
      updateLevelFromXP(newXP)
    }
  }
})
```

---

## 🚀 COMMENT TESTER

### **Option 1 : Recalculer tous les niveaux existants (recommandé)**

1. Va dans Supabase SQL Editor
2. Exécute `recalculer_niveaux.sql`
3. Tous les niveaux seront corrigés

### **Option 2 : Tester avec un utilisateur**

Dans Supabase SQL Editor :
```sql
-- Voir ton XP et niveau actuel
SELECT user_id, total_xp, current_level 
FROM gamification_data 
WHERE user_id = 'ton-id';

-- Ajouter 500 XP (pour tester)
UPDATE gamification_data
SET total_xp = total_xp + 500
WHERE user_id = 'ton-id';

-- Recharge la page Vue → le niveau sera recalculé automatiquement !
```

### **Option 3 : Tester dans l'app**

1. Note ton XP actuel (ex: 250 XP, niveau 3)
2. Complète un défi/quête (gagne 100 XP)
3. Le système détecte : 350 XP total
4. Calcul : `Math.floor(Math.sqrt(350 / 50)) + 1` = niveau 3
5. Si passage au niveau supérieur → notification toast 🎉

---

## 📊 TABLE DE RÉFÉRENCE

| XP Total | Niveau | XP pour passer |
|----------|--------|----------------|
| 0-49     | 1      | 50 XP          |
| 50-149   | 2      | 100 XP         |
| 150-299  | 3      | 150 XP         |
| 300-499  | 4      | 200 XP         |
| 500-749  | 5      | 250 XP         |
| 750-1049 | 6      | 300 XP         |
| 1050-1399| 7      | 350 XP         |
| 1400-1799| 8      | 400 XP         |
| 1800-2249| 9      | 450 XP         |
| 2250-2749| 10     | 500 XP         |

---

## 🔍 VÉRIFIER QUE ÇA MARCHE

### **Dans la console navigateur (F12)** :
```
🔄 XP changé: 250 → 350, recalcul du niveau...
🎉 NIVEAU UP ! 3 → 4
✅ Niveau mis à jour dans Supabase
```

### **Dans l'interface** :
- Badge de niveau se met à jour
- Toast de notification "Niveau Supérieur !"
- XP affiché correctement

---

## 📝 FICHIERS CRÉÉS

1. **recalculer_niveaux.sql** - Corrige tous les niveaux dans la DB
2. **SYSTEME_NIVEAUX.md** - Documentation complète du système
3. **FIX_NIVEAUX_RESUME.md** - Ce fichier

---

## 🎯 MAINTENANT

**Exécute `recalculer_niveaux.sql` dans Supabase pour corriger tous les niveaux existants, puis teste l'app !**
