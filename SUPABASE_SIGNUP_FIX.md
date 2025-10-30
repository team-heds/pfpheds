# 🔧 GUIDE DE RÉSOLUTION : Erreur Création de Compte Supabase

## ❌ PROBLÈME
```
Failed to create user: API error happened while trying to communicate with the server.
```

## 🔍 DIAGNOSTIC COMPLET

### Étape 1 : Vérifier Docker Supabase

#### a) Démarrer Docker Desktop
```bash
# Ouvrir Docker Desktop manuellement ou via:
start "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

#### b) Vérifier les conteneurs Supabase
```bash
docker ps -a | findstr supabase
```

Vous devriez voir des conteneurs comme:
- `supabase-db` (PostgreSQL)
- `supabase-auth` (GoTrue Auth)
- `supabase-rest` (PostgREST API)
- `supabase-realtime`
- `supabase-storage`

#### c) Démarrer Supabase si nécessaire
```bash
# Si vous utilisez Supabase CLI
npx supabase start

# Ou avec docker-compose si vous avez un fichier
cd backend
docker-compose up -d
```

---

### Étape 2 : Vérifier la Configuration

#### a) Variables d'environnement (.env)
Vérifiez que votre fichier `.env` contient:

```env
# URL locale de Supabase (si Docker)
VITE_SUPABASE_URL=http://localhost:54321

# Clé anon locale (valeur par défaut Supabase CLI)
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**OU pour Supabase Cloud:**
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_KEY=votre_anon_key
```

#### b) Tester la connexion
Créez un fichier de test temporaire:

```javascript
// test-supabase-connection.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test de ping
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1)
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur de connexion:', error)
      return false
    }
    console.log('✅ Connexion Supabase OK')
    return true
  } catch (e) {
    console.error('❌ Impossible de se connecter à Supabase:', e.message)
    return false
  }
}

testConnection()
```

---

### Étape 3 : Vérifier Configuration Auth Supabase

#### a) Activer les inscriptions (Supabase Cloud)
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Authentication** → **Settings**
4. Vérifiez que **"Enable email signups"** est activé

#### b) Configuration locale (Docker)
Vérifiez le fichier `backend/supabase/config.toml` (si vous en avez un):

```toml
[auth]
enable_signup = true
site_url = "http://localhost:5178"
additional_redirect_urls = ["https://hedsvs.ch"]

[auth.email]
enable_signup = true
enable_confirmations = true # Mettre false pour tests
```

---

### Étape 4 : Vérifier les Politiques RLS

Les politiques RLS (Row Level Security) peuvent bloquer les inscriptions.

#### a) Créer une migration pour autoriser les inscriptions

Créez `supabase/migrations/FIX_auth_users.sql`:

```sql
-- =====================================================
-- FIX: Autoriser les inscriptions utilisateurs
-- =====================================================

-- Vérifier si la table auth.users existe et est accessible
-- (normalement gérée par Supabase Auth)

-- Créer la table user_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;

-- Policy: Chaque utilisateur peut voir son propre profil
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Chaque utilisateur peut créer son propre profil (à l'inscription)
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Chaque utilisateur peut modifier son propre profil
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
```

#### b) Appliquer la migration

```bash
# Supabase CLI
npx supabase db push

# OU manuellement dans le Dashboard Supabase:
# SQL Editor → Copier le contenu du fichier → Run
```

---

### Étape 5 : Tester avec Logs Détaillés

Modifiez temporairement `src/stores/authStore.js` pour avoir plus de détails:

```javascript
async function signUpSupabase(credentials) {
  loading.value = true;
  error.value = null;
  try {
    console.log('🔵 Tentative inscription Supabase avec:', {
      email: credentials.email,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL
    });
    
    const { data, error: signUpError } = await supabase.auth.signUp(credentials);
    
    if (signUpError) {
      console.error('❌ Erreur Supabase signUp:', signUpError);
      console.error('Code erreur:', signUpError.code);
      console.error('Status:', signUpError.status);
      console.error('Message:', signUpError.message);
      throw signUpError;
    }
    
    console.log('✅ Inscription réussie:', data);
    
    user.value = data.user;
    session.value = data.session;
    authProvider.value = 'supabase';
    return data;
  } catch (e) {
    error.value = e.message;
    console.error('💥 Exception lors de l\'inscription:', e);
    throw e;
  } finally {
    loading.value = false;
  }
}
```

---

## 🎯 CHECKLIST DE RÉSOLUTION

- [ ] **Docker Desktop démarré**
- [ ] **Conteneurs Supabase actifs** (`docker ps`)
- [ ] **Variables ENV correctes** (URL + KEY)
- [ ] **Inscriptions activées** (Supabase Dashboard ou config.toml)
- [ ] **Politiques RLS configurées** (migration appliquée)
- [ ] **Logs détaillés activés** (vérifier console navigateur)
- [ ] **Test d'inscription** avec email de test

---

## 🔧 COMMANDES RAPIDES

### Redémarrer Supabase local
```bash
npx supabase stop
npx supabase start
```

### Voir les logs Auth
```bash
npx supabase logs auth
```

### Reset complet (⚠️ ATTENTION : Efface les données)
```bash
npx supabase db reset
```

### Appliquer les migrations
```bash
npx supabase db push
```

---

## 📊 ERREURS COURANTES

### 1. "Invalid API key"
**Problème:** Clé Supabase incorrecte  
**Solution:** Vérifier `VITE_SUPABASE_KEY` dans `.env`

### 2. "Email rate limit exceeded"
**Problème:** Trop de tentatives d'inscription  
**Solution:** Attendre 1h ou utiliser un autre email

### 3. "User already registered"
**Problème:** Email déjà inscrit  
**Solution:** Utiliser un autre email ou reset la DB

### 4. "Invalid email"
**Problème:** Format email invalide  
**Solution:** Vérifier le format (xxx@domain.com)

### 5. "Password should be at least 6 characters"
**Problème:** Mot de passe trop court  
**Solution:** Minimum 6 caractères

### 6. "Email signups are disabled"
**Problème:** Inscriptions désactivées dans config  
**Solution:** Activer dans Dashboard → Auth → Settings

---

## 🆘 SI RIEN NE FONCTIONNE

### Option 1: Utiliser Supabase Cloud
Si Docker local pose problème, utilisez Supabase Cloud:
1. Créer un projet sur https://supabase.com
2. Copier URL et anon key
3. Mettre à jour `.env`

### Option 2: Désactiver confirmation email (tests uniquement)
Dans Supabase Dashboard:
1. **Authentication** → **Settings**
2. **Email Auth** → Désactiver "Enable email confirmations"
3. Re-tester l'inscription

### Option 3: Vérifier CORS
Si Supabase Cloud, vérifier:
1. **Settings** → **API**
2. **CORS Origins** : Ajouter `http://localhost:5178`

---

## 📞 SUPPORT

Si le problème persiste après tous ces tests:
1. Vérifier les logs Docker: `docker logs supabase-auth`
2. Vérifier les logs Supabase: `npx supabase logs`
3. Consulter: https://supabase.com/docs/guides/auth
