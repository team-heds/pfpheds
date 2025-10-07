# 🚀 TUTORIEL COMPLET - MISE EN PLACE SYSTÈME DE NIVEAUX

## ✅ PRÉREQUIS

Avant de commencer, assure-toi d'avoir :
- ✅ Accès à Supabase (https://supabase.com)
- ✅ Ton projet Supabase ouvert
- ✅ Les fichiers SQL prêts dans ton dossier

---

## 📋 ÉTAPE 1 : BACKUP DE TA BASE (SÉCURITÉ)

### **1.1 Exporter tes données actuelles**

Dans Supabase :
1. Va dans **"Table Editor"**
2. Sélectionne la table `gamification_data`
3. Clique sur **"Export"** → **"CSV"**
4. Fais pareil pour `houses`

**✅ Tu as maintenant une sauvegarde si besoin de revenir en arrière**

---

## 📋 ÉTAPE 2 : VÉRIFIER TA STRUCTURE ACTUELLE

### **2.1 Ouvre SQL Editor dans Supabase**

1. Clique sur **"SQL Editor"** dans le menu gauche
2. Clique sur **"+ New query"**

### **2.2 Exécute ce script de vérification**

```sql
-- Vérifier gamification_data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gamification_data'
ORDER BY ordinal_position;

-- Vérifier houses
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'houses'
ORDER BY ordinal_position;

-- Voir combien d'utilisateurs
SELECT COUNT(*) as nb_users FROM gamification_data;

-- Voir les maisons actuelles
SELECT * FROM houses;
```

**📝 Note les résultats** (nombre d'utilisateurs, structure des tables)

---

## 📋 ÉTAPE 3 : MIGRATION NIVEAUX INDIVIDUELS (20 niveaux)

### **3.1 Voir l'impact AVANT la migration**

Copie et exécute ce code :

```sql
-- VOIR l'impact de la migration (sans modifier)
SELECT 
  user_id,
  total_xp,
  current_level as niveau_actuel,
  LEAST(FLOOR(SQRT(total_xp / 100.0)), 20) as nouveau_niveau,
  LEAST(FLOOR(SQRT(total_xp / 100.0)), 20) - current_level as difference
FROM gamification_data
ORDER BY total_xp DESC
LIMIT 20;
```

**📊 Résultat attendu :**
- Tu vois une colonne `difference`
- Si négative : niveau va baisser
- Si positive : niveau va augmenter
- Si 0 : pas de changement

### **3.2 APPLIQUER la migration**

Si tout semble OK, exécute :

```sql
-- MIGRATION VERS SYSTÈME 20 NIVEAUX
UPDATE gamification_data
SET current_level = LEAST(FLOOR(SQRT(total_xp / 100.0)), 20)
WHERE current_level != LEAST(FLOOR(SQRT(total_xp / 100.0)), 20);

-- Vérifier que tout est bon
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
```

**✅ Checkpoint 1 : Tous les niveaux sont entre 1 et 20** 
---

## 📋 ÉTAPE 4 : AJOUTER NIVEAUX DE MAISON

### **4.1 Ajouter la colonne level aux maisons**

```sql
-- Ajouter colonne level
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Calculer niveau initial basé sur total_xp
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- Vérifier
SELECT name, total_xp, level FROM houses;
```

**✅ Checkpoint 2 : Chaque maison a maintenant un niveau**

### **4.2 Créer le trigger automatique**

```sql
-- Fonction pour calcul auto du niveau
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur mise à jour total_xp
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();
```

**✅ Checkpoint 3 : Le trigger est créé**

---

## 📋 ÉTAPE 5 : TESTER LE SYSTÈME

### **5.1 Test ajout XP à une maison**

```sql
-- Voir état actuel Harmonis
SELECT name, total_xp, level FROM houses WHERE name = 'Harmonis';

-- Ajouter 500 XP (simule un étudiant niveau 5)
UPDATE houses 
SET total_xp = total_xp + 500 
WHERE name = 'Harmonis';

-- Vérifier que le niveau est recalculé auto
SELECT name, total_xp, level FROM houses WHERE name = 'Harmonis';
```

**✅ Checkpoint 4 : Le niveau se met à jour automatiquement !**

---

## 📋 ÉTAPE 6 : VOIR LA TABLE DE RÉFÉRENCE

### **6.1 Niveaux individuels**

```sql
-- Table des 20 niveaux individuels
WITH niveau_config AS (
  SELECT 
    level as niveau,
    POWER(level, 2) * 100 as xp_minimum,
    CASE level
      WHEN 1 THEN 'Étudiant·e Physio'
      WHEN 5 THEN 'Assistant·e Physio'
      WHEN 8 THEN 'Physiothérapeute Diplômé·e'
      WHEN 10 THEN 'Spécialiste'
      WHEN 15 THEN 'Cadre de Santé Physio'
      WHEN 20 THEN 'Légende Physiothérapie HES'
      ELSE 'Niveau ' || level
    END as titre
  FROM generate_series(1, 20) as level
)
SELECT * FROM niveau_config;
```

### **6.2 Niveaux de maison**

```sql
-- Table des 10 niveaux de maison
WITH niveau_maison AS (
  SELECT 
    level as niveau,
    POWER(level - 1, 2) * 10000 as xp_minimum,
    CASE
      WHEN level = 1 THEN 'Maison Naissante'
      WHEN level = 2 THEN 'Maison Active'
      WHEN level = 3 THEN 'Maison Dynamique'
      WHEN level = 4 THEN 'Maison Brillante'
      WHEN level = 5 THEN 'Maison d''Excellence'
      WHEN level >= 6 THEN 'Maison Prestigieuse'
    END as titre
  FROM generate_series(1, 10) as level
)
SELECT * FROM niveau_maison;
```

---

## 📋 ÉTAPE 7 : TESTER DANS L'APPLICATION

### **7.1 Ouvrir l'application**

1. Lance ton application Vue
2. Va sur la page gamification de ton profil
3. Ouvre la console navigateur (F12)

### **7.2 Vérifier les logs**

Dans la console, tu dois voir :
```
🔍 Chargement des stats gamification Supabase pour: [ton-id]
✅ Données gamification Supabase chargées: {...}
🏆 X badges chargés...
🎯 X défis chargés...
🗺️ X quêtes chargées...
✅ Toutes les données gamification chargées avec succès
```

### **7.3 Vérifier l'affichage**

Tu dois voir :
- ✅ Ton niveau affiché (1-20)
- ✅ Ton titre (ex: "Physiothérapeute Diplômé·e")
- ✅ Ta barre de progression XP
- ✅ Le nom de ta maison

---

## 📋 ÉTAPE 8 : TESTER MONTÉE DE NIVEAU

### **8.1 Simuler montée de niveau**

Dans Supabase SQL :

```sql
-- Voir ton XP actuel
SELECT user_id, total_xp, current_level 
FROM gamification_data 
WHERE user_id = 'TON-USER-ID';  -- Remplace par ton ID

-- Ajouter 1000 XP (pour tester)
UPDATE gamification_data
SET total_xp = total_xp + 1000
WHERE user_id = 'TON-USER-ID';  -- Remplace par ton ID
```

### **8.2 Recharger la page**

1. Recharge ta page gamification
2. Vérifie la console :
   - Si passage palier → Message `🎉 NIVEAU UP !`
   - Notification toast visible
   - Points ajoutés à la maison

---

## 📋 ÉTAPE 9 : VÉRIFIER BONUS MAISON

### **9.1 Vérifier les points de maison**

```sql
-- Voir historique XP de ta maison
SELECT name, total_xp, level 
FROM houses 
ORDER BY total_xp DESC;
```

### **9.2 Test complet palier**

```sql
-- Mettre un user exactement au palier 5 (1600 XP)
UPDATE gamification_data
SET total_xp = 1600,
    current_level = 5
WHERE user_id = 'TON-USER-ID';

-- Recharge l'app et ajoute 1 XP pour déclencher le watcher
-- Tu devrais voir la notification palier !
```

---

## 📋 ÉTAPE 10 : STATISTIQUES FINALES

### **10.1 Vue d'ensemble**

```sql
-- Répartition par phase
SELECT 
  CASE
    WHEN current_level BETWEEN 1 AND 5 THEN 'Novice'
    WHEN current_level BETWEEN 6 AND 10 THEN 'Intermédiaire'
    WHEN current_level BETWEEN 11 AND 15 THEN 'Avancé'
    WHEN current_level BETWEEN 16 AND 20 THEN 'Maître'
  END as phase,
  COUNT(*) as nombre_users,
  AVG(total_xp)::INTEGER as xp_moyen
FROM gamification_data
GROUP BY phase
ORDER BY MIN(current_level);

-- Classement des maisons
SELECT 
  name,
  total_xp,
  level,
  member_count
FROM houses
ORDER BY total_xp DESC;
```

---

## ✅ CHECKLIST FINALE

Coche au fur et à mesure :

### **Base de données** ✅
- [ ] Backup gamification_data fait
- [ ] Backup houses fait
- [ ] Migration 20 niveaux appliquée
- [ ] Colonne level ajoutée aux maisons
- [ ] Trigger update_house_level créé
- [ ] Tests SQL passés

### **Application** ✅
- [ ] Page gamification charge sans erreur
- [ ] Niveau affiché correctement (1-20)
- [ ] Titre de niveau correct
- [ ] Barre de progression XP visible
- [ ] Nom de maison affiché

### **Fonctionnalités** ✅
- [ ] Montée de niveau testée
- [ ] Notification palier fonctionne
- [ ] Points maison ajoutés
- [ ] Niveau maison calculé
- [ ] Toast notifications visibles

---

## 🐛 DÉPANNAGE

### **Problème : Niveaux à 0 ou null**

```sql
-- Corriger les niveaux null
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)))
WHERE current_level IS NULL OR current_level < 1;
```

### **Problème : Maison level null**

```sql
-- Corriger niveau maison
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1)
WHERE level IS NULL OR level < 1;
```

### **Problème : Console erreur RLS**

```sql
-- Vérifier les politiques RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'gamification_data';

-- Si besoin, activer lecture pour tous (temporaire)
ALTER TABLE gamification_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON gamification_data FOR SELECT USING (true);
```

---

## 🎉 FÉLICITATIONS !

Si toutes les étapes sont cochées, **ton système est opérationnel !**

### **Ce qui fonctionne maintenant :**

✅ Système 20 niveaux pour étudiants
✅ Titres physiothérapie adaptés
✅ 4 paliers avec récompenses (5, 10, 15, 20)
✅ Bonus XP automatiques pour maisons
✅ Niveaux de maison (1-10)
✅ Notifications toast niveau up
✅ Calcul automatique des niveaux
✅ Watcher temps réel sur XP

---

## 📚 FICHIERS DE RÉFÉRENCE

- **SYSTEME_20_NIVEAUX_PHYSIO.md** → Documentation complète
- **SYSTEME_DOUBLE_NIVEAU.md** → Système individuel + maison
- **RESUME_FINAL_PHYSIO.md** → Résumé technique
- **levelsConfig.js** → Configuration code
- **migration_20_niveaux.sql** → Script migration
- **add_level_houses.sql** → Script maisons

---

**Tu es prêt ! Bon courage avec ton système de gamification** 🚀✨
