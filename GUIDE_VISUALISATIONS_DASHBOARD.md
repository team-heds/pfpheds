# 📊 GUIDE DES VISUALISATIONS DASHBOARD

Guide complet pour utiliser le nouveau système de visualisations interactives dans les dashboards.

---

## 🎨 TYPES DE VISUALISATIONS DISPONIBLES

### **1. Graphique en Camembert (Pie Chart)** 🥧
- **Utilisation** : Montrer la répartition en pourcentages
- **Idéal pour** : Distribution par classe, par maison, par statut
- **Affichage** : Pourcentages automatiques dans la légende

**Exemple** :
```vue
<PieChart
  :data="[
    { label: 'BA23', value: 61, color: '#f59e0b' },
    { label: 'BA24', value: 65, color: '#10b981' },
    { label: 'BA25', value: 189, color: '#3b82f6' }
  ]"
  title="Répartition par Classe"
  :height="350"
  :show-legend="true"
  :show-percentage="true"
/>
```

---

### **2. Graphique en Anneau (Doughnut Chart)** 🍩
- **Utilisation** : Comme le camembert avec un centre personnalisable
- **Idéal pour** : Afficher un total au centre
- **Affichage** : Texte central avec valeur et label

**Exemple** :
```vue
<DoughnutChart
  :data="[
    { label: 'Avec SAE', value: 150, color: '#10b981' },
    { label: 'Sans SAE', value: 165, color: '#ef4444' }
  ]"
  :height="350"
  :show-center-text="true"
  center-value="315"
  center-label="Total"
  cutout="70%"
/>
```

---

### **3. Graphique en Barres (Bar Chart)** 📊
- **Utilisation** : Comparaison de valeurs
- **Idéal pour** : Classements, comparaisons
- **Options** : Vertical ou horizontal

**Exemple Vertical** :
```vue
<BarChart
  :data="classChartData"
  title="Étudiants par Classe"
  :height="400"
  :horizontal="false"
  :show-values="true"
/>
```

**Exemple Horizontal** :
```vue
<BarChart
  :data="classChartData"
  :height="400"
  :horizontal="true"
/>
```

---

### **4. Graphique en Ligne (Line Chart)** 📈
- **Utilisation** : Évolution dans le temps
- **Idéal pour** : Progressions, tendances
- **Options** : Lisse ou angulaire, rempli ou non

**Exemple** :
```vue
<LineChart
  :data="[
    { x: 'Jan', y: 45 },
    { x: 'Fév', y: 52 },
    { x: 'Mar', y: 48 }
  ]"
  label="Inscriptions mensuelles"
  color="#8b5cf6"
  :height="300"
  :fill="true"
  :smooth="true"
  :show-points="true"
/>
```

---

## 🎛️ COMPOSANT CHART SELECTOR

Permet à l'utilisateur de **choisir** le type de visualisation !

### **Utilisation** :
```vue
<ChartSelector
  :data="studentData"
  title="Répartition des Étudiants"
  default-type="pie"
  :height="350"
  chart-color="#3b82f6"
  :show-refresh="true"
  @refresh="reloadData"
/>
```

### **Types disponibles** :
- `pie` - Camembert
- `doughnut` - Anneau
- `bar` - Barres verticales
- `horizontal-bar` - Barres horizontales
- `line` - Ligne

### **Boutons de sélection** :
L'utilisateur voit 5 boutons pour switcher entre les types :
- 🥧 Camembert
- ⭕ Anneau
- 📊 Barres
- ↔️ Barres H
- 📈 Ligne

---

## 🎴 COMPOSANT STATS CARD

Carte de statistiques **tout-en-un** avec graphiques intégrés !

### **Exemple Complet** :
```vue
<StatsCard
  title="Répartition par Classe"
  subtitle="Distribution des étudiants"
  :value="315"
  icon="pi pi-users"
  color="#3b82f6"
  :trend="12.5"
  trend-label="vs mois dernier"
  :chart-data="classChartData"
  chart-title="Classes 2024-2025"
  default-chart-type="pie"
  :chart-height="350"
  :show-value="true"
  :show-chart-toggle="true"
  :show-refresh="true"
  :additional-info="[
    { label: 'BA23', value: '61' },
    { label: 'BA24', value: '65' },
    { label: 'BA25', value: '189' }
  ]"
  footer-text="Dernière mise à jour : maintenant"
  @refresh="loadStats"
>
  <template #footer>
    <Button label="Voir détails" @click="goToDetails" />
  </template>
</StatsCard>
```

### **Fonctionnalités** :
- ✅ **Valeur principale** avec tendance
- ✅ **Graphique interactif** avec sélecteur de type
- ✅ **Bouton masquer/afficher** le graphique
- ✅ **Infos additionnelles** en grille
- ✅ **Footer personnalisable**
- ✅ **Bouton refresh**

---

## 🚀 UTILISATION DANS VOS DASHBOARDS

### **1. Importer les composants** :
```javascript
import PieChart from '@/components/admin/widgets/charts/PieChart.vue'
import BarChart from '@/components/admin/widgets/charts/BarChart.vue'
import DoughnutChart from '@/components/admin/widgets/charts/DoughnutChart.vue'
import LineChart from '@/components/admin/widgets/charts/LineChart.vue'
import ChartSelector from '@/components/admin/widgets/ChartSelector.vue'
import StatsCard from '@/components/admin/widgets/StatsCard.vue'
```

### **2. Préparer vos données** :
```javascript
const classChartData = computed(() => {
  const colors = {
    'BA23': '#f59e0b',
    'BA24': '#10b981',
    'BA25': '#3b82f6'
  }
  
  return Object.entries(stats.value.byClass).map(([classe, count]) => ({
    label: classe,
    value: count,
    color: colors[classe]
  }))
})
```

