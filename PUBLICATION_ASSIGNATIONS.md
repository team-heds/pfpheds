# 📢 Système de Publication des Assignations PFP

## 🎯 Objectif

Permettre aux administrateurs de **valider et publier** les résultats d'attribution des places PFP pour les rendre visibles dans le profil des étudiants.

---

## 🔄 Workflow Complet

### 1. **Admin Lance l'Algorithme**
```
VotationPFPViewPHYFP.vue
↓
Clic sur "Lancer l'algorithme"
↓
Backend: resultatVotationStoreBackend.js
↓
Création des assignations dans student_result_vote
↓
Status par défaut: "draft" (brouillon)
```

### 2. **Admin Visualise les Résultats**
```
PlacesAssignmentView.vue
↓
Sélectionner PFP + Année
↓
Affichage du tableau des assignations
↓
Status: "draft" (non visible par les étudiants)
```

### 3. **Admin Modifie les Assignations** (Optionnel)
```
Clic sur icône ✏️
↓
Sélection d'une nouvelle place
↓
Sauvegarde
↓
Assignation mise à jour (toujours en "draft")
```

### 4. **Admin Publie les Assignations**
```
Clic sur "Publier aux étudiants"
↓
Confirmation
↓
UPDATE student_result_vote
SET status = 'published'
WHERE pfp_type = ... AND year = ...
↓
Toast de confirmation
```

### 5. **Étudiant Voit son Assignation**
```
Connexion étudiant
↓
ProfileView.vue
↓
VotationResultProfil.vue
↓
SELECT * FROM student_result_vote
WHERE user_id = ... AND status = 'published'
↓
Affichage de la place assignée
```

---

## 📊 Structure de la Base de Données

### Table: `student_result_vote`

```sql
CREATE TABLE student_result_vote (
  id UUID PRIMARY KEY,
  user_id TEXT,
  pfp_type VARCHAR(50),  -- 'PFP1A', 'PFP1B'
  year VARCHAR(10),       -- '2025', '2026'
  assigned_place_id TEXT,
  assigned_place_name TEXT,
  assigned_institution_name TEXT,
  assigned_rank INTEGER,
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft' ou 'published'
  assigned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ...
);
```

### Index Ajoutés

```sql
-- Index pour les requêtes par statut
CREATE INDEX idx_student_result_vote_status 
ON student_result_vote(status);

-- Index composite pour les requêtes fréquentes
CREATE INDEX idx_student_result_vote_user_pfp_year_status
ON student_result_vote(user_id, pfp_type, year, status);
```

---

## 🔧 Modifications Apportées

### 1. **Migration SQL**
**Fichier**: `supabase_migrations/20251211_add_status_to_student_result_vote.sql`

- Ajout colonne `status` avec valeur par défaut 'draft'
- Création des index pour optimiser les requêtes
- Commentaires pour documentation

### 2. **PlacesAssignmentView.vue**

#### Nouveau Bouton
```vue
<Button 
  icon="pi pi-check-circle" 
  label="Publier aux étudiants" 
  severity="success" 
  @click="publishAssignments"
  :loading="publishing"
/>
```

#### Nouvelle Fonction
```javascript
const publishAssignments = async () => {
  // 1. Vérifications
  // 2. Confirmation utilisateur
  // 3. UPDATE status = 'published'
  // 4. Toast de succès
}
```

### 3. **VotationResultProfil.vue**

#### Nouvelle Fonction
```javascript
const fetchPublishedAssignments = async () => {
  const { data } = await supabase
    .from('student_result_vote')
    .select('*')
    .eq('user_id', props.userId)
    .eq('status', 'published')
  
  publishedAssignments.value = data || []
}
```

#### Computed Modifié
```javascript
const assignedPlaces = computed(() => {
  // PRIORITÉ: assignations publiées
  if (publishedAssignments.value.length > 0) {
    return assignedPlacesFromPublished.value
  }
  
  // FALLBACK: ancien système JSONB
  return assignedPlacesFromSupabase.value
})
```

---

## 🎨 Interface Admin

### Bouton "Publier aux étudiants"

**Apparence:**
- Icône: ✓ (check-circle)
- Couleur: Vert (success)
- Tooltip: "Rendre les assignations visibles dans le profil des étudiants"

**États:**
- Normal: Bouton vert cliquable
- Loading: Spinner pendant la publication
- Désactivé: Si aucune assignation

**Position:**
```
┌────────────────────────────────────────────┐
│ Résultats d'Attribution - PFP1A 2026      │
│                                            │
│ [✓ Publier aux étudiants] [📥 Exporter]   │
└────────────────────────────────────────────┘
```

---

## 💬 Messages Utilisateur

### Confirmation Publication
```
Voulez-vous publier 27 assignations pour PFP1A 2026?

Ces assignations seront visibles dans le profil des étudiants.

[Annuler] [OK]
```

### Toast Succès
```
✅ Publication réussie
27 assignations sont maintenant visibles par les étudiants
```

### Toast Erreur
```
❌ Erreur
Impossible de publier les assignations: [message d'erreur]
```

---

## 🔍 États des Assignations

### "draft" (Brouillon)
- ❌ **NON visible** par les étudiants
- ✅ Visible par les admins dans PlacesAssignmentView
- ✅ Modifiable par les admins
- ✅ État par défaut après l'algorithme

### "published" (Publié)
- ✅ **VISIBLE** par les étudiants dans leur profil
- ✅ Visible par les admins
- ✅ Toujours modifiable par les admins
- ✅ État après clic sur "Publier"

