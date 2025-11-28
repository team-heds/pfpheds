# 🚀 Fonctionnalités Avancées - Dashboard Admin

## 📋 Table des matières

1. [Drag & Drop](#drag--drop)
2. [Export/Import Configuration](#exportimport-configuration)
3. [Système d'Alertes](#système-dalertes)
4. [Comparaison de Périodes](#comparaison-de-périodes)
5. [Dashboard Principal](#dashboard-principal)

---

## 🎯 Drag & Drop

### Fonctionnalité
Réorganisez vos KPI par simple glisser-déposer pour créer votre vue personnalisée.

### Utilisation

```vue
<DashboardKpiGrid
  :kpis="kpisData"
  storage-key="mon-dashboard-config"
  @config-changed="handleConfigChange"
/>
```

### Caractéristiques

- **Mode édition** : Activez avec le bouton "Personnaliser"
- **Glisser-déposer** : Maintenez et déplacez les cartes KPI
- **Masquer/Afficher** : Cliquez sur l'œil pour masquer un KPI
- **Sauvegarde auto** : Configuration sauvegardée dans localStorage
- **Persistance** : Votre configuration est conservée entre les sessions

### Code

```javascript
// Le composant DashboardKpiGrid gère automatiquement:
// - Le drag & drop avec HTML5 Drag API
// - La persistance avec localStorage
// - L'ordre personnalisé des KPI
// - La visibilité de chaque KPI

const userConfig = {
  order: ['kpi1', 'kpi3', 'kpi2'], // Ordre personnalisé
  hidden: ['kpi4'],                // KPI masqués
  alerts: {}                       // Alertes configurées
}
```

### Événements

| Événement | Description | Données |
|-----------|-------------|---------|
| `config-changed` | Configuration modifiée | `{ order, hidden, alerts }` |
| `kpi-action` | Clic sur un KPI | `kpi` object |

---

## 💾 Export/Import Configuration

### Export de Configuration

**Fonctionnalité** : Exportez votre configuration personnalisée au format JSON.

**Utilisation** :
1. Cliquez sur "Exporter"
2. Copiez le JSON généré
3. Sauvegardez dans un fichier ou partagez

**Format JSON** :
```json
{
  "version": "1.0",
  "timestamp": "2024-11-26T09:00:00.000Z",
  "kpis": [
    {
      "id": "total_users",
      "label": "Utilisateurs Totaux"
    }
  ],
  "order": ["total_users", "total_roles"],
  "hidden": ["route_count"],
  "alerts": {
    "total_users": {
      "enabled": true,
      "type": "value",
      "threshold": 100,
      "severity": "warn"
    }
  }
}
```

### Import de Configuration

**Fonctionnalité** : Restaurez une configuration exportée.

**Utilisation** :
1. Cliquez sur "Importer"
2. Collez votre JSON
3. Cliquez "Importer"
4. Configuration restaurée instantanément

### Cas d'Usage

- **Sauvegarde** : Gardez une copie de votre configuration
- **Partage** : Partagez votre disposition avec l'équipe
- **Templates** : Créez des modèles de dashboard
- **Environnements** : Différentes configs pour dev/prod

---

## 🔔 Système d'Alertes

### Vue d'ensemble

Configurez des alertes automatiques qui se déclenchent selon des seuils personnalisés.

### Types d'Alertes

#### 1. **Valeur Absolue**
Alerte quand un KPI atteint une valeur spécifique.

```javascript
{
  type: 'value',
  threshold: 100,
  condition: 'above', // ou 'below', 'equal'
  severity: 'warn'
}
```

**Exemple** : Alerte si nombre d'utilisateurs > 500

#### 2. **Variation en Pourcentage**
Alerte sur la variation relative entre périodes.

```javascript
{
  type: 'percentage',
  threshold: 20,
  condition: 'above',
  severity: 'info'
}
```

**Exemple** : Alerte si augmentation > 20%

#### 3. **Tendance**
Alerte basée sur la tendance (hausse/baisse).

```javascript
{
  type: 'trend',
  condition: 'above',
  severity: 'success'
}
```

### Niveaux de Sévérité

| Sévérité | Couleur | Usage |
|----------|---------|-------|
| `info` | Bleu | Information générale |
| `warn` | Orange | Attention requise |
| `error` | Rouge | Problème critique |
| `success` | Vert | Objectif atteint |

### Configuration

```vue
<KpiAlertManager
  v-model="showDialog"
  :kpi="selectedKpi"
  @save="handleSave"
  @remove="handleRemove"
/>
```

### Notifications

- **Email** : Optionnel, active les notifications email
- **Message personnalisé** : Texte d'alerte personnalisable
- **Prévisualisation** : Voir l'alerte avant de sauvegarder

### API

```javascript
// Définir une alerte
kpiGridRef.value.setKpiAlert('kpi_id', {
  enabled: true,
  type: 'value',
  threshold: 100,
  condition: 'above',
  severity: 'warn',
  customMessage: 'Seuil critique atteint!',
  notify: true
})

// Supprimer une alerte
kpiGridRef.value.setKpiAlert('kpi_id', null)
```

---

## 📊 Comparaison de Périodes

### Fonctionnalité

Comparez les KPI entre différentes périodes pour analyser les tendances.

### Périodes Disponibles

**Période Actuelle** :
- 7 derniers jours
- 30 derniers jours
- 90 derniers jours
- Cette année
- Personnalisée

**Période de Comparaison** :
- Période précédente
- Même période année dernière
- Début de l'année
- Personnalisée

### Utilisation

```vue
<PeriodComparisonPanel
  :kpis="allKpis"
  @compare="handleComparison"
/>
```

### Métriques Calculées

Pour chaque KPI comparé :

1. **Variation Absolue**
   ```
   Différence = Valeur Actuelle - Valeur Précédente
   ```

2. **Variation en Pourcentage**
   ```
   % = ((Actuelle - Précédente) / Précédente) × 100
   ```

3. **Graphique Comparatif**
   - Barre avant/après
   - Indicateur visuel de progression

4. **Tag de Performance**
   - Vert : +20% ou plus
   - Bleu : +5% à +20%
   - Gris : -5% à +5%
   - Orange : -20% à -5%
   - Rouge : -20% ou moins

### Exemple de Résultat

```javascript
{
  currentPeriod: '30d',
  comparePeriod: 'previous',
  data: [
    {
      id: 'total_users',
      label: 'Utilisateurs',
      currentValue: 1234,
      previousValue: 1000,
      variation: 23.4 // +23.4%
    }
  ]
}
```

### Événement Émis

```javascript
@compare="(data) => {
  console.log('Période:', data.currentPeriod)
  console.log('Comparé avec:', data.comparePeriod)
  console.log('Résultats:', data.data)
}"
```

---

## 🏠 Dashboard Principal

### Route
```
/admin/enhanced-dashboard
```

### Structure

Le dashboard principal est organisé en **4 onglets** :

#### 1. 📊 **Vue d'ensemble**

**Contenu** :
- Tous les KPI (Général + PFP + Académique + Gamification)
- Grid modulable avec drag & drop
- Quick stats (KPI actifs, alertes, dashboards)
- Boutons personnalisation, export, import

**Features** :
- ✅ Drag & drop pour réorganiser
- ✅ Masquer/afficher les KPI
- ✅ Mode comparaison activable
- ✅ Export/import configuration

#### 2. 📈 **Comparaison**

**Contenu** :
- Panneau de comparaison de périodes
- Sélection période actuelle vs précédente
- Résultats visuels par KPI
- Graphiques comparatifs

**Features** :
- ✅ Comparaison multi-périodes
- ✅ Graphiques avant/après
- ✅ Calculs automatiques
- ✅ Tags de performance

#### 3. 🔔 **Alertes**

**Contenu** :
- Liste des alertes actives
- Configuration par KPI
- Gestion des seuils
- Prévisualisation

**Features** :
- ✅ Créer/modifier/supprimer alertes
- ✅ 3 types d'alertes
- ✅ 4 niveaux de sévérité
- ✅ Notifications email

#### 4. 📱 **Dashboards**

**Contenu** :
- Liens vers les 4 dashboards spécialisés
- Cartes cliquables avec icônes
- Descriptions

**Dashboards Disponibles** :
- **Général** : Administration système
- **PFP** : Formation pratique professionnelle
- **Académique** : Enseignement & cours
- **Gamification** : Engagement & quêtes

### Utilisation Complète

```vue
<template>
  <EnhancedDashboardView />
</template>

<script setup>
import EnhancedDashboardView from '@/views/admin/EnhancedDashboardView.vue'
</script>
```

### Composants Utilisés

```javascript
import DashboardKpiGrid from '@/components/admin/widgets/DashboardKpiGrid.vue'
import PeriodComparisonPanel from '@/components/admin/widgets/PeriodComparisonPanel.vue'
import KpiAlertManager from '@/components/admin/widgets/KpiAlertManager.vue'
```

### Store de Configuration

La configuration utilisateur est stockée dans **localStorage** :

```javascript
// Clé de stockage
localStorage.getItem('admin-dashboard-kpi-config')

// Structure
{
  order: ['kpi1', 'kpi2'],
  hidden: ['kpi3'],
  alerts: {
    'kpi1': { /* config alerte */ }
  }
}
```

---

## 🎯 Workflow Complet

### Scénario d'utilisation typique

1. **Premier accès** au dashboard
   - Tous les KPI affichés dans ordre par défaut
   - Aucune alerte configurée

2. **Personnalisation**
   - Activer mode édition
   - Glisser-déposer pour réorganiser
   - Masquer les KPI non pertinents
   - Sauvegarder automatiquement

3. **Configuration alertes**
   - Aller dans l'onglet "Alertes"
   - Sélectionner un KPI
   - Configurer seuil et conditions
   - Activer notifications

4. **Analyse comparative**
   - Onglet "Comparaison"
   - Sélectionner périodes
   - Lancer la comparaison
   - Analyser les résultats

5. **Partage de configuration**
   - Exporter la configuration
   - Envoyer à un collègue
   - Collègue importe
   - Même vue partagée

6. **Accès dashboards spécialisés**
   - Onglet "Dashboards"
   - Cliquer sur dashboard souhaité
   - Vue détaillée du domaine

---

## 🔧 Configuration Technique

### Dépendances

```json
{
  "primevue": "^3.52.0",
  "vue": "^3.4.21",
  "vue-chartjs": "^5.3.2",
  "chart.js": "^4.5.0"
}
```

### Services Utilisés

```javascript
// Service KPI Manager
import { useKpiManager } from '@/composables/useKpiManager'

// Charger KPI par dashboard
const { kpisWithData, loadKpis } = useKpiManager('general')
```

### Composables

| Composable | Usage |
|------------|-------|
| `useKpiManager` | Gestion des KPI par dashboard |
| `useToast` | Notifications utilisateur |
| `useRouter` | Navigation |

---

## 📱 Responsive Design

Toutes les fonctionnalités sont **100% responsive** :

- **Desktop** : Grid 4 colonnes
- **Tablet** : Grid 2 colonnes
- **Mobile** : Grid 1 colonne
- **Drag & Drop** : Tactile supporté
- **Dialogs** : Plein écran sur mobile

---

## 🎨 Personnalisation

### Thèmes

Les composants respectent le thème PrimeVue actif :

```javascript
// Variables CSS utilisées
var(--surface-card)
var(--surface-border)
var(--text-color)
var(--primary-color)
```

### Couleurs KPI

Personnalisables dans `kpiConfigs.js` :

```javascript
{
  color: '#3b82f6'  // Couleur personnalisée
}
```

---

## 🚀 Roadmap Future

### Améliorations Prévues

- [ ] **Multi-utilisateurs** : Partage de configs cloud
- [ ] **Widgets avancés** : Donut charts, bar charts
- [ ] **Données historiques** : Graphiques d'évolution
- [ ] **Export PDF** : Rapports automatiques
- [ ] **Webhooks** : Alertes vers Slack/Teams
- [ ] **Templates** : Bibliothèque de dashboards
- [ ] **AI Insights** : Suggestions automatiques
- [ ] **Mobile App** : Application native

---

## 📚 Documentation API

### DashboardKpiGrid

```typescript
interface Props {
  kpis: KPI[]
  title?: string
  subtitle?: string
  storageKey?: string
}

interface Events {
  'kpi-action': (kpi: KPI) => void
  'config-changed': (config: UserConfig) => void
}

interface Methods {
  setKpiAlert(kpiId: string, alert: Alert | null): void
  resetConfig(): void
}
```

### PeriodComparisonPanel

```typescript
interface Props {
  kpis: KPI[]
}

interface Events {
  'compare': (data: ComparisonResult) => void
}
```

### KpiAlertManager

```typescript
interface Props {
  kpi: KPI | null
  modelValue: boolean
}

interface Events {
  'update:modelValue': (visible: boolean) => void
  'save': (kpiId: string, alert: Alert) => void
  'remove': (kpiId: string) => void
}
```

---

## 💡 Bonnes Pratiques

1. **Sauvegardez régulièrement** votre configuration
2. **Testez les alertes** avant d'activer les notifications
3. **Utilisez des noms descriptifs** pour les alertes personnalisées
4. **Comparez des périodes cohérentes** (même durée)
5. **Limitez le nombre de KPI** visibles pour clarté
6. **Partagez les templates** avec votre équipe

---

## 🐛 Debugging

### Logs Console

```javascript
// Activer les logs détaillés
localStorage.setItem('dashboard-debug', 'true')

// Voir la config actuelle
console.log(localStorage.getItem('admin-dashboard-kpi-config'))
```

### Reset Configuration

```javascript
// Via l'API
kpiGridRef.value.resetConfig()

// Manuellement
localStorage.removeItem('admin-dashboard-kpi-config')
location.reload()
```

---

## 🎓 Support

Pour toute question ou problème :

1. Consultez cette documentation
2. Vérifiez la console navigateur
3. Testez avec une config vierge
4. Contactez le support technique

---

**Dernière mise à jour** : 26 novembre 2024
**Version** : 1.0.0
**Auteur** : Système Admin PFPHEdS
