# 🎯 Dashboard Principal Personnalisé - Guide Complet

## 📊 Vue d'Ensemble

Le **Dashboard Principal** (`/admin`) a été complètement transformé en **dashboard personnalisé par utilisateur** avec toutes les fonctionnalités avancées du système KPI modulable.

---

## ✨ Nouveautés Principales

### 🎨 Interface Personnalisée

```
┌─────────────────────────────────────────────────┐
│  👋 Bonjour, Antoine!                           │
│  Votre dashboard personnalisé - 26 novembre     │
│                                                 │
│  [🔔 Notifications]  [⚙️ Personnaliser]        │
└─────────────────────────────────────────────────┘
```

**Features**:
- ✅ **Message de bienvenue personnalisé** avec nom de l'utilisateur
- ✅ **Avatar avec initiales** (ex: AQ pour Antoine Quarroz)
- ✅ **Date du jour** en français
- ✅ **Badge notifications** avec compteur
- ✅ **Gradient dynamique** en header

### 📱 4 Onglets Fonctionnels

#### 1️⃣ **Mes KPI**

**Contenu**:
- Grid KPI modulable avec drag & drop
- 16 KPI disponibles (tous dashboards combinés)
- Quick stats Firebase (Places, Institutions, Étudiants, Formateurs)
- Temps réel avec Firebase

**Fonctionnalités**:
```vue
<!-- Drag & drop automatique -->
<DashboardKpiGrid
  :storage-key="userStorageKey"  // Unique par utilisateur
  @kpi-action="handleKpiAction"
/>
```

#### 2️⃣ **Comparaison**

**Contenu**:
- Panneau de comparaison de périodes
- Sélection de périodes multiples
- Graphiques comparatifs
- Calculs automatiques

#### 3️⃣ **Alertes**

**Contenu**:
- Liste des alertes actives
- Création/modification/suppression
- Prévisualisation en temps réel
- Gestion des notifications

**Interface**:
```
┌─────────────────────────────────────┐
│ Mes alertes KPI            [+ Nouvelle alerte] │
├─────────────────────────────────────┤
│ ⚠️ Utilisateurs > 500               │
│    Type: Valeur absolue             │
│    Seuil: 500                       │
│    Notification: ✓                  │
└─────────────────────────────────────┘
```

#### 4️⃣ **Paramètres**

**Contenu**:
- Export/Import configuration
- Réinitialisation dashboard
- Accès rapide dashboards spécialisés
- Liens vers Général, PFP, Académique, Gamification

---

## 🔐 Personnalisation par Utilisateur

### Storage Key Unique

Chaque utilisateur a sa **propre configuration** sauvegardée:

```javascript
// Storage key unique par utilisateur
const userStorageKey = computed(() => `dashboard-kpi-config-${userId.value}`)

// Exemple:
// dashboard-kpi-config-abc123xyz  (User 1)
// dashboard-kpi-config-def456uvw  (User 2)
```

**Avantages**:
- ✅ Configuration isolée par utilisateur
- ✅ Pas d'interférence entre utilisateurs
- ✅ Personnalisation individuelle conservée
- ✅ Export/Import par utilisateur

### Données Persistantes

```javascript
// Structure de configuration par utilisateur
{
  order: ['kpi1', 'kpi3', 'kpi2'],     // Ordre personnalisé
  hidden: ['kpi4', 'kpi7'],            // KPI masqués
  alerts: {
    'kpi1': {
      enabled: true,
      type: 'value',
      threshold: 100,
      severity: 'warn',
      notify: true
    }
  }
}
```

---

## 🚀 Utilisation

### Première Connexion

1. **Accédez à** `/admin`
2. **Message de bienvenue** personnalisé s'affiche
3. **Tous les KPI** visibles par défaut
4. **Aucune alerte** configurée

### Personnalisation

#### Étape 1: Réorganiser les KPI

```
1. Onglet "Mes KPI"
2. Cliquez "Personnaliser" (header ou onglet Paramètres)
3. Mode édition activé
4. Glissez-déposez les KPI
5. Ordre sauvegardé automatiquement
```

#### Étape 2: Masquer des KPI

```
1. En mode édition
2. Cliquez sur l'icône œil
3. KPI masqué (visible en semi-transparent)
4. Re-cliquez pour afficher à nouveau
```

#### Étape 3: Configurer une Alerte

