# 📊 Widgets Admin - Système KPI Modulable

## Vue d'ensemble

Ce dossier contient les widgets réutilisables pour les dashboards admin, notamment le **système KPI modulable** qui permet de créer et configurer des KPI de manière flexible et role-aware.

## Composants

### 🎯 KpiCard.vue

Composant générique pour afficher un KPI avec toutes ses fonctionnalités.

**Props:**
- `label` (String, requis) - Libellé du KPI
- `subtitle` (String) - Sous-titre optionnel
- `value` (Number|String, requis) - Valeur à afficher
- `icon` (String, requis) - Icône PrimeIcons
- `color` (String) - Couleur personnalisée (hex)
- `trend` (Number) - Pourcentage de variation (+12, -5, etc.)
- `comparison` (String) - Texte de comparaison
- `chartData` (Array) - Données pour mini-graphique
- `showChart` (Boolean) - Afficher le graphique
- `animated` (Boolean) - Animation du chiffre
- `clickable` (Boolean) - Rendre cliquable
- `actionLabel` (String) - Label du bouton d'action
- `variant` (String) - 'default' | 'compact' | 'large'
- `loading` (Boolean) - État de chargement

**Events:**
- `@action` - Émis au clic sur le KPI ou le bouton

**Exemple:**
```vue
<KpiCard
  label="Utilisateurs"
  subtitle="Total système"
  :value="1234"
  icon="pi pi-users"
  color="#3b82f6"
  :trend="12"
  comparison="vs 1,102 semaine dernière"
  :chartData="[100, 120, 115, 130, 125, 140, 135]"
  :showChart="true"
  :clickable="true"
  actionLabel="Voir liste"
  @action="handleClick"
/>
```

### 📈 MiniChart.vue

Composant de mini-graphique utilisant Chart.js pour afficher des tendances.

**Props:**
- `data` (Array) - Tableau de valeurs numériques
- `color` (String) - Couleur de la ligne
- `height` (Number|String) - Hauteur en pixels

**Exemple:**
```vue
<MiniChart
  :data="[10, 20, 15, 30, 25, 40, 35]"
  color="#3b82f6"
  :height="40"
/>
```

## Configuration (kpiConfigs.js)

Tous les KPI sont configurés centralement dans `/src/config/kpiConfigs.js`.

**Structure d'un KPI:**
```javascript
{
  id: 'total_users',               // Identifiant unique
  label: 'Utilisateurs Totaux',    // Libellé affiché
  subtitle: 'Comptes actifs',      // Sous-titre
  icon: 'pi pi-users',             // Icône PrimeIcons
  color: '#3b82f6',                // Couleur personnalisée
  dataKey: 'totalUsers',           // Clé dans les données retournées
  showChart: true,                 // Afficher mini-graphique
  animated: true,                  // Animer le chiffre
  clickable: true,                 // Rendre cliquable
  actionLabel: 'Voir',             // Label du bouton
  fetchFn: 'fetchGeneralKpis',     // Fonction du service
  order: 1,                        // Ordre d'affichage
  visible: true,                   // Visibilité
  roles: ['admin', 'super.all']    // Rôles autorisés
}
```

**Dashboards disponibles:**
- `general` - Admin général
- `pfp` - Formation pratique
- `academique` - Académique
- `gamification` - Gamification

## Composable (useKpiManager)

Le composable `/src/composables/useKpiManager.js` gère toute la logique des KPI.

**Utilisation:**
```vue
<script setup>
import { useKpiManager } from '@/composables/useKpiManager'

const {
  kpisWithData,      // KPI avec données enrichies
  loading,           // État de chargement
  refreshing,        // État de rafraîchissement
  period,            // Période sélectionnée ('7d', '30d', '90d')
  loadKpis,          // Charger les KPI
  refresh            // Rafraîchir
} = useKpiManager('general')
</script>
```

**Fonctionnalités:**
- Filtrage automatique selon rôles/permissions
- Groupement des appels API
- Calcul automatique des tendances
- Génération de données de graphiques
- Support multi-périodes

## Exemple complet d'utilisation

```vue
<template>
  <AdminLayout>
    <div class="dashboard">
      <!-- Header avec filtres -->
      <div class="header">
        <h1>Mon Dashboard</h1>
        <ButtonGroup>
          <Button label="7j" @click="period = '7d'" />
          <Button label="30j" @click="period = '30d'" />
          <Button label="90j" @click="period = '90d'" />
        </ButtonGroup>
        <Button icon="pi pi-refresh" @click="refresh" :loading="refreshing" />
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <KpiCard
          v-for="kpi in kpisWithData"
          :key="kpi.id"
          v-bind="kpi"
          @action="handleKpiAction(kpi)"
        />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import KpiCard from './widgets/KpiCard.vue'
import { useKpiManager } from '@/composables/useKpiManager'

const router = useRouter()

const {
  kpisWithData,
  loading,
  refreshing,
  period,
  loadKpis,
  refresh
} = useKpiManager('general')

function handleKpiAction(kpi) {
  // Navigation ou action selon le KPI
  if (kpi.id === 'total_users') {
    router.push('/user_list')
  }
}

onMounted(async () => {
  await loadKpis()
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>
```

## Ajouter un nouveau KPI

1. **Créer la configuration** dans `kpiConfigs.js`:
```javascript
{
  id: 'my_new_kpi',
  label: 'Mon KPI',
  icon: 'pi pi-chart-line',
  color: '#10b981',
  dataKey: 'myKpiValue',
  fetchFn: 'fetchMyData',
  order: 5,
  visible: true,
  roles: ['admin']
}
```

2. **Implémenter la fonction fetch** dans `dashboardService.js`:
```javascript
export async function fetchMyData() {
  // Votre logique ici
  return {
    myKpiValue: 42
  }
}
```

3. **C'est tout!** Le KPI apparaîtra automatiquement pour les utilisateurs avec le bon rôle.

## Avantages

✅ **Modulaire** - Ajouter un KPI = 1 objet config
✅ **Role-aware** - Filtrage automatique selon permissions
✅ **Réutilisable** - Même composant partout
✅ **Extensible** - Facile d'ajouter features
✅ **Performant** - Requêtes groupées + cache

## Roadmap

- [ ] Support drag & drop pour réorganiser
- [ ] Export de configuration personnalisée par utilisateur
- [ ] Widgets avancés (donut chart, bar chart, etc.)
- [ ] Alertes/seuils configurables
- [ ] Comparaison multi-périodes
- [ ] Sauvegarde layout personnalisé
