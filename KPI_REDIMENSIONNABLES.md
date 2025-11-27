# 🎯 KPI Redimensionnables - Guide Rapide

## 🎉 Nouvelle Fonctionnalité

Les **KPI (indicateurs)** sont maintenant **redimensionnables** comme les Quick Stats!

---

## 📏 5 Tailles Disponibles

| Taille | Colonnes | Description | Usage |
|--------|----------|-------------|-------|
| **Compact** | 1 col | Minimal, sans fioriture | Vue d'ensemble dense |
| **Petit** | 1 col | Avec graphique | Équilibre info/espace |
| **Moyen** | 2 cols | Standard (défaut) | Vue standard |
| **Grand** | 3 cols | Détaillé | KPI prioritaires |
| **Très Grand** | 4 cols | Complet, toute la largeur | KPI principal |

---

## 🚀 Utilisation

### Activer le Mode Édition

```
1. Onglet "Mes KPI"
2. Cliquez "Personnaliser" (bouton en haut)
3. Mode édition activé pour les KPI
```

### Redimensionner un KPI

```
1. En mode édition
2. Un tag de taille apparaît sur chaque KPI (ex: "Moyen")
3. Cliquez sur le tag
4. Dialog s'ouvre avec 5 options:
   - Compact (1 col)
   - Petit (1 col)
   - Moyen (2 cols) ← Default
   - Grand (3 cols)
   - Très Grand (4 cols)
5. Sélectionnez la taille
6. Toast confirmation: "KPI redimensionné en Grand"
7. Automatiquement sauvegardé!
```

### Réorganiser les KPI

```
1. En mode édition
2. Glissez un KPI (icône ⚹)
3. Déposez à la nouvelle position
4. Grid se réorganise automatiquement
```

### Masquer un KPI

```
1. En mode édition
2. Cliquez sur l'icône œil 👁
3. KPI masqué (semi-transparent)
4. Re-cliquez pour afficher
```

---

## 🎨 Exemples Visuels

### Grid 4 Colonnes (Desktop)

```
┌─────┬─────┬─────┬─────┐
│  C  │  C  │  C  │  C  │  Compact (4×1)
├─────┴─────┼─────┴─────┤
│   Moyen   │   Moyen   │  Moyen (2×2)
├─────┬─────┴─────┬─────┤
│  P  │   Moyen   │  P  │  Mix
├─────┴───────────┴─────┤
│      Très Grand       │  Très Grand (1×4)
└───────────────────────┘
```

### Exemple Réel

```
┌──────────────────────────────────────┐
│ 👥 Utilisateurs          Très Grand │
│                                      │
│           1,234                      │
│                                      │
│      ▁▂▃▅▆▇█  +12%                 │
└──────────────────────────────────────┘

┌─────────────┬──────────────┐
│ 📊 KPI 1    │ 📈 KPI 2     │  Moyen × 2
│   567       │   890        │
│   +5%       │   +8%        │
└─────────────┴──────────────┘

┌────┬────┬────┬────┐
│ C1 │ C2 │ C3 │ C4 │  Compact × 4
│ 12 │ 34 │ 56 │ 78 │
└────┴────┴────┴────┘
```

---

## 💾 Sauvegarde

### Configuration Par Utilisateur

```javascript
// localStorage unique
const storageKey = `dashboard-kpi-config-${userId}`

// Structure
{
  order: ['kpi1', 'kpi2', 'kpi3'],
  hidden: ['kpi4'],
  sizes: {
    'total_users': 'xlarge',        // Très Grand
    'students_count': 'large',      // Grand
    'institutions': 'medium',       // Moyen
    'teachers': 'small',           // Petit
    'places': 'compact'            // Compact
  },
  alerts: {
    'total_users': { /* ... */ }
  }
}
```

---

## 🎨 Détails des Tailles

### Compact (1 col)

**Affichage**:
- Icône 32px
- Valeur 1.25rem
- Header horizontal
- Label 0.75rem
- Minimal, dense

