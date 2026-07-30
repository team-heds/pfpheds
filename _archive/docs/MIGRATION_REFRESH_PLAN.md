# Plan de Migration : Refresh Automatique Platform-Wide

## 🎯 Objectif
Éliminer tous les bugs de rechargement manuel (F5) sur toute la plateforme en appliquant le pattern `useDataRefresh` de manière systématique.

---

## 📊 État actuel (Audit)

### ✅ Composants MIGRÉS (3)
- `StudentEditDialog.vue` ✅
- `StudentCreateDialog.vue` ✅
- `CreatePlaceDialog.vue` ✅

### ⚠️ Composants PARTIELLEMENT MIGRÉS (1)
- `PlacesViewPHYFP.vue` ⚠️ (parent async ok, mais besoin de vérifier tous les dialogs)

### ❌ Composants À MIGRER (priorité haute)

#### **Gestion des utilisateurs** (9 composants)
1. `EtudiantForm.vue` - Création étudiants (ancienne architecture Firebase)
2. `EtudiantFormModif.vue` - Modification étudiants (ancienne architecture Firebase)
3. `NewUserForm.vue` - Création utilisateurs
4. `NewUserFormModif.vue` - Modification utilisateurs
5. `EnseignentForm.vue` - Création enseignants
6. `EnseignentFormModif.vue` - Modification enseignants
7. `PraticienFormateurForm.vue` - Création praticiens
8. `PraticienFormateurFormModif.vue` - Modification praticiens
9. `StudentListView.vue` - Vérifier tous les handlers d'événements

#### **Gestion des institutions** (2 composants)
10. `InstitutionForm.vue` - Création institutions
11. `InstitutionFormModif.vue` - Modification institutions

#### **Autres modules** (3 composants)
12. `CreatePostDialog.vue` - Création de posts (social)
13. `EventForm.vue` - Création/modification d'événements
14. `TicketForm.vue` - Création de tickets académiques

---

## 🚀 Stratégie de Migration (4 phases)

### **Phase 1 : Foundation (FAIT ✅)**
- [x] Créer `useDataRefresh.js` composable
- [x] Documenter le pattern dans `DATA_REFRESH_PATTERN.md`
- [x] Migrer 3 composants pilotes (Students + Places)
- [x] Valider le pattern sur des cas réels

### **Phase 2 : Gestion Utilisateurs (PRIORITÉ HAUTE)**
**Objectif** : 100% des opérations utilisateurs sans F5

#### **Étape 2.1 : Dialogs modernes (Supabase)**
- [ ] Migrer `NewUserForm.vue` → `UserCreateDialog.vue`
- [ ] Migrer `NewUserFormModif.vue` → `UserEditDialog.vue`
- [ ] Appliquer `useDataRefresh` aux deux dialogs
- [ ] Tester sur `UserListView.vue`

#### **Étape 2.2 : Formulaires enseignants**
- [ ] Migrer `EnseignentForm.vue` → `TeacherCreateDialog.vue`
- [ ] Migrer `EnseignentFormModif.vue` → `TeacherEditDialog.vue`
- [ ] Appliquer `useDataRefresh`
- [ ] Tester sur `EnseignentListView.vue`

#### **Étape 2.3 : Formulaires praticiens**
- [ ] Migrer `PraticienFormateurForm.vue` → `PractitionerCreateDialog.vue`
- [ ] Migrer `PraticienFormateurFormModif.vue` → `PractitionerEditDialog.vue`
- [ ] Appliquer `useDataRefresh`
- [ ] Tester sur `PraticienFormateurListView.vue`

**Durée estimée** : 2-3 jours de développement

### **Phase 3 : Institutions & PFP (PRIORITÉ MOYENNE)**
**Objectif** : Toutes les opérations institutions/places sans F5

- [ ] Migrer `InstitutionForm.vue` → `InstitutionCreateDialog.vue`
- [ ] Migrer `InstitutionFormModif.vue` → `InstitutionEditDialog.vue`
- [ ] Vérifier tous les dialogs PFP existants
- [ ] Appliquer `useDataRefresh` systématiquement
- [ ] Tester sur toutes les vues de formation pratique

**Durée estimée** : 1-2 jours

### **Phase 4 : Modules secondaires (PRIORITÉ BASSE)**
**Objectif** : Cohérence totale sur toute la plateforme

- [ ] Social : `CreatePostDialog.vue`
- [ ] Events : `EventForm.vue`
- [ ] Academic : `TicketForm.vue`
- [ ] Vérifier les vues `/apps/*` (mail, chat, tasklist)

**Durée estimée** : 1 jour

---

## 🛠️ Template de Migration Standard

### **Pour chaque Dialog/Form à migrer**

#### **1. Identifier le pattern actuel**
```vue
<!-- ❌ ANCIEN PATTERN -->
async saveData() {
  await supabase.from('table').insert(data)
  this.$emit('updated')  // ou emit('updated')
  this.close()
}
```

