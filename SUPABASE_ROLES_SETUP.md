# 🔐 Configuration des Rôles Admin Supabase

## 📋 Vue d'ensemble

Ce guide explique comment configurer les rôles admin pour les utilisateurs Supabase, permettant ainsi l'accès aux pages d'administration comme c'est déjà le cas pour Firebase.

---

## 🎯 Deux Options Disponibles

### **Option 1 : User Metadata (Rapide - Recommandé pour démarrer)**

Stocke les rôles directement dans les métadonnées de l'utilisateur Supabase.

#### ✅ Avantages :
- Configuration rapide (5 minutes)
- Pas de table supplémentaire nécessaire
- Idéal pour prototypage et petites équipes

#### ❌ Inconvénients :
- Moins flexible pour la gestion en masse
- Nécessite accès Dashboard Supabase pour chaque modification

---

### **Option 2 : Table `user_roles` (Production - Recommandé)**

Utilise une table dédiée pour gérer les rôles de manière structurée.

#### ✅ Avantages :
- Gestion flexible et scalable
- Interface admin possible dans l'app
- Audit trail complet
- Support multi-rôles avancé

#### ❌ Inconvénients :
- Setup initial plus long (15-20 minutes)
- Requiert création de table et policies

---

## 🚀 OPTION 1 : Configuration User Metadata

### Étape 1 : Accéder au Dashboard Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Dans le menu latéral, allez à **Authentication → Users**

### Étape 2 : Modifier un utilisateur

1. Trouvez l'utilisateur à qui vous voulez donner l'accès admin
2. Cliquez sur les **3 points** à droite → **Edit user**
3. Descendez jusqu'à **Raw user meta data**

### Étape 3 : Ajouter les rôles

Dans le champ **Raw user meta data**, ajoutez la structure JSON suivante :

```json
{
  "roles": {
    "admin": true,
    "editor": true
  }
}
```

#### Rôles disponibles :

| Rôle | Description | Accès |
|------|-------------|-------|
| `admin` | Administrateur complet | Toutes les pages admin |
| `editor` | Éditeur de contenu | Pages de gestion modules, users |
| `game_master` | Maître du jeu gamification | Pages gamification admin |
| `house_coach` | Coach de maison | Gestion de sa maison |
| `professor` | Professeur | Analytics et statistiques |

#### Exemples de configurations :

**Admin complet :**
```json
{
  "roles": {
    "admin": true
  }
}
```

**Éditeur :**
```json
{
  "roles": {
    "editor": true
  }
}
```

**Plusieurs rôles :**
```json
{
  "roles": {
    "admin": true,
    "game_master": true,
    "professor": true
  }
}
```

### Étape 4 : Sauvegarder

Cliquez sur **Save** en bas du formulaire.

### ✅ C'est fait !

L'utilisateur a maintenant accès aux pages admin ! Il doit se reconnecter pour que les changements prennent effet.

---

## 🏗️ OPTION 2 : Configuration Table `user_roles`

### Étape 1 : Créer la table

Dans le Dashboard Supabase, allez à **SQL Editor** et exécutez :

```sql
-- Création de la table user_roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, role_name)
);

-- Index pour performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_roles_updated_at();

-- Table de log pour audit
CREATE TABLE user_roles_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'granted', 'revoked', 'updated'
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

CREATE INDEX idx_user_roles_audit_user ON user_roles_audit(user_id);
```

### Étape 2 : Configurer les Row Level Security (RLS)

```sql
-- Activer RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_audit ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy : Seuls les admins peuvent modifier les rôles
CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'admin' 
    AND is_active = true
  )
);

-- Policy : Tout le monde peut lire l'audit (pour transparence)
CREATE POLICY "Anyone can view audit"
ON user_roles_audit FOR SELECT
TO authenticated
USING (true);

-- Policy : Seuls les admins peuvent écrire dans l'audit
CREATE POLICY "Admins can write audit"
ON user_roles_audit FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'admin' 
    AND is_active = true
  )
);
```

### Étape 3 : Ajouter votre premier admin

```sql
-- Remplacez 'VOTRE_USER_ID' par votre ID utilisateur Supabase
-- Vous pouvez le trouver dans Authentication → Users
INSERT INTO user_roles (user_id, role_name, notes)
VALUES (
  'VOTRE_USER_ID', -- ⚠️ À REMPLACER
  'admin',
  'Premier administrateur'
);
```

### Étape 4 : Fonctions helper (optionnel mais utile)