**Usage**: Pour afficher beaucoup de KPI rapidement

### Petit (1 col)

**Affichage**:
- Icône 40px
- Valeur 1.5rem
- Graphique inclus
- Équilibré

**Usage**: Vue d'ensemble avec graphiques

### Moyen (2 cols) - Défaut

**Affichage**:
- Icône 48px
- Valeur 2rem
- Standard PrimeVue
- Graphique + tendance

**Usage**: Configuration par défaut, bon équilibre

### Grand (3 cols)

**Affichage**:
- Icône 56px
- Valeur 2.5rem
- Détaillé
- Espace pour plus d'info

**Usage**: KPI importants, prioritaires

### Très Grand (4 cols)

**Affichage**:
- Icône 72px
- Valeur 3.5rem (énorme!)
- Padding 2rem
- Header espacé (1.5rem)
- Label 1.1rem
- Toute la largeur

**Usage**: KPI principal, hero metric

---

## 🔧 Implémentation Technique

### Composants Modifiés

#### DashboardKpiGrid.vue

**Ajouté**:
```javascript
// Options de taille
const kpiSizeOptions = [
  { value: 'compact', label: 'Compact', cols: 1 },
  { value: 'small', label: 'Petit', cols: 1 },
  { value: 'medium', label: 'Moyen', cols: 2 },
  { value: 'large', label: 'Grand', cols: 3 },
  { value: 'xlarge', label: 'Très Grand', cols: 4 }
]

// Config avec tailles
const userConfig = ref({
  order: [],
  hidden: [],
  alerts: {},
  sizes: {}  // ← Nouveau!
})

// Fonctions
function showKpiSizeSelector(kpi)
function changeKpiSize(size)
function getKpiSizeLabel(size)
function getKpiSizeSeverity(size)
```

**CSS**:
```css
.kpi-grid {
  grid-template-columns: repeat(4, 1fr);
}

.kpi-grid-item.size-compact { grid-column: span 1; }
.kpi-grid-item.size-small { grid-column: span 1; }
.kpi-grid-item.size-medium { grid-column: span 2; }
.kpi-grid-item.size-large { grid-column: span 3; }
.kpi-grid-item.size-xlarge { grid-column: span 4; }
```

#### KpiCard.vue

**Ajouté**:
```javascript
// Nouvelle prop
props: {
  size: { type: String, default: 'medium' }
}

// Classes CSS
:class="[`kpi-size-${size}`]"
```

**Styles adaptatifs**:
```css
/* Chaque taille a ses propres styles */
.kpi-size-compact .kpi-value { font-size: 1.25rem; }
.kpi-size-small .kpi-value { font-size: 1.5rem; }
.kpi-size-medium .kpi-value { font-size: 2rem; }
.kpi-size-large .kpi-value { font-size: 2.5rem; }
.kpi-size-xlarge .kpi-value { font-size: 3.5rem; }
```

---

## 📱 Responsive

### Desktop (> 1200px)
- Grid: 4 colonnes
- Toutes tailles fonctionnent

### Tablet (768-1200px)
- Grid: 2 colonnes
- Large & XLarge → 2 cols max

### Mobile (< 768px)
- Grid: 1 colonne
- Toutes tailles → 1 col (full width)

---

## 🎯 Cas d'Usage

### Admin Système

```javascript
{
  sizes: {
    'total_users': 'xlarge',      // Hero metric
    'total_roles': 'medium',
    'active_permissions': 'small',
    'route_count': 'compact'
  }
}
```

**Résultat**: Focus sur total_users (très grand), reste compact

### Responsable PFP

```javascript
{
  sizes: {
    'students_count': 'large',    // Priorité étudiants
    'places_count': 'large',      // Priorité places
    'institutions': 'medium',
    'pfp_ongoing': 'medium'
  }
}
```

**Résultat**: 2 KPI grands, 2 moyens en dessous

### Analyste Data

