# 👨‍⚕️ Assignation de Praticien Formateur par Étudiant

## 🎯 Nouvelle Fonctionnalité

Permet d'**assigner un praticien formateur spécifique** à chaque étudiant pour sa place de formation pratique.

---

## ✨ Fonctionnalités

### 1. **Sélection Intelligente**
```
Si la place a des praticiens configurés:
  → Proposer uniquement ces praticiens (liste restreinte)

Si la place n'a pas de praticiens configurés:
  → Proposer TOUS les praticiens disponibles
```

### 2. **Sauvegarde en Base de Données**
```
Chaque assignation stocke:
- assigned_place_id (la place)
- assigned_praticien_id (le praticien spécifique) ← NOUVEAU
```

### 3. **Modification Facile**
```
Dropdown avec:
- Sélection rapide
- Changement à tout moment
- Suppression possible (X pour clear)
```

---

## 📊 Structure de la Base de Données

### Migration Appliquée

```sql
-- Ajouter la colonne assigned_praticien_id
ALTER TABLE student_result_vote 
ADD COLUMN IF NOT EXISTS assigned_praticien_id bigint NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_student_result_vote_praticien 
ON student_result_vote(assigned_praticien_id);
```

### Table `student_result_vote`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique de l'assignation |
| `user_id` | text | ID de l'étudiant |
| `assigned_place_id` | text | ID de la place |
| `assigned_praticien_id` | **bigint** | **ID du praticien assigné** ✨ NOUVEAU |
| `pfp_type` | text | PFP1A, PFP1B, etc. |
| `year` | text | Année académique |
| `status` | text | draft, published, assigned |

### Exemple de Données

```javascript
{
  "id": "abc123",
  "user_id": "student456",
  "assigned_place_id": "place789",
  "assigned_praticien_id": 123,  // ← Praticien sélectionné
  "pfp_type": "PFP1A",
  "year": "2026",
  "status": "published"
}
```

---

## 🎨 Interface Utilisateur

### Dropdown de Sélection

```vue
<Dropdown
  v-model="assigned_praticien_id"
  :options="praticienOptions"
  placeholder="Sélectionner un praticien"
  showClear
>
  <template #value>
    <!-- Affiche le praticien sélectionné -->
    Jean Martin
  </template>
  
  <template #option>
    <!-- Liste des options -->
    Jean Martin
    jean.martin@example.com
  </template>
</Dropdown>
```

### Message d'Information

**Si praticiens configurés pour la place:**
```
ℹ️ 3 praticien(s) configuré(s) pour cette place
```

**Si pas de praticiens configurés:**
```
⚠️ Aucun praticien configuré - sélection parmi tous
```

---

## 🔄 Flux de Travail

### Cas 1: Place avec Praticiens Configurés

```
1. Admin ouvre PlacesAssignmentView
   ↓
2. Voit dropdown avec les 3 praticiens de la place
   ↓
3. Sélectionne "Jean Martin"
   ↓
4. Sauvegarde automatique en DB
   ↓
5. Notification: "Jean Martin a été assigné à Alice DUPONT"
```

### Cas 2: Place sans Praticiens Configurés

```
1. Admin ouvre PlacesAssignmentView
   ↓
2. Voit dropdown avec TOUS les praticiens (45)
   ↓
3. Cherche et sélectionne un praticien
   ↓
4. Sauvegarde automatique en DB
   ↓
5. Message: "⚠️ Aucun praticien configuré - sélection parmi tous"
```

### Cas 3: Changement de Praticien

```
1. Étudiant est assigné à "Jean Martin"
   ↓
2. Admin change pour "Sophie Dubois"
   ↓
3. Mise à jour automatique en DB
   ↓
4. Notification: "Sophie Dubois a été assigné à Alice DUPONT"
```

### Cas 4: Retirer un Praticien

```
1. Étudiant est assigné à "Jean Martin"
   ↓
2. Admin clique sur X (clear)
   ↓
3. assigned_praticien_id → NULL
   ↓
4. Notification: "Praticien retiré pour Alice DUPONT"
```

---

## 💾 Logique de Sauvegarde

### Fonction `assignPraticien`

```javascript
const assignPraticien = async (assignment, praticienId) => {
  // 1. Marquer comme en cours de sauvegarde
  assignment.savingPraticien = true
  
  try {
    // 2. Mettre à jour dans Supabase
    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        assigned_praticien_id: praticienId,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
    
    if (error) throw error
    
    // 3. Mettre à jour localement
    assignment.assigned_praticien_id = praticienId
    
    // 4. Notification
    toast.add({
      severity: 'success',
      summary: 'Praticien assigné',
      detail: `${getPraticienName(praticienId)} assigné`
    })
  } catch (error) {
    // Gestion d'erreur
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message
    })
  } finally {
    assignment.savingPraticien = false
  }
}
```

