# 🔧 Guide: Appliquer la Migration Praticien

## ⚠️ Important

Avant de tester la fonctionnalité d'assignation des praticiens formateurs, vous **DEVEZ** appliquer la migration SQL.

---

## 📋 Étapes

### 1. **Ouvrir Supabase Dashboard**
```
1. Aller sur https://supabase.com
2. Se connecter
3. Ouvrir votre projet pfpheds
4. Aller dans "SQL Editor"
```

### 2. **Copier la Migration**
Fichier: `supabase_migrations/20251211_add_praticien_to_assignment.sql`

```sql
-- Migration: Ajouter le praticien formateur assigné pour chaque assignation
ALTER TABLE student_result_vote 
ADD COLUMN IF NOT EXISTS assigned_praticien_id bigint NULL;

CREATE INDEX IF NOT EXISTS idx_student_result_vote_praticien 
ON student_result_vote(assigned_praticien_id);

COMMENT ON COLUMN student_result_vote.assigned_praticien_id IS 
'ID du praticien formateur assigné spécifiquement à cet étudiant pour cette place. NULL si pas encore assigné.';
```

### 3. **Exécuter la Migration**
```
1. Coller le SQL dans l'éditeur
2. Cliquer sur "Run" (ou Ctrl+Enter)
3. Vérifier le message de succès
```

### 4. **Vérifier l'Application**
```sql
-- Vérifier que la colonne existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_result_vote' 
AND column_name = 'assigned_praticien_id';
```

**Résultat attendu:**
```
column_name            | data_type | is_nullable
-----------------------|-----------|------------
assigned_praticien_id  | bigint    | YES
```

---

## ✅ Vérifications

### Vérification 1: Structure Table
```sql
SELECT * FROM student_result_vote LIMIT 1;
```
→ La colonne `assigned_praticien_id` doit apparaître (avec NULL)

### Vérification 2: Index Créé
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'student_result_vote' 
AND indexname LIKE '%praticien%';
```
→ `idx_student_result_vote_praticien` doit apparaître

### Vérification 3: Commentaire
```sql
SELECT col_description('student_result_vote'::regclass, 
  (SELECT ordinal_position FROM information_schema.columns 
   WHERE table_name='student_result_vote' 
   AND column_name='assigned_praticien_id'));
```
→ Le commentaire doit s'afficher

---

## 🧪 Test Rapide

### 1. **Assigner un Praticien Manuellement**
```sql
-- Trouver une assignation
SELECT id, user_id, assigned_place_name 
FROM student_result_vote 
LIMIT 1;

-- Trouver un praticien
SELECT id, nom, prenom 
FROM praticiens_formateurs 
LIMIT 1;

-- Faire l'assignation
UPDATE student_result_vote
SET assigned_praticien_id = 123  -- Remplacer par un ID réel
WHERE id = 'abc123';  -- Remplacer par un ID réel

-- Vérifier
SELECT 
  assigned_place_name,
  assigned_praticien_id
FROM student_result_vote
WHERE id = 'abc123';
```

### 2. **Test dans l'Interface**
```
1. Ouvrir PlacesAssignmentView
2. Sélectionner PFP1A + 2026
3. Trouver une ligne
4. Ouvrir le dropdown "Praticien Formateur"
5. Sélectionner un praticien
6. Vérifier notification de succès
7. Rafraîchir la page
8. Vérifier que le praticien est toujours sélectionné
```

---

## 🚨 En Cas de Problème

### Erreur: "column already exists"
```
✅ C'est OK ! La colonne existe déjà.
→ La migration utilise IF NOT EXISTS pour éviter les doublons
```

### Erreur: "permission denied"
```
❌ Vous n'avez pas les droits
→ Utiliser un compte admin Supabase
→ Ou demander à quelqu'un avec les droits
```

### Erreur: "table not found"
```
❌ La table student_result_vote n'existe pas
→ Vérifier le nom de la table
→ Appliquer d'abord la migration de création de table
```

### Le Dropdown Ne Se Charge Pas
```
1. Ouvrir Console (F12)
2. Chercher des erreurs
3. Vérifier que les praticiens sont chargés:
   [3/6] Chargement des praticiens formateurs...
   [OK] 45 praticiens chargés
4. Vérifier la structure de la colonne
```

---

## 📊 Données Avant/Après

### AVANT la Migration
```javascript
{
  id: "abc123",
  user_id: "student456",
  assigned_place_id: "place789",
  // ❌ Pas de praticien assigné
}
```

### APRÈS la Migration
```javascript
{
  id: "abc123",
  user_id: "student456",
  assigned_place_id: "place789",
  assigned_praticien_id: 123  // ✅ Praticien assigné
}
```

---

## 🔄 Rollback (Si Nécessaire)

Si vous voulez annuler la migration :

```sql
-- Supprimer l'index
DROP INDEX IF EXISTS idx_student_result_vote_praticien;

-- Supprimer la colonne
ALTER TABLE student_result_vote 
DROP COLUMN IF EXISTS assigned_praticien_id;
```

⚠️ **Attention**: Cela supprimera toutes les assignations de praticiens !

---

## ✅ Checklist Finale

- [ ] Migration SQL exécutée
- [ ] Colonne `assigned_praticien_id` créée
- [ ] Index créé
- [ ] Commentaire ajouté
- [ ] Test manuel réussi
- [ ] Dropdown fonctionne dans l'interface
- [ ] Sauvegarde fonctionne
- [ ] Rafraîchissement conserve la sélection

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs console** (F12)
2. **Vérifier la structure SQL**
3. **Tester manuellement en SQL**
4. **Contacter le support technique**

---

**Date**: 11 décembre 2025  
**Auteur**: Cascade AI
