# ✅ CHECKLIST RAPIDE - MISE EN PLACE

## 🎯 ORDRE D'EXÉCUTION

### **📦 ÉTAPE 1 : BACKUP (2 min)**
```bash
□ Exporter gamification_data en CSV
□ Exporter houses en CSV
```

---

### **🔍 ÉTAPE 2 : VÉRIFICATION (1 min)**

**Dans Supabase SQL Editor :**

```sql
-- Copier-coller et exécuter
SELECT COUNT(*) as nb_users FROM gamification_data;
SELECT * FROM houses;
```

□ Nombre d'utilisateurs noté : ______
□ Maisons affichées : Harmonis, Elaris, Doloris, Solencia

---

### **🚀 ÉTAPE 3 : MIGRATION NIVEAUX (2 min)**

**Fichier : `migration_20_niveaux.sql`**

```sql
-- 1. VOIR l'impact (sans modifier)
SELECT 
  user_id,
  total_xp,
  current_level as actuel,
  LEAST(FLOOR(SQRT(total_xp / 100.0)), 20) as nouveau
FROM gamification_data
LIMIT 10;
```

□ Résultat vérifié

```sql
-- 2. APPLIQUER la migration
UPDATE gamification_data
SET current_level = LEAST(FLOOR(SQRT(total_xp / 100.0)), 20);
```

□ Migration appliquée
□ Message : "UPDATE X" affiché

---

### **🏠 ÉTAPE 4 : NIVEAUX MAISONS (3 min)**

**Fichier : `add_level_houses.sql`**

```sql
-- 1. Ajouter colonne
ALTER TABLE houses ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Calculer niveaux initiaux
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- 3. Créer fonction trigger
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer trigger
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();
```

□ Colonne level ajoutée
□ Fonction créée
□ Trigger créé

---

### **🧪 ÉTAPE 5 : TEST SQL (1 min)**

```sql
-- Tester le trigger
SELECT name, total_xp, level FROM houses WHERE name = 'Harmonis';

UPDATE houses SET total_xp = total_xp + 500 WHERE name = 'Harmonis';

SELECT name, total_xp, level FROM houses WHERE name = 'Harmonis';
-- Le level doit avoir changé !
```

□ Level se met à jour automatiquement ✅

---

### **💻 ÉTAPE 6 : TEST APPLICATION (2 min)**

1. **Ouvrir l'app**
   ```bash
   npm run dev
   ```

2. **Aller sur page gamification**
   
3. **Ouvrir console (F12)**

□ Pas d'erreur rouge
□ Niveau affiché entre 1 et 20
□ Titre correct (ex: "Physiothérapeute Diplômé·e")
□ Maison affichée

---

### **🎉 ÉTAPE 7 : TEST COMPLET (3 min)**

**Dans Supabase :**

```sql
-- Remplace TON-USER-ID par ton vrai ID
-- Ton ID est dans la console : "Chargement pour: [ID]"

-- 1. Voir ton état actuel
SELECT user_id, total_xp, current_level 
FROM gamification_data 
WHERE user_id = 'TON-USER-ID';

-- 2. Te mettre à un palier
UPDATE gamification_data
SET total_xp = 1600, current_level = 5
WHERE user_id = 'TON-USER-ID';
```

□ Ton XP modifié

**Dans l'app :**
- Recharge la page
- Ajoute 1 XP (fais une action)

□ Notification "PALIER 5 ATTEINT !" visible
□ Toast notification apparaît
□ Console affiche "+500 XP ajoutés à [maison]"

---

### **📊 ÉTAPE 8 : VÉRIFICATION FINALE (1 min)**

```sql
-- Statistiques
SELECT 
  CASE
    WHEN current_level BETWEEN 1 AND 5 THEN 'Novice'
    WHEN current_level BETWEEN 6 AND 10 THEN 'Intermédiaire'
    WHEN current_level BETWEEN 11 AND 15 THEN 'Avancé'
    ELSE 'Maître'
  END as phase,
  COUNT(*) as users
FROM gamification_data
GROUP BY phase;

-- Classement maisons
SELECT name, total_xp, level 
FROM houses 
ORDER BY total_xp DESC;
```

□ Statistiques cohérentes
□ Maisons ont un niveau
□ Tout fonctionne ! 🎉

---

## 🚨 SI PROBLÈME

### **Erreur : Column does not exist**
```sql
-- Ajouter la colonne manquante
ALTER TABLE houses ADD COLUMN level INTEGER DEFAULT 1;
```

### **Niveaux à 0**
```sql
-- Recalculer
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)));
```

### **Maison level null**
```sql
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);
```

---

## ✅ VALIDATION FINALE

**Tous les points cochés ? Félicitations !**

Tu as maintenant :
- ✅ 20 niveaux physiothérapie
- ✅ 4 paliers avec bonus
- ✅ Niveaux de maison
- ✅ Notifications automatiques
- ✅ Système complet opérationnel

**Temps total : ~15 minutes**

---

## 📝 NOTES

**Ton User ID :** ___________________

**État avant migration :**
- Niveau : _____
- XP : _____
- Maison : _____

**État après migration :**
- Niveau : _____
- XP : _____
- Maison : _____
- Niveau maison : _____

---

**C'est parti ! Commence par l'étape 1** 🚀
