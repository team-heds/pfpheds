# 📚 Guide Complet - Système de Gestion des Modules par Responsables

## 🎯 Vue d'ensemble

Ce système permet aux **responsables de modules** de gérer uniquement **leurs modules** de manière autonome, tandis que les **administrateurs** gardent un accès complet.

### Fonctionnalités principales :
- ✅ **Filtrage automatique** : Chaque responsable ne voit que SES modules
- ✅ **Gestion complète** : Édition des infos, enseignants, planning, stats
- ✅ **Sécurité renforcée** : Row Level Security (RLS) dans Supabase
- ✅ **Permissions granulaires** : Admin vs Responsable de module
- ✅ **Interface intuitive** : Dashboard personnalisé avec onglets

---

## 📋 Étapes de déploiement

### Étape 1 : Migration Supabase

#### 1.1 Se connecter à Supabase
```bash
# Via l'interface web
https://app.supabase.com/

# OU via CLI
npx supabase login
npx supabase link
```

#### 1.2 Exécuter la migration SQL
```bash
# Dans Supabase Dashboard > SQL Editor
# Coller le contenu de:
supabase_migrations/add_module_management_system.sql

# OU via CLI
npx supabase db push
```

#### 1.3 Vérifier la migration
```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'modules' 
AND column_name = 'responsable_email';

-- Vérifier que la table user_roles existe
SELECT * FROM user_roles LIMIT 1;

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'modules';
```

---

### Étape 2 : Configuration des rôles

#### 2.1 Ajouter des administrateurs
```sql
-- Ajouter un admin
INSERT INTO user_roles (user_email, role) 
VALUES ('admin@hevs.ch', 'admin');

-- Ajouter plusieurs admins
INSERT INTO user_roles (user_email, role) VALUES
('antoine.quarroz@hevs.ch', 'admin'),
('votre.email@hevs.ch', 'admin');
```

#### 2.2 Ajouter des responsables de modules
```sql
-- Ajouter un responsable
INSERT INTO user_roles (user_email, role) 
VALUES ('martin.dupont@hevs.ch', 'responsable_module');

-- Ajouter plusieurs responsables
INSERT INTO user_roles (user_email, role) VALUES
('sophie.martin@hevs.ch', 'responsable_module'),
('jean.bernard@hevs.ch', 'responsable_module');
```

#### 2.3 Vérifier les rôles
```sql
SELECT * FROM user_roles ORDER BY created_at DESC;
```

---

### Étape 3 : Associer les responsables aux modules

#### 3.1 Mettre à jour manuellement
```sql
-- Associer un responsable à un module
UPDATE modules 
SET responsable_email = 'martin.dupont@hevs.ch',
    responsable = 'Dr. Martin Dupont'
WHERE id = 'uuid-du-module';

-- Associer plusieurs modules à un responsable
UPDATE modules 
SET responsable_email = 'sophie.martin@hevs.ch',
    responsable = 'Dr. Sophie Martin'
WHERE number IN ('M1.1', 'M1.2', 'M1.3');
```

#### 3.2 Mettre à jour par matching de nom
```sql
-- Associer automatiquement par nom
UPDATE modules 
SET responsable_email = 'martin.dupont@hevs.ch'
WHERE responsable LIKE '%Martin%Dupont%';

-- Vérifier les associations
SELECT number, title, responsable, responsable_email 
FROM modules 
WHERE responsable_email IS NOT NULL
ORDER BY number;
```

#### 3.3 Script de migration complète
```sql
-- Créer une fonction helper pour nettoyer les noms
CREATE OR REPLACE FUNCTION clean_name(text) 
RETURNS text AS $$
  SELECT lower(trim(regexp_replace($1, '[^a-zA-Z ]', '', 'g')))
$$ LANGUAGE SQL;

-- Mise à jour avec correspondances
UPDATE modules m
SET responsable_email = (
  SELECT email 
  FROM user_roles 
  WHERE role = 'responsable_module'
  AND clean_name(email) LIKE '%' || clean_name(m.responsable) || '%'
  LIMIT 1
)
WHERE responsable IS NOT NULL
AND responsable_email IS NULL;
```

---

### Étape 4 : Configuration côté client

#### 4.1 Mettre à jour la liste des admins
```javascript
// Dans src/composables/useModulePermissions.js
const adminEmails = [
  'admin@hevs.ch',
  'antoine.quarroz@hevs.ch',
  'votre.email@hevs.ch'  // Ajoutez les vôtres
]
```