```
1. Onglet "Alertes"
2. Cliquez "Nouvelle alerte"
3. Sélectionnez un KPI
4. Configurez:
   - Type (valeur, %, tendance)
   - Seuil
   - Condition (>, <, =)
   - Sévérité (info, warn, error, success)
   - Message personnalisé
   - Notification email
5. Prévisualisez
6. Sauvegardez
```

#### Étape 4: Exporter la Configuration

```
1. Onglet "Paramètres"
2. Section "Export / Import"
3. Cliquez "Exporter ma configuration"
4. JSON généré avec:
   - Votre nom
   - Timestamp
   - Ordre des KPI
   - KPI masqués
   - Alertes configurées
5. Copiez ou sauvegardez
```

---

## 📊 Données Temps Réel

### Firebase Integration

Le dashboard affiche des données **temps réel** depuis Firebase:

```javascript
// Quick stats avec Firebase
const totalPlaces = ref(0)        // Places de stages
const totalInstitutions = ref(0)  // Institutions partenaires
const totalStudents = ref(0)      // Étudiants inscrits
const totalFormateurs = ref(0)    // Praticiens formateurs

// Listeners temps réel
onValue(placesRef, (snapshot) => {
  totalPlaces.value = snapshot.val() ? Object.keys(snapshot.val()).length : 0
})
```

**Avantages**:
- ✅ Mises à jour instantanées
- ✅ Pas besoin de rafraîchir
- ✅ Synchronisation multi-utilisateurs
- ✅ Données toujours à jour

### KPI Dynamiques

Les **16 KPI** sont chargés dynamiquement via `useKpiManager`:

```javascript
const { kpisWithData: generalKpis } = useKpiManager('general')
const { kpisWithData: pfpKpis } = useKpiManager('pfp')
const { kpisWithData: academiqueKpis } = useKpiManager('academique')
const { kpisWithData: gamificationKpis } = useKpiManager('gamification')

// Tous combinés
const userKpis = computed(() => [
  ...generalKpis.value,
  ...pfpKpis.value,
  ...academiqueKpis.value,
  ...gamificationKpis.value
])
```

---

## 🎯 Cas d'Usage

### Scénario 1: Admin Système

```
👤 User: Admin Système (Antoine)
📧 Email: antoine.quarroz@hevs.ch

Configuration:
- KPI visibles: General (4) + PFP (2)
- KPI masqués: Académique + Gamification
- Alertes: 
  ✓ Utilisateurs > 500
  ✓ Places < 10
- Export: config_admin_system.json
```

### Scénario 2: Responsable PFP

```
👤 User: Responsable PFP (Marie)
📧 Email: marie.dupont@hevs.ch

Configuration:
- KPI visibles: PFP (4) + General (2)
- KPI masqués: Académique + Gamification
- Alertes:
  ✓ Étudiants > 100
  ✓ Institutions < 5
- Export: config_resp_pfp.json
```

### Scénario 3: Enseignant

```
👤 User: Enseignant (Jean)
📧 Email: jean.martin@hevs.ch

Configuration:
- KPI visibles: Académique (4)
- KPI masqués: Tout sauf Académique
- Alertes:
  ✓ Cours < 10
  ✓ Media > 100
- Export: config_enseignant.json
```

---

## 💾 Export/Import

### Format JSON

```json
{
  "version": "1.0",
  "user": "Antoine Quarroz",
  "timestamp": "2024-11-26T09:00:00.000Z",
  "order": [
    "total_users",
    "students_count",
    "institutions_count",
    "places_count"
  ],
  "hidden": [
    "teachers_count",
    "courses_count"
  ],
  "alerts": {
    "total_users": {
      "enabled": true,
      "type": "value",
      "threshold": 500,
      "condition": "above",
      "severity": "warn",
      "customMessage": "Seuil utilisateurs atteint!",
      "notify": true
    }
  }
}
```

### Partage entre Utilisateurs

#### Exporter

```bash
1. User A: Export sa config
2. Copie le JSON
3. Envoie à User B (email, Slack, etc.)
```

#### Importer

```bash
1. User B: Onglet Paramètres
2. Cliquez "Importer une configuration"
3. Colle le JSON de User A
4. Cliquez "Importer"
5. Rechargement automatique
6. Configuration de User A appliquée!
```

**Use cases**:
- 📋 **Templates d'équipe**: Même config pour tous
- 👥 **Onboarding**: Nouvelle recrue reçoit config standard
- 🔄 **Backup**: Sauvegarde avant changements
- 🌐 **Multi-device**: Même config sur plusieurs appareils

