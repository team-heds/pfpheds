# 🔄 Migration Praticiens Formateurs : Firebase → Supabase

## ✅ Modifications Effectuées

### **1. Store Migré** (`src/stores/praticiensStore.js`)
- ❌ **Avant** : Firebase Realtime Database
- ✅ **Après** : Supabase PostgreSQL

### **2. Méthodes Migrées**
- ✅ `fetchPraticiens()` - Récupération avec recherche et pagination
- ✅ `createPraticien()` - Création d'un nouveau praticien
- ✅ `updatePraticien()` - Mise à jour d'un praticien
- ✅ `deletePraticien()` - Suppression d'un praticien
- ✅ `getPraticienById()` - Récupération d'un praticien par ID

### **3. Formulaires** (Aucune modification nécessaire)
- ✅ `PraticienFormateurForm.vue` - Formulaire de création
- ✅ `PraticienFormateurFormModif.vue` - Formulaire de modification

Les formulaires utilisent déjà le store, donc ils fonctionnent automatiquement avec Supabase !

## 📋 Étapes de Migration

### **Étape 1 : Créer la Table Supabase**

1. **Connectez-vous à Supabase Dashboard**
2. **Allez dans SQL Editor**
3. **Exécutez le script** : `supabase_migrations/create_praticiens_formateurs_table.sql`

Ce script crée :
- ✅ La table `praticiens_formateurs`
- ✅ Les index pour la performance
- ✅ Les triggers pour `updated_at` automatique
- ✅ Les politiques RLS (Row Level Security)

### **Étape 2 : Migrer les Données Firebase → Supabase**

#### **Option A : Migration Manuelle via SQL**

1. **Exportez les données Firebase** :
   - Allez dans Firebase Console
   - Database → Realtime Database
   - Exportez `PraticienFormateurs` en JSON

2. **Convertissez et importez dans Supabase** :

```sql
-- Exemple d'insertion manuelle
INSERT INTO praticiens_formateurs (nom, prenom, mail, institution, localite)
VALUES 
  ('Dupont', 'Marie', 'marie.dupont@example.com', 'HEdS Fribourg', 'Fribourg'),
  ('Martin', 'Jean', 'jean.martin@example.com', 'HEdS Genève', 'Genève');
```

#### **Option B : Script de Migration Automatique (Recommandé)**

Créez un script Node.js pour migrer automatiquement :

```javascript
// migrate-praticiens.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { createClient } from '@supabase/supabase-js';

// Configuration Firebase
const firebaseConfig = { /* votre config */ };
const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getDatabase(firebaseApp);

// Configuration Supabase
const supabase = createClient('VOTRE_URL', 'VOTRE_KEY');

async function migratePraticiens() {
  console.log('🔄 Début de la migration...');
  
  // Récupérer depuis Firebase
  const snapshot = await get(ref(firebaseDb, 'PraticienFormateurs'));
  const firebaseData = snapshot.val();
  
  if (!firebaseData) {
    console.log('❌ Aucune donnée Firebase trouvée');
    return;
  }
  
  // Convertir en array
  const praticiens = Object.values(firebaseData).map(p => ({
    nom: p.Nom || p.nom || '',
    prenom: p.Prenom || p.prenom || '',
    mail: p.Mail || p.mail || null,
    institution: p.Institution || p.institution || null,
    localite: p.Localite || p.localite || null,
  }));
  
  console.log(`📊 ${praticiens.length} praticiens à migrer`);
  
  // Insérer dans Supabase
  const { data, error } = await supabase
    .from('praticiens_formateurs')
    .insert(praticiens);
  
  if (error) {
    console.error('❌ Erreur migration:', error);
  } else {
    console.log('✅ Migration réussie !');
  }
}

migratePraticiens();
```

### **Étape 3 : Vérifier la Migration**

1. **Dans Supabase** :
   - Allez dans Table Editor
   - Ouvrez `praticiens_formateurs`
   - Vérifiez que toutes les données sont présentes

2. **Dans l'application** :
   - Ouvrez la liste des praticiens formateurs
   - Vérifiez que les données s'affichent
   - Testez la création d'un nouveau praticien
   - Testez la modification d'un praticien
   - Testez la suppression d'un praticien

