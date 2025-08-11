# 🔄 Migration Firebase → Supabase PostgreSQL - Partie 3

## 🔒 Politiques de Sécurité Row Level Security (RLS)

```sql
-- Activation RLS sur toutes les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON users
    FOR SELECT USING (is_public_profile = true);

-- Politiques pour les communautés
CREATE POLICY "Everyone can view public communities" ON communities
    FOR SELECT USING (type = 'public' AND is_active = true);

CREATE POLICY "Members can view their communities" ON communities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = communities.id
            AND cm.user_id = auth.uid()
        )
    );

-- Politiques pour les posts
CREATE POLICY "Users can view public posts" ON posts
    FOR SELECT USING (
        visibility = 'public'
        AND published_at IS NOT NULL
        AND published_at <= NOW()
    );

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (author_id = auth.uid());

-- Politiques pour les carnets de notes
CREATE POLICY "Users can manage their own notebooks" ON notebooks
    FOR ALL USING (owner_id = auth.uid());

-- Politiques pour les événements
CREATE POLICY "Everyone can view public events" ON events
    FOR SELECT USING (is_public = true AND is_cancelled = false);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (organizer_id = auth.uid());

-- Politiques pour les votations
CREATE POLICY "Users can view active public votations" ON votations
    FOR SELECT USING (
        is_public = true
        AND is_active = true
        AND start_date <= NOW()
        AND end_date > NOW()
    );

-- Politiques pour les conversations
CREATE POLICY "Participants can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );

-- Politiques pour les messages
CREATE POLICY "Participants can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );
```

---

## 🔧 Fonctions et Triggers