---

## 📝 Logs Console

### Admin - Publication
```
[PUBLISH] Publication des assignations...
PFP: PFP1A, Année: 2026
Nombre d'assignations: 27
[SUCCESS] Assignations publiées avec succès
```

### Étudiant - Chargement
```
[FETCH] Récupération des assignations publiées pour userId: user123
✅ 1 assignations publiées trouvées pour l'étudiant
[NEW] Utilisation des assignations depuis student_result_vote
🎯 1 assignations publiées enrichies
```

---

## 🔄 Compatibilité Avec l'Ancien Système

### Fallback Automatique

Le système est **rétrocompatible** :

```javascript
// Si assignations publiées trouvées
if (publishedAssignments.length > 0) {
  return assignedPlacesFromPublished  // NOUVEAU
}

// Sinon, fallback sur ancien système
return assignedPlacesFromSupabase  // ANCIEN (JSONB)
```

### Migration Progressive

- ✅ **Nouveau système** : student_result_vote avec status
- ✅ **Ancien système** : Champs JSONB dans places
- ✅ **Coexistence** : Les deux systèmes peuvent coexister
- ✅ **Transition** : Progressivement tout passer au nouveau système

---

## 🧪 Tests

### Test 1: Publication Simple
```
1. Admin lance l'algorithme pour PFP1A 2026
2. Admin va sur PlacesAssignmentView
3. Sélectionne PFP1A + 2026
4. Voit le tableau des assignations
5. Clique sur "Publier aux étudiants"
6. Confirme
7. Voit le toast de succès
```

### Test 2: Vérification Étudiant
```
1. Se connecter en tant qu'étudiant
2. Aller sur le profil
3. Vérifier que l'assignation s'affiche
4. Vérifier le nom de la place
5. Vérifier l'institution
```

### Test 3: Modification Après Publication
```
1. Admin publie les assignations
2. Admin modifie une assignation
3. Vérifier que la modification est sauvegardée
4. Vérifier que l'étudiant voit la nouvelle place
```

### Test 4: Fallback Ancien Système
```
1. Créer des assignations dans l'ancien système (JSONB)
2. Se connecter en tant qu'étudiant
3. Vérifier que les assignations s'affichent
4. Publier de nouvelles assignations
5. Vérifier que le nouveau système prend le relais
```

---

## 🔒 Sécurité

### Permissions RLS (Row Level Security)

#### student_result_vote

**SELECT:**
```sql
-- Admin: Tout voir
CREATE POLICY "Admin can select all" ON student_result_vote
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Étudiant: Voir uniquement ses propres assignations publiées
CREATE POLICY "Student can select own published" ON student_result_vote
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() AND 
  status = 'published'
);
```

**UPDATE:**
```sql
-- Seuls les admins peuvent modifier
CREATE POLICY "Only admin can update" ON student_result_vote
FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 📊 Statistiques

### Dans PlacesAssignmentView

```
Total étudiants: 32
Assignés: 27
En attente: 5
```

### Après Publication

```
✅ 27 assignations publiées avec succès
📧 Notification envoyée aux étudiants (futur)
```

---

## 🚀 Améliorations Futures

### 1. Notifications Email
```javascript
// Après publication, envoyer un email
await sendEmailToStudents(results.value, {
  subject: 'Votre place PFP est disponible',
  template: 'pfp-assignment'
})
```

### 2. Historique des Modifications
```sql
CREATE TABLE student_result_vote_history (
  id UUID PRIMARY KEY,
  student_result_vote_id UUID,
  old_place_id TEXT,
  new_place_id TEXT,
  modified_by UUID,
  modified_at TIMESTAMPTZ
);
```

### 3. Dé-publication
```javascript
const unpublishAssignments = async () => {
  // Repasser les assignations en "draft"
  await supabase
    .from('student_result_vote')
    .update({ status: 'draft' })
    .eq('pfp_type', selectedPFP.value)
    .eq('year', selectedYear.value)
}
```

### 4. Publication Partielle
```javascript
// Publier uniquement certaines assignations
const publishSelected = async (selectedIds) => {
  await supabase
    .from('student_result_vote')
    .update({ status: 'published' })
    .in('id', selectedIds)
}
```

---

## ✅ Checklist de Validation

- [x] Migration SQL créée et documentée
- [x] Bouton "Publier" ajouté dans PlacesAssignmentView
- [x] Fonction publishAssignments implémentée
- [x] Confirmation utilisateur avant publication
- [x] Toast de succès/erreur
- [x] VotationResultProfil.vue mis à jour
- [x] Récupération des assignations publiées
- [x] Fallback sur ancien système
- [x] Logs détaillés pour debugging
- [x] Gestion des erreurs robuste
- [x] Index de performance créés
- [x] Documentation complète

---

## 📞 Support

### Pour les Admins

**Problème**: Les assignations ne s'affichent pas après publication
**Solution**: 
1. Vérifier les logs console (F12)
2. Vérifier le statut dans la DB: `SELECT * FROM student_result_vote WHERE status = 'published'`
3. Vérifier les permissions RLS

### Pour les Étudiants

**Problème**: Je ne vois pas mon assignation
**Solution**:
1. Vérifier que l'admin a publié les assignations
2. Rafraîchir la page
3. Vérifier les logs console pour voir si l'assignation est récupérée

---

**Date**: 11 décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Production Ready  
**Auteur**: Cascade AI
