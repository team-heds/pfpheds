# 🧠 SMART VISUALIZATION - Guide Complet

## 🎯 **CONCEPT**

**SmartVisualization** est un composant **intelligent** qui :
1. ✅ **Analyse automatiquement** tes données
2. ✅ **Suggère** le meilleur type de visualisation
3. ✅ **Permet à l'utilisateur** de choisir parmi 7 types d'affichage
4. ✅ **Affiche un badge "Auto"** sur le type suggéré

---

## 📊 **7 TYPES DE VISUALISATION**

| Type | Icon | Usage | Idéal pour |
|------|------|-------|------------|
| **Camembert** | 🥧 | Proportions | 2-6 catégories |
| **Anneau** | 🍩 | Proportions avec total | 2-6 catégories |
| **Barres** | 📊 | Comparaisons | 3-10 items |
| **Ligne** | 📈 | Tendances temporelles | Séries temporelles |
| **Tableau** | 📋 | Données détaillées | > 10 items |
| **Cards** | 🎴 | Vue visuelle | 2-3 items |
| **Chiffres** | 🔢 | Vue simple | Tous types |

---

## 🤖 **DÉTECTION AUTOMATIQUE**

### **Logique de Sélection** :

```javascript
// Série temporelle ? → Line chart
if (hasTimeSeries) return 'line'

// Beaucoup de données (> 10) ? → Table
if (dataCount > 10) return 'table'

// Peu de données (2-3) ? → Cards
if (dataCount <= 3) return 'cards'

// 4-6 items avec couleurs ? → Doughnut
if (dataCount <= 6 && hasColors) return 'doughnut'

// 7-10 items ? → Bar
if (dataCount <= 10) return 'bar'

// Par défaut → Pie
return 'pie'
```

### **Exemples** :

#### **Données : 3 classes**
```javascript
[
  { label: 'BA23', value: 61, color: '#f59e0b' },
  { label: 'BA24', value: 65, color: '#10b981' },
  { label: 'BA25', value: 189, color: '#3b82f6' }
]
```
→ **Suggestion : Cards** (peu de données, facile à comparer)

#### **Données : 5 classes avec couleurs**
```javascript
[
  { label: 'BA21', value: 45, color: '#ef4444' },
  { label: 'BA22', value: 52, color: '#f59e0b' },
  { label: 'BA23', value: 61, color: '#10b981' },
  { label: 'BA24', value: 65, color: '#3b82f6' },
  { label: 'BA25', value: 189, color: '#8b5cf6' }
]
```
→ **Suggestion : Doughnut** (proportions visuelles)

#### **Données : Évolution mensuelle**
```javascript
[
  { x: 'Jan', y: 45 },
  { x: 'Fév', y: 52 },
  { x: 'Mar', y: 48 },
  // ...
]
```
→ **Suggestion : Line** (série temporelle)

#### **Données : 15 étudiants**
```javascript
[
  { label: 'Étudiant 1', value: 95 },
  { label: 'Étudiant 2', value: 88 },
  // ... 13 autres
]
```
→ **Suggestion : Table** (beaucoup de données)

---

## 🚀 **UTILISATION**

### **Usage Basique** :
```vue
<SmartVisualization
  :data="myData"
  title="Mes Statistiques"
/>
```

### **Usage Complet** :
```vue
<SmartVisualization
  :data="classChartData"
  title="Répartition Classes"
  :auto-detect="true"
  :height="350"
  :show-export="true"
  :show-refresh="true"
  @refresh="reloadData"
  @export="handleExport"
/>
```

---

## 🎨 **PROPS**

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `data` | Array | **requis** | Données à visualiser |
| `title` | String | - | Titre de la visualisation |
| `height` | Number | 350 | Hauteur des graphiques (px) |
| `autoDetect` | Boolean | true | Activer la détection auto |
| `defaultType` | String | - | Type par défaut (override auto) |
| `chartProps` | Object | - | Props additionnelles pour charts |
| `showExport` | Boolean | true | Bouton export CSV |
| `showRefresh` | Boolean | false | Bouton actualiser |

---

## 📋 **FORMAT DES DONNÉES**

### **Pour Graphiques Catégoriels** :
```javascript
const data = [
  {
    label: 'Catégorie A',  // Requis
    value: 42,              // Requis
    color: '#3b82f6'        // Optionnel mais recommandé
  },
  // ...
]
```

### **Pour Séries Temporelles** :
```javascript
const data = [
  {
    x: 'Janvier',     // ou 'date' ou 'month'
    y: 42             // ou 'value'
  },
  // ...
]
```

---

## 🎯 **EXEMPLES PAR CAS D'USAGE**

### **Cas 1 : Répartition Simple**
```vue
<template>
  <SmartVisualization
    :data="distributionData"
    title="Distribution par Classe"
  />
</template>

<script setup>
const distributionData = ref([
  { label: 'BA23', value: 61, color: '#f59e0b' },
  { label: 'BA24', value: 65, color: '#10b981' },
  { label: 'BA25', value: 189, color: '#3b82f6' }
])
</script>
```
→ Suggère automatiquement **Cards** (3 items)

---

