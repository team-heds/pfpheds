# 🚀 Guide de Migration : Événements Firebase → Supabase

## 📋 Vue d'ensemble

Cette migration permet de passer complètement de Firebase à Supabase pour la gestion des événements.

### **Avantages de Supabase**
- ✅ **Base de données relationnelle** (PostgreSQL) au lieu de NoSQL
- ✅ **Requêtes SQL puissantes** avec JOINs et agrégations
- ✅ **Row Level Security (RLS)** intégré
- ✅ **Temps réel natif** avec WebSockets
- ✅ **Storage intégré** similaire à Firebase Storage
- ✅ **Coûts réduits** pour la plupart des projets

---

## 🛠️ Étapes de Migration

### **1️⃣ Préparer Supabase**

#### A. Créer le schéma de base de données
1. Ouvre Supabase Dashboard → SQL Editor
2. Copie le contenu de `supabase_migration_events.sql`
3. Exécute le script
4. Vérifie dans "Table Editor" que 3 tables sont créées :
   - `events`
   - `event_registrations`
   - `event_likes`

#### B. Configurer Supabase Storage
1. Va dans "Storage" → "New bucket"
2. Crée un bucket nommé **`events`**
3. Rends-le **public** (pour les images d'événements)
4. Configure les politiques :
   ```sql
   -- Lecture publique
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'events');
   
   -- Upload authentifié
   CREATE POLICY "Authenticated upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');
   
   -- Delete par le créateur
   CREATE POLICY "Owner delete"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'events' AND auth.uid()::text = owner);
   ```

#### C. Vérifier le client Supabase
Assure-toi que `src/supabase.js` existe (il existe déjà dans ton projet) :
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Et dans `.env` :
```
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_KEY=ta-clé-anonyme
```

**Note**: Un fichier `.env.supabase.example` a été créé avec plus de détails.

---

### **2️⃣ Migrer les données existantes**

#### Option A : Migration manuelle (petite quantité)
Si tu as peu d'événements (<50), tu peux les recréer manuellement via l'interface.

#### Option B : Script de migration automatique
Crée un script pour transférer les données Firebase → Supabase :

```javascript
// scripts/migrate-events-to-supabase.js
import { db } from '../firebase.js'
import { ref as dbRef, get } from 'firebase/database'
import { supabase } from '../src/supabaseClient.js'

async function migrateEvents() {
  console.log('🚀 Début de la migration...')
  
  // 1. Récupérer tous les événements Firebase
  const eventsRef = dbRef(db, 'events')
  const snapshot = await get(eventsRef)
  const firebaseEvents = snapshot.val()
  
  if (!firebaseEvents) {
    console.log('❌ Aucun événement à migrer')
    return
  }
  
  const events = Object.entries(firebaseEvents).map(([id, ev]) => ({
    firebaseId: id,
    ...ev
  }))
  
  console.log(`📊 ${events.length} événements trouvés`)
  
  // 2. Insérer dans Supabase
  for (const event of events) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: event.title,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            lieu: event.lieu || '',
            type: event.type || 'public',
            role: event.role || null,
            admin_uid: event.admin,
            image_url: event.image || null
          }
        ])
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ Migré: ${event.title} (${event.firebaseId} → ${data.id})`)
      
      // 3. Migrer les inscriptions si présentes
      if (event.registered && Array.isArray(event.registered)) {
        for (const registration of event.registered) {
          const userUid = typeof registration === 'string' 
            ? registration 
            : registration.uid
          
          await supabase.from('event_registrations').insert([{
            event_id: data.id,
            user_uid: userUid,
            user_nom: registration.nom || '',
            user_prenom: registration.prenom || '',
            user_photo_url: registration.photoURL || ''
          }])
        }
      }
      
    } catch (err) {
      console.error(`❌ Erreur pour ${event.title}:`, err.message)
    }
  }
  
  console.log('✅ Migration terminée !')
}

migrateEvents()
```

Pour l'exécuter :
```bash
node scripts/migrate-events-to-supabase.js
```

---

### **3️⃣ Mettre à jour le code**

#### A. Remplacer le store
```bash
# Sauvegarder l'ancien
mv src/stores/eventStore.js src/stores/eventStore_firebase_backup.js

# Utiliser le nouveau
mv src/stores/eventStore_supabase.js src/stores/eventStore.js
```

#### B. Mettre à jour EventManagementView.vue

Remplacer les imports Firebase :
```javascript
// ❌ ANCIEN (Firebase)
import { auth } from '../../../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref as dbRef, get } from 'firebase/database';

// ✅ NOUVEAU (Supabase)
import { supabase } from '@/supabaseClient';
```

Remplacer l'authentification :
```javascript
// ❌ ANCIEN
onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
});

// ✅ NOUVEAU
supabase.auth.onAuthStateChange((event, session) => {
  currentUser.value = session?.user || null;
});
```

#### C. Mettre à jour les composants

**EventCard.vue** - Adapter pour Supabase :
```javascript
// Les événements ont maintenant:
// - id (UUID au lieu de string)
// - start_date au lieu de startDate
// - end_date au lieu de endDate
// - admin_uid au lieu de admin
// - image_url au lieu de image
// - registration_count et likes_count (depuis la vue)
```

**EventForm.vue** - Pas de changement majeur, juste les noms de champs.

**EventDetail.vue** - Adapter pour les nouveaux noms de champs.

---

### **4️⃣ Tester la migration**

#### Checklist de tests
- [ ] Les événements s'affichent correctement
- [ ] Créer un nouvel événement
- [ ] Upload d'image fonctionne
- [ ] Modifier un événement existant
- [ ] Supprimer un événement
- [ ] S'inscrire à un événement
- [ ] Se désinscrire d'un événement
- [ ] Liker/unliker un événement
- [ ] Les filtres fonctionnent (public/privé, rôle)
- [ ] La recherche fonctionne
- [ ] Le tri par date fonctionne
- [ ] Les temps réel updates fonctionnent

---

### **5️⃣ Nettoyer Firebase**

Une fois que tout fonctionne en production :

1. **Sauvegarder les données Firebase** (export JSON)
2. **Désactiver les règles Firebase** pour les événements
3. **Supprimer le code Firebase** non utilisé
4. **Retirer les dépendances Firebase** si plus nécessaires

---

## 🎯 Résultat Final

### **Structure Supabase**
```
📦 Base de données
├── 📊 events (table principale)
├── 📊 event_registrations (inscriptions)
├── 📊 event_likes (likes)
└── 👁️ events_with_counts (vue avec agrégations)

📦 Storage
└── 🪣 events (bucket pour images)
```

### **Fonctionnalités**
✅ Création/Édition/Suppression d'événements
✅ Upload d'images
✅ Inscriptions utilisateurs
✅ Système de likes
✅ Événements publics/privés avec rôles
✅ Temps réel
✅ Sécurité RLS
✅ Performances optimisées

---

## 🔧 Troubleshooting

### Erreur : "relation 'events' does not exist"
→ Le schéma SQL n'a pas été exécuté. Retourne à l'étape 1A.

### Erreur : "Invalid API key"
→ Vérifie tes variables d'environnement `.env`

### Images ne s'affichent pas
→ Vérifie que le bucket `events` est bien **public**

### RLS bloque les requêtes
→ Vérifie les politiques RLS dans Supabase Dashboard

### Temps réel ne fonctionne pas
→ Active "Realtime" sur la table `events` dans Supabase

---

## 📞 Support

Si tu rencontres des problèmes, vérifie :
1. La console du navigateur (F12)
2. Les logs Supabase Dashboard
3. Les politiques RLS

---

**Bonne migration ! 🚀**
