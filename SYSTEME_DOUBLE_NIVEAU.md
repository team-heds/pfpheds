# 🎯 SYSTÈME DOUBLE NIVEAU - INDIVIDUEL & MAISON

## 📊 DEUX SYSTÈMES EN PARALLÈLE

### **1. NIVEAUX INDIVIDUELS** (20 niveaux)
- Progression personnelle de chaque étudiant
- Formule : `Niveau = √(XP / 100)`
- Max niveau 20

### **2. NIVEAUX DE MAISON** (10 niveaux)
- Progression collective de la maison
- Formule : `Niveau = √(XP / 10000) + 1`
- Contribué par tous les membres

---

## 🔗 COMMENT ÇA FONCTIONNE

### **Flux Complet :**

```
ÉTUDIANT gagne XP
    ↓
NIVEAU INDIVIDUEL monte
    ↓
PALIER atteint (5, 10, 15, 20)
    ↓
BONUS XP → MAISON
    ↓
NIVEAU MAISON monte
```

---

## 📈 NIVEAUX INDIVIDUELS (20)

| Niveau | Titre | XP Min | Bonus Maison |
|--------|-------|--------|--------------|
| 1 | Étudiant·e Physio | 0 | - |
| 5 | Assistant·e Physio | 1,600 | **+500 XP** |
| 8 | Physiothérapeute Diplômé·e | 4,900 | - |
| 10 | Spécialiste | 8,100 | **+1000 XP** |
| 15 | Cadre de Santé Physio | 19,600 | **+1500 XP** |
| 20 | Légende Physiothérapie HES | 36,100 | **+3000 XP** |

**Total bonus si un étudiant atteint niveau 20 : 6000 XP pour sa maison**

---

## 🏆 NIVEAUX DE MAISON (10)

| Niveau | Titre | XP Collectif Min | Membres nécessaires* |
|--------|-------|-----------------|----------------------|
| 1 | Maison Naissante | 0 | - |
| 2 | Maison Active | 10,000 | ~20 |
| 3 | Maison Dynamique | 40,000 | ~80 |
| 4 | Maison Brillante | 90,000 | ~180 |
| 5 | Maison d'Excellence | 160,000 | ~320 |
| 6 | Maison Prestigieuse | 250,000 | ~500 |
| 7 | Maison Légendaire | 360,000 | ~720 |
| 8 | Maison Mythique | 490,000 | ~980 |

*Estimation si chaque membre contribue 500 XP

### **Formule Maison :**
```javascript
Niveau Maison = √(XP total / 10000) + 1
```

**Pourquoi diviser par 10000 ?**
- Les niveaux individuels divisent par 100
- Les maisons divisent par 10000 (100× plus dur)
- Car c'est collectif et accumulatif

---

## 💡 EXEMPLE CONCRET

### **Scénario : Harmonis avec 50 membres**

**Membre 1 atteint niveau 5** :
- Bonus : +500 XP pour Harmonis
- Total Harmonis : 500 XP
- Niveau Harmonis : √(500/10000) + 1 = 1

**25 membres atteignent niveau 5** :
- Total bonus : 25 × 500 = 12,500 XP
- Niveau Harmonis : √(12500/10000) + 1 = 2

**10 membres atteignent niveau 20** :
- Total bonus : 10 × 6000 = 60,000 XP
- Niveau Harmonis : √(60000/10000) + 1 = 3

---

## 🎮 AVANTAGES DU SYSTÈME

### **Pour l'étudiant :**
✅ Progression personnelle visible
✅ Titres motivants (Étudiant → Légende)
✅ Sentiment de contribuer à sa maison
✅ Récompenses à chaque palier

### **Pour la maison :**
✅ Effort collectif valorisé
✅ Compétition entre maisons
✅ Esprit d'équipe renforcé
✅ Niveau de maison visible

---

## 🚀 MISE EN PLACE

### **ÉTAPE 1 : Ajouter colonne level aux maisons**
```sql
-- Exécute add_level_houses.sql
ALTER TABLE houses ADD COLUMN level INTEGER DEFAULT 1;
```

### **ÉTAPE 2 : Trigger automatique**
```sql
-- Le trigger calcule automatiquement le niveau
-- quand total_xp change
CREATE TRIGGER trigger_update_house_level...
```

### **ÉTAPE 3 : Code Vue déjà adapté** ✅
- Utilise `total_xp` au lieu de `total_points`
- Détecte changement de niveau de maison
- Affiche notification

---

## 📊 TABLEAU RÉCAPITULATIF

### **Contribution d'un étudiant actif :**

| Action Étudiant | XP Individuel | Bonus Maison |
|-----------------|---------------|--------------|
| Atteint niveau 5 | 1,600 XP | +500 XP |
| Atteint niveau 10 | 8,100 XP | +1,000 XP |
| Atteint niveau 15 | 19,600 XP | +1,500 XP |
| Atteint niveau 20 | 36,100 XP | +3,000 XP |
| **TOTAL** | 36,100 XP | **6,000 XP** |

### **Impact sur la maison :**

| Membres actifs | XP Collectif | Niveau Maison |
|----------------|--------------|---------------|
| 1 membre niv. 20 | 6,000 | 1 |
| 5 membres niv. 20 | 30,000 | 2 |
| 10 membres niv. 20 | 60,000 | 3 |
| 20 membres niv. 20 | 120,000 | 4 |
| 50 membres niv. 20 | 300,000 | 6 |

---

## 🏅 AFFICHAGE DANS L'APP

### **Profil Individuel :**
```
Étudiant: Antoine
Niveau 12 - Physiothérapeute Référent·e
XP: 14,400 / 16,900 (85%)
Maison: Harmonis
```

### **Page Maison :**
```
🏠 Harmonis - Niveau 4
Maison Brillante
XP: 95,000 / 160,000 (59%)
Membres: 85
Classement: 2ème
```

---

## ✨ RÉSUMÉ

**Système à 2 niveaux :**
1. **Niveau Individuel** (1-20) : Progression personnelle
2. **Niveau Maison** (1-10) : Contribution collective

**Lien :**
- Paliers individuels → Bonus XP maison
- XP maison → Niveau maison monte
- Motivation : Aider sa maison à progresser

**Formules :**
- Individuel : `√(XP/100)` plafonné à 20
- Maison : `√(XP/10000) + 1` plafonné à 10

---

**Exécute `add_level_houses.sql` pour activer le système !** 🚀
