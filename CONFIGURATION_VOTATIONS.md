# 📋 Configuration des Votations - Guide d'Extension

## 🎯 Configuration Actuelle

**Actuellement actif :**
- **PFP** : PFP1A, PFP1B
- **Année** : 2026

## 🔧 Comment Ajouter de Nouvelles Années ou PFPs

### Étape 1 : Ouvrir le Fichier de Configuration

Ouvrez le fichier : `/src/views/admin/pfp/VotationEtudiantsView.vue`

Recherchez la section **CONFIGURATION CENTRALISÉE** (vers la ligne 457) :

```javascript
// ============================================
// CONFIGURATION CENTRALISÉE - Facile à modifier
// ============================================
const ACTIVE_CONFIG = {
  // Années actives pour les votations
  activeYears: ['2026'],
  
  // Types de PFP actifs
  activePFPs: ['PFP1A', 'PFP1B'],
  
  // Configuration complète pour extension future
  allYears: ['2024', '2025', '2026', '2027', '2028'],
  allPFPs: [
    { label: 'PFP1A', value: 'PFP1A', active: true },
    { label: 'PFP1B', value: 'PFP1B', active: true },
    { label: 'PFP2', value: 'PFP2', active: false },
    { label: 'PFP3', value: 'PFP3', active: false },
    { label: 'PFP4', value: 'PFP4', active: false }
  ]
}
```

### Étape 2 : Activer un Nouveau PFP

**Pour activer PFP2 :**

```javascript
// AVANT
{ label: 'PFP2', value: 'PFP2', active: false },

// APRÈS
{ label: 'PFP2', value: 'PFP2', active: true },
```

**ET** ajouter `'PFP2'` dans `activePFPs` :

```javascript
activePFPs: ['PFP1A', 'PFP1B', 'PFP2'],
```

### Étape 3 : Ajouter une Nouvelle Année

**Pour ajouter l'année 2027 :**

```javascript
// AVANT
activeYears: ['2026'],

// APRÈS
activeYears: ['2026', '2027'],
```

### Étape 4 : Exemples de Configurations Courantes

#### Configuration pour PFP1A et PFP1B en 2026 (Actuelle)
```javascript
activeYears: ['2026'],
activePFPs: ['PFP1A', 'PFP1B'],
```

#### Configuration pour tous les PFPs en 2026
```javascript
activeYears: ['2026'],
activePFPs: ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'],

// Et mettre active: true pour tous les PFPs
allPFPs: [
  { label: 'PFP1A', value: 'PFP1A', active: true },
  { label: 'PFP1B', value: 'PFP1B', active: true },
  { label: 'PFP2', value: 'PFP2', active: true },
  { label: 'PFP3', value: 'PFP3', active: true },
  { label: 'PFP4', value: 'PFP4', active: true }
]
```

#### Configuration pour PFP1A uniquement sur plusieurs années
```javascript
activeYears: ['2026', '2027'],
activePFPs: ['PFP1A'],

allPFPs: [
  { label: 'PFP1A', value: 'PFP1A', active: true },
  { label: 'PFP1B', value: 'PFP1B', active: false },
  { label: 'PFP2', value: 'PFP2', active: false },
  { label: 'PFP3', value: 'PFP3', active: false },
  { label: 'PFP4', value: 'PFP4', active: false }
]
```

## 🚀 Impact de la Configuration

### Ce Qui Change Automatiquement :

1. **Filtres** : Seuls les PFPs et années actifs apparaissent dans les dropdowns
2. **Génération des lignes** : Le système crée automatiquement des entrées pour chaque étudiant × PFP actif × année active
3. **Statistiques** : Les cartes de statistiques sont calculées uniquement sur les PFPs/années actifs
4. **Banner d'info** : Le bandeau rose affiche automatiquement la configuration active
5. **Export** : L'export CSV inclut uniquement les données filtrées

### Ce Qui Ne Change PAS :

- La structure de la base de données
- Les permissions RLS
- Les votes déjà enregistrés (ils restent accessibles)

## ⚠️ Points d'Attention

### 1. Vérifier les Places Disponibles

Avant d'activer un nouveau PFP, assurez-vous que :
- Les places sont créées dans la base de données
- Les institutions sont configurées
- Les critères de validation sont définis

### 2. Communication aux Étudiants

Quand vous activez un nouveau PFP ou une nouvelle année :
1. Informez les étudiants concernés
2. Définissez une date limite de vote
3. Vérifiez que les étudiants ont accès aux bonnes places

### 3. Tests Avant Production

1. Activez la configuration sur un environnement de test
2. Vérifiez que les filtres fonctionnent
3. Testez un vote complet
4. Vérifiez les statistiques et l'export

## 📊 Exemple de Déploiement Progressif

### Phase 1 : PFP1A et PFP1B pour 2026 (Actuel)
```javascript
activeYears: ['2026']
activePFPs: ['PFP1A', 'PFP1B']
```

### Phase 2 : Ajouter PFP2 en 2026
```javascript
activeYears: ['2026']
activePFPs: ['PFP1A', 'PFP1B', 'PFP2']
```

### Phase 3 : Ouvrir 2027 pour PFP1A
```javascript
activeYears: ['2026', '2027']
activePFPs: ['PFP1A', 'PFP1B', 'PFP2']
```

### Phase 4 : Tous les PFPs pour 2026-2027
```javascript
activeYears: ['2026', '2027']
activePFPs: ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
```

## 🛠️ Dépannage

### Les nouveaux PFPs n'apparaissent pas

1. Vérifiez que `active: true` est bien défini
2. Vérifiez que le PFP est dans `activePFPs`
3. Rechargez la page (Ctrl+F5 ou Cmd+Shift+R)
4. Videz le cache du navigateur

### Les statistiques sont incorrectes

1. Les statistiques sont calculées uniquement sur les PFPs/années actifs
2. Cliquez sur "Réinitialiser les filtres" pour tout voir
3. Vérifiez que les votes sont bien enregistrés dans la base de données

### Les étudiants ne voient pas les nouvelles votations

1. Vérifiez les permissions RLS sur `student_votes`
2. Assurez-vous que les places sont visibles pour les étudiants
3. Vérifiez que les critères de validation correspondent au profil étudiant

## 📞 Support

Pour toute question, contactez l'administrateur système ou consultez :
- Documentation Supabase : https://supabase.com/docs
- Documentation PrimeVue : https://primevue.org/
