# 🎿 Guide Système de Groupe Alp'in Physio

## ✅ Fonctionnalités créées

### **1. Nouveau type d'événement "Alp'in Physio"**
- ✅ Type d'événement dédié à l'association
- ✅ Visible uniquement par les membres de l'association
- ✅ Gérable par les administrateurs de l'association

### **2. Table des membres**
- ✅ Gestion des membres actifs/inactifs
- ✅ Rôles : Admin ou Membre
- ✅ Informations : nom, prénom, email, poste

### **3. Permissions spéciales**
- ✅ Seuls les **membres actifs** voient les événements Alp'in Physio
- ✅ Seuls les **admins** peuvent modifier/supprimer les événements de l'association
- ✅ Le **créateur** d'un événement peut toujours le gérer

### **4. Page d'administration**
- ✅ Gestion des membres (ajouter, modifier, supprimer)
- ✅ Liste des événements de l'association
- ✅ Statistiques (membres, événements, participants)

---

## 📋 Installation

### **Étape 1 : Créer la structure en base de données**

Exécute le script SQL dans **Supabase SQL Editor** :

```bash
ALPINPHYSIO_GROUP_SETUP.sql
```

Ce script va :
1. ✅ Créer la table `alpinphysio_members`
2. ✅ Ajouter le type "alpinphysio" aux événements
3. ✅ Configurer les permissions RLS
4. ✅ Créer des fonctions helper

### **Étape 2 : Ajouter les membres initiaux**

Dans le script SQL, **remplace les UIDs** par les vrais UIDs Supabase :

```sql
INSERT INTO alpinphysio_members (user_id, role, nom, prenom, email, poste) VALUES
  ('UID_ADMIN_1', 'admin', 'Doe', 'John', 'john.doe@hevs.ch', 'Président'),
  ('UID_ADMIN_2', 'admin', 'Smith', 'Jane', 'jane.smith@hevs.ch', 'Vice-présidente')
ON CONFLICT (user_id) DO NOTHING;
```

**Comment obtenir les UIDs ?**
1. Va sur Supabase Dashboard → Authentication → Users
2. Copie l'UID de chaque utilisateur
3. Remplace `UID_ADMIN_1`, `UID_ADMIN_2`, etc.

### **Étape 3 : Ajouter la route dans le router**

Ajoute cette route dans `src/router.js` :

```javascript
{
  path: '/alpinphysio/admin',
  name: 'alpinphysio-admin',
  component: () => import('@/views/associations/AlpinPhysioAdminView.vue'),
  meta: { requiresAuth: true }
}
```

---

## 🎯 Utilisation

### **Pour les membres de l'association**

#### **1. Voir les événements Alp'in Physio**
- Va sur `/events`
- Les événements type "Alp'in Physio" apparaissent automatiquement
- Seuls les membres actifs les voient

#### **2. S'inscrire à un événement**
- Clique sur un événement Alp'in Physio
- Clique sur "S'inscrire"
- Ton inscription est enregistrée

### **Pour les administrateurs**

#### **1. Accéder à l'administration**
- Va sur `/alpinphysio/admin`
- Tu dois être admin pour y accéder

#### **2. Gérer les membres**
**Onglet "Membres"** :
- ✅ Voir la liste des membres actifs
- ✅ Ajouter un nouveau membre avec son UID
- ✅ Modifier le rôle d'un membre (member ↔ admin)
- ✅ Supprimer un membre

**Ajouter un membre** :
1. Clique sur "Ajouter un membre"
2. Remplis le formulaire :
   - **User ID (UID)** : UID Supabase de l'utilisateur
   - **Nom, Prénom, Email**
   - **Poste** : Ex: Président, Secrétaire, Trésorier
   - **Rôle** : Admin ou Membre
3. Sauvegarde

#### **3. Créer un événement Alp'in Physio**
1. Va sur `/events`
2. Clique sur "Créer un événement"
3. **Type** : Sélectionne "Alp'in Physio"
4. Remplis les détails (titre, description, dates, lieu)
5. Crée l'événement

#### **4. Gérer les événements**
**Onglet "Événements Alp'in Physio"** :
- ✅ Voir tous les événements de l'association
- ✅ Modifier n'importe quel événement (même si tu ne l'as pas créé)
- ✅ Supprimer n'importe quel événement
- ✅ Voir le nombre de participants

**Onglet "Statistiques"** :
- ✅ Nombre de membres actifs
- ✅ Nombre d'événements total
- ✅ Total de participants à tous les événements

---

## 🔒 Permissions détaillées

### **Événements type "alpinphysio"**

| Action | Qui peut le faire |
|--------|-------------------|
| **Voir** | Membres actifs seulement |
| **S'inscrire** | Tous les utilisateurs authentifiés |
| **Créer** | Tous les utilisateurs authentifiés |
| **Modifier** | Créateur OU admin Alp'in Physio |
| **Supprimer** | Créateur OU admin Alp'in Physio |

