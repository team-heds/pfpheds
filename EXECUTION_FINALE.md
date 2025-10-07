# 🚀 EXÉCUTION FINALE - SCRIPTS SQL CORRIGÉS

## ⭐ NOUVEAU : Scripts adaptés à ta structure (avec house_id)

**Utilise le fichier : `SCRIPTS_CORRIGES.sql`**

## ⚠️ IMPORTANT : ORDRE D'EXÉCUTION

Exécute ces scripts **DANS CET ORDRE** dans Supabase SQL Editor :

---

## 📋 SCRIPT 1 : CORRECTION NIVEAUX INDIVIDUELS

**Objectif** : Corriger les niveaux à 0 et appliquer le système 20 niveaux

```sql
-- ================================================
-- CORRECTION ET MIGRATION NIVEAUX INDIVIDUELS
-- ================================================

-- 1. CORRIGER les niveaux à 0 (forcer minimum 1)
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)));

-- 2. Vérifier que tous les niveaux sont corrects
SELECT 
  user_id,
  total_xp,
  current_level,
  CASE
    WHEN current_level BETWEEN 1 AND 20 THEN '✅ OK'
    ELSE '❌ Hors limites'
  END as status
FROM gamification_data
ORDER BY total_xp DESC
LIMIT 10;

-- 3. Voir la répartition par niveau
SELECT 
  current_level,
  COUNT(*) as nombre_utilisateurs
FROM gamification_data
GROUP BY current_level
ORDER BY current_level;
```

**✅ Résultat attendu** : Tous les niveaux entre 1 et 20

---

## 📋 SCRIPT 2 : SYNCHRONISER XP DES MAISONS

**Objectif** : Calculer les XP des maisons depuis les XP des étudiants

```sql
-- ================================================
-- SYNCHRONISER XP MAISONS DEPUIS UTILISATEURS
-- ================================================

-- 1. Voir l'état AVANT
SELECT name, total_xp, member_count FROM houses;

-- 2. D'ABORD : Vérifier quelle colonne contient la maison
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gamification_data'
ORDER BY ordinal_position;

-- 3. METTRE À JOUR les XP des maisons
-- ⚠️ REMPLACE "maison" par le nom de la colonne que tu vois ci-dessus
-- Si c'est house_id, utilise house_id. Si c'est house_name, utilise house_name
UPDATE houses h
SET 
  total_xp = COALESCE((
    SELECT SUM(total_xp)
    FROM gamification_data g
    WHERE g.house_id = h.id  -- OU LOWER(g.house_name) = h.name
  ), 0),
  member_count = COALESCE((
    SELECT COUNT(*)
    FROM gamification_data g
    WHERE g.house_id = h.id  -- OU LOWER(g.house_name) = h.name
  ), 0);

-- 3. Voir le résultat APRÈS
SELECT 
  name,
  total_xp,
  member_count,
  (total_xp / NULLIF(member_count, 0))::INTEGER as xp_par_membre
FROM houses
ORDER BY total_xp DESC;
```

**✅ Résultat attendu** : Chaque maison a le total XP de ses membres

---

## 📋 SCRIPT 3 : AJOUTER NIVEAUX AUX MAISONS

**Objectif** : Ajouter la colonne level et le trigger automatique

```sql
-- ================================================
-- SYSTÈME NIVEAUX MAISONS
-- ================================================

-- 1. Ajouter colonne level
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Calculer niveaux initiaux (formule: √(XP/10000) + 1)
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- 3. Créer fonction de calcul automatique
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer trigger sur changement de total_xp
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();

-- 5. Vérifier le résultat
SELECT 
  name,
  total_xp,
  level,
  member_count,
  CASE
    WHEN level = 1 THEN 'Maison Naissante'
    WHEN level = 2 THEN 'Maison Active'
    WHEN level = 3 THEN 'Maison Dynamique'
    WHEN level = 4 THEN 'Maison Brillante'
    WHEN level >= 5 THEN 'Maison d''Excellence'
  END as titre
FROM houses
ORDER BY total_xp DESC;
```

