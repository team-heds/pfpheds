# 📝 Publication Individuelle des Assignations

## 🎯 Nouvelle Fonctionnalité

Permet de **publier ou dépublier** les assignations **étudiant par étudiant** directement depuis le tableau, en plus de la publication groupée.

---

## ✨ Fonctionnalités

### 1. **Colonne Statut**
Chaque ligne affiche le statut actuel de l'assignation :

| Badge | Statut | Signification |
|-------|--------|---------------|
| 🟡 **Brouillon** | draft | Non visible par l'étudiant |
| 🟢 **Publié** | published | Visible par l'étudiant |

### 2. **Boutons d'Action sur Chaque Ligne**

#### Pour une Assignation en Brouillon
```
[✏️ Modifier]  [✓ Publier]
```

#### Pour une Assignation Publiée
```
[✏️ Modifier]  [✗ Dépublier]
```

---

## 🎨 Interface

### Tableau avec Actions

```
┌─────────────────────────────────────────────────────────────────────┐
│ Étudiant      │ Place    │ Institution │ Rang  │ Statut   │ Actions │
├─────────────────────────────────────────────────────────────────────┤
│ DUPONT Alice  │ Gériatrie│ HVS         │ 1er   │🟡Brouillon│ ✏️ ✓   │
│ MARTIN Paul   │ Ortho    │ HFR         │ 2ème  │🟢Publié  │ ✏️ ✗   │
│ BERNARD Julie │ Pédiatrie│ CHUV        │ 1er   │🟡Brouillon│ ✏️ ✓   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflows

### Workflow 1: Publication Individuelle

```
1. Assignation en "Brouillon"
   ↓
2. Admin clique sur ✓ (Publier)
   ↓
3. UPDATE status = 'published'
   ↓
4. Badge passe en 🟢 "Publié"
   ↓
5. Bouton change en ✗ (Dépublier)
   ↓
6. Étudiant voit l'assignation dans son profil
```

### Workflow 2: Dépublication Individuelle

```
1. Assignation "Publié"
   ↓
2. Admin clique sur ✗ (Dépublier)
   ↓
3. Confirmation demandée
   ↓
4. UPDATE status = 'draft'
   ↓
5. Badge passe en 🟡 "Brouillon"
   ↓
6. Bouton change en ✓ (Publier)
   ↓
7. Étudiant ne voit PLUS l'assignation
```

### Workflow 3: Publication Groupée Intelligente

```
1. Admin clique sur "Publier aux étudiants" (bouton en haut)
   ↓
2. Système compte les assignations NON publiées
   ↓
3. Confirmation: "Publier X assignations non publiées?"
   ↓
4. UPDATE status = 'published' WHERE status = 'draft'
   ↓
5. Seules les assignations en brouillon sont publiées
   ↓
6. Toast: "X assignations publiées"
```

---

## 🎯 Cas d'Usage

### Cas 1: Publication Progressive
```
Contexte: Admin veut publier les assignations au fur et à mesure

1. Algorithme attribue 30 places → Toutes en "Brouillon"
2. Admin vérifie les 5 premières assignations
3. Admin publie ces 5 assignations individuellement
4. Étudiants concernés voient leur place
5. Admin continue à vérifier et publier
```

### Cas 2: Correction d'Erreur
```
Contexte: Une assignation publiée doit être corrigée

1. Admin voit que DUPONT Alice a une mauvaise place
2. Admin clique sur ✗ pour dépublier
3. Confirmation: "L'étudiant ne verra plus cette assignation"
4. Admin clique sur ✏️ pour modifier
5. Admin sélectionne la bonne place
6. Admin clique sur ✓ pour republier
7. DUPONT Alice voit maintenant la bonne place
```

### Cas 3: Publication Partielle
```
Contexte: Certaines assignations nécessitent validation supplémentaire