### **3. Ajouter dans votre template** :
```vue
<div class="grid">
  <div class="col-12 lg:col-6">
    <StatsCard
      title="Répartition par Classe"
      :value="totalStudents"
      icon="pi pi-users"
      :chart-data="classChartData"
      default-chart-type="pie"
    />
  </div>
</div>
```

---

## 📱 PAGE D'EXEMPLE : STATISTIQUES ÉTUDIANTS

Une **page complète** avec toutes les visualisations !

### **Route** : `/etudiant_stats`

### **Contenu** :
1. **Répartition par Classe** - Graphique pie/doughnut/bar
2. **Étudiants avec SAE** - Graphique doughnut avec centre
3. **Évolution des Inscriptions** - Graphique ligne
4. **Comparaison par Année** - Graphique barres
5. **Répartition Maisons** - Graphique doughnut
6. **Statistiques Rapides** - Cards avec chiffres clés

### **Accès** :
```
http://localhost:5178/etudiant_stats
```

---

## 🎨 PERSONNALISATION

### **Couleurs** :
```javascript
const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#14b8a6',
  purple: '#8b5cf6'
}
```

### **Hauteurs** :
- **Petit** : `height="200"`
- **Moyen** : `height="300"`
- **Grand** : `height="400"`

### **Options spécifiques** :

#### **PieChart** :
- `show-legend` : Afficher la légende
- `show-percentage` : Afficher les pourcentages

#### **DoughnutChart** :
- `show-center-text` : Texte au centre
- `cutout` : Taille du trou (ex: "70%")

#### **BarChart** :
- `horizontal` : Orientation
- `show-values` : Valeurs sur les barres
- `stacked` : Barres empilées

#### **LineChart** :
- `fill` : Remplissage sous la ligne
- `smooth` : Courbe lissée
- `show-points` : Points sur la ligne

---

## 💡 EXEMPLES PAR CAS D'USAGE

### **Cas 1 : Distribution Simple**
```vue
<PieChart
  :data="distributionData"
  title="Distribution"
  :height="300"
/>
```

### **Cas 2 : Comparaison de Catégories**
```vue
<BarChart
  :data="categoriesData"
  :horizontal="true"
  :height="400"
/>
```

### **Cas 3 : Évolution Temporelle**
```vue
<LineChart
  :data="timeSeriesData"
  label="Évolution"
  :smooth="true"
  :fill="true"
/>
```

### **Cas 4 : Carte Complète avec Choix**
```vue
<StatsCard
  title="Ma Statistique"
  :value="totalValue"
  :chart-data="myData"
  :show-chart-toggle="true"
  default-chart-type="pie"
/>
```

---

## 🔧 INTÉGRATION AVEC VOS SERVICES

### **Exemple avec studentsService** :
```javascript
import studentsService from '@/service/studentsService'

const stats = ref({
  byClass: {},
  total: 0
})

async function loadStats() {
  const students = await studentsService.getAllStudents()
  
  // Agréger par classe
  stats.value.byClass = students.reduce((acc, s) => {
    const classe = s.Classe || 'Non défini'
    acc[classe] = (acc[classe] || 0) + 1
    return acc
  }, {})
  
  stats.value.total = students.length
}

const chartData = computed(() => {
  return Object.entries(stats.value.byClass).map(([classe, count]) => ({
    label: classe,
    value: count,
    color: getColorForClass(classe)
  }))
})
```

---

## 🎯 RECOMMANDATIONS

### **Pour les KPIs** :
- Utiliser **StatsCard** avec valeur + petit graphique
- Type par défaut : **MiniChart** ou **DoughnutChart**

### **Pour les analyses** :
- Utiliser **ChartSelector** pour donner le choix
- Hauteur **400px** minimum

### **Pour les tendances** :
- Utiliser **LineChart** lisse et rempli
- Couleur cohérente avec le dashboard

### **Pour les comparaisons** :
- Utiliser **BarChart** horizontal si > 5 items
- Utiliser **PieChart** si < 5 items

---

## 📚 RESSOURCES

### **Composants Créés** :
- `components/admin/widgets/charts/PieChart.vue`
- `components/admin/widgets/charts/DoughnutChart.vue`
- `components/admin/widgets/charts/BarChart.vue`
- `components/admin/widgets/charts/LineChart.vue`
- `components/admin/widgets/ChartSelector.vue`
- `components/admin/widgets/StatsCard.vue`

### **Page d'Exemple** :
- `views/admin/users/StudentStatsView.vue`

### **Librairies Utilisées** :
- **Chart.js** : Rendu des graphiques
- **vue-chartjs** : Wrapper Vue pour Chart.js
- **PrimeVue** : Composants UI (Card, Button)

---

## 🚀 PROCHAINES ÉTAPES

### **Intégration** :
1. Ajouter un lien vers `/etudiant_stats` dans votre menu admin
2. Remplacer les graphiques simples par des **ChartSelector**
3. Enrichir vos **KpiCards** avec des graphiques

### **Extensions Possibles** :
- Graphiques **Radar** pour comparaisons multidimensionnelles
- Graphiques **Scatter** pour corrélations
- Graphiques **Mixed** combinant lignes et barres
- **Export** des graphiques en PDF/PNG
- **Partage** des visualisations

---

**Votre dashboard va devenir 🔥 !**

Besoin d'aide ? Consulte ce guide ou les exemples dans `StudentStatsView.vue` ! 📊✨
