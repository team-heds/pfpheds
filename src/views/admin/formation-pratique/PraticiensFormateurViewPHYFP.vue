<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-plus text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Praticiens Formateurs</h1>
              <p class="text-600 m-0 mt-2">Référentiel des praticiens formateurs</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2">
            <input v-model="search" type="text" class="search-input" placeholder="Rechercher (nom, prénom, email, institution, localité)" />
          </div>
        </div>
      </div>


      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <div class="flex align-items-center justify-content-between mb-2">
          <div class="text-color-secondary">{{ total }} praticien(s)</div>
          <div class="flex align-items-center gap-2">
            <Button label="Ajouter" icon="pi pi-plus" size="small" @click="openCreate" />
            <div v-if="error" class="text-red-500">{{ error }}</div>
          </div>
        </div>
        <DataTable
          :value="items"
          :loading="loading"
          dataKey="id"
          :paginator="true"
          :rows="12"
          :rowHover="true"
        >
          <Column header="Nom">
            <template #body="{ data }">
              {{ fullName(data) }}
            </template>
          </Column>
          <Column field="mail" header="Email"></Column>
          <Column header="Institution" :sortable="true">
            <template #body="{ data }">
              {{ getInstitutionName(data) }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" size="small" text @click="openEdit(data)" />
              <Button icon="pi pi-trash" size="small" text severity="danger" @click="onDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <Dialog 
        v-model:visible="editorVisible" 
        :modal="true" 
        :header="form.id ? 'Modifier un praticien formateur' : 'Ajouter un praticien formateur'" 
        :style="{ width: '450px' }"
      >
        <div class="p-fluid">
          <div class="field mb-3">
            <label for="prenom" class="font-semibold">Prénom *</label>
            <InputText 
              id="prenom" 
              v-model="form.prenom" 
              placeholder="Ex: Jean"
              :class="{ 'p-invalid': submitted && !form.prenom }"
            />
            <small v-if="submitted && !form.prenom" class="p-error">Le prénom est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="nom" class="font-semibold">Nom *</label>
            <InputText 
              id="nom" 
              v-model="form.nom" 
              placeholder="Ex: Dupont"
              :class="{ 'p-invalid': submitted && !form.nom }"
            />
            <small v-if="submitted && !form.nom" class="p-error">Le nom est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="mail" class="font-semibold">Email *</label>
            <InputText 
              id="mail" 
              v-model="form.mail" 
              type="email"
              placeholder="Ex: jean.dupont@email.ch"
              :class="{ 'p-invalid': submitted && !form.mail }"
            />
            <small v-if="submitted && !form.mail" class="p-error">L'email est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="institution" class="font-semibold">Institution</label>
            <Dropdown 
              id="institution"
              v-model="form.institution_id" 
              :options="institutionOptions" 
              optionLabel="label" 
              optionValue="value" 
              filter 
              filterPlaceholder="Rechercher une institution..."
              placeholder="Sélectionner une institution" 
              :loading="instStore.loading"
              showClear
              class="w-full"
            />
            <small class="text-500">Optionnel - Lien vers l'institution associée</small>
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="closeDialog" />
          <Button 
            :label="form.id ? 'Mettre à jour' : 'Créer'" 
            icon="pi pi-check" 
            :loading="saving" 
            @click="save" 
          />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { usePraticiensFormateursStore } from '@/stores/praticiensFormateursStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'

const store = usePraticiensFormateursStore()
const instStore = useInstitutionsStore()
const search = ref('')
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const items = computed(() => store.praticiensFormateurs)
const total = computed(() => items.value.length)
const saving = ref(false)
const editorVisible = ref(false)
const submitted = ref(false)
const form = ref({ id: null, prenom: '', nom: '', mail: '', institution_id: null })

function fullName(u) {
  return [u.prenom, u.nom].filter(Boolean).join(' ')
}

function getInstitutionName(u) {
  const id = u?.institution_id
  if (id != null) return instStore.getInstitutionNameById?.(id) || u.institution || ''
  return u.institution || ''
}

const institutionOptions = computed(() => {
  const arr = Array.isArray(instStore.institutions) ? instStore.institutions : []
  return arr
    .filter(i => i.InstitutionId || i.id) // Filtrer celles qui ont un ID
    .map(i => {
      const id = i.InstitutionId ?? i.id
      const name = i.Name || i.name || `#${id}`
      const locality = i.Locality || i.localite || ''
      const label = locality ? `${name} (${locality})` : name
      return { 
        label, 
        value: id 
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
})

let debounceId = null
onMounted(() => {
  store.fetchPraticiensFormateurs('')
  instStore.fetchInstitutions()
})

watch(search, (v) => {
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(() => {
    store.fetchPraticiensFormateurs(v || '')
  }, 300)
})

function openCreate() {
  form.value = { id: null, prenom: '', nom: '', mail: '', institution_id: null }
  submitted.value = false
  editorVisible.value = true
}

function openEdit(row) {
  form.value = { id: row.id, prenom: row.prenom || '', nom: row.nom || '', mail: row.mail || '', institution_id: row.institution_id ?? null }
  submitted.value = false
  editorVisible.value = true
}

function closeDialog() {
  editorVisible.value = false
  submitted.value = false
}

async function save() {
  submitted.value = true
  
  // Validation
  if (!form.value.prenom || !form.value.nom || !form.value.mail) {
    return
  }
  
  try {
    saving.value = true
    const payload = { 
      prenom: form.value.prenom.trim(), 
      nom: form.value.nom.trim(), 
      mail: form.value.mail.trim(), 
      institution_id: form.value.institution_id 
    }
    
    // Récupérer le nom et la localité de l'institution si disponible
    if (payload.institution_id) {
      // Note: institution_id dans praticiens_formateurs est UUID
      // mais InstitutionId dans institutions est TEXT
      // On compare en string
      const instId = String(payload.institution_id)
      const inst = instStore.institutions?.find(i => {
        const iId = String(i.InstitutionId || i.id || '')
        return iId === instId
      })
      
      if (inst) {
        payload.institution = inst.Name || inst.name || ''
        payload.localite = inst.Locality || inst.localite || ''
        console.log('🏥 Institution trouvée:', payload.institution, '-', payload.localite)
      } else {
        console.warn('⚠️ Institution non trouvée pour ID:', instId)
      }
    }
    
    if (!form.value.id) {
      await store.createPraticienFormateur(payload)
      console.log('✅ Praticien formateur créé avec succès')
    } else {
      await store.updatePraticienFormateur(form.value.id, payload)
      console.log('✅ Praticien formateur mis à jour avec succès')
    }
    
    editorVisible.value = false
    submitted.value = false
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde:', e)
    alert('Erreur lors de la sauvegarde: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!row?.id) return
  if (!confirm('Supprimer ce praticien ?')) return
  try {
    await store.deletePraticienFormateur(row.id)
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--surface-border,#e0e0e0);
  border-radius: 8px;
  min-width: 320px;
}
.form-grid { margin-top: 0.5rem; }
</style>