**✅ Résultat attendu** : Chaque maison a un niveau calculé automatiquement

---

## 📋 SCRIPT 4 : TESTER LE SYSTÈME

**Objectif** : Vérifier que tout fonctionne

```sql
-- ================================================
-- TESTS FINAUX
-- ================================================

-- 1. Test trigger maison
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- Ajouter 1000 XP
UPDATE houses SET total_xp = total_xp + 1000 WHERE name = 'harmonis';

-- Le level doit avoir changé automatiquement
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- 2. Statistiques globales
SELECT 
  'Utilisateurs' as type,
  COUNT(*) as total,
  SUM(total_xp) as total_xp,
  AVG(total_xp)::INTEGER as xp_moyen
FROM gamification_data

UNION ALL

SELECT 
  'Maisons' as type,
  COUNT(*) as total,
  SUM(total_xp) as total_xp,
  AVG(total_xp)::INTEGER as xp_moyen
FROM houses;

-- 3. Top 5 étudiants par maison
WITH top_students AS (
  SELECT 
    maison,
    user_id,
    total_xp,
    current_level,
    ROW_NUMBER() OVER (PARTITION BY maison ORDER BY total_xp DESC) as rank
  FROM gamification_data
  WHERE maison IS NOT NULL
)
SELECT 
  maison,
  user_id,
  total_xp,
  current_level
FROM top_students
WHERE rank <= 5
ORDER BY maison, rank;
```

---

## ✅ CHECKLIST D'EXÉCUTION

Coche au fur et à mesure :

- [ ] **Script 1** : Correction niveaux individuels exécuté
- [ ] **Vérification** : Tous les niveaux entre 1 et 20
- [ ] **Script 2** : Synchronisation XP maisons exécuté
- [ ] **Vérification** : Maisons ont les XP de leurs membres
- [ ] **Script 3** : Niveaux maisons ajoutés
- [ ] **Vérification** : Colonne level existe et trigger fonctionne
- [ ] **Script 4** : Tests passés avec succès
- [ ] **Application** : Page gamification recharge sans erreur
- [ ] **Application** : Niveaux affichés correctement
- [ ] **Application** : Maisons ont un niveau visible

---

## 🎯 RÉSULTATS ATTENDUS

### **Après Script 1**
```
✅ Tous les utilisateurs ont niveau 1 minimum
✅ Formule appliquée: niveau = √(XP/100)
✅ Niveau max = 20
```

### **Après Script 2**
```
✅ Harmonis: 2000 XP (40 membres × 50 XP)
✅ Elaris: 1800 XP (36 membres × 50 XP)
✅ Doloris: 2200 XP (44 membres × 50 XP)
✅ Solencia: 1900 XP (38 membres × 50 XP)
```

### **Après Script 3**
```
✅ Toutes les maisons: niveau 1
✅ Trigger actif sur changements XP
✅ Calcul automatique niveau maison
```

---

## 🚨 SI PROBLÈME

### **Niveaux toujours à 0**
```sql
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(GREATEST(0, total_xp) / 100.0)));
```

### **Maisons sans XP**
```sql
-- Forcer recalcul
UPDATE houses h
SET total_xp = (
  SELECT COALESCE(SUM(total_xp), 0)
  FROM gamification_data
  WHERE LOWER(maison) = h.name
);
```

### **Trigger pas créé**
```sql
-- Vérifier si trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_house_level';

-- Si vide, réexécuter script 3
```

---

## ⏱️ TEMPS ESTIMÉ : 5 MINUTES

1. Script 1 : 1 min
2. Script 2 : 1 min
3. Script 3 : 2 min
4. Tests : 1 min

---

**C'EST PARTI ! Exécute les scripts dans l'ordre** 🚀
