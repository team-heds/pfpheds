# ⚡ GUIDE RAPIDE - EXÉCUTION EN 5 MINUTES

## 🎯 FICHIER À UTILISER

**Ouvre : `SCRIPTS_CORRIGES.sql`**

Tous les scripts sont adaptés à ta structure avec `house_id`.

---

## 📋 ÉTAPES SIMPLES

### **1. OUVRIR SUPABASE SQL EDITOR**
1. Va sur https://supabase.com
2. Ouvre ton projet
3. Clique sur "SQL Editor"
4. Clique sur "+ New query"

---

### **2. COPIER-COLLER LES SCRIPTS**

#### **SCRIPT 1 : Corriger les niveaux à 0**

```sql
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)));

-- Vérifier
SELECT 
  current_level,
  COUNT(*) as nombre_users
FROM gamification_data
GROUP BY current_level
ORDER BY current_level;
```

**✅ Résultat** : Tous les users ont niveau ≥ 1

---

#### **SCRIPT 2 : Synchroniser XP des maisons**

```sql
UPDATE houses h
SET 
  total_xp = COALESCE((
    SELECT SUM(total_xp)
    FROM gamification_data g
    WHERE g.house_id = h.id
  ), 0),
  member_count = COALESCE((
    SELECT COUNT(*)
    FROM gamification_data g
    WHERE g.house_id = h.id
  ), 0);

-- Vérifier
SELECT 
  name,
  total_xp,
  member_count,
  (total_xp / NULLIF(member_count, 0))::INTEGER as xp_moyen
FROM houses
ORDER BY total_xp DESC;
```

**✅ Résultat** : Maisons ont le total XP de leurs membres

---

#### **SCRIPT 3 : Ajouter niveaux aux maisons**

```sql
-- Ajouter colonne
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Calculer niveaux
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- Trigger automatique
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();

-- Vérifier
SELECT name, total_xp, level, member_count 
FROM houses 
ORDER BY total_xp DESC;
```

**✅ Résultat** : Maisons ont un niveau + trigger actif

---

#### **SCRIPT 4 : Test final**

```sql
-- Voir liaison gamification_data <-> houses
SELECT 
  h.name as maison,
  COUNT(g.user_id) as nb_membres,
  SUM(g.total_xp) as total_xp_membres,
  h.total_xp as total_xp_maison,
  h.level as niveau_maison
FROM houses h
LEFT JOIN gamification_data g ON g.house_id = h.id
GROUP BY h.name, h.total_xp, h.level
ORDER BY h.total_xp DESC;
```

**✅ Résultat** : Tout est synchronisé !

---

## 🎉 C'EST FAIT !

### **Maintenant teste ton app**

1. Lance ton app Vue : `npm run dev`
2. Va sur `/gamification`
3. Ouvre console (F12)
4. Vérifie :
   - ✅ Pas d'erreur
   - ✅ Niveau affiché ≥ 1
   - ✅ Maison visible
   - ✅ XP bar fonctionne

---

## 📊 CE QUI A CHANGÉ

### **Avant**
```
current_level: 0 ❌
Maisons: pas de niveau
Lien: pas clair
```

### **Après**
```
current_level: 1+ ✅
Maisons: niveau calculé automatiquement
Lien: house_id → houses.id
```

---

## 🔧 STRUCTURE FINALE

### **Table gamification_data**
- `house_id` (UUID) → pointe vers `houses.id`
- `current_level` (1-20)
- `total_xp` (50, 100, 200...)

### **Table houses**
- `id` (UUID)
- `name` (harmonis, elaris, doloris, solencia)
- `total_xp` (somme XP membres)
- `level` (1-10) ⭐ NOUVEAU
- `member_count` (nombre membres)

### **Trigger automatique**
Quand `houses.total_xp` change → `houses.level` recalculé

---

## ⏱️ TEMPS TOTAL : 5 MINUTES

- Script 1 : 1 min
- Script 2 : 1 min  
- Script 3 : 2 min
- Test : 1 min

---

**C'EST PARTI ! Ouvre Supabase et copie-colle les scripts** 🚀✨