```sql
-- Fonction pour vérifier les rôles
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = required_role
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📦 Script de Migration Python

```python
#!/usr/bin/env python3
"""
Script de migration Firebase Realtime Database vers Supabase PostgreSQL
Usage: python migrate_firebase_to_supabase.py
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
FIREBASE_EXPORT_PATH = 'backend/firebasedata/pfpheds-default-rtdb-export.json'

class FirebaseToSupabaseMigrator:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.migration_log = []
        
    def log_migration(self, table: str, action: str, count: int, errors: List[str] = None):
        """Enregistre les résultats de migration"""
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'table': table,
            'action': action,
            'count': count,
            'errors': errors or []
        }
        self.migration_log.append(log_entry)
        print(f"[{log_entry['timestamp']}] {table}: {action} {count} records")
    
    def load_firebase_data(self) -> Dict[str, Any]:
        """Charge les données Firebase depuis le fichier JSON"""
        try:
            with open(FIREBASE_EXPORT_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Fichier Firebase non trouvé: {FIREBASE_EXPORT_PATH}")
            return {}
    
    def convert_firebase_timestamp(self, timestamp: Any) -> Optional[str]:
        """Convertit un timestamp Firebase en format PostgreSQL"""
        if not timestamp:
            return None
        
        try:
            if isinstance(timestamp, (int, float)):
                dt = datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
                return dt.isoformat()
            return str(timestamp)
        except Exception as e:
            print(f"Erreur conversion timestamp {timestamp}: {e}")
            return None
    
    def migrate_users(self, firebase_data: Dict[str, Any]):
        """Migre les utilisateurs Firebase vers Supabase"""
        users_data = firebase_data.get('Users', {})
        if not users_data:
            self.log_migration('users', 'skipped', 0, ['No users data found'])
            return
        
        migrated_count = 0
        errors = []
        
        for firebase_id, user_data in users_data.items():
            try:
                user_uuid = str(uuid.uuid4())
                
                supabase_user = {
                    'id': user_uuid,
                    'firebase_id': firebase_id,
                    'email': user_data.get('email', ''),
                    'first_name': user_data.get('firstName', ''),
                    'last_name': user_data.get('lastName', ''),
                    'display_name': user_data.get('displayName', ''),
                    'avatar_url': user_data.get('photoURL', ''),
                    'phone': user_data.get('phone', ''),
                    'is_active': user_data.get('isActive', True),
                    'is_verified': user_data.get('emailVerified', False),
                    'created_at': self.convert_firebase_timestamp(user_data.get('createdTime'))
                }
                
                result = self.supabase.table('users').insert(supabase_user).execute()
                
                if result.data:
                    migrated_count += 1
                else:
                    errors.append(f"Failed to insert user {firebase_id}")
                    
            except Exception as e:
                errors.append(f"Error migrating user {firebase_id}: {str(e)}")
        
        self.log_migration('users', 'migrated', migrated_count, errors)
    
    def migrate_institutions(self, firebase_data: Dict[str, Any]):
        """Migre les institutions"""
        institutions_data = firebase_data.get('Institutions', {})
        migrated_count = 0
        errors = []
        
        for firebase_id, institution_data in institutions_data.items():
            try:
                supabase_institution = {
                    'id': str(uuid.uuid4()),
                    'firebase_id': firebase_id,
                    'name': institution_data.get('name', ''),
                    'short_name': institution_data.get('shortName', ''),
                    'type': institution_data.get('type', 'hospital'),
                    'description': institution_data.get('description', ''),
                    'address': institution_data.get('address', ''),
                    'city': institution_data.get('city', ''),
                    'country': institution_data.get('country', 'CH'),
                    'phone': institution_data.get('phone', ''),
                    'email': institution_data.get('email', ''),
                    'is_active': institution_data.get('isActive', True),
                    'created_at': self.convert_firebase_timestamp(institution_data.get('createdAt'))
                }
                
                result = self.supabase.table('institutions').insert(supabase_institution).execute()
                
                if result.data:
                    migrated_count += 1
                else:
                    errors.append(f"Failed to insert institution {firebase_id}")
                    
            except Exception as e:
                errors.append(f"Error migrating institution {firebase_id}: {str(e)}")
        
        self.log_migration('institutions', 'migrated', migrated_count, errors)
    
    def run_migration(self):
        """Exécute la migration complète"""
        print("🚀 Début de la migration Firebase → Supabase")
        print("=" * 50)
        
        firebase_data = self.load_firebase_data()
        if not firebase_data:
            print("❌ Aucune donnée Firebase trouvée")
            return
        
        # Ordre de migration (respecter les dépendances)
        self.migrate_institutions(firebase_data)
        self.migrate_users(firebase_data)
        
        # Sauvegarde du log de migration
        with open('migration_log.json', 'w') as f:
            json.dump(self.migration_log, f, indent=2)
        
        print("\n✅ Migration terminée")
        print(f"📋 Log sauvegardé dans migration_log.json")

if __name__ == "__main__":
    migrator = FirebaseToSupabaseMigrator()
    migrator.run_migration()
```

---

## 🚀 Plan de Déploiement

### 1. Préparation Supabase

```bash
# 1. Créer un nouveau projet Supabase
# 2. Configurer les variables d'environnement
cp .env.example .env.local

# 3. Variables requises
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 2. Exécution du Schéma SQL

```sql
-- Exécuter dans l'ordre :
-- 1. FIREBASE_TO_SUPABASE_MIGRATION_PART1.md (schéma de base)
-- 2. FIREBASE_TO_SUPABASE_MIGRATION_PART2.md (schéma social)
-- 3. FIREBASE_TO_SUPABASE_MIGRATION_PART3.md (sécurité RLS)
```

### 3. Migration des Données

```bash
# Installation des dépendances Python
pip install supabase asyncpg python-dotenv

# Exécution de la migration
python migrate_firebase_to_supabase.py
```

### 4. Tests et Validation

```bash
# Tests de connexion
npm run test:supabase

# Validation des données
npm run validate:migration

# Tests d'authentification
npm run test:auth
```

### 5. Mise en Production

```bash
# Déploiement avec Supabase
npm run build
npm run deploy:supabase

# Monitoring
npm run monitor:migration
```

---

## 📊 Checklist de Migration

### ✅ Préparation
- [ ] Backup complet Firebase
- [ ] Projet Supabase créé
- [ ] Variables d'environnement configurées
- [ ] Schéma SQL exécuté
- [ ] Politiques RLS activées

### ✅ Migration des Données
- [ ] Institutions migrées
- [ ] Utilisateurs migrés
- [ ] Rôles assignés
- [ ] Communautés migrées
- [ ] Posts migrés
- [ ] Notes migrées
- [ ] Événements migrés
- [ ] Messages migrés

### ✅ Tests
- [ ] Authentification fonctionnelle
- [ ] CRUD opérations testées
- [ ] Permissions vérifiées
- [ ] Performance validée
- [ ] Sécurité testée

### ✅ Déploiement
- [ ] Frontend mis à jour
- [ ] Services Supabase intégrés
- [ ] Monitoring activé
- [ ] Documentation mise à jour
- [ ] Formation équipe

**Migration Firebase → Supabase complète !** 🎉