---

## 🔍 Logique de Sélection

### Fonction `getPraticienOptions`

```javascript
const getPraticienOptions = (assignment) => {
  // CAS 1: Place avec praticiens configurés
  if (assignment.praticiens_formateurs_list?.length > 0) {
    return assignment.praticiens_formateurs_list.map(p => ({
      value: p.id,
      label: p.nom,
      mail: p.mail
    }))
  }
  
  // CAS 2: Tous les praticiens disponibles
  return allPraticiens.value.map(p => ({
    value: p.id,
    label: `${p.prenom} ${p.nom}`,
    mail: p.mail
  }))
}
```

### Priorité de Sélection

| Situation | Source | Nb Options |
|-----------|--------|------------|
| **Place configurée** | `places.praticiensFormateurs` | 1-5 praticiens |
| **Place non configurée** | `praticiens_formateurs` (tous) | ~45 praticiens |

---

## 📤 Export CSV Amélioré

### Colonnes

| Colonne | Description | Exemple |
|---------|-------------|---------|
| Nom | Nom de l'étudiant | DUPONT |
| Prénom | Prénom de l'étudiant | Alice |
| Place Attribuée | Nom de la place | Gériatrie |
| Institution | Institution | HVS |
| **Praticien Assigné** | **Praticien sélectionné** ✨ | **Jean Martin** |
| **Email Praticien** | **Email du praticien** ✨ | **jean@...** |
| Praticiens Disponibles | Liste complète | "Jean Martin, Sophie..." |
| Rang | Rang du choix | 1er choix |
| Date Attribution | Date | 11/12/2025 |
| Statut | Statut | published |

### Format CSV

```csv
Nom,Prénom,Place,Institution,Praticien Assigné,Email Praticien,Praticiens Disponibles,Rang
DUPONT,Alice,Gériatrie,HVS,Jean Martin,jean@...,"Jean Martin, Sophie Dubois",1er choix
MARTIN,Paul,Ortho,HFR,Non assigné,,"Pierre Dupont",2ème choix
```

---

## 🎯 Cas d'Usage

### Cas 1: Rotation de Praticiens
```
Place: Gériatrie HVS
Praticiens configurés: Jean Martin, Sophie Dubois, Pierre Dupont

Semestre 1:
- Alice → Jean Martin
- Bob → Sophie Dubois
- Charles → Pierre Dupont

Semestre 2:
- Alice → Sophie Dubois (changement)
- Bob → Pierre Dupont
- Charles → Jean Martin
```

### Cas 2: Praticien Non Configuré
```
Place: Pédiatrie CHUV
Praticiens configurés: Aucun ⚠️

Admin:
1. Ouvre dropdown
2. Voit TOUS les praticiens (45)
3. Cherche "Marie Dupuis"
4. Sélectionne et sauvegarde
```

### Cas 3: Changement d'Avis
```
1. Alice assignée à Jean Martin
2. Jean Martin indisponible
3. Admin change pour Sophie Dubois
4. Mise à jour instantanée
5. Email automatique possible (futur)
```

---

## 📊 Données Enrichies

### Structure Complète d'une Assignation

```javascript
{
  // Données de base
  id: "abc123",
  user_id: "student456",
  student_name: "DUPONT Alice",
  
  // Place
  assigned_place_id: "place789",
  assigned_place_name: "Gériatrie",
  assigned_institution_name: "HVS",
  
  // Praticiens
  praticiens_formateurs_list: [        // Liste complète configurée
    { id: 123, nom: "Jean Martin", mail: "jean@..." },
    { id: 456, nom: "Sophie Dubois", mail: "sophie@..." }
  ],
  assigned_praticien_id: 123,          // ← Praticien ASSIGNÉ
  
  // Autres
  assigned_rank: 1,
  status: "published",
  savingPraticien: false
}
```

---

## 🔧 Fonctions Utilitaires

### `getPraticienName(praticienId)`
```javascript
// Obtenir le nom d'un praticien par son ID
const praticien = allPraticiens.find(p => p.id == praticienId)
return praticien 
  ? `${praticien.prenom} ${praticien.nom}` 
  : `Praticien ${praticienId}`
```

### `getPraticienOptions(assignment)`
```javascript
// Obtenir les options du dropdown
if (hasConfiguredPraticiens) {
  return configuredPraticiens  // Liste restreinte
} else {
  return allPraticiens         // Liste complète
}
```

### `assignPraticien(assignment, praticienId)`
```javascript
// Assigner et sauvegarder
await supabase
  .from('student_result_vote')
  .update({ assigned_praticien_id: praticienId })
  .eq('id', assignment.id)
```