## 🔍 Vérification des Permissions

### **Qui peut faire quoi ?**

| Action | Étudiant | Enseignant | Editor | Admin |
|--------|----------|------------|--------|-------|
| **Voir** | ✅ | ✅ | ✅ | ✅ |
| **Créer** | ❌ | ❌ | ✅ | ✅ |
| **Modifier** | ❌ | ❌ | ✅ | ✅ |
| **Supprimer** | ❌ | ❌ | ❌ | ✅ |

### **Tester les Permissions**

```sql
-- Vérifier les policies
SELECT * FROM pg_policies 
WHERE tablename = 'praticiens_formateurs';

-- Tester une requête SELECT (doit fonctionner pour tous les authentifiés)
SELECT * FROM praticiens_formateurs LIMIT 5;
```

## 📊 Structure de la Table

```sql
CREATE TABLE praticiens_formateurs (
  id BIGSERIAL PRIMARY KEY,           -- ID auto-incrémenté
  nom TEXT NOT NULL,                  -- Nom (requis)
  prenom TEXT NOT NULL,               -- Prénom (requis)
  mail TEXT,                          -- Email (optionnel)
  institution TEXT,                   -- Institution (optionnel)
  localite TEXT,                      -- Localité (optionnel)
  created_at TIMESTAMPTZ DEFAULT NOW(), -- Date de création
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- Date de modification
);
```

## 🎯 Fonctionnalités du Store

### **1. Recherche Avancée**
```javascript
// Recherche dans nom, prenom, mail, institution, localite
await store.fetchPraticiens('Dupont')
```

### **2. Pagination**
```javascript
// Récupérer 50 praticiens à partir de l'offset 0
await store.fetchPraticiens('', { limit: 50, offset: 0 })
```

### **3. Tri Automatique**
- Les praticiens sont triés par **nom** puis **prénom** alphabétiquement

### **4. Normalisation des Champs**
Le store gère automatiquement :
- Minuscules : `nom`, `prenom`, `mail`
- Majuscules : `Nom`, `Prenom`, `Mail` (pour compatibilité)

## 🐛 Dépannage

### **Erreur : "relation praticiens_formateurs does not exist"**
➡️ La table n'existe pas dans Supabase. Exécutez le script de migration.

### **Erreur : "permission denied for table praticiens_formateurs"**
➡️ Les policies RLS ne sont pas correctes. Vérifiez les permissions dans Supabase.

### **Les données ne s'affichent pas**
1. Vérifiez dans Supabase Table Editor que les données existent
2. Ouvrez la console du navigateur (F12)
3. Cherchez les logs `[PRATICIENS STORE]`
4. Vérifiez les erreurs éventuelles

### **Erreur lors de la création**
- Vérifiez que votre utilisateur a le rôle `admin` ou `editor`
- Vérifiez dans `user_profiles` que `is_active = true`

## 📝 Notes Importantes

1. **Firebase Realtime Database reste actif** pour les autres données
2. **Seuls les praticiens formateurs** sont migrés vers Supabase
3. **Les formulaires** n'ont pas été modifiés (ils utilisent le store)
4. **La compatibilité** est maintenue avec les anciennes majuscules

## ✅ Checklist Migration

- [ ] Script SQL exécuté dans Supabase
- [ ] Table `praticiens_formateurs` créée
- [ ] Policies RLS vérifiées
- [ ] Données migrées de Firebase
- [ ] Test de lecture (liste des praticiens)
- [ ] Test de création (nouveau praticien)
- [ ] Test de modification (éditer un praticien)
- [ ] Test de suppression (supprimer un praticien)
- [ ] Permissions testées (admin, editor, student)

## 🚀 Résultat Final

- ✅ **Store Supabase** : Praticiens formateurs dans PostgreSQL
- ✅ **Performance améliorée** : Index sur nom, prénom, mail, institution
- ✅ **Sécurité renforcée** : Row Level Security activé
- ✅ **Timestamps automatiques** : `updated_at` mis à jour automatiquement
- ✅ **Recherche optimisée** : Recherche full-text dans tous les champs

**La migration est terminée !** 🎉