#### 4.2 Tester la connexion
1. Se connecter avec un compte responsable de module
2. Aller sur `/admin/dashboard-rm`
3. Vérifier que "Mes Modules" affiche uniquement SES modules

---

### Étape 5 : Tests de permissions

#### 5.1 Test en tant qu'admin
```bash
# Se connecter avec admin@hevs.ch
# Résultat attendu:
✅ Voit TOUS les modules dans "Responsables de Modules"
✅ Peut accéder à /admin/modules/:id/manage pour N'IMPORTE QUEL module
✅ Peut modifier tous les champs (nombre, année, responsable_email)
```

#### 5.2 Test en tant que responsable
```bash
# Se connecter avec martin.dupont@hevs.ch
# Résultat attendu:
✅ Voit UNIQUEMENT SES modules dans "Mes Modules"
✅ Peut accéder UNIQUEMENT à /admin/modules/:id/manage pour SES modules
✅ Peut modifier uniquement certains champs (titre, description, etc.)
❌ Ne peut PAS modifier: nombre, année, responsable_email
❌ Ne peut PAS accéder aux modules des autres
```

#### 5.3 Test de sécurité RLS
```sql
-- Se connecter en tant qu'utilisateur (pas admin)
-- Essayer de voir tous les modules
SELECT * FROM modules;
-- Résultat: Devrait ne montrer QUE les modules du responsable connecté

-- Essayer de modifier un module d'un autre responsable
UPDATE modules 
SET title = 'HACK'
WHERE responsable_email != current_setting('request.jwt.claims')::json->>'email';
-- Résultat: Devrait échouer avec erreur de permission
```

---

## 🔒 Sécurité - Row Level Security (RLS)

### Politiques actives

#### 1. SELECT (Lecture)
```sql
-- Les responsables voient leurs modules OU les admins voient tout
CREATE POLICY "Responsables can view own modules"
ON modules FOR SELECT
USING (
  responsable_email = auth.jwt() ->> 'email'
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);
```

#### 2. UPDATE (Modification)
```sql
-- Les responsables modifient leurs modules OU les admins modifient tout
CREATE POLICY "Responsables can update own modules"
ON modules FOR UPDATE
USING (
  responsable_email = auth.jwt() ->> 'email'
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);
```

#### 3. INSERT (Création)
```sql
-- Seuls les admins créent des modules
CREATE POLICY "Admins can create modules"
ON modules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);
```

#### 4. DELETE (Suppression)
```sql
-- Seuls les admins suppriment des modules
CREATE POLICY "Admins can delete modules"
ON modules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);
```

---

## 🎨 Interface utilisateur

### Dashboard RM (`/admin/dashboard-rm`)

#### Pour les responsables de modules
```
┌─────────────────────────────────────────────┐
│ 📊 Dashboard Responsable Module             │
├─────────────────────────────────────────────┤
│                                             │
│ 📚 Modules gérés: 48                        │
│ [15 1ère année] [18 2ème] [15 3ème]        │
│                                             │
│ 👥 Enseignants SI: 28                       │
│                                             │
├─────────────────────────────────────────────┤
│ 📚 Mes Modules [3]                          │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐   │
│ │ M1.1 │ Anatomie Humaine              │   │
│ │      │ [Année 1] 6 crédits • 45h     │   │
│ │      │ [Gérer] [Planning]            │   │
│ └───────────────────────────────────────┘   │
│ ┌───────────────────────────────────────┐   │
│ │ M1.2 │ Physiologie                   │   │
│ │      │ [Année 1] 5 crédits • 40h     │   │
│ │      │ [Gérer] [Planning]            │   │
│ └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Page de gestion (`/admin/modules/:id/manage`)

```
┌─────────────────────────────────────────────┐
│ ⚙️ Gestion du module - M1.1 Anatomie       │
├─────────────────────────────────────────────┤
│ [Informations] [Enseignants] [Planning]     │
│ [Statistiques]                              │
├─────────────────────────────────────────────┤
│                                             │
│ Numéro: M1.1         Année: 1               │
│ Titre: Anatomie et physiologie humaine      │
│ Description: [Texte éditable]               │
│                                             │
│ Responsable: Dr. Martin Dupont              │
│ Email: martin.dupont@hevs.ch                │
│                                             │
│ Crédits: 6           Heures: 45             │
│                                             │
│ [Annuler] [Enregistrer]                     │
└─────────────────────────────────────────────┘
```

---

## 🚀 Utilisation

### En tant qu'administrateur

1. **Connexion** : Se connecter avec un compte admin
2. **Dashboard** : Accéder à `/admin/dashboard-rm`
3. **Vue globale** : Voir tous les responsables et leurs modules
4. **Gestion** : Cliquer sur n'importe quel module pour le gérer
5. **Permissions** : Modifier tous les champs, y compris responsable_email

### En tant que responsable de module

1. **Connexion** : Se connecter avec votre compte HEdS
2. **Dashboard** : Accéder à `/admin/dashboard-rm`
3. **Mes modules** : Voir uniquement VOS modules
4. **Gestion** : Cliquer "Gérer" sur un de vos modules
5. **Édition** : Modifier les infos du module (certains champs protégés)
6. **Enseignants** : Ajouter/retirer des enseignants
7. **Planning** : Visualiser le planning du module

---

## 🛠️ Dépannage

### Problème : Un responsable ne voit pas ses modules

**Solution 1 : Vérifier l'email dans Supabase**
```sql
-- Vérifier quel email est connecté
SELECT auth.jwt() ->> 'email';

