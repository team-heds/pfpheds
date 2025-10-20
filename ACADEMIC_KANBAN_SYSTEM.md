# 📋 Système de Gestion Académique avec Kanban

## 🎯 Vue d'ensemble

Système complet de gestion de la production de contenu académique avec un tableau Kanban permettant de suivre les tickets de production (vidéos, développements, simulations) depuis la demande jusqu'à la publication sur Vimeo.

## 🏗️ Architecture

### Composants créés

#### 1️⃣ **Services**
- `src/service/ticketService.js` - Service Supabase pour la gestion des tickets
  - CRUD complet des tickets
  - Changement de statut (drag & drop)
  - Publication sur Vimeo
  - Statistiques

#### 2️⃣ **Composants Vue**
- `src/components/academic/KanbanBoard.vue` - Tableau Kanban avec 6 colonnes
- `src/components/academic/TicketForm.vue` - Formulaire de création/édition
- `src/components/academic/TicketDetails.vue` - Vue détaillée d'un ticket

#### 3️⃣ **Vues principales**
- `src/views/admin/academic/AcademicKanbanView.vue` - Page principale du Kanban
- `src/views/admin/academic/MediaContentView.vue` - Gestion du contenu multimédia

#### 4️⃣ **Base de données**
- `supabase/migrations/create_academic_tickets.sql` - Migration SQL Supabase

#### 5️⃣ **Navigation**
- Routes ajoutées dans `router.js`
- Menu ajouté dans `AdminSidebar.vue`

---

## 📊 Structure de la base de données

### Table `academic_tickets`