1. Admin publie 25 assignations sur 30 (publication groupée ou individuelle)
2. 5 assignations restent en brouillon (besoin de validation)
3. Après validation, admin publie ces 5 individuellement
4. Tous les étudiants voient finalement leur place
```

---

## 💻 Code Technique

### Fonction Publication Individuelle

```javascript
const publishSingleAssignment = async (assignment) => {
  // 1. Mise à jour dans Supabase
  await supabase
    .from('student_result_vote')
    .update({ 
      status: 'published',
      updated_at: new Date().toISOString()
    })
    .eq('id', assignment.id)

  // 2. Mise à jour locale
  results.value[index].status = 'published'

  // 3. Toast de confirmation
  toast.add({
    severity: 'success',
    detail: `L'assignation de ${assignment.student_name} est maintenant visible`
  })
}
```

### Fonction Dépublication Individuelle

```javascript
const unpublishSingleAssignment = async (assignment) => {
  // 1. Demander confirmation
  if (!confirm(`Remettre en brouillon l'assignation de ${assignment.student_name}?`)) {
    return
  }

  // 2. Mise à jour dans Supabase
  await supabase
    .from('student_result_vote')
    .update({ 
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', assignment.id)

  // 3. Mise à jour locale
  results.value[index].status = 'draft'

  // 4. Toast de confirmation
  toast.add({
    severity: 'info',
    detail: `L'assignation de ${assignment.student_name} est repassée en brouillon`
  })
}
```

### Affichage Conditionnel des Boutons

```vue
<!-- Bouton Publier (si draft) -->
<Button 
  v-if="slotProps.data.status !== 'published'"
  icon="pi pi-check-circle" 
  severity="success" 
  @click="publishSingleAssignment(slotProps.data)"
/>

<!-- Bouton Dépublier (si published) -->
<Button 
  v-else
  icon="pi pi-times-circle" 
  severity="warning" 
  @click="unpublishSingleAssignment(slotProps.data)"
/>
```

---

## 📊 Statistiques

### Avant Publication
```
Total: 30 assignations
- Brouillon: 30
- Publié: 0
```

### Après Publication Individuelle de 5
```
Total: 30 assignations
- Brouillon: 25
- Publié: 5
```

### Après Publication Groupée
```
Total: 30 assignations
- Brouillon: 0
- Publié: 30
```

---

## 🔍 Messages Utilisateur

### Publication Individuelle
```
✅ Publication réussie
L'assignation de DUPONT Alice est maintenant visible
```

### Dépublication Individuelle
```
⚠️ Confirmation requise
Voulez-vous remettre en brouillon l'assignation de DUPONT Alice?
L'étudiant ne verra plus cette assignation dans son profil.

[Annuler] [OK]
```

```
ℹ️ Dépublication réussie
L'assignation de DUPONT Alice est repassée en brouillon
```

### Publication Groupée Intelligente
```
⚠️ Confirmation requise
Voulez-vous publier 15 assignations non publiées pour PFP1A 2026?
Ces assignations seront visibles dans le profil des étudiants.

[Annuler] [OK]
```

```
✅ Publication réussie
15 assignations sont maintenant visibles par les étudiants
```

### Si Tout est Déjà Publié
```
ℹ️ Déjà publié
Toutes les assignations sont déjà publiées
```

---

## 🎨 Design des Badges

### Badge "Brouillon"
```css
Couleur: Warning (Orange/Jaune)
Icône: 🕐 pi-clock
Texte: "Brouillon"
```

### Badge "Publié"
```css
Couleur: Success (Vert)
Icône: ✓ pi-check
Texte: "Publié"
```

---

## 📝 Logs Console

### Publication Individuelle
```
[PUBLISH_SINGLE] Publication de l'assignation: DUPONT Alice
[SUCCESS] Assignation publiée avec succès
```

### Dépublication Individuelle
```
[UNPUBLISH_SINGLE] Dépublication de l'assignation: DUPONT Alice
[SUCCESS] Assignation dépubliée avec succès
```

### Publication Groupée
```
[PUBLISH_ALL] Publication des assignations non publiées...
PFP: PFP1A, Année: 2026
Nombre d'assignations à publier: 15
[SUCCESS] Assignations publiées avec succès
```

---

## 🧪 Tests

### Test 1: Publication Individuelle
```
1. Admin lance l'algorithme → 30 assignations en "Brouillon"
2. Admin clique sur ✓ pour DUPONT Alice
3. Vérifier badge passe en "Publié"
4. Vérifier bouton change en ✗
5. Se connecter en tant que DUPONT Alice
6. Vérifier que l'assignation s'affiche
```

### Test 2: Dépublication Individuelle
```
1. Assignation de DUPONT Alice est "Publié"
2. Admin clique sur ✗
3. Confirmer dans le dialog
4. Vérifier badge passe en "Brouillon"
5. Vérifier bouton change en ✓
6. Se connecter en tant que DUPONT Alice
7. Vérifier que l'assignation ne s'affiche PLUS
```

### Test 3: Publication Groupée Partielle
```
1. 30 assignations: 20 en "Brouillon", 10 en "Publié"
2. Admin clique sur "Publier aux étudiants"
3. Vérifier message: "Publier 20 assignations non publiées?"
4. Confirmer
5. Vérifier que SEULES les 20 en brouillon sont publiées
6. Les 10 déjà publiées restent inchangées
```

### Test 4: Modification Après Publication
```
1. DUPONT Alice a une assignation "Publié"
2. Admin clique sur ✏️ (Modifier)
3. Admin change la place
4. Vérifier que le statut reste "Publié"
5. DUPONT Alice voit la NOUVELLE place (pas l'ancienne)
```

---

## ⚠️ Comportements Importants

### 1. Publication Groupée = Seulement les "Brouillon"
La publication groupée ne touche QUE les assignations avec `status = 'draft'`.

Les assignations déjà publiées ne sont pas affectées.

### 2. Modification Ne Change Pas le Statut
Quand on modifie une place (bouton ✏️), le statut (`draft` ou `published`) reste inchangé.

Si c'était publié, ça reste publié avec la nouvelle place.

### 3. Dépublication Nécessite Confirmation
Pour éviter les erreurs, dépublier demande TOUJOURS une confirmation.

### 4. Mise à Jour Temps Réel
Les changements de statut se reflètent immédiatement dans le tableau sans besoin de recharger.

---

## 🔒 Sécurité

### Permissions Admin
Seuls les admins peuvent :
- Publier une assignation
- Dépublier une assignation
- Voir toutes les assignations (draft + published)

### Permissions Étudiant
Les étudiants peuvent uniquement :
- Voir leurs propres assignations avec `status = 'published'`
- Ne JAMAIS voir les assignations en `draft`

---

## 🚀 Avantages

### 1. **Flexibilité**
- Publication progressive selon validation
- Contrôle fin assignation par assignation

### 2. **Sécurité**
- Possibilité de dépublier si erreur
- Validation avant publication groupée

### 3. **Transparence**
- Statut visible en un coup d'œil
- Logs détaillés pour audit

### 4. **Ergonomie**
- Actions directes depuis le tableau
- Pas besoin de dialog supplémentaire
- Confirmation pour actions critiques

---

## 📊 Comparaison des Méthodes

| Critère | Publication Individuelle | Publication Groupée |
|---------|--------------------------|---------------------|
| **Rapidité** | ⭐⭐ Lent (une par une) | ⭐⭐⭐⭐⭐ Rapide (toutes) |
| **Contrôle** | ⭐⭐⭐⭐⭐ Total | ⭐⭐ Partiel |
| **Sécurité** | ⭐⭐⭐⭐⭐ Maximum | ⭐⭐⭐ Bonne |
| **Usage** | Validation fine | Publication finale |

---

## 💡 Recommandations

### Workflow Recommandé

1. **Phase 1: Algorithme**
   - Lancer l'algorithme
   - Toutes les assignations en "Brouillon"

2. **Phase 2: Validation**
   - Vérifier les assignations prioritaires
   - Publier individuellement les assignations validées

3. **Phase 3: Corrections**
   - Modifier les assignations problématiques
   - Dépublier si nécessaire
   - Republier après correction

4. **Phase 4: Publication Finale**
   - Utiliser "Publier aux étudiants" pour le reste
   - Vérifier que tout est publié

---

## ✅ Checklist de Validation

- [x] Colonne Statut ajoutée au tableau
- [x] Badge Brouillon/Publié avec icônes
- [x] Bouton Publier sur lignes en brouillon
- [x] Bouton Dépublier sur lignes publiées
- [x] Fonction publishSingleAssignment
- [x] Fonction unpublishSingleAssignment
- [x] Confirmation avant dépublication
- [x] Toast de succès/info
- [x] Mise à jour locale du tableau
- [x] Publication groupée intelligente
- [x] Comptage des assignations non publiées
- [x] Logs détaillés

---

**Date**: 11 décembre 2025  
**Version**: 2.0  
**Statut**: ✅ Production Ready  
**Auteur**: Cascade AI
