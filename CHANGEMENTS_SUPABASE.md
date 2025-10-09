# ✅ Changements effectués : Migration Events vers Supabase

## 📝 Résumé des modifications

### **1. Fichiers créés**
- ✅ `supabase_migration_events.sql` - Schéma BDD complet
- ✅ `src/stores/eventStore_supabase.js` - Nouveau store Pinia
- ✅ `MIGRATION_EVENTS_GUIDE.md` - Guide de migration détaillé
- ✅ `CHANGEMENTS_SUPABASE.md` - Ce fichier récapitulatif

### **2. Fichiers modifiés**
- ✅ `src/views/apps/events/EventManagementView.vue` - Adapté à Supabase

---

## 🔄 Changements dans EventManagementView.vue

### **Imports**
```diff
- import { auth } from '../../../../firebase.js';
- import { onAuthStateChanged } from 'firebase/auth';
- import { getDatabase, ref as dbRef, get } from 'firebase/database';
+ import { supabase } from '@/supabaseClient';
```

### **Authentification**
```diff
- onAuthStateChanged(auth, (user) => {
-   currentUser.value = user;
- });
+ supabase.auth.getSession().then(({ data: { session } }) => {
+   currentUser.value = session?.user || null;
+ });
+ authSubscription = supabase.auth.onAuthStateChange((event, session) => {
+   currentUser.value = session?.user || null;
+ });
```

### **userId**
```diff
- const userId = computed(() => currentUser.value?.uid || null);
+ const userId = computed(() => currentUser.value?.id || null);
```

### **Fonction likeEvent()**
```diff
- function likeEvent(event) {
-   eventStore.updateEvent(event.id, {
-     likes: event.liked ? event.likes - 1 : event.likes + 1,
-     liked: !event.liked
-   });
- }
+ async function likeEvent(event) {
+   if (!userId.value) {
+     alert('Vous devez être connecté pour liker un événement');
+     return;
+   }
+   try {
+     await eventStore.toggleLike(event.id, userId.value);
+   } catch (error) {
+     console.error('Erreur lors du like:', error);
+     alert('Erreur lors du like');
+   }
+ }
```

### **Fonction registerEvent()**
- ✅ Suppression de Firebase Database pour récupérer les infos user
- ✅ Utilisation de `user_metadata` Supabase Auth
- ✅ Fallback vers table `users` Supabase si elle existe
- ✅ Appel à `eventStore.toggleLike()` au lieu de `toggleRegistration()`

### **Noms de champs adaptés**
```diff
- ev.startDate, ev.endDate, ev.admin
+ ev.start_date, ev.endDate (rétrocompatible), ev.admin_uid
```

### **Lifecycle hooks**
```diff
- onMounted(() => {
-   await eventStore.listenEvents();
- });
+ onMounted(() => {
+   unsubscribeEvents = eventStore.listenEvents();
+ });
+ 
+ onUnmounted(() => {
+   if (unsubscribeEvents) unsubscribeEvents();
+   if (authSubscription) authSubscription.data.subscription.unsubscribe();
+ });
```

---

## 🗄️ Changements dans le Store

### **Nouveau fichier : eventStore_supabase.js**

#### **Nouvelles fonctions**
- ✅ `fetchEvents()` - Récupère tous les événements
- ✅ `listenEvents()` - Écoute temps réel + retourne fonction unsubscribe
- ✅ `toggleLike(eventId, userId)` - Like/Unlike un événement
- ✅ `getEventRegistrations(eventId)` - Récupère les inscrits
- ✅ `isUserRegistered(eventId, userId)` - Vérifie si inscrit
- ✅ `hasUserLiked(eventId, userId)` - Vérifie si liké

#### **Fonctions modifiées**
- ✅ `addEvent()` - Upload image vers Supabase Storage
- ✅ `updateEventComplete()` - Gestion image Supabase Storage
- ✅ `deleteEvent()` - Suppression image + événement
- ✅ `toggleRegistration()` - Insert/Delete dans `event_registrations`