---

## 🔔 Système de Notifications

### Toast Messages

Le dashboard utilise **PrimeVue Toast** pour les notifications:

```javascript
// Bienvenue
toast.add({
  severity: 'info',
  summary: 'Bienvenue Antoine!',
  detail: 'Personnalisez votre dashboard avec drag & drop',
  life: 4000
})

// Configuration sauvegardée
toast.add({
  severity: 'success',
  summary: 'Configuration sauvegardée',
  life: 2000
})

// Alerte configurée
toast.add({
  severity: 'success',
  summary: 'Alerte configurée',
  detail: 'Vous serez notifié par email',
  life: 3000
})
```

### Types de Notifications

| Type | Usage | Durée |
|------|-------|-------|
| `info` | Information générale | 4s |
| `success` | Action réussie | 2s |
| `warn` | Attention | 3s |
| `error` | Erreur | 5s |

---

## 🎨 Personnalisation Visuelle

### Header Gradient

```vue
<div class="dashboard-welcome">
  <!-- Gradient dynamique -->
  <style>
  background: linear-gradient(135deg, 
    var(--primary-color) 0%, 
    var(--primary-600) 100%
  );
  </style>
</div>
```

### Couleurs par Type de Card

```javascript
// Places - Bleu
style="background-color: #3b82f620; color: #3b82f6"

// Institutions - Vert
style="background-color: #10b98120; color: #10b981"

// Étudiants - Violet
style="background-color: #8b5cf620; color: #8b5cf6"

// Formateurs - Orange
style="background-color: #f59e0b20; color: #f59e0b"
```

### Animations

```css
/* Hover cards */
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* Hover dashboards */
.dashboard-link-card:hover {
  transform: translateY(-8px) scale(1.02);
}
```

---

## 🔐 Sécurité & Permissions

### Authentification Requise

```javascript
// Route protégée
{
  path: '/admin',
  component: DashboardView,
  meta: { 
    requiresAuth: true,
    need: ['admin', 'super.all', 'AdminPhysio', 'EnseignantPhysio']
  }
}
```

### Données Utilisateur

```javascript
// User depuis Firebase Auth
const user = computed(() => auth.currentUser)
const userId = computed(() => user.value?.uid || 'default')
const userName = computed(() => 
  user.value?.displayName || 
  user.value?.email?.split('@')[0] || 
  'Admin'
)
```

### Isolation des Données

- ✅ **Storage key unique** par userId
- ✅ **Pas d'accès** aux configs d'autres users
- ✅ **localStorage** isolé par domaine
- ✅ **Export** inclut le nom de l'utilisateur

---

## 🛠️ Maintenance

### Réinitialiser un Dashboard

```javascript
// Méthode 1: Via UI
function confirmReset() {
  confirm.require({
    message: 'Réinitialiser votre dashboard ?',
    accept: () => {
      kpiGridRef.value.resetConfig()
      localStorage.removeItem(userStorageKey.value)
      location.reload()
    }
  })
}

// Méthode 2: Console dev
localStorage.removeItem('dashboard-kpi-config-abc123xyz')
location.reload()
```

### Debug

```javascript
// Voir la config actuelle
const config = localStorage.getItem('dashboard-kpi-config-abc123xyz')
console.log(JSON.parse(config))

// Logs détaillés
localStorage.setItem('dashboard-debug', 'true')
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Desktop: > 1024px */
.grid { grid-template-columns: repeat(4, 1fr); }

/* Tablet: 768-1024px */
@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .dashboard-welcome { text-align: center; }
}
```

### Mobile Features

- ✅ **Touch events** pour drag & drop
- ✅ **Dialogs plein écran**
- ✅ **Navigation simplifiée**
- ✅ **Texte adapté** (2rem au lieu de 4xl)

---

## 🎯 Comparaison Ancien vs Nouveau

### Avant

```
❌ Dashboard statique identique pour tous
❌ Pas de personnalisation
❌ Pas d'alertes
❌ Pas d'export/import
❌ Pas de drag & drop
❌ Configuration manuelle dans code
```

### Après

```
✅ Dashboard personnalisé par utilisateur
✅ Drag & drop complet
✅ Alertes configurables
✅ Export/Import JSON
✅ 4 onglets fonctionnels
✅ Temps réel Firebase
✅ Storage unique par user
✅ Interface moderne
✅ 100% responsive
✅ Notifications toast
```

---

## 🚀 Prochaines Améliorations