#### **2. Appliquer le nouveau pattern**
```vue
<!-- ✅ NOUVEAU PATTERN -->
<script setup>
import { useDataRefresh } from '@/composables/useDataRefresh'

const { emitAndWait } = useDataRefresh()

async function saveData() {
  try {
    // 1. Sauvegarder
    await supabase.from('table').insert(data)
    
    // 2. Émettre ET attendre
    await emitAndWait(emit, 'updated')
    
    // 3. Toast
    toast.add({ severity: 'success', summary: 'Succès' })
    
    // 4. Fermer
    close()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur' })
  }
}
</script>
```

#### **3. Vérifier le composant parent**
```vue
<!-- Parent doit avoir un handler async -->
<template>
  <MyDialog @updated="onItemUpdated" />
</template>

<script setup>
async function onItemUpdated() {
  await fetchItems()  // Recharger les données
}
</script>
```

#### **4. Tester**
- [ ] Créer un item → liste se rafraîchit automatiquement
- [ ] Modifier un item → liste se met à jour sans F5
- [ ] Supprimer un item → liste se met à jour sans F5
- [ ] Aucune console error

---

## 📋 Checklist de Migration par Composant

**Pour chaque composant migré, cocher :**
- [ ] Import de `useDataRefresh` ajouté
- [ ] `emitAndWait` extrait du composable
- [ ] Ordre de sauvegarde respecté (save → emit → toast → close)
- [ ] Parent a un handler async qui recharge les données
- [ ] Tests manuels passés (create/update/delete)
- [ ] Aucune régression sur les fonctionnalités existantes
- [ ] Logs de debug retirés (ou gated par `import.meta.env.DEV`)

---

## 🎯 Quick Wins Immédiats (à faire maintenant)

### **1. Vérifier StudentListView.vue**
Confirmer que tous les handlers sont async et rechargent bien :
```javascript
async function onStudentUpdated() {
  await fetchEtudiantsFromSupabase()
}

async function onStudentCreated() {
  await fetchEtudiantsFromSupabase()
}
```

### **2. Auditer tous les `*ListView.vue`**
Trouver tous les fichiers qui contiennent des listes et vérifier :
```bash
# Fichiers à auditer
src/views/admin/users/*.vue
src/views/admin/formation-pratique/*.vue
```

### **3. Identifier les bugs critiques actuels**
Lister les pages où F5 est requis le plus souvent :
- [ ] Page étudiants ?
- [ ] Page institutions ?
- [ ] Page praticiens ?
- [ ] Page places ?
- [ ] Autres ?

---

## 📈 Indicateurs de Succès

### **Métriques**
- **Avant** : X% des opérations CRUD nécessitent F5
- **Objectif** : 0% des opérations CRUD nécessitent F5
- **Tests** : 100% des dialogs/forms testés manuellement

### **Validation finale**
- [ ] Tous les formulaires de création fonctionnent sans F5
- [ ] Tous les formulaires de modification fonctionnent sans F5
- [ ] Toutes les suppressions fonctionnent sans F5
- [ ] Aucune régression fonctionnelle
- [ ] Code review complet
- [ ] Documentation à jour

---

## 🚨 Pièges à Éviter

### **1. Ne pas attendre le refresh parent**
```javascript
// ❌ MAUVAIS
emit('updated')
close()  // Trop rapide !

// ✅ BON
await emitAndWait(emit, 'updated')
close()
```

### **2. Parent non-async**
```javascript
// ❌ MAUVAIS
function onUpdated() {
  fetchItems()  // Non bloquant
}

// ✅ BON
async function onUpdated() {
  await fetchItems()
}
```

### **3. Oublier de tester**
Toujours tester :
- Création → refresh automatique
- Modification → refresh automatique
- Suppression → refresh automatique

---

## 📝 Notes de Migration

### **Composants Firebase → Supabase**
Les anciens `*Form.vue` et `*FormModif.vue` utilisent Firebase. Migration en 2 étapes :
1. **Court terme** : Appliquer `useDataRefresh` même sur Firebase
2. **Long terme** : Migrer vers Supabase + Dialogs modernes

### **Architecture cible**
```
components/
  admin/
    forms/
      [entity]/
        CreateDialog.vue  (avec useDataRefresh)
        EditDialog.vue    (avec useDataRefresh)
        DeleteDialog.vue  (avec useDataRefresh)
```

---

## 🎓 Ressources

- **Documentation** : `docs/DATA_REFRESH_PATTERN.md`
- **Composable** : `src/composables/useDataRefresh.js`
- **Exemples** :
  - `StudentEditDialog.vue` (complet avec validation)
  - `StudentCreateDialog.vue` (création simple)
  - `CreatePlaceDialog.vue` (formulaire complexe)

---

## ⏭️ Prochaine Action Immédiate

**À faire maintenant :**
1. Lire ce plan
2. Identifier le module le plus problématique (celui qui nécessite F5 le plus souvent)
3. Commencer par migrer ce module en Phase 2
4. Tester et valider
5. Passer au module suivant

**Commencer par :**
- [ ] `NewUserForm.vue` + `NewUserFormModif.vue` ?
- [ ] `InstitutionForm.vue` + `InstitutionFormModif.vue` ?
- [ ] Autre (spécifier) : _______________
