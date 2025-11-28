# 📊 GUIDE LAYOUT KPI & VISIBILITÉ

## ✅ **CE QUI A ÉTÉ FAIT**

### **1. Layout à Deux Niveaux** 📐

#### **Ligne du Haut : 3 Gros KPI**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   KPI 1     │ │   KPI 2     │ │   KPI 3     │
│   GRAND     │ │   GRAND     │ │   GRAND     │
│  160px min  │ │  160px min  │ │  160px min  │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### **Ligne du Bas : 4 Petits KPI**
```
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ KPI 4 │ │ KPI 5 │ │ KPI 6 │ │ KPI 7 │
│COMPACT│ │COMPACT│ │COMPACT│ │COMPACT│
│110px  │ │110px  │ │110px  │ │110px  │
└───────┘ └───────┘ └───────┘ └───────┘
```

---

## 🎨 **TAILLES DISPONIBLES**

### **Size: `compact`** (Petit)
- **Hauteur min** : 110px
- **Padding** : 1rem
- **Icône** : 40x40px
- **Valeur** : 1.75rem
- **Label** : 0.8rem
- **Usage** : KPI secondaires, métriques compactes

### **Size: `large`** (Grand)
- **Hauteur min** : 160px
- **Padding** : 1.5rem
- **Icône** : 56x56px
- **Valeur** : 2.5rem
- **Label** : 1rem
- **Usage** : KPI principaux, métriques importantes

### **Size: `medium`** (Défaut)
- **Hauteur min** : 100%
- **Padding** : 1.25rem
- **Icône** : 48x48px
- **Valeur** : 2rem
- **Label** : 0.875rem
- **Usage** : KPI standard

---

## 🎯 **CONFIGURATION ACTUELLE**

### **Dashboard Général**

```vue
<!-- 3 GROS KPI en haut -->
<div class="col-12 md:col-4">
  <KpiCard v-bind="kpisWithData[0]" size="large" />
</div>
<div class="col-12 md:col-4">
  <KpiCard v-bind="kpisWithData[4]" size="large" />
</div>
<div class="col-12 md:col-4">
  <KpiCard v-bind="kpisWithData[5]" size="large" />
</div>

<!-- 4 PETITS KPI en bas -->
<div class="col-12 md:col-6 lg:col-3">
  <KpiCard v-bind="kpisWithData[1]" size="compact" />
</div>
<div class="col-12 md:col-6 lg:col-3">
  <KpiCard v-bind="kpisWithData[2]" size="compact" />
</div>
<div class="col-12 md:col-6 lg:col-3">
  <KpiCard v-bind="kpisWithData[3]" size="compact" />
</div>
<div class="col-12 md:col-6 lg:col-3">
  <KpiCard v-bind="kpisWithData[6]" size="compact" />
</div>
```

---

## 🌈 **AMÉLIORATIONS VISIBILITÉ**

### **Avant** ❌
```css
background: var(--surface-card);  /* Parfois invisible */
color: var(--text-color);         /* Peut être trop clair */
box-shadow: 0 2px 8px rgba(0,0,0,0.04);  /* Trop léger */
```

### **Après** ✅
```css
background: rgba(255, 255, 255, 0.98);   /* Fond blanc visible */
color: #0f172a;                          /* Texte foncé lisible */
box-shadow: 0 2px 12px rgba(0,0,0,0.1);  /* Ombre visible */
border: 1px solid rgba(0, 0, 0, 0.08);   /* Bordure subtile */
```

---

## 🎨 **COULEURS DE TEXTE**

| Élément | Couleur | Usage |
|---------|---------|-------|
| **Label** | `#1e293b` | Titre du KPI (slate-800) |
| **Subtitle** | `#64748b` | Sous-titre (slate-500) |
| **Valeur** | `#0f172a` | Chiffre principal (slate-900) |
| **Compare** | `#64748b` | Texte de comparaison (slate-500) |

---

## 📱 **RESPONSIVE**

### **Desktop (> 768px)**
```
[  LARGE  ] [  LARGE  ] [  LARGE  ]
[COMPACT] [COMPACT] [COMPACT] [COMPACT]
```

### **Tablet (768px)**
```
[  LARGE  ] [  LARGE  ]
[  LARGE  ]
[COMPACT] [COMPACT]
[COMPACT] [COMPACT]
```

### **Mobile (< 768px)**
```
[  LARGE  ]
[  LARGE  ]
[  LARGE  ]
[COMPACT]
[COMPACT]
[COMPACT]
[COMPACT]
```

---

## 🔧 **PERSONNALISER LE LAYOUT**

### **Exemple 1 : 2 Gros + 6 Petits**
```vue
<!-- 2 GROS -->
<div class="col-12 md:col-6">
  <KpiCard size="large" />
</div>
<div class="col-12 md:col-6">
  <KpiCard size="large" />
</div>

<!-- 6 PETITS -->
<div class="col-12 md:col-4 lg:col-2">
  <KpiCard size="compact" />
</div>
<!-- ... répéter 6 fois -->
```

### **Exemple 2 : 4 Moyens**
```vue
<div class="col-12 md:col-6 lg:col-3">
  <KpiCard size="medium" />
</div>
<!-- ... répéter 4 fois -->
```

### **Exemple 3 : 1 Énorme + 8 Petits**
```vue
<!-- 1 ÉNORME (prend toute la largeur) -->
<div class="col-12">
  <KpiCard size="xlarge" />
</div>

<!-- 8 PETITS -->
<div class="col-12 md:col-3">
  <KpiCard size="compact" />
</div>
<!-- ... répéter 8 fois -->
```

---

## 🎯 **MAPPING KPI ACTUEL**

| Index | KPI | Taille | Position |
|-------|-----|--------|----------|
| `[0]` | Utilisateurs Totaux | `large` | Haut gauche |
| `[4]` | Institutions | `large` | Haut centre |
| `[5]` | Places de Stage | `large` | Haut droite |
| `[1]` | Rôles | `compact` | Bas 1/4 |
| `[2]` | Permissions | `compact` | Bas 2/4 |
| `[3]` | Routes | `compact` | Bas 3/4 |
| `[6]` | Votations Actives | `compact` | Bas 4/4 |

---

## 💡 **CONSEILS**

### **Hiérarchie Visuelle** 📊
- **Large** : Métriques les + importantes (utilisateurs, revenus, objectifs)
- **Compact** : Métriques secondaires (détails, sous-catégories)

### **Disposition** 🎨
- **Haut** : KPI principaux (large)
- **Bas** : KPI de détail (compact)
- **Gauche** : Plus important
- **Droite** : Moins important

### **Couleurs** 🌈
- **Bleu** (`#3b82f6`) : Info, utilisateurs
- **Vert** (`#10b981`) : Succès, disponible
- **Orange** (`#f59e0b`) : Attention, en cours
- **Rouge** (`#ef4444`) : Urgent, critique
- **Violet** (`#8b5cf6`) : Premium, spécial

---

## 🚀 **PROCHAINES ÉTAPES**

1. ✅ Layout 3 gros + 4 petits configuré
2. ✅ Visibilité améliorée (fond blanc, texte foncé)
3. ✅ Tailles `compact` et `large` optimisées
4. ⏳ **À venir** : Animations au hover
5. ⏳ **À venir** : Mode sombre

---

**Ton dashboard a maintenant une hiérarchie visuelle claire ! 🎉**