### **Cas 2 : Dashboard KPI**
```vue
<template>
  <Card>
    <template #content>
      <SmartVisualization
        :data="kpiData"
        title="Performance par Équipe"
        :height="400"
        :show-refresh="true"
        @refresh="loadKpis"
      />
    </template>
  </Card>
</template>

<script setup>
const kpiData = ref([
  { label: 'Équipe A', value: 85, color: '#10b981' },
  { label: 'Équipe B', value: 92, color: '#3b82f6' },
  { label: 'Équipe C', value: 78, color: '#f59e0b' },
  { label: 'Équipe D', value: 88, color: '#8b5cf6' },
  { label: 'Équipe E', value: 90, color: '#ec4899' }
])
</script>
```
→ Suggère automatiquement **Doughnut** (5 items colorés)

---

### **Cas 3 : Évolution Temporelle**
```vue
<template>
  <SmartVisualization
    :data="evolutionData"
    title="Inscriptions Mensuelles"
    :height="300"
  />
</template>

<script setup>
const evolutionData = ref([
  { x: 'Jan', y: 45 },
  { x: 'Fév', y: 52 },
  { x: 'Mar', y: 48 },
  { x: 'Avr', y: 61 },
  { x: 'Mai', y: 58 }
])
</script>
```
→ Suggère automatiquement **Line** (série temporelle)

---

### **Cas 4 : Liste Détaillée**
```vue
<template>
  <SmartVisualization
    :data="studentData"
    title="Résultats par Étudiant"
    :show-export="true"
  />
</template>

<script setup>
const studentData = ref([
  { label: 'Alice', value: 95, color: '#10b981' },
  { label: 'Bob', value: 88, color: '#3b82f6' },
  // ... 15 autres étudiants
])
</script>
```
→ Suggère automatiquement **Table** (> 10 items)

---

## 🎨 **PERSONNALISATION**

### **Forcer un Type Spécifique** :
```vue
<SmartVisualization
  :data="myData"
  :auto-detect="false"
  default-type="bar"
/>
```
→ Affichera toujours en barres (pas de suggestion)

### **Désactiver l'Export** :
```vue
<SmartVisualization
  :data="myData"
  :show-export="false"
/>
```

### **Props de Chart Personnalisées** :
```vue
<SmartVisualization
  :data="myData"
  :chart-props="{
    showLegend: false,
    cutout: '80%'
  }"
/>
```

---

## 📦 **ÉVÉNEMENTS**

### **@refresh** :
Émis quand l'utilisateur clique sur le bouton refresh

```vue
<SmartVisualization
  :data="data"
  :show-refresh="true"
  @refresh="reloadData"
/>

<script setup>
async function reloadData() {
  loading.value = true
  data.value = await fetchData()
  loading.value = false
}
</script>
```

### **@export** :
Émis lors de l'export (CSV téléchargé automatiquement)

```vue
<SmartVisualization
  :data="data"
  :show-export="true"
  @export="handleExport"
/>

<script setup>
function handleExport({ data, csv }) {
  console.log('Données exportées:', data)
  console.log('CSV:', csv)
  // Analytics, notification, etc.
}
</script>
```

---

## 🎯 **TYPES D'AFFICHAGE EN DÉTAIL**

### **📊 Vue Tableau** :
- ✅ Colonnes : #, Libellé, Valeur, %, Couleur
- ✅ Tri sur toutes les colonnes
- ✅ Pagination automatique (si > 10 items)
- ✅ Export CSV

### **🎴 Vue Cards** :
- ✅ Grille responsive
- ✅ Icône colorée par item
- ✅ Valeur + pourcentage
- ✅ Hover effects

### **🔢 Vue Chiffres** :
- ✅ Liste compacte
- ✅ Barres de progression
- ✅ Valeurs mises en avant
- ✅ Couleurs par item

---

## 🚀 **INTÉGRATION DANS TES DASHBOARDS**

### **Remplacer un StatsCard** :

**Avant** :
```vue
<StatsCard
  title="Répartition"
  :chart-data="data"
  default-chart-type="pie"
/>
```

**Après** :
```vue
<Card>
  <template #content>
    <SmartVisualization
      :data="data"
      title="Répartition"
    />
  </template>
</Card>
```

---

## 💡 **BONNES PRATIQUES**

### **✅ À FAIRE** :
- Toujours fournir des **couleurs** pour un affichage optimal
- Utiliser **labels courts** et clairs
- Activer **auto-detect** pour l'expérience utilisateur
- Fournir un **titre** descriptif

### **❌ À ÉVITER** :
- Ne pas mélanger séries temporelles et catégories
- Éviter plus de 20 items (utiliser pagination)
- Ne pas oublier les couleurs (rendu moins beau)

---

## 🎨 **THÈMES DE COULEURS**

### **Palette Classes** :
```javascript
const classColors = {
  'BA21': '#ef4444',  // Rouge
  'BA22': '#f59e0b',  // Orange
  'BA23': '#fbbf24',  // Jaune
  'BA24': '#10b981',  // Vert
  'BA25': '#3b82f6',  // Bleu
  'BA26': '#8b5cf6',  // Violet
}
```

### **Palette Status** :
```javascript
const statusColors = {
  'Success': '#10b981',
  'Warning': '#f59e0b',
  'Error': '#ef4444',
  'Info': '#3b82f6',
  'Neutral': '#6b7280'
}
```

---

## 📊 **RÉSULTAT**

Avec **SmartVisualization**, tu as :
- ✅ **7 types** de visualisation disponibles
- ✅ **Détection automatique** du meilleur type
- ✅ **Badge "Auto"** sur le type suggéré
- ✅ **Choix utilisateur** toujours possible
- ✅ **Export CSV** intégré
- ✅ **Responsive** et moderne
- ✅ **Facile à intégrer** partout

**Ton dashboard devient intelligent ! 🧠✨**