-- Vérifier les modules de cet email
SELECT * FROM modules 
WHERE responsable_email = 'email@hevs.ch';
```

**Solution 2 : Mettre à jour l'email du responsable**
```sql
UPDATE modules 
SET responsable_email = 'bon.email@hevs.ch'
WHERE id = 'uuid-du-module';
```

### Problème : "Accès refusé" sur /admin/modules/:id/manage

**Cause** : L'utilisateur n'est pas le responsable du module

**Solution** :
```sql
-- Vérifier qui est le responsable
SELECT responsable, responsable_email 
FROM modules 
WHERE id = 'uuid-du-module';

-- Mettre à jour si besoin
UPDATE modules 
SET responsable_email = 'correct.email@hevs.ch'
WHERE id = 'uuid-du-module';
```

### Problème : RLS bloque les requêtes

**Diagnostic** :
```sql
-- Désactiver temporairement RLS pour tester
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;

-- Tester la requête
SELECT * FROM modules;

-- Réactiver RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
```

**Solution** : Vérifier que l'utilisateur a le bon rôle
```sql
-- Vérifier les rôles
SELECT * FROM user_roles 
WHERE user_email = 'email@hevs.ch';

-- Ajouter le rôle si manquant
INSERT INTO user_roles (user_email, role) 
VALUES ('email@hevs.ch', 'responsable_module');
```

---

## 📊 Statistiques et monitoring

### Vue des responsables
```sql
-- Statistiques par responsable
SELECT * FROM responsable_stats;

-- Top 5 responsables par nombre de modules
SELECT responsable, total_modules, total_credits
FROM responsable_stats
ORDER BY total_modules DESC
LIMIT 5;
```

### Modules sans responsable
```sql
-- Trouver les modules orphelins
SELECT number, title 
FROM modules 
WHERE responsable_email IS NULL;

-- Compter les modules orphelins
SELECT COUNT(*) as orphelins
FROM modules 
WHERE responsable_email IS NULL;
```

---

## 🔄 Prochaines améliorations possibles

- [ ] **Notifications** : Alerter les responsables de modifications
- [ ] **Workflows** : Validation par niveaux (responsable → admin)
- [ ] **Historique** : Tracker toutes les modifications avec audit log
- [ ] **Export** : PDF/Excel des informations de module
- [ ] **Templates** : Créer des modules à partir de templates
- [ ] **Collaboration** : Plusieurs responsables par module
- [ ] **Délégation** : Système de délégation temporaire
- [ ] **Rapports** : Statistiques avancées par responsable

---

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée dans Supabase
- [ ] Table `user_roles` créée avec succès
- [ ] Colonne `responsable_email` ajoutée à `modules`
- [ ] Politiques RLS actives et testées
- [ ] Rôles admin ajoutés dans `user_roles`
- [ ] Responsables de modules ajoutés
- [ ] Modules associés aux responsables (`responsable_email` rempli)
- [ ] Liste des admins mise à jour dans `useModulePermissions.js`
- [ ] Route `/admin/modules/:id/manage` accessible
- [ ] Tests de permissions admin réussis
- [ ] Tests de permissions responsable réussis
- [ ] Tests de sécurité RLS réussis
- [ ] Documentation distribuée à l'équipe

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase Dashboard > Logs
2. Vérifier la console du navigateur (F12)
3. Tester les requêtes SQL directement dans Supabase
4. Vérifier que l'utilisateur est bien connecté
5. Vérifier que le JWT contient l'email correct

---

**Version** : 1.0.0  
**Date** : 12/12/2025  
**Auteur** : Système de gestion de modules HEdS