```sql
-- Fonction pour donner un rôle
CREATE OR REPLACE FUNCTION grant_role(
  target_user_id UUID,
  new_role TEXT,
  granted_by_user_id UUID DEFAULT auth.uid()
)
RETURNS user_roles AS $$
DECLARE
  result user_roles;
BEGIN
  INSERT INTO user_roles (user_id, role_name, granted_by)
  VALUES (target_user_id, new_role, granted_by_user_id)
  ON CONFLICT (user_id, role_name) 
  DO UPDATE SET is_active = true, granted_by = granted_by_user_id
  RETURNING * INTO result;
  
  -- Log l'action
  INSERT INTO user_roles_audit (user_id, role_name, action, performed_by, details)
  VALUES (target_user_id, new_role, 'granted', granted_by_user_id, 
          jsonb_build_object('timestamp', NOW()));
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer un rôle
CREATE OR REPLACE FUNCTION revoke_role(
  target_user_id UUID,
  old_role TEXT,
  revoked_by_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_roles 
  SET is_active = false
  WHERE user_id = target_user_id AND role_name = old_role;
  
  -- Log l'action
  INSERT INTO user_roles_audit (user_id, role_name, action, performed_by, details)
  VALUES (target_user_id, old_role, 'revoked', revoked_by_user_id,
          jsonb_build_object('timestamp', NOW()));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Étape 5 : Exemples d'utilisation

#### Via SQL :

```sql
-- Donner le rôle admin
SELECT grant_role('user-uuid-here', 'admin');

-- Donner plusieurs rôles
SELECT grant_role('user-uuid-here', 'admin');
SELECT grant_role('user-uuid-here', 'editor');

-- Retirer un rôle
SELECT revoke_role('user-uuid-here', 'editor');

-- Voir tous les rôles d'un utilisateur
SELECT * FROM user_roles 
WHERE user_id = 'user-uuid-here' AND is_active = true;
```

#### Via JavaScript (dans l'app) :

```javascript
// Donner un rôle
const { data, error } = await supabase
  .from('user_roles')
  .insert({
    user_id: 'user-uuid-here',
    role_name: 'admin',
    granted_by: currentUserId
  })

// Voir les rôles d'un utilisateur
const { data: roles } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
```

---

## 🧪 Test de Configuration

### Tester si ça fonctionne :

1. **Connectez-vous** avec un utilisateur Supabase
2. **Ouvrez la console** du navigateur (F12)
3. **Naviguez vers** une page admin (ex: `/admin`)
4. **Vérifiez les logs** :

```
🔑 Vérification des rôles pour supabase user ID: xxx-xxx-xxx
✅ Rôles trouvés dans user_metadata: { admin: true }
// OU
✅ Rôles trouvés dans table user_roles: { admin: true, editor: true }
```

Si vous voyez **"Aucun rôle trouvé"**, vérifiez votre configuration.

---

## 🔧 Dépannage

### Problème : "Aucun rôle trouvé"

**Solution Option 1 (user_metadata) :**
1. Vérifiez que le JSON dans user_metadata est valide
2. La structure doit être : `{ "roles": { "admin": true } }`
3. L'utilisateur doit se **reconnecter** après modification

**Solution Option 2 (table) :**
1. Vérifiez que la table `user_roles` existe
2. Vérifiez que le RLS est correctement configuré
3. Vérifiez que l'utilisateur a bien une entrée : `SELECT * FROM user_roles WHERE user_id = 'xxx'`

### Problème : "Table user_roles not found"

Le système bascule automatiquement sur user_metadata. Pas de problème si vous utilisez l'Option 1.

### Problème : L'utilisateur a le rôle mais n'a pas accès

1. Vérifiez la route dans `router.js` : `requiredRole: ['admin']`
2. Vérifiez les logs console pour voir quel rôle est attendu vs reçu
3. Les rôles sont **case-sensitive** : `admin` ≠ `Admin`

---

## 📊 Tableau de Compatibilité des Rôles

| Route | Rôles acceptés |
|-------|----------------|
| `/admin` | `admin`, `editor` |
| `/admin/modules` | `admin`, `editor` |
| `/profilAdmin/:id` | `admin` |
| `/admin/defis` | `admin` |
| `/admin/gamification/*` | `admin`, `game_master`, `house_coach` |
| `/user_list` | `admin`, `editor` |
| `/votation_management` | `admin` |

---

## 🎯 Recommandations

### Pour une **petite équipe** (< 10 admins) :
→ **Option 1** (user_metadata) suffit amplement

### Pour une **production sérieuse** :
→ **Option 2** (table user_roles) pour la flexibilité

### Migration de l'Option 1 vers l'Option 2 :
Pas de problème ! Le système vérifie d'abord user_metadata, puis la table. Vous pouvez migrer progressivement.

---

## 💡 Prochaines Étapes

1. ✅ Choisir votre option (1 ou 2)
2. ✅ Suivre les étapes de configuration
3. ✅ Tester avec un utilisateur
4. ✅ Documenter vos admins

Besoin d'aide ? Consultez les logs console (F12) pour le debug !

---

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [User Metadata](https://supabase.com/docs/guides/auth/managing-user-data)

**Fait avec ❤️ pour votre projet pfpheds**
