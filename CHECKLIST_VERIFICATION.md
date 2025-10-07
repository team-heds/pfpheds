# ✅ CHECKLIST DE VÉRIFICATION

## 📋 APRÈS AVOIR EXÉCUTÉ LES 4 SCRIPTS

### **MÉTHODE 1 : Script Automatique** ⭐

**Exécute dans Supabase** :
```sql
-- Copie tout le contenu de VERIFICATION_COMPLETE.sql
-- Et exécute-le d'un coup
```

**Résultats attendus** :
- ✅ Tous les checks affichent "OK"
- ✅ Aucun "PROBLÈME" ou "❌"

---

### **MÉTHODE 2 : Vérifications Manuelles**

#### **CHECK 1 : Niveaux Individuels** ✅

```sql
SELECT MIN(current_level), MAX(current_level), COUNT(*) 
FROM gamification_data;
```

**Attendu** :
- MIN = 1 (pas 0)
- MAX ≤ 20
- COUNT = nombre d'utilisateurs

---

#### **CHECK 2 : Tous ont une maison** ✅

```sql
SELECT 
  COUNT(CASE WHEN house_id IS NOT NULL THEN 1 END) as avec_maison,
  COUNT(*) as total
FROM gamification_data;
```

**Attendu** :
- avec_maison = total

---

#### **CHECK 3 : XP des maisons synchronisés** ✅

```sql
SELECT 
  h.name,
  COUNT(g.user_id) as membres,
  SUM(g.total_xp) as xp_calculé,
  h.total_xp as xp_stocké
FROM houses h
LEFT JOIN gamification_data g ON g.house_id = h.id
GROUP BY h.name, h.total_xp
ORDER BY h.name;
```

**Attendu** :
- xp_calculé = xp_stocké (pour chaque maison)
- Chaque maison a des membres

---

#### **CHECK 4 : Niveaux des maisons** ✅

```sql
SELECT 
  name,
  total_xp,
  level,
  GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1) as level_calculé
FROM houses;
```

**Attendu** :
- level = level_calculé
- Toutes les maisons ont un niveau ≥ 1

---

#### **CHECK 5 : Trigger actif** ✅

```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_update_house_level';
```

**Attendu** :
- 1 ligne retournée
- tgenabled = 'O' (actif)

---

#### **CHECK 6 : Exemples concrets** ✅

```sql
-- Voir quelques utilisateurs
SELECT 
  g.email,
  h.name as maison,
  g.total_xp,
  g.current_level
FROM gamification_data g
LEFT JOIN houses h ON g.house_id = h.id
ORDER BY g.total_xp DESC
LIMIT 5;
```

**Attendu** :
- Niveaux cohérents avec XP
- Maisons affichées correctement

---

## 🧪 TEST TRIGGER EN LIVE

```sql
-- 1. Noter l'état actuel
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- 2. Ajouter 5000 XP
UPDATE houses SET total_xp = total_xp + 5000 WHERE name = 'harmonis';

-- 3. Vérifier que le level a changé automatiquement
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- 4. Remettre comme avant
UPDATE houses SET total_xp = total_xp - 5000 WHERE name = 'harmonis';
```

**Attendu** :
- Le `level` change automatiquement à l'étape 3
- Pas besoin de le calculer manuellement

---

## 💻 TEST APPLICATION

### **1. Lancer l'App**

```bash
npm run dev
```

### **2. Aller sur `/gamification`**

### **3. Ouvrir Console (F12)**

**Vérifier** :
- ❌ Pas d'erreur rouge
- ✅ Logs : "Données gamification chargées"
- ✅ Niveau affiché ≥ 1
- ✅ Maison visible

### **4. Vérifier l'Affichage**

**Profil utilisateur** :
- [ ] BandeauMaison visible
- [ ] Niveau entre 1 et 20
- [ ] Titre correct (ex: "Étudiant·e Physio")
- [ ] XP bar avec progression
- [ ] Maison affichée (Harmonis, Elaris, etc.)

**Page Maison** :
- [ ] Niveau de la maison visible
- [ ] XP total maison affiché
- [ ] Nombre de membres correct
- [ ] Classement fonctionne

---

## 🎯 CHECKLIST FINALE

Coche au fur et à mesure :

### **Base de données** ✅
- [ ] Tous les niveaux ≥ 1
- [ ] XP maisons synchronisés
- [ ] Colonne `houses.level` existe
- [ ] Trigger `update_house_level` actif
- [ ] Test trigger OK

### **Application** ✅
- [ ] App lance sans erreur
- [ ] Page gamification charge
- [ ] Niveaux affichés correctement
- [ ] Maisons visibles
- [ ] Console sans erreur

### **Fonctionnalités** ✅
- [ ] BandeauMaison fonctionne
- [ ] XPBar affiche progression
- [ ] Navigation maisons OK
- [ ] Classement maisons OK
- [ ] Stats maisons correctes

---

## 🚨 SI UN CHECK ÉCHOUE

### **Niveaux toujours à 0**
```sql
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)));
```

### **XP maisons désynchronisés**
```sql
UPDATE houses h
SET total_xp = COALESCE((
  SELECT SUM(total_xp)
  FROM gamification_data g
  WHERE g.house_id = h.id
), 0);
```

### **Trigger pas actif**
```sql
-- Réexécuter SCRIPT 3 complet
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
-- ... puis recréer
```

### **Erreur dans l'app**
1. Vide le cache : Ctrl+Shift+R
2. Vérifie la console
3. Recharge les données gamification

---

## 📊 RÉSULTAT ATTENDU FINAL

### **Table gamification_data**
```
✅ 100% utilisateurs : niveau 1-20
✅ 100% utilisateurs : house_id valide
✅ Moyenne : 50 XP par user (au départ)
```

### **Table houses**
```
✅ 4 maisons avec niveau ≥ 1
✅ XP = somme XP membres
✅ member_count = nombre réel
✅ Trigger actif
```

### **Application**
```
✅ Aucune erreur console
✅ Affichage correct
✅ Navigation fluide
✅ Données temps réel
```

---

**Exécute `VERIFICATION_COMPLETE.sql` pour tout vérifier d'un coup !** 🎯✨
