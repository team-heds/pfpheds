# Installation de l'Algorithme d'Attribution - Guide rapide

## ✅ Checklist d'installation

### 1. Migration SQL (Base de données)

**Fichier**: `supabase_migrations/20251211_create_student_result_vote.sql`

#### Option A: Via Supabase Dashboard
1. Ouvrir le SQL Editor dans Supabase Dashboard
2. Copier tout le contenu de `20251211_create_student_result_vote.sql`
3. Exécuter le script
4. Vérifier qu'il n'y a pas d'erreurs

#### Option B: Via ligne de commande
```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase_migrations/20251211_create_student_result_vote.sql
```

✅ **Vérification**: La table `student_result_vote` doit exister avec les RLS activés

### 2. Backend (API Routes)

**Fichier**: `backend/supabase/resultatVotationStoreBackend.js`

#### Installation
```bash
cd backend

# Installer uuid si pas déjà installé
npm install uuid

# Vérifier que le fichier existe
ls -la supabase/resultatVotationStoreBackend.js

# Démarrer le backend
npm start
```

✅ **Vérification**: Le serveur doit afficher "Server running on port 3000"

#### Test de l'API
```bash
# Obtenir un token depuis Supabase Auth
# Puis tester la route:
curl http://localhost:3000/api/resultat-votation/results/PFP1A/2026 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Frontend (Service)

**Fichier**: `src/stores/resultatVotationService.js`

#### Installation
Le fichier est déjà créé, vérifier juste qu'il existe:
```bash
ls -la src/stores/resultatVotationService.js
```

#### Configuration
Vérifier les variables d'environnement:

**.env.local** (développement):
```env
VITE_BACKEND_URL=http://localhost:3000
```

**.env.production**:
```env
VITE_BACKEND_URL=https://api2.hedsvs.ch
```

✅ **Vérification**: Le frontend doit pouvoir se connecter au backend

### 4. Interface utilisateur

**Fichier**: `src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue`

Le fichier est déjà modifié avec:
- Sélection obligatoire Année + PFP
- Affichage filtré (BA25 uniquement avec choix)
- Bouton "Démarrer l'algorithme"

✅ **Vérification**: Accéder à la page et vérifier l'interface

### 5. Test complet

```bash
# Test de la migration et des fonctions
node scripts/test-algorithm-attribution.js
```

**Sortie attendue**:
```
🧪 Test de l'algorithme d'attribution des places

1️⃣ Vérification de la table student_result_vote...
✅ Table student_result_vote existe

2️⃣ Test des fonctions RPC...
✅ Fonction get_student_result fonctionne
✅ Fonction get_algorithm_results fonctionne

3️⃣ Test de la vue result_statistics...
✅ Vue result_statistics existe

✅ Tous les tests sont passés!
```

## 📋 Ordre d'installation recommandé

1. **Base de données** (Migration SQL)
2. **Backend** (API)
3. **Frontend** (Service + Vue)
4. **Tests**

## 🔧 Configuration requise

### Backend

**package.json** doit contenir:
```json
{
  "dependencies": {
    "express": "^5.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "uuid": "^9.x"
  }
}
```

### Frontend

**package.json** doit contenir:
```json
{
  "dependencies": {
    "vue": "^3.x",
    "primevue": "^3.x",
    "axios": "^1.x",
    "@supabase/supabase-js": "^2.x"
  }
}
```

## 🚀 Premier lancement

### 1. Démarrer le backend
```bash
cd backend
npm start
# Serveur sur http://localhost:3000
```

### 2. Démarrer le frontend
```bash
npm run dev
# Interface sur http://localhost:5173
```

### 3. Se connecter en tant qu'admin
- Aller sur la page de connexion
- Se connecter avec un compte admin
- Naviguer vers "Formation Pratique" > "Votation PFP"

### 4. Tester l'algorithme
1. Sélectionner **Année**: 2026
2. Sélectionner **PFP**: PFP1A
3. Vérifier que des étudiants avec des choix sont affichés
4. Cliquer sur **"Démarrer l'algorithme"**
5. Attendre les résultats

## ❗ Problèmes courants

### "Permission denied" lors de l'algorithme
- Vérifier que l'utilisateur est bien admin
- Vérifier les RLS policies dans Supabase

### "Authentication required"
- Vérifier que le token JWT est valide
- Se reconnecter si nécessaire

### "No available place"
- Vérifier que des places existent dans la table `places`
- Vérifier que les places ont une capacité > 0

### Backend ne démarre pas
- Vérifier que le port 3000 n'est pas déjà utilisé
- Vérifier les variables d'environnement `.env`

### Frontend ne se connecte pas au backend
- Vérifier `VITE_BACKEND_URL` dans `.env`
- Vérifier que le backend est démarré
- Vérifier les CORS dans `backend/index.js`

## 📊 Vérification post-installation

### Base de données
```sql
-- Vérifier la table
SELECT COUNT(*) FROM student_result_vote;

-- Vérifier les fonctions
SELECT proname FROM pg_proc WHERE proname LIKE '%student_result%';

-- Vérifier la vue
SELECT * FROM result_statistics LIMIT 1;
```

### Backend
```bash
# Test ping
curl http://localhost:3000/api/ping
# Réponse: pingpong

# Test health
curl http://localhost:3000/health
# Réponse: {"status":"healthy", ...}
```

### Frontend
1. Ouvrir la console navigateur (F12)
2. Aller sur la page Votation
3. Vérifier qu'il n'y a pas d'erreurs
4. Les logs doivent afficher:
   - `📚 Chargement des étudiants BA25...`
   - `✅ XX étudiants BA25 chargés`

## 📖 Documentation

- **Guide complet**: `ALGORITHME_ATTRIBUTION.md`
- **Code backend**: `backend/supabase/resultatVotationStoreBackend.js`
- **Code frontend**: `src/stores/resultatVotationService.js`
- **Migration SQL**: `supabase_migrations/20251211_create_student_result_vote.sql`

## 🎯 Prochaines étapes

Après l'installation:
1. Tester avec quelques étudiants
2. Vérifier les résultats dans `student_result_vote`
3. Ajuster les capacités des places si nécessaire
4. Former les administrateurs à l'utilisation

## ✉️ Support

En cas de problème:
1. Vérifier les logs (backend console + browser console)
2. Consulter `ALGORITHME_ATTRIBUTION.md`
3. Exécuter `node scripts/test-algorithm-attribution.js`
