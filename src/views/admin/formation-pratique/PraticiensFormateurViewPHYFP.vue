<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-plus text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Praticiens Formateurs</h1>
              <p class="text-600 m-0 mt-2">Référentiel des praticiens formateurs (Supabase)</p>
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

      <Dialog v-model:visible="editorVisible" :modal="true" header="Praticien formateur" class="w-30rem">
        <div class="grid form-grid">
          <div class="col-12">
            <label class="block mb-2">Prénom</label>
            <InputText v-model="form.prenom" class="w-full" />
          </div>
          <div class="col-12">
            <label class="block mb-2">Nom</label>
            <InputText v-model="form.nom" class="w-full" />
          </div>
          <div class="col-12">
            <label class="block mb-2">Email</label>
            <InputText v-model="form.mail" class="w-full" />
          </div>
          <div class="col-12">
            <label class="block mb-2">Institution</label>
            <Dropdown v-model="form.institution_id" :options="institutionOptions" optionLabel="label" optionValue="value" filter class="w-full" placeholder="Sélectionner une institution" />
          </div>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <Button label="Annuler" class="p-button-secondary" @click="closeDialog" />
            <Button label="Enregistrer" icon="pi pi-save" :loading="saving" @click="save" />
          </div>
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
  return arr.map(i => ({ label: i.Name || i.name || `#${i.InstitutionId ?? i.id}`, value: i.InstitutionId ?? i.id }))
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
  editorVisible.value = true
}

function openEdit(row) {
  form.value = { id: row.id, prenom: row.prenom || '', nom: row.nom || '', mail: row.mail || '', institution_id: row.institution_id ?? null }
  editorVisible.value = true
}

function closeDialog() {
  editorVisible.value = false
}

async function save() {
  try {
    saving.value = true
    const payload = { prenom: form.value.prenom, nom: form.value.nom, mail: form.value.mail, institution_id: form.value.institution_id }
    const instName = getInstitutionName({ institution_id: form.value.institution_id, institution: '' })
    if (instName) payload.institution = instName
    if (!form.value.id) {
      await store.createPraticienFormateur(payload)
    } else {
      await store.updatePraticienFormateur(form.value.id, payload)
    }
    editorVisible.value = false
  } catch (e) {
    console.error(e)
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

