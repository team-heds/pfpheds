# 🔧 Configuration variables d'environnement Supabase

## ❌ Problème actuel

Le script `importPlaces.js` cherche `VITE_SUPABASE_REST_URL` mais ton `.env` utilise probablement une autre convention.

---

## ✅ Solution : Ajouter les variables manquantes

### Option 1 : Convention Standard Supabase (recommandé)

Ajoute dans ton `.env` :

```env
# URL de base Supabase (sans /rest/v1)
VITE_SUPABASE_URL=https://api2.hedsvs.ch

# Clé anonyme (anon key)
VITE_SUPABASE_KEY=eyJhbGci...ton-anon-key...
```

**Les scripts vont automatiquement ajouter `/rest/v1` quand nécessaire.**

### Option 2 : Ajouter la variable REST_URL (legacy)

Si tu veux garder la compatibilité avec `institutionsStore.js` existant :

```env
# URL complète avec /rest/v1
VITE_SUPABASE_REST_URL=https://api2.hedsvs.ch/rest/v1

# Clé anonyme
VITE_SUPABASE_KEY=eyJhbGci...ton-anon-key...
```

---

## 🔍 Comment trouver ces valeurs ?

### Via Supabase Dashboard

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Copie :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_KEY`

### Exemple

Si ton **Project URL** est : `https://xyzabcdef.supabase.co`

```env
VITE_SUPABASE_URL=https://xyzabcdef.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4ODk2MDAwLCJleHAiOjE5OTQ0NzIwMDB9.abcdef123456789
```

---

## 🛠️ Vérification

Après avoir ajouté les variables, teste avec :

```bash
node backend/supabase/importPlaces.js
```

**Tu devrais voir :**
```
✅ Variables chargées
🔄 Démarrage de l'import...
```

Au lieu de :
```
❌ Variables d'environnement manquantes
```

---

## 📋 Résumé des variables Supabase

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de base Supabase | `https://api2.hedsvs.ch` |
| `VITE_SUPABASE_KEY` | Clé anonyme (anon key) | `eyJhbGci...` |
| `VITE_SUPABASE_REST_URL` | (Legacy) URL complète REST | `https://api2.hedsvs.ch/rest/v1` |

**Note** : `VITE_SUPABASE_URL` est la convention standard. Les scripts ajoutent automatiquement `/rest/v1`.

---

## 🔐 Variables optionnelles (pour admin)

Si tu veux bypass RLS (Row Level Security) pour l'import :

```env
# Clé service_role (DANGEREUX - ne pas commit)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...service-role-key...
```

Cette clé se trouve aussi dans **Settings** → **API** → **service_role key**.

⚠️ **Attention** : Ne commit JAMAIS cette clé dans Git !

---

## 🚀 Après configuration

Une fois les variables ajoutées :

```bash
# 1. Importer institutions
node backend/supabase/importInstitutions.js

# 2. Importer places
node backend/supabase/importPlaces.js

# 3. Tester l'app
npm run dev
```

---

**Problème résolu ! ✅**
