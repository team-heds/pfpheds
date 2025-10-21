# 📚 Bibliothèque Vidéo - Documentation Complète

## 🎯 Vue d'ensemble

La **Bibliothèque Vidéo** est un système centralisé pour stocker, organiser et accéder à toutes les vidéos Vimeo produites dans le cadre des tickets académiques. Lorsqu'un ticket de type "vidéo" est marqué comme terminé, ses vidéos sont automatiquement archivées dans la bibliothèque.

---

## 🏗️ Architecture

### **Composants principaux**

1. **VideoLibraryView.vue** - Interface utilisateur de la bibliothèque
2. **videoLibraryService.js** - Service de gestion des vidéos
3. **ticketService.js** - Hook automatique d'ajout à la bibliothèque
4. **Table Supabase** `video_library` - Stockage des données

### **Structure de données**

```javascript
video_library {
  id: UUID,
  ticket_id: UUID,
  vimeo_url: String,
  vimeo_id: String,
  title: String,
  description: Text,
  thumbnail_url: String,
  duration: Integer (minutes),
  module_id: UUID,
  year_id: UUID,
  type: String ('cours', 'tp', 'demo', 'simulation', 'autre'),
  person_filmed: String,
  filming_date: Date,
  published_date: Timestamp,
  tags: Array<String>,
  created_at: Timestamp,
  created_by: UUID
}
```

---

## 🚀 Workflow automatique

### **1. Création du ticket**
```
Admin crée un ticket → Type: "Vidéo" → Ajout métadonnées (personne filmée, durée, etc.)
```

### **2. Production de la vidéo**
```
Filming → Montage → Upload sur Vimeo → Lien Vimeo ajouté au ticket
```

### **3. Archivage automatique**
```
Ticket passe en "Terminé" → Hook détecte le changement → Vidéos ajoutées à la bibliothèque
```

**Code automatique** (dans `ticketService.js`) :
```javascript
if (status change to 'done' && ticket has video_links) {
  import videoLibraryService
  addTicketVideosToLibrary(ticket)
}
```

### **4. Disponibilité**
```
Bibliothèque → Vidéos organisées par module/année → Accès instantané
```

---

## 🎨 Interface utilisateur

### **Page : `/admin/academic/video-library`**

#### **Header**
- Statistiques rapides : Total vidéos, durée totale, modules couverts
- Bouton d'actualisation

#### **Filtres**
- **Recherche** : Par titre, description, intervenant
- **Année** : Filtrer par année académique
- **Module** : Filtrer par module
- **Type** : cours, tp, démo, simulation, autre
- **Tri** : Date, titre, durée

#### **Grille de vidéos**
Chaque carte affiche :
- Thumbnail Vimeo
- Titre et description
- Tags (module, année)
- Durée
- Intervenant
- Date de publication
- Actions : Visionner, Copier lien, Menu

#### **Player intégré**
Modal avec :
- Lecteur Vimeo embed
- Métadonnées complètes
- Lien vers le ticket source
- Bouton "Ouvrir dans Vimeo"
- Copier le lien

---

## 🔧 Installation

### **1. Créer la table Supabase**

Exécuter le fichier SQL `supabase_video_library_schema.sql` dans l'éditeur SQL Supabase :

```bash
# Le fichier contient :
- Création de la table video_library
- Index pour performances
- Policies RLS (sécurité)
- Fonctions utilitaires
```

### **2. Vérifier les permissions**

La table est protégée par RLS :
- **Lecture** : Tous les utilisateurs authentifiés
- **Écriture** : Admin et Editor uniquement
- **Suppression** : Admin uniquement

### **3. Tester l'intégration**

1. Créer un ticket de type "Vidéo"
2. Ajouter un lien Vimeo dans `metadata.video_links`
3. Passer le ticket en "Terminé"
4. Vérifier dans la bibliothèque (`/admin/academic/video-library`)

---

## 📊 Fonctionnalités

### **Recherche et filtrage**
```javascript
// Recherche dans titre, description, intervenant
// Filtre par année académique
// Filtre par module
// Filtre par type de contenu
// Tri multiple (date, titre, durée)
```

### **Visionner une vidéo**
```javascript
// Clic sur la carte → Modal avec player Vimeo
// Lecture directe dans l'application
// Métadonnées complètes affichées
// Lien vers le ticket source
```

### **Copier un lien**
```javascript
// Bouton "Copier lien" → Copie dans le presse-papier
// Toast de confirmation
// Partage rapide avec étudiants/collègues
```

### **Statistiques**
```javascript
// Total de vidéos
// Durée totale (heures)
// Nombre de modules couverts
// Statistiques par type
```

---

## 🔄 API Service

### **videoLibraryService.js**

#### **Ajouter une vidéo**
```javascript
import { addVideoToLibrary } from '@/service/videoLibraryService'

await addVideoToLibrary({
  ticket_id: 'uuid',
  vimeo_url: 'https://vimeo.com/123456789',
  title: 'Titre de la vidéo',
  description: 'Description',
  module_id: 'uuid',
  year_id: 'uuid',
  type: 'cours',
  person_filmed: 'Dr. Smith',
  filming_date: '2025-01-20',
  duration: 15,
  tags: ['anatomie', 'pratique']
})
```