---

## 🐛 Gestion des Erreurs

### Erreur de Sauvegarde
```javascript
try {
  await supabase.update(...)
} catch (error) {
  toast.add({
    severity: 'error',
    summary: 'Erreur',
    detail: 'Impossible d\'assigner le praticien: ' + error.message
  })
}
```

### Praticien Non Trouvé
```javascript
const praticien = findPraticien(id)
if (!praticien) {
  return `Praticien ${id}` // Fallback
}
```

### Place Sans Praticiens
```javascript
if (!hasPraticiens) {
  return allPraticiens // Tous les praticiens disponibles
}
```

---

## 🧪 Tests

### Test 1: Assignation Simple
```
1. Ouvrir PlacesAssignmentView
2. Trouver une ligne
3. Cliquer sur dropdown
4. Sélectionner un praticien
5. Vérifier notification succès
6. Rafraîchir page
7. Vérifier praticien toujours sélectionné
```

### Test 2: Changement de Praticien
```
1. Ligne avec praticien déjà assigné
2. Ouvrir dropdown
3. Changer pour un autre
4. Vérifier mise à jour
5. Vérifier notification
```

### Test 3: Retirer un Praticien
```
1. Ligne avec praticien assigné
2. Cliquer sur X (clear)
3. Vérifier praticien retiré
4. Vérifier notification
5. Vérifier NULL en DB
```

### Test 4: Place sans Praticiens Configurés
```
1. Trouver place sans praticiens
2. Ouvrir dropdown
3. Vérifier message "sélection parmi tous"
4. Vérifier ~45 options disponibles
5. Sélectionner un praticien
6. Vérifier sauvegarde
```

### Test 5: Export CSV
```
1. Assigner plusieurs praticiens
2. Exporter en CSV
3. Ouvrir fichier
4. Vérifier colonne "Praticien Assigné"
5. Vérifier colonne "Email Praticien"
6. Vérifier données correctes
```

---

## 📝 Logs Console

### Assignation Réussie
```
[ASSIGN_PRATICIEN] Assignation praticien: {
  assignment: "DUPONT Alice",
  praticienId: 123,
  praticienName: "Jean Martin"
}
[SUCCESS] Praticien assigné avec succès
```

### Erreur d'Assignation
```
[ERROR] Erreur assignation praticien: {
  code: "...",
  message: "...",
  details: "..."
}
```

---

## 🎓 Résumé

### Pour les Administrateurs
- ✅ Assignation rapide via dropdown
- ✅ Sélection intelligente (place ou tous)
- ✅ Sauvegarde automatique
- ✅ Modification facile à tout moment
- ✅ Export CSV complet

### Pour l'Organisation
- ✅ Traçabilité complète étudiant → place → praticien
- ✅ Base de données centralisée
- ✅ Gestion des rotations facilitée
- ✅ Statistiques possibles par praticien

### Pour les Étudiants (futur)
- ✅ Voir leur praticien formateur assigné
- ✅ Contact direct via email
- ✅ Information claire dès la publication

---

## 🚀 Améliorations Futures

### 1. **Notification Automatique**
```javascript
// Envoyer email au praticien quand assigné
if (praticienAssigned) {
  sendEmail(praticien.mail, {
    subject: "Nouvel étudiant assigné",
    body: `${student.name} vous est assigné pour ${place.name}`
  })
}
```

### 2. **Statistiques Praticiens**
```vue
<div>
  <h5>Jean Martin</h5>
  <p>5 étudiants encadrés ce semestre</p>
  <ProgressBar :value="(5/10)*100" />
</div>
```

### 3. **Calendrier d'Encadrement**
```vue
<Calendar>
  <Event praticien="Jean Martin" etudiant="Alice" dates="Jan-Mar" />
  <Event praticien="Jean Martin" etudiant="Bob" dates="Apr-Jun" />
</Calendar>
```

### 4. **Charge de Travail**
```javascript
// Alerter si praticien surchargé
if (countStudents(praticien) > maxCapacity) {
  toast.warn("⚠️ Ce praticien a déjà beaucoup d'étudiants")
}
```

---

## ✅ Checklist de Migration

- [x] Migration SQL créée
- [x] Colonne `assigned_praticien_id` ajoutée
- [x] Index créé pour performance
- [x] Dropdown de sélection implémenté
- [x] Fonction `assignPraticien` créée
- [x] Sauvegarde automatique
- [x] Notifications toast
- [x] Gestion des erreurs
- [x] Export CSV mis à jour
- [x] Messages d'information
- [x] Logs de debug
- [x] Documentation complète

---

**Date**: 11 décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Implémenté  
**Auteur**: Cascade AI
