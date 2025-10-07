# 🎮 GUIDE RAPIDE - GAME MASTER NIVEAU MAX

## 📋 ÉTAPES À SUIVRE

### **ÉTAPE 1 : Trouver ton User ID**

Exécute dans Supabase :
```sql
SELECT user_id, email, total_xp, current_level 
FROM gamification_data 
WHERE email LIKE '%antoine%';
```

**Note ton user_id** : `___________________________`

---

### **ÉTAPE 2 : Exécuter le script complet**

**Dans `add_gamemaster_house.sql`** :

1. **Ligne 58** : Remplace `'TON-USER-ID'` par ton vrai user_id
2. **Exécute tout le fichier** dans Supabase SQL Editor

---

### **ÉTAPE 3 : Vérifier**

Le script affiche automatiquement :

✅ **Si tout est OK** :
```
✅ PARFAIT - Niveau 20 & Game Master !
✅ Niveau MAX atteint !
```

---

## 🎯 CE QUI SERA FAIT

### **Ton Compte** :
- **Maison** : Game Master (violet royal)
- **Niveau** : 20 (Légende Physiothérapie HES)
- **XP** : 40,000 (niveau 20 requis)
- **Titre** : "Maître du Jeu"

### **Maison Game Master** :
- **Niveau** : 10 (MAX)
- **XP** : 1,000,000 (largement au-dessus du niveau 10)
- **Couleur** : `#9333ea` (Violet royal)
- **Devise** : "Voir tout, gérer tout"

---

## 📊 TABLEAU DE NIVEAUX

### **Niveaux Individuels** :
| Niveau | XP Min | Titre |
|--------|--------|-------|
| 1 | 0 | Étudiant·e Physio |
| 20 | 36,100 | Légende Physiothérapie HES |
| **20** | **40,000** | **TOI - Game Master** ✨ |

### **Niveaux Maisons** :
| Niveau | XP Min | Titre |
|--------|--------|-------|
| 1 | 0 | Maison Naissante |
| 10 | 810,000 | Maison Mythique |
| **10** | **1,000,000** | **Game Master** ✨ |

---

## 🎨 AFFICHAGE DANS L'APP

### **Ton Profil** :
```
👑 Antoine Quarroz
Niveau 20 - Légende Physiothérapie HES
40,000 XP
Maison : Game Master 🎮
```

### **Bandeau Maison** :
```
╔════════════════════════════════╗
║   🎮 GAME MASTER 🎮           ║
║   Niveau 10 - Maître du Jeu   ║
║   "Voir tout, gérer tout"     ║
╚════════════════════════════════╝
```

---

## 🔧 SI BESOIN DE REVENIR EN ARRIÈRE

```sql
-- Remettre ton compte en Elaris niveau 1
UPDATE gamification_data
SET 
  house_id = '550e8400-e29b-41d4-a716-446655440002',  -- Elaris
  total_xp = 50,
  current_level = 1
WHERE user_id = 'TON-USER-ID';
```

---

## 🚀 APRÈS L'INSTALLATION

Tu auras accès à :
- ✅ Maison spéciale Game Master
- ✅ Niveau 20 (max individuel)
- ✅ Couleur violette distinctive
- ✅ Base pour dashboard admin futur

---

## 📝 NOTES

**Niveau 20** = `20² × 100 = 40,000 XP`
- Palier final atteint
- +3,000 XP bonus pour la maison

**Niveau 10 Maison** = `(10-1)² × 10,000 = 810,000 XP`
- Niveau max des maisons
- Titre : Maison Mythique

**1,000,000 XP** = Largement au-dessus pour être sûr du niveau 10

---

**Exécute maintenant le script et deviens Maître du Jeu !** 🎮👑✨