#### **Récupérer des vidéos**
```javascript
import { getAllVideos } from '@/service/videoLibraryService'

// Sans filtres
const videos = await getAllVideos()

// Avec filtres
const videos = await getAllVideos({
  module_id: 'uuid',
  year_id: 'uuid',
  type: 'cours',
  search: 'anatomie'
})
```

#### **Ajouter automatiquement depuis un ticket**
```javascript
import { addTicketVideosToLibrary } from '@/service/videoLibraryService'

// Appelé automatiquement quand ticket passe en "done"
const addedVideos = await addTicketVideosToLibrary(ticket)
```

#### **Statistiques**
```javascript
import { getVideoStats } from '@/service/videoLibraryService'

const stats = await getVideoStats()
// {
//   total: 50,
//   byModule: { 'module-1': 10, 'module-2': 15 },
//   byYear: { '2024-2025': 30, '2023-2024': 20 },
//   totalDuration: 1250 // minutes
// }
```

---

## 🔗 Navigation

### **Accès à la bibliothèque**

#### **Depuis la sidebar admin**
```
Sidebar → Outils → Médias → Bibliothèque Vidéo
```

#### **Depuis les vues de tickets**
```
Vue Kanban → Bouton "Bibliothèque"
Vue Liste → Bouton "Bibliothèque"
Vue Calendrier → Bouton "Bibliothèque"
```

#### **URL directe**
```
/admin/academic/video-library
```

---

## 🎯 Cas d'usage

### **1. Enseignant cherche une vidéo spécifique**
```
Bibliothèque → Recherche "anatomie" → Filtre Module + Année → Visionner
```

### **2. Admin partage un lien avec des étudiants**
```
Bibliothèque → Trouver la vidéo → Copier lien → Partager
```

### **3. Coordination vérifie la production par module**
```
Bibliothèque → Filtre par module → Voir toutes les vidéos → Statistiques
```

### **4. Archivage automatique après montage**
```
Ticket "Vidéo cours anatomie" → Status: Terminé → Automatiquement dans bibliothèque
```

---

## 🔒 Sécurité

### **Permissions RLS Supabase**
```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Anyone authenticated can view videos"

-- Écriture : Admin et Editor uniquement
CREATE POLICY "Only admin and editor can insert videos"

-- Modification : Admin et Editor uniquement
CREATE POLICY "Only admin and editor can update videos"

-- Suppression : Admin uniquement
CREATE POLICY "Only admin can delete videos"
```

### **Validation des données**
- Vimeo URL doit être valide
- Module ID doit être un UUID ou null
- Type doit être dans la liste autorisée
- Durée doit être un nombre positif

---

## 📈 Performances

### **Optimisations**
- **Index SQL** sur vimeo_id, module_id, year_id, type, published_date
- **Index GIN** sur les tags pour recherche rapide
- **Lazy loading** des thumbnails
- **Pagination** si plus de 100 vidéos

### **Cache**
- Thumbnails Vimeo mises en cache par le navigateur
- Computed properties pour filtres temps réel
- Pas de re-fetch inutile des données

---

## 🐛 Dépannage

### **Vidéos n'apparaissent pas après ticket terminé**

1. Vérifier que le ticket a `metadata.video_links`
2. Vérifier les logs console pour erreurs
3. Vérifier les permissions Supabase (RLS)
4. Vérifier que la table `video_library` existe

### **Erreur lors du chargement des vidéos**

```javascript
// Vérifier la connexion Supabase
const { data, error } = await supabase.from('video_library').select('count')
console.log('Error:', error)
```

### **Thumbnails ne s'affichent pas**

```javascript
// Vérifier l'ID Vimeo
function getVimeoThumbnailUrl(vimeoId) {
  return `https://vumbnail.com/${vimeoId}.jpg`
}
```

---

## 🚀 Prochaines améliorations

### **Court terme**
- [ ] Export de la liste des vidéos (Excel, CSV)
- [ ] Playlists personnalisées par enseignant
- [ ] Notifications quand nouvelle vidéo ajoutée

### **Moyen terme**
- [ ] Analytics de visionnage
- [ ] Commentaires et notes sur les vidéos
- [ ] Versions multiples d'une même vidéo
- [ ] Sous-titres et transcriptions

### **Long terme**
- [ ] Intégration avec LMS (Moodle, Canvas)
- [ ] Génération automatique de playlists par thème
- [ ] Recommandations basées sur le profil étudiant
- [ ] Chapitrages automatiques avec timestamps

---

## 📞 Support

En cas de problème :
1. Vérifier les logs console navigateur
2. Vérifier les logs Supabase
3. Contacter l'équipe de développement

---

## 📝 Changelog

### Version 1.0.0 (Janvier 2025)
- ✅ Création de la bibliothèque vidéo
- ✅ Ajout automatique depuis tickets terminés
- ✅ Interface de recherche et filtrage
- ✅ Player Vimeo intégré
- ✅ Statistiques et analytics de base
- ✅ Permissions RLS Supabase
- ✅ Navigation complète entre vues

---

**Documentation complète du système de bibliothèque vidéo PFP HEdS** 🎬📚