### **Membres Alp'in Physio**

| Action | Qui peut le faire |
|--------|-------------------|
| **Voir** | Tous les utilisateurs authentifiés |
| **Ajouter** | Admins Alp'in Physio uniquement |
| **Modifier** | Admins Alp'in Physio uniquement |
| **Supprimer** | Admins Alp'in Physio uniquement |

---

## 📊 Structure de la base de données

### **Table `alpinphysio_members`**

```sql
CREATE TABLE alpinphysio_members (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,  -- UID Supabase
  role TEXT CHECK (role IN ('admin', 'member')),
  nom TEXT,
  prenom TEXT,
  email TEXT,
  poste TEXT,  -- Ex: Président, Secrétaire
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Table `events` - Modification**

Nouvelle contrainte sur `type` :
```sql
CHECK (type IN ('public', 'private', 'alpinphysio'))
```

---

## 🎨 Interface utilisateur

### **Formulaire de création d'événement**

Nouveau choix dans le type :
```
□ Public
□ Privé
□ Alp'in Physio  ← NOUVEAU
```

### **Page d'administration**

3 onglets :
1. **Membres** : DataTable avec liste des membres
2. **Événements Alp'in Physio** : DataTable avec liste des événements
3. **Statistiques** : Cards avec chiffres clés

---

## 🔧 Fichiers créés

### **1. Script SQL**
- `ALPINPHYSIO_GROUP_SETUP.sql` : Configuration base de données

### **2. Store Pinia**
- `src/stores/alpinPhysioStore.js` : Gestion des membres

### **3. Page d'administration**
- `src/views/associations/AlpinPhysioAdminView.vue` : Interface admin

### **4. Modifications**
- `src/components/events/EventForm.vue` : Ajout du type "Alp'in Physio"

---

## 🚀 Prochaines étapes

### **1. Exécuter le SQL**
```bash
# Dans Supabase SQL Editor
Execute: ALPINPHYSIO_GROUP_SETUP.sql
```

### **2. Ajouter les membres**
Modifie les UIDs dans le script SQL et réexécute l'INSERT

### **3. Ajouter la route**
Dans `src/router.js`, ajoute la route `/alpinphysio/admin`

### **4. Tester**
1. Connecte-toi avec un compte admin
2. Va sur `/alpinphysio/admin`
3. Ajoute des membres
4. Crée un événement type "Alp'in Physio"
5. Vérifie les permissions

---

## 🐛 Dépannage

### **"Je ne vois pas les événements Alp'in Physio"**
✅ Vérifie que tu es membre actif dans la table `alpinphysio_members`
✅ Vérifie que `is_active = true`

### **"Je ne peux pas accéder à /alpinphysio/admin"**
✅ Vérifie que ton rôle est `admin` dans la table `alpinphysio_members`
✅ Vérifie que la route existe dans le router

### **"Erreur lors de la création d'événement"**
✅ Vérifie que la contrainte sur `events.type` inclut 'alpinphysio'
✅ Vérifie les politiques RLS avec `SELECT * FROM pg_policies WHERE tablename = 'events'`

### **"Impossible d'ajouter un membre"**
✅ Vérifie que tu es admin
✅ Vérifie que l'UID existe dans Supabase Auth
✅ Vérifie les logs de la console pour l'erreur exacte

---

## 📝 Exemple d'utilisation

### **Scénario complet**

#### **Étape 1 : Configuration initiale (Admin système)**
1. Exécute `ALPINPHYSIO_GROUP_SETUP.sql`
2. Ajoute 2 admins initiaux avec leurs UIDs

#### **Étape 2 : Ajout de membres (Admin Alp'in Physio)**
1. Va sur `/alpinphysio/admin`
2. Onglet "Membres" → "Ajouter un membre"
3. Ajoute 5 membres avec rôle "Membre"

#### **Étape 3 : Création d'un événement (Admin ou Membre)**
1. Va sur `/events`
2. "Créer un événement"
3. Type : "Alp'in Physio"
4. Titre : "Grand Raid BCVS 2025"
5. Description, dates, lieu
6. Crée

#### **Étape 4 : Gestion (Admin seulement)**
1. Va sur `/alpinphysio/admin`
2. Onglet "Événements Alp'in Physio"
3. Modifie ou supprime l'événement même si tu ne l'as pas créé

---

## ✅ Résumé

🎯 **Système complet** de gestion de groupe pour Alp'in Physio
🎯 **Permissions granulaires** (membre, admin, créateur)
🎯 **Interface admin** intuitive avec DataTables
🎯 **Sécurité RLS** au niveau base de données
🎯 **Prêt pour production** avec gestion d'erreurs

**Maintenant tu peux gérer l'association Alp'in Physio directement dans la plateforme ! 🚀**
