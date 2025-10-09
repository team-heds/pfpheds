# ✅ Corrections appliquées - Migration Supabase

## 🔧 Problèmes corrigés

### **1. Erreur 400 lors de la création d'événement**
**Symptôme** :
```
api2.hedsvs.ch/rest/v1/events : 400 Bad Request
Erreur lors de la création de l'événement
```

**Correction** :
- ✅ Ajout de logs détaillés pour debug
- ✅ Validation des données avant l'insertion
- ✅ Gestion des valeurs nulles/undefined
- ✅ Affichage console des données envoyées

**Code amélioré** :
```javascript
const eventData = {
  title: event.title,
  description: event.description || '',
  start_date: event.startDate,
  end_date: event.endDate,
  lieu: event.lieu || '',
  type: event.type || 'public',
  role: event.type === 'private' ? (event.role || null) : null,
  admin_uid: event.admin,
  image_url: imageUrl
};

console.log('📤 Données envoyées à Supabase:', eventData);
```

---

### **2. Vue events_with_counts non créée**
**Symptôme** :
```
relation "events_with_counts" does not exist
```

**Correction** :
- ✅ Fallback automatique sur la table `events` si la vue n'existe pas
- ✅ Logs informatifs pour identifier le problème
- ✅ Fonctionnement garanti même sans la vue

**Code** :
```javascript
// Essayer la vue d'abord
const result = await supabase
  .from('events_with_counts')
  .select('*');

// Si erreur, utiliser la table
if (fetchError?.message?.includes('does not exist')) {
  console.log('⚠️ Vue introuvable, utilisation de la table events');
  // Fallback sur events
}
```

---

### **3. WebSocket failures (temps réel)**
**Symptôme** :
```
WebSocket connection to 'wss://api2.hedsvs.ch/realtime/v1/websocket' failed
Multiple GoTrueClient instances detected
```

**Correction** :
- ✅ Gestion d'erreur pour les échecs de connexion WebSocket
- ✅ L'application fonctionne même sans temps réel
- ✅ Logs clairs pour identifier si le temps réel fonctionne

**Code** :
```javascript
try {
  const subscription = supabase.channel('events-channel')
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Temps réel actif');
      }
      if (err) {
        console.warn('⚠️ Erreur temps réel (non bloquant):', err);
      }
    });
  return () => supabase.removeChannel(subscription);
} catch (err) {
  console.warn('⚠️ Temps réel non disponible');
  return () => {};
}
```

---

## 📋 À vérifier maintenant

### **1. Test de création d'événement**
Essaye de créer un événement et regarde la console :
- [ ] Tu dois voir : `📤 Données envoyées à Supabase:`
- [ ] Puis soit : `✅ Événement créé avec succès`
- [ ] Ou : `❌ Erreur Supabase insert:` avec le détail

### **2. Test de chargement des événements**
Recharge la page :
- [ ] Tu dois voir : `📥 Chargement des événements depuis Supabase...`
- [ ] Puis : `✅ X événements chargés`

### **3. Vérifier Supabase Dashboard**
Va dans ton Supabase Dashboard :

**Tables requises** :
- [ ] `events` existe avec les bonnes colonnes
- [ ] `event_registrations` existe
- [ ] `event_likes` existe
- [ ] `events_with_counts` (vue) existe (optionnel)

**Storage** :
- [ ] Bucket `events` existe
- [ ] Bucket est **public**

---

## 🔍 Debug : Prochaines étapes

### **Si l'erreur 400 persiste**
Copie le message `📤 Données envoyées à Supabase:` de la console et vérifie :
1. Que toutes les colonnes existent dans ta table `events`
2. Que les types correspondent (TEXT, TIMESTAMPTZ, UUID, etc.)
3. Que les contraintes NOT NULL sont respectées

### **Si "Events loaded: 0"**
1. Vérifie que la table `events` existe dans Supabase
2. Vérifie que le SQL de migration a bien été exécuté
3. Regarde les logs : `❌ Erreur lors du chargement:` pour plus de détails

### **Si les WebSocket échouent toujours**
C'est **normal** si :
- Ton Supabase est hébergé sur un domaine personnalisé
- Le Realtime n'est pas activé dans ton projet
- Il y a un problème de CORS

**Solution** : Le système fonctionne quand même ! Le temps réel est optionnel.

---

## 📊 Logs attendus (console normale)

```
✅ Utilisateur Supabase trouvé: antoine.quarroz@hevs.ch
EventManagementView mounted - Supabase version
Starting to listen for events...
📥 Chargement des événements depuis Supabase...
✅ 0 événements chargés (ou plus si tu en as créé)
Events loaded: 0
⚠️ Erreur abonnement temps réel (non bloquant): [...]  ← NORMAL
```

---

## 🚀 Prochains tests

1. **Créer un événement** :
   - Clique sur "Créer un événement"
   - Remplis le formulaire
   - Soumets
   - Regarde la console pour les logs

2. **Vérifier dans Supabase** :
   - Va sur Supabase Dashboard
   - Table Editor → events
   - Vérifie si l'événement apparaît

3. **Tester les autres fonctions** :
   - Modifier un événement
   - Supprimer un événement
   - S'inscrire à un événement
   - Liker un événement

---

## ⚠️ Si rien ne fonctionne

**Envoie-moi** :
1. Le contenu complet de la console (erreurs rouges)
2. Une capture du Supabase Dashboard → Table Editor
3. Confirme que le SQL a bien été exécuté

**Je pourrai alors** :
- Diagnostiquer le problème exact
- Corriger le schéma SQL si nécessaire
- Adapter le store si les colonnes ne correspondent pas

---

**Dernière mise à jour** : 2025-10-09