```javascript
{
  sizes: {
    'key_metric': 'xlarge',       // Métrique clé géante
    'metric1': 'small',
    'metric2': 'small',
    'metric3': 'small',
    'metric4': 'small'            // 4 petits KPI sur une ligne
  }
}
```

**Résultat**: Hero metric + 4 KPI compacts

---

## 💡 Bonnes Pratiques

### ✅ À Faire

1. **KPI principal** → Très Grand (xlarge)
2. **KPI importants** (2-3) → Grand (large)
3. **KPI standard** (4-6) → Moyen (medium)
4. **Métriques rapides** (8+) → Petit/Compact

### ❌ À Éviter

1. **Trop de XLarge** → Perte de vue d'ensemble
2. **Tout en Compact** → Difficile à lire
3. **Pas de logique** → Hiérarchie incohérente

### 🎯 Exemple Idéal

```
┌─────────────────────────────┐
│    KPI Principal (XLarge)   │  ← Métrique #1
└─────────────────────────────┘

┌──────────┬──────────┬─────────┐
│  Grand   │  Grand   │  Grand  │  ← Top 3 KPI
└──────────┴──────────┴─────────┘

┌─────┬─────┬─────┬─────┐
│ Moy │ Moy │ Moy │ Moy │  ← KPI secondaires
└─────┴─────┴─────┴─────┘

┌──┬──┬──┬──┬──┬──┬──┬──┐
│C │C │C │C │C │C │C │C │  ← Métriques rapides
└──┴──┴──┴──┴──┴──┴──┴──┘
```

---

## 🚀 Workflow Complet

### Scénario Type

```
1. User ouvre /admin
2. Voit KPI en taille par défaut (medium)
3. Clique "Personnaliser"
4. Clique tag "Moyen" sur KPI principal
5. Dialog s'ouvre
6. Sélectionne "Très Grand"
7. KPI devient full-width géant
8. Toast: "KPI redimensionné en Très Grand"
9. Fait pareil pour 2-3 autres KPI → Grand
10. Laisse le reste en Moyen/Petit
11. Glisse-dépose pour réorganiser
12. Clique "Terminer"
13. Config sauvegardée automatiquement
14. Reload page → Config conservée!
```

---

## 🐛 Debug

### KPI ne change pas de taille

```javascript
// Vérifier localStorage
const config = JSON.parse(localStorage.getItem('dashboard-kpi-config-USER_ID'))
console.log(config.sizes)

// Doit contenir:
// { 'total_users': 'xlarge', ... }
```

### Tailles bizarres sur mobile

```
Normal! Sur mobile toutes les tailles deviennent 1 colonne.
C'est voulu pour l'UX mobile.
```

### Tag ne s'affiche pas

```
Mode édition activé? Vérifier que editMode = true
```

---

## 📊 Statistiques

### Code Ajouté

- **DashboardKpiGrid.vue**: +150 lignes
- **KpiCard.vue**: +80 lignes  
- **CSS**: +120 lignes
- **Total**: ~350 lignes

### Fonctionnalités

- ✅ 5 tailles disponibles
- ✅ Dialog sélection visuelle
- ✅ Preview en temps réel
- ✅ Sauvegarde auto
- ✅ Tags colorés par taille
- ✅ Tooltips informatifs
- ✅ Responsive complet
- ✅ Animations fluides

---

## 🏆 Résumé

**Les KPI sont maintenant redimensionnables** avec:

- ✅ **5 tailles** (Compact → Très Grand)
- ✅ **Dialog visuel** avec preview
- ✅ **Tags colorés** par sévérité
- ✅ **Grid 4 colonnes** adaptatif
- ✅ **Responsive** intelligent
- ✅ **Sauvegarde** par utilisateur
- ✅ **Cohérent** avec Quick Stats

**Même UX que les widgets** = Expérience unifiée! 🎨

---

**Profitez de vos KPI redimensionnables!** 🎯

**Date**: 26 novembre 2024  
**Version**: 3.1.0