### Phase 2 (Court terme)

- [ ] **Thèmes** : Sélection light/dark par user
- [ ] **Widgets supplémentaires** : Calendrier, tâches
- [ ] **Raccourcis clavier** : Ctrl+D pour édition
- [ ] **Favoris** : Marquer KPI préférés
- [ ] **Notes personnelles** : Annotations sur KPI

### Phase 3 (Moyen terme)

- [ ] **Partage config** : Via email intégré
- [ ] **Templates prédéfinis** : Par rôle
- [ ] **Historique configs** : Rollback possible
- [ ] **Multi-dashboards** : Plusieurs vues par user
- [ ] **Sync cloud** : Config sur serveur

### Phase 4 (Long terme)

- [ ] **IA Suggestions** : Config automatique
- [ ] **Mobile app** : Application native
- [ ] **Collaboration** : Dashboards partagés
- [ ] **Webhooks** : Alertes externes
- [ ] **API REST** : Gestion programmatique

---

## 📚 Documentation Technique

### Composants Utilisés

```javascript
// Core
import DashboardKpiGrid from '@/components/admin/widgets/DashboardKpiGrid.vue'
import PeriodComparisonPanel from '@/components/admin/widgets/PeriodComparisonPanel.vue'
import KpiAlertManager from '@/components/admin/widgets/KpiAlertManager.vue'

// PrimeVue
import { TabView, TabPanel, Card, Button, Avatar, Badge, Tag, Message, Dialog, Textarea, Toast, ConfirmDialog }

// Composables
import { useKpiManager } from '@/composables/useKpiManager'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Firebase
import { auth, db } from '@/firebase'
import { ref as dbRef, onValue } from 'firebase/database'
```

### Props & Events

```typescript
// DashboardKpiGrid
interface Props {
  kpis: KPI[]
  title?: string
  subtitle?: string
  storageKey: string  // IMPORTANT: Unique par user
}

interface Events {
  'kpi-action': (kpi: KPI) => void
  'config-changed': (config: UserConfig) => void
}
```

---

## 💡 Tips & Astuces

### Performance

1. **Lazy loading** des onglets
2. **Debounce** sur drag & drop
3. **Cache** des données Firebase
4. **Pagination** pour grandes listes

### UX

1. **Toast** pour feedback immédiat
2. **ConfirmDialog** avant actions destructives
3. **Skeleton loaders** pendant chargement
4. **Messages d'aide** contextuels

### Bonnes Pratiques

1. **Exporter régulièrement** sa config
2. **Tester import** avant de supprimer l'original
3. **Nommer** les exports (ex: config_2024_11_26.json)
4. **Partager** les configs d'équipe
5. **Documenter** les alertes configurées

---

## 🎓 Formation Utilisateurs

### Vidéos Tutoriels (à créer)

1. **Introduction** (3min)
   - Vue d'ensemble
   - Navigation onglets
   - Quick stats

2. **Personnalisation** (5min)
   - Drag & drop
   - Masquer/afficher
   - Ordre des KPI

3. **Alertes** (4min)
   - Créer une alerte
   - Configurer seuils
   - Notifications

4. **Export/Import** (3min)
   - Exporter config
   - Partager avec équipe
   - Importer et restaurer

### Checklist Onboarding

```
□ Accéder à /admin
□ Lire message de bienvenue
□ Explorer les 4 onglets
□ Activer mode édition
□ Réorganiser 2-3 KPI
□ Masquer 1 KPI non pertinent
□ Créer 1 alerte de test
□ Exporter sa configuration
□ Naviguer vers dashboard spécialisé
```

---

## 🏆 Résumé

**Le Dashboard Principal** est maintenant un **hub personnalisé** offrant:

- ✅ **Personnalisation complète** par utilisateur
- ✅ **16 KPI modulables** avec drag & drop
- ✅ **Alertes intelligentes** configurables
- ✅ **Comparaison de périodes** multi-critères
- ✅ **Export/Import** de configuration
- ✅ **Temps réel** avec Firebase
- ✅ **Interface moderne** et responsive
- ✅ **Notifications** toast intégrées
- ✅ **4 onglets** fonctionnels
- ✅ **Accès rapide** aux dashboards spécialisés

**Route**: `http://localhost:5178/admin`

**Profitez de votre dashboard personnalisé!** 🚀

---

**Version**: 2.0.0  
**Date**: 26 novembre 2024  
**Auteur**: Système Admin PFPHEdS  
**Licence**: MIT
