# Pattern Standardisé : Refresh Automatique après CRUD

## 🎯 Problème résolu

**Symptômes :**
- Les listes ne se rafraîchissent pas après création/modification/suppression
- L'utilisateur doit recharger manuellement la page (F5) pour voir les changements
- Les dialogs se ferment trop vite avant que le parent ne refresh

**Cause :**
Mauvais timing entre :
1. Sauvegarde des données en DB
2. Émission de l'événement vers le parent
3. Fermeture du dialog
4. Refresh de la liste parent

---

## ✅ Solution Standardisée

### **Composable `useDataRefresh`**

Utiliser le composable `@/composables/useDataRefresh` qui garantit le bon ordre d'exécution.

#### **Option 1 : Méthode simple `emitAndWait`**

```vue
<script setup>
import { useDataRefresh } from '@/composables/useDataRefresh'

const { emitAndWait } = useDataRefresh()

const saveData = async () => {
  saving.value = true
  try {
    // 1. Sauvegarder en DB
    await supabase.from('table').insert(data)
    
    // 2. Émettre l'événement ET attendre le refresh parent
    await emitAndWait(emit, 'data-updated')
    
    // 3. Toast de succès
    toast.add({ 
      severity: 'success', 
      summary: 'Succès',
      detail: 'Données sauvegardées'
    })
    
    // 4. Fermer le dialog
    closeDialog()
    
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur' })
  } finally {
    saving.value = false
  }
}
</script>
```

#### **Option 2 : Méthode complète `handleCrudOperation`**

```vue
<script setup>
import { useDataRefresh } from '@/composables/useDataRefresh'

const { handleCrudOperation } = useDataRefresh()

const saveData = async () => {
  saving.value = true
  
  const success = await handleCrudOperation({
    emit,
    eventName: 'data-updated',
    saveOperation: async () => {
      // Votre logique de sauvegarde
      await supabase.from('table').insert(data)
    },
    toast,
    closeDialog,
    messages: {
      successSummary: 'Succès',
      successDetail: 'Données sauvegardées',
      errorSummary: 'Erreur',
      errorDetail: 'Impossible de sauvegarder'
    }
  })
  
  saving.value = false
}
</script>
```

---

## 📋 Migration : Convertir ancien code

### **Avant (❌ Ne fonctionne pas toujours)**

```javascript
const saveData = async () => {
  try {
    await supabase.from('table').insert(data)
    
    toast.add({ severity: 'success', summary: 'Succès' })
    emit('data-updated')  // ⚠️ Émis trop tard !
    closeDialog()         // ⚠️ Ferme avant que parent refresh !
  } catch (error) {
    // ...
  }
}
```

### **Après (✅ Fonctionne toujours)**

```javascript
import { useDataRefresh } from '@/composables/useDataRefresh'

const { emitAndWait } = useDataRefresh()

const saveData = async () => {
  try {
    // 1. Sauvegarder
    await supabase.from('table').insert(data)
    
    // 2. Émettre ET attendre
    await emitAndWait(emit, 'data-updated')
    
    // 3. Toast
    toast.add({ severity: 'success', summary: 'Succès' })
    
    // 4. Fermer
    closeDialog()
  } catch (error) {
    // ...
  }
}
```

---

## 🔧 Pattern pour les composants parents

### **Liste avec refresh automatique**

```vue
<template>
  <DataTable :value="items" />
  
  <EditDialog
    v-model:visible="showDialog"
    :itemId="selectedId"
    @item-updated="onItemUpdated"
  />
</template>

<script setup>
const items = ref([])
const showDialog = ref(false)
const selectedId = ref(null)

const fetchItems = async () => {
  const { data } = await supabase.from('items').select('*')
  items.value = data
}

const onItemUpdated = async () => {
  // Le dialog a déjà attendu avant de fermer
  // On peut refresh immédiatement
  await fetchItems()
}

onMounted(() => {
  fetchItems()
})
</script>
```

---

## 📝 Checklist de migration

Pour chaque Dialog/Form de CRUD dans le projet :

- [ ] Importer `useDataRefresh` depuis `@/composables`
- [ ] Extraire `emitAndWait` du composable
- [ ] **ORDRE CRITIQUE** dans la fonction de sauvegarde :
  1. [ ] Sauvegarder les données en DB
  2. [ ] Appeler `await emitAndWait(emit, 'event-name')`
  3. [ ] Afficher le toast de succès
  4. [ ] Fermer le dialog
- [ ] Vérifier que le composant parent écoute l'événement
- [ ] Tester : créer/modifier/supprimer → liste doit se rafraîchir automatiquement

---

## 🎯 Composants prioritaires à migrer

### **Dialogs de gestion utilisateurs**
- [x] `StudentEditDialog.vue` ✅ Migré
- [x] `StudentCreateDialog.vue` ✅ Migré
- [ ] `EtudiantFormModif.vue`
- [ ] `NewUserForm.vue`
- [ ] `NewUserFormModif.vue`
- [ ] `EnseignentForm.vue`
- [ ] `EnseignentFormModif.vue`
- [ ] `PraticienFormateurForm.vue`
- [ ] `PraticienFormateurFormModif.vue`

### **Dialogs d'institutions**
- [ ] `InstitutionForm.vue`
- [ ] `InstitutionFormModif.vue`

### **Dialogs PFP**
- [ ] Tous les composants de création/modification dans `views/admin/pfp/`
- [ ] Tous les composants de création/modification dans `views/admin/formation-pratique/`

### **Dialogs gamification**
- [ ] `ChallengeManagementView.vue`
- [ ] `QuestManagementView.vue`
- [ ] `BadgeManagementView.vue`

---

## 🚀 Bénéfices

✅ **UX améliorée** : Plus besoin de F5  
✅ **Données toujours à jour** : Synchronisation automatique  
✅ **Code standardisé** : Même pattern partout  
✅ **Moins de bugs** : Timing garanti  
✅ **Maintenabilité** : Un seul composable à maintenir

---

## 🐛 Dépannage

**Q : Les données ne se rafraîchissent toujours pas ?**

R : Vérifiez que :
1. Le parent écoute bien l'événement : `@item-updated="onItemUpdated"`
2. La méthode `onItemUpdated` recharge bien les données : `await fetchItems()`
3. Vous utilisez bien `await emitAndWait()` et non `emit()` directement

**Q : Le dialog se ferme trop lentement ?**

R : Ajustez le délai dans `emitAndWait` :
```javascript
await emitAndWait(emit, 'event-name', undefined, 50) // 50ms au lieu de 100ms
```

**Q : Puis-je passer des données avec l'événement ?**

R : Oui, utilisez le 3ème paramètre :
```javascript
await emitAndWait(emit, 'item-updated', { id: itemId })
```

---

## 📚 Voir aussi

- `src/composables/useDataRefresh.js` - Code source du composable
- `src/components/admin/forms/StudentEditDialog.vue` - Exemple d'implémentation
- `src/views/admin/users/StudentListView.vue` - Exemple de parent qui écoute
