# 🔍 Diagnostic Erreur Praticiens Formateurs

## 🐛 Erreur Actuelle

```
api2.hedsvs.ch/rest/v1/praticiens_formateurs?columns=%22nom%22%2C%22prenom%22%2C%22mail%22%2C%22institution%22%2C%22localite%22&select=*
Failed to load resource: the server responded with a status of 400 ()
```

## ✅ Vérifications à Faire

### **1. Vérifier que la Table Existe**

Dans **Supabase Dashboard** → **Table Editor** :
- [ ] La table `praticiens_formateurs` est visible
- [ ] Elle a les colonnes : `id`, `nom`, `prenom`, `mail`, `institution`, `localite`, `created_at`, `updated_at`

### **2. Vérifier les Permissions RLS**

Dans **Supabase Dashboard** → **Authentication** → **Policies** :
- [ ] RLS est activé sur `praticiens_formateurs`
- [ ] Il y a des policies pour SELECT, INSERT, UPDATE, DELETE
- [ ] Les policies ne sont pas trop restrictives

**Pour vérifier, exécute ce SQL :**
```sql
SELECT * FROM pg_policies WHERE tablename = 'praticiens_formateurs';
```

### **3. Vérifier ton Rôle Utilisateur**

Dans **Supabase Dashboard** → **Table Editor** → `user_profiles` :
- [ ] Ton utilisateur (`antoine.quarroz@hevs.ch`) existe dans `user_profiles`
- [ ] `role` = `'admin'` ou `'editor'`
- [ ] `is_active` = `true`

**Pour vérifier, exécute ce SQL :**
```sql
SELECT user_id, email, role, is_active, permissions
FROM user_profiles
WHERE email = 'antoine.quarroz@hevs.ch';
```

### **4. Tester l'Insertion Manuellement**

Dans **Supabase SQL Editor**, teste une insertion manuelle :
```sql
INSERT INTO praticiens_formateurs (nom, prenom, mail, institution, localite)
VALUES ('Test', 'Debug', 'test@test.com', 'HEdS Test', 'Fribourg')
RETURNING *;
```

- [ ] Si ça fonctionne → Problème de permissions RLS
- [ ] Si ça échoue → Problème de structure de table

## 🔧 Solutions selon l'Erreur

### **Cas 1 : Permissions RLS Manquantes**
➡️ **Exécute** : `supabase_migrations/fix_praticiens_formateurs_permissions.sql`

### **Cas 2 : user_profiles Incomplet**
```sql
-- Vérifier que tu as un profil
SELECT * FROM user_profiles WHERE user_id = auth.uid();

-- Si aucun résultat, créer le profil
INSERT INTO user_profiles (user_id, email, role, is_active, permissions)
VALUES (
  auth.uid(),
  'antoine.quarroz@hevs.ch',
  'admin',
  true,
  ARRAY['manage_users', 'manage_institutions', 'manage_places', 'manage_votations']
);
```

### **Cas 3 : Structure de Table Incorrecte**
```sql
-- Vérifier les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'praticiens_formateurs'
ORDER BY ordinal_position;
```

## 🚨 Erreur Spécifique : Status 400

L'erreur 400 suggère généralement :
1. **Paramètres de requête invalides** (problème dans l'URL)
2. **Permissions RLS qui rejettent la requête**
3. **Contraintes de validation non respectées**

### **Debug Avancé dans Supabase**

1. **Logs en temps réel** :
   - Va dans **Logs** → **API Logs**
   - Filtre par `POST /rest/v1/praticiens_formateurs`
   - Regarde le message d'erreur complet

2. **Teste avec curl** (dans terminal) :
```bash
curl -X POST 'https://api2.hedsvs.ch/rest/v1/praticiens_formateurs' \
  -H "apikey: TON_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer TON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Debug",
    "mail": "test@test.com",
    "institution": "HEdS",
    "localite": "Fribourg"
  }'
```

## 📊 Résultat Attendu

Après correction, tu devrais voir dans la console :
```
✅ [PRATICIENS STORE] Praticien created successfully in Supabase: 123
```

Et dans Supabase Table Editor, le nouveau praticien doit apparaître.

## 💡 Solution Temporaire

Si rien ne fonctionne, **désactive temporairement RLS** pour tester :
```sql
ALTER TABLE praticiens_formateurs DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATTENTION** : Ne fais ça que pour tester ! Réactive ensuite RLS :
```sql
ALTER TABLE praticiens_formateurs ENABLE ROW LEVEL SECURITY;
```