```sql
CREATE TABLE academic_tickets (
  id UUID PRIMARY KEY,
  type VARCHAR(50) -- 'video', 'development', 'simulation', 'other'
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) -- 'backlog', 'todo', 'in_progress', 'validation', 'problems', 'done'
  priority VARCHAR(20) -- 'low', 'normal', 'high', 'urgent'
  module_id UUID REFERENCES modules(id),
  created_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMP,
  metadata JSONB, -- Données spécifiques au type
  has_assets BOOLEAN,
  vimeo_id VARCHAR(100),
  vimeo_url TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Métadonnées par type (JSONB)

#### Type VIDÉO
```json
{
  "person_filmed": "Prof. Dupont",
  "filming_date": "2025-01-25T10:00:00Z",
  "modality": "powerpoint_sonorise",
  "duration_minutes": 15,
  "assets_url": "https://drive.google.com/..."
}
```

**Modalités disponibles :**
- `powerpoint_sonorise` - PowerPoint sonorisé
- `table_ronde` - Table ronde
- `podcast` - Podcast
- `interview` - Interview
- `tutorial` - Tutoriel
- `other` - Autre

#### Type DÉVELOPPEMENT
```json
{
  "dev_type": "web_app",
  "technologies": "Vue.js, Node.js",
  "repository_url": "https://github.com/..."
}
```

#### Type SIMULATION
```json
{
  "sim_type": "clinical_case",
  "participants_count": 5,
  "equipment": "Mannequins, matériel d'injection..."
}
```

---

## 🎨 Workflow Kanban

### Colonnes du tableau

1. **Backlog** 📥
   - Nouvelles demandes
   - En attente de planification

2. **À faire** 📋
   - Tickets validés et planifiés
   - Prêts à être pris en charge

3. **En cours** 🔄
   - Production en cours
   - Tournage, développement, montage

4. **Validation** ✅
   - En attente de validation
   - Revue qualité

5. **Problèmes** ⚠️
   - Tickets bloqués
   - Nécessitent une intervention

6. **Terminé** 🎉
   - Production terminée
   - Publié sur Vimeo (pour vidéos)

### Drag & Drop

Les tickets peuvent être déplacés entre les colonnes par glisser-déposer. Le changement de statut est automatiquement sauvegardé dans Supabase.

---

## 📹 Workflow Vidéo

### 1. Création du ticket

**Via le Kanban :**
1. Cliquer "Nouveau ticket"
2. Sélectionner type "Vidéo"
3. Remplir le formulaire :
   - Titre de la vidéo
   - Module associé
   - Personne filmée
   - Date de tournage
   - Modalité (PowerPoint, Podcast, etc.)
   - Date de rendu
   - Assets (slides, documents)

### 2. Suivi de la production

Le ticket progresse dans le Kanban :
- **Backlog** → Demande reçue
- **À faire** → Planifié
- **En cours** → Tournage/Montage
- **Validation** → Revue
- **Terminé** → Prêt pour publication

### 3. Publication sur Vimeo

Quand le ticket est en **Validation** ou **Terminé** :
1. Uploader la vidéo sur Vimeo (manuellement)
2. Récupérer l'ID et l'URL Vimeo
3. Dans le détail du ticket, cliquer "Publier sur Vimeo"
4. Renseigner l'ID et l'URL
5. Le ticket passe automatiquement en "Terminé"

### 4. Affichage dans la gestion du contenu

La vidéo apparaît automatiquement dans :
- `/admin/academic/media-content`
- Organisée par module
- Accessible aux enseignants

---

## 🔧 Utilisation

### Accès au système

**Menu Admin → Gestion Académique**

Deux pages disponibles :
1. **Tableau Kanban** - Gestion des tickets
2. **Gestion Contenu Multimédia** - Vue des vidéos publiées

### Créer un ticket

1. Aller sur `/admin/academic/kanban`
2. Cliquer "Nouveau ticket"
3. Choisir le type (Vidéo, Développement, Simulation, Autre)
4. Remplir le formulaire selon le type
5. Enregistrer

### Gérer les tickets

**Actions disponibles :**
- 📝 Modifier - Éditer le ticket
- 📋 Dupliquer - Créer une copie
- 🗑️ Supprimer - Effacer le ticket
- 👁️ Voir détails - Afficher toutes les infos

**Changement de statut :**
- Glisser-déposer entre les colonnes
- Ou éditer et changer le statut

### Filtrer les tickets

**Filtres disponibles :**
- Type de contenu
- Module
- Recherche textuelle

### Statistiques

Cliquer sur "Statistiques" pour voir :
- Total de tickets
- Répartition par statut
- Répartition par type

---

## 🎥 Gestion du contenu multimédia

### Page `/admin/academic/media-content`

**Fonctionnalités :**
- Vue des vidéos publiées organisées par modules
- Statistiques :
  - Total de vidéos
  - Modules avec vidéos
  - Durée totale
  - Vidéos ce mois-ci
- Filtres par module et année
- Recherche de vidéos
- Player Vimeo intégré

**Actions :**
- Voir la vidéo sur Vimeo
- Modifier le ticket source
- Ajouter une nouvelle vidéo à un module

---

## 🔐 Permissions

### Rôles requis

**Admin / Editor** peuvent :
- ✅ Créer des tickets
- ✅ Modifier tous les tickets
- ✅ Supprimer tous les tickets
- ✅ Changer les statuts
- ✅ Publier sur Vimeo
- ✅ Voir toutes les statistiques

**Autres utilisateurs authentifiés** peuvent :
- ✅ Voir tous les tickets
- ✅ Créer leurs propres tickets
- ✅ Modifier leurs propres tickets
- ⛔ Ne peuvent pas modifier les tickets des autres

---

## 📱 Interface responsive

Le système est entièrement responsive :
- **Desktop** : Vue Kanban complète avec 6 colonnes
- **Tablette** : Vue 3 colonnes par rangée
- **Mobile** : Vue 1 colonne, scroll horizontal

---

## 🚀 Installation

### 1. Migration SQL

Exécuter dans Supabase SQL Editor :
```bash
supabase/migrations/create_academic_tickets.sql
```

### 2. Vérifications

- ✅ Table `academic_tickets` créée
- ✅ Table `modules` existe (pour les relations)
- ✅ Policies RLS activées
- ✅ Vue `academic_tickets_stats` créée

### 3. Redémarrer l'application

```bash
npm run dev
```

### 4. Tester

1. Se connecter en tant qu'admin
2. Aller sur `/admin/academic/kanban`
3. Créer un ticket de test
4. Tester le drag & drop

---

## 🔄 Intégration avec Vimeo

### Configuration

Le système suppose que vous avez :
- Un compte Vimeo
- Accès pour uploader des vidéos
- Les IDs et URLs des vidéos

### Processus

1. **Upload manuel** sur Vimeo (pour l'instant)
2. **Récupération** de l'ID et URL
3. **Publication** via le système
4. **Synchronisation** automatique dans la gestion de contenu

### Future amélioration

Possibilité d'intégrer l'API Vimeo pour :
- Upload direct depuis l'interface
- Récupération automatique des métadonnées
- Gestion des playlists par module

---

## 📊 Statistiques et rapports

### Vue globale

- Total de tickets par statut
- Répartition par type de contenu
- Tickets en retard
- Performance par module

### Vue détaillée

Pour chaque ticket :
- Historique des changements
- Temps passé dans chaque statut
- Commentaires et notes

---

## 🎯 Cas d'usage

### Exemple 1 : Production vidéo PowerPoint sonorisé

1. **Enseignant** crée un ticket :
   - Type : Vidéo
   - Titre : "Introduction aux soins de base"
   - Module : Soins infirmiers 1ère année
   - Modalité : PowerPoint sonorisé
   - Assets : Lien vers le PowerPoint

2. **Équipe multimédia** :
   - Déplace en "À faire"
   - Planifie le tournage
   - Déplace en "En cours"
   - Enregistre la voix-off
   - Monte la vidéo

3. **Validation** :
   - Déplace en "Validation"
   - L'enseignant valide

4. **Publication** :
   - Upload sur Vimeo
   - Publication dans le système
   - Déplace en "Terminé"
   - Disponible dans la gestion de contenu

### Exemple 2 : Développement d'un plugin

1. **Demande** :
   - Type : Développement
   - Titre : "Plugin de quiz interactif"
   - Technologies : Vue.js, Supabase
   - Repository : GitHub

2. **Développement** :
   - Backlog → À faire → En cours
   - Commits GitHub liés
   - Revue de code

3. **Tests et déploiement** :
   - Validation → Tests
   - Problèmes → Corrections
   - Terminé → Déployé

---

## 🛠️ Maintenance

### Nettoyage des données

```sql
-- Supprimer les tickets terminés de plus de 6 mois
DELETE FROM academic_tickets 
WHERE status = 'done' 
AND updated_at < NOW() - INTERVAL '6 months';
```

### Sauvegarde

Les données sont automatiquement sauvegardées par Supabase. 

Pour un export manuel :
```sql
-- Export des tickets
COPY academic_tickets TO '/tmp/tickets.csv' CSV HEADER;
```

---

## 📝 Notes importantes

### Données sensibles

- Les assets peuvent contenir des liens vers Google Drive ou autres
- Vérifier les permissions sur ces liens
- Ne pas stocker de données sensibles dans les métadonnées

### Performance

- La table est indexée sur les colonnes fréquemment utilisées
- Le JSONB metadata est indexé avec GIN pour recherche rapide
- Pagination automatique côté client pour les grandes listes

### Évolutivité

Le système peut facilement être étendu pour :
- Nouveaux types de contenu
- Champs personnalisés dans metadata
- Workflow personnalisé par type
- Notifications par email/Slack
- Intégration avec d'autres outils

---

## 🎓 Formation

### Pour les enseignants

1. Comment créer une demande de vidéo
2. Comment suivre l'avancement
3. Comment valider le résultat

### Pour l'équipe multimédia

1. Comment gérer le Kanban
2. Comment prioriser les demandes
3. Comment publier sur Vimeo

### Documentation utilisateur

À créer : Guide utilisateur avec captures d'écran

---

## 🐛 Dépannage

### Les tickets ne se chargent pas

1. Vérifier la connexion Supabase
2. Vérifier les permissions RLS
3. Regarder la console du navigateur

### Le drag & drop ne fonctionne pas

1. Vérifier que l'utilisateur a les droits de modification
2. Vérifier la connexion réseau
3. Essayer de rafraîchir la page

### Les vidéos Vimeo ne s'affichent pas

1. Vérifier que vimeo_id est correct
2. Vérifier que la vidéo est publique ou accessible
3. Vérifier les paramètres d'embed Vimeo

---

## 📧 Support

Pour toute question ou problème :
- Créer un ticket dans le Kanban (type: Autre)
- Contacter l'équipe de développement
- Consulter la documentation Supabase

---

## 🎉 Conclusion

Ce système offre une solution complète pour gérer la production de contenu académique de manière organisée et collaborative. Il permet un suivi transparent du début à la fin et facilite la collaboration entre enseignants et équipe multimédia.
