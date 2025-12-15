# 🚀 Guide : Appliquer la Migration SQL

## ⚠️ IMPORTANT : Cette étape est OBLIGATOIRE

Sans cette migration, l'algorithme ne peut PAS fonctionner !

---

## 📋 Méthode 1 : Supabase Dashboard (RECOMMANDÉ)

### Étape 1 : Ouvrir Supabase Dashboard
1. Aller sur : **https://supabase.com/dashboard**
2. Se connecter si nécessaire
3. Sélectionner votre projet

### Étape 2 : Ouvrir SQL Editor
1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur le bouton **"+ New query"** en haut

### Étape 3 : Copier le fichier de migration
1. Ouvrir le fichier : `supabase_migrations/20251211_create_student_result_vote.sql`
2. Sélectionner **TOUT le contenu** (Cmd+A ou Ctrl+A)
3. Copier (Cmd+C ou Ctrl+C)

### Étape 4 : Coller et exécuter
1. Coller dans l'éditeur SQL (Cmd+V ou Ctrl+V)
2. Cliquer sur le bouton **"RUN"** en bas à droite
   - Ou utiliser le raccourci : **Cmd+Enter** (Mac) ou **Ctrl+Enter** (Windows)

### Étape 5 : Vérifier le résultat
Vous devriez voir :
```
Success. No rows returned
```

✅ **C'est normal !** Cela signifie que la migration s'est bien exécutée.

---

## 🔍 Vérification

### Test rapide
Dans le SQL Editor, exécuter cette requête :

```sql
-- Vérifier que la table existe
SELECT * FROM student_result_vote LIMIT 1;
```

**Résultat attendu** : `Success. No rows returned` (la table existe mais est vide)

### Test de la fonction batch
```sql
-- Vérifier que la fonction batch existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'batch_upsert_student_results';
```

**Résultat attendu** : Une ligne avec `batch_upsert_student_results`

---

## 🔄 Après la migration

### 1. Redémarrer le backend
```bash
cd backend
node index.js
```

### 2. Tester l'algorithme
1. Ouvrir l'interface web
2. Aller dans la page de votation PFP
3. Sélectionner **Année** et **PFP**
4. Cliquer sur **"Démarrer l'algorithme"**

### 3. Vérifier les logs
Dans le terminal backend, vous devriez voir :
```
🚀 Démarrage algorithme d'attribution: PFP1A - 2026
💾 Enregistrement de X résultats en batch...
✅ Batch insert: X succès, 0 erreurs
✅ Algorithme terminé: {...}
```

---

## ❌ Problèmes courants

### Erreur : "relation already exists"
**Cause** : La migration a déjà été partiellement appliquée

**Solution** : 
```sql
-- Supprimer la table existante
DROP TABLE IF EXISTS student_result_vote CASCADE;

-- Puis ré-exécuter toute la migration
```

### Erreur : "permission denied"
**Cause** : Vous n'avez pas les droits admin sur Supabase

**Solution** : Demander à un admin du projet de faire la migration

### Erreur : "function already exists"
**Cause** : Certaines fonctions existent déjà

**Solution** : C'est normal, les fonctions utilisent `CREATE OR REPLACE`

---

## 📝 Méthode 2 : CLI Supabase (Avancé)

Si vous avez Supabase CLI installé :

```bash
# Se connecter au projet
supabase link --project-ref VOTRE_PROJECT_REF

# Appliquer la migration
supabase db push

# Ou exécuter directement le fichier
supabase db execute --file supabase_migrations/20251211_create_student_result_vote.sql
```

---

## 📞 Support

### Si la migration échoue complètement

1. **Copier l'erreur exacte** affichée dans Supabase
2. **Vérifier les permissions** du projet
3. **Contacter le support** avec :
   - Le message d'erreur complet
   - La ligne SQL qui pose problème
   - Votre rôle dans le projet

---

## ✅ Checklist finale

Après avoir appliqué la migration, vérifier :

- [ ] Table `student_result_vote` existe
- [ ] Fonction `upsert_student_result` existe
- [ ] Fonction `batch_upsert_student_results` existe
- [ ] Fonction `get_student_result` existe
- [ ] Fonction `get_algorithm_results` existe
- [ ] Vue `result_statistics` existe
- [ ] Policies RLS sont activées
- [ ] Backend redémarré
- [ ] Algorithme fonctionne sans erreur

---

## 🎯 Résultat attendu

Après la migration réussie, l'algorithme devrait :

1. ✅ S'exécuter en **< 1 seconde**
2. ✅ Afficher `💾 Enregistrement de X résultats en batch...`
3. ✅ Afficher `✅ Batch insert: X succès, 0 erreurs`
4. ✅ Enregistrer tous les résultats dans la base de données
5. ✅ Retourner des statistiques complètes

---

**Date** : 11 décembre 2025  
**Version de la migration** : 20251211  
**Fichier** : `supabase_migrations/20251211_create_student_result_vote.sql`