#### **Structure des événements**
```javascript
// Firebase (ancien)
{
  id: 'firebase-push-id',
  title, description, startDate, endDate,
  admin: 'user-uid',
  likes: 5,
  liked: true,
  registered: ['uid1', 'uid2', {...}]
}

// Supabase (nouveau)
{
  id: 'uuid',
  title, description,
  start_date: 'ISO timestamp',
  end_date: 'ISO timestamp',
  admin_uid: 'user-id',
  likes_count: 5,        // Depuis la vue
  registration_count: 3  // Depuis la vue
}
```

---

## 🎯 Prochaines étapes

### **1. Exécuter le SQL Supabase**
1. Va sur Supabase Dashboard
2. SQL Editor → New query
3. Copie `supabase_migration_events.sql`
4. Exécute (Run)
5. Vérifie que 3 tables sont créées

### **2. Configurer Storage**
1. Supabase Dashboard → Storage
2. Créer bucket `events` (public)
3. Configurer les politiques (voir guide)

### **3. Remplacer le store**
```bash
# Sauvegarder l'ancien
mv src/stores/eventStore.js src/stores/eventStore_firebase_backup.js

# Utiliser le nouveau
mv src/stores/eventStore_supabase.js src/stores/eventStore.js
```

### **4. Adapter les composants**

#### **EventCard.vue**
```diff
- event.startDate → event.start_date
- event.endDate → event.end_date
- event.admin → event.admin_uid
- event.image → event.image_url
- event.likes → event.likes_count (depuis la vue)
```

#### **EventForm.vue**
```diff
- startDate, endDate (pas de changement majeur)
+ Utiliser les mêmes noms, ils seront convertis dans le store
```

#### **EventDetail.vue**
```diff
- event.registered → Appeler eventStore.getEventRegistrations(event.id)
- event.liked → Appeler eventStore.hasUserLiked(event.id, userId)
```

### **5. Tester**
- [ ] Connexion utilisateur fonctionne
- [ ] Liste des événements s'affiche
- [ ] Créer un événement
- [ ] Upload d'image
- [ ] Liker un événement
- [ ] S'inscrire à un événement
- [ ] Modifier un événement
- [ ] Supprimer un événement
- [ ] Temps réel fonctionne

---

## ⚠️ Points d'attention

### **Authentification**
- Assure-toi que Supabase Auth est configuré
- Les utilisateurs doivent avoir un compte Supabase
- Migration possible depuis Firebase Auth vers Supabase Auth

### **Table users**
Si tu as besoin de stocker nom/prénom/photo :
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nom TEXT,
  prenom TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Compatibilité**
Le code est **rétrocompatible** :
- `ev.startDate || ev.start_date` - Fonctionne avec les deux
- `ev.admin || ev.admin_uid` - Fonctionne avec les deux

---

## 📊 Avantages de la migration

| Aspect | Avant (Firebase) | Après (Supabase) |
|--------|------------------|------------------|
| **DB** | NoSQL (JSON) | PostgreSQL (relationnel) |
| **Likes** | Compteur manuel | Table dédiée + agrégation |
| **Inscrits** | Array dans event | Table `event_registrations` |
| **Requêtes** | Limitées | SQL complet |
| **Sécurité** | Rules Firebase | RLS PostgreSQL |
| **Coût** | $$$$ | $ |

---

## 🆘 Problèmes courants

### Erreur : "relation 'events' does not exist"
→ SQL pas exécuté. Va dans SQL Editor et exécute le script.

### Erreur : "Invalid API key"
→ Vérifie `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY`
→ Voir `.env.supabase.example` pour un modèle

### Images ne s'affichent pas
→ Bucket `events` doit être **public** dans Storage

### RLS bloque les requêtes
→ Vérifie les politiques RLS dans Dashboard

---

**Migration prête ! 🚀 Suis les étapes du guide pour finaliser.**
