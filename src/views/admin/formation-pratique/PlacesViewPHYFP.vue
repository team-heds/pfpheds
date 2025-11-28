<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Places</h1>
              <p class="text-600 m-0 mt-2">Gestion des places de formation pratique</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex align-items-center gap-2">
              <span class="text-600">Année</span>
              <Dropdown :options="years" v-model="selectedYear" class="w-8rem" />
            </div>
            <div class="flex align-items-center gap-2">
              <span class="text-600">Afficher</span>
              <Dropdown :options="rowsOptions" optionLabel="label" optionValue="value" v-model="rowsPerPage" class="w-10rem" :disabled="showAll" />
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="showAll" />
                <span class="text-600">Tout</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="showHalf" />
                <span class="text-600">Moitié</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="withPdfOnly" />
                <span class="text-600">Avec PDF</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="compact" />
                <span class="text-600">Compact</span>
              </div>
            </div>
            <span class="flex-1"></span>
            <div class="flex align-items-center gap-2">
              <Button icon="pi pi-eye" outlined @click="toggleColumnsPanel" v-tooltip.top="'Afficher/Masquer colonnes'" />
              <Button icon="pi pi-plus" label="Nouvelle place" @click="showCreateDialog = true" severity="success" />
              <InputText v-model="search" placeholder="Rechercher (nom, institution, canton)" class="search-input" />
              <Button icon="pi pi-refresh" outlined @click="reload" />
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de sélection des colonnes -->
      <OverlayPanel ref="columnsPanel" :style="{ width: '300px' }">
        <div class="p-3">
          <h3 class="text-lg font-semibold mb-3">Afficher les colonnes</h3>
          
          <div class="field-checkbox mb-2">
            <Checkbox v-model="showCriteresColumns" inputId="show-criteres" :binary="true" @change="toggleAllCriteres" />
            <label for="show-criteres" class="font-semibold">Critères (tous)</label>
          </div>
          
          <div class="ml-4 mb-3">
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.MSQ" inputId="col-msq" :binary="true" />
              <label for="col-msq">MSQ</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.SYSINT" inputId="col-sysint" :binary="true" />
              <label for="col-sysint">SYSINT</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.NEUROGER" inputId="col-neuroger" :binary="true" />
              <label for="col-neuroger">NEUROGER</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.AIGU" inputId="col-aigu" :binary="true" />
              <label for="col-aigu">AIGU</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.REHAB" inputId="col-rehab" :binary="true" />
              <label for="col-rehab">REHAB</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.AMBU" inputId="col-ambu" :binary="true" />
              <label for="col-ambu">AMBU</label>
            </div>
          </div>
          
          <div class="field-checkbox mb-2">
            <Checkbox v-model="showLanguesColumns" inputId="show-langues" :binary="true" @change="toggleAllLangues" />
            <label for="show-langues" class="font-semibold">Langues (toutes)</label>
          </div>
          
          <div class="ml-4">
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.FR" inputId="col-fr" :binary="true" />
              <label for="col-fr">FR</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.DE" inputId="col-de" :binary="true" />
              <label for="col-de">DE</label>
            </div>
          </div>
        </div>
      </OverlayPanel>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <div class="text-600 mb-2">{{ rows.length }} résultat(s)</div>
        <DataTable
          :value="rows"
          :loading="loading"
          dataKey="PlaceId"
          :paginator="!showAll"
          :rows="rowsPerPage"
          :rowsPerPageOptions="rawRowsPerPageOptions"
          :rowHover="true"
          :scrollable="true"
          scrollHeight="68vh"
          :resizableColumns="true"
          columnResizeMode="fit"
          :reorderableColumns="true"
          :class="[{ 'table-compact': compact }]"
        >
          <template #empty>
            <div class="text-center p-4 text-600">Aucune place trouvée</div>
          </template>
          <Column header="Nom" sortable>
            <template #body="{ data }">
              <InputText :value="data.NomPlace || ''" @change="e => onChangeSimple(data, 'NomPlace', e.target.value)" />
            </template>
          </Column>
          <Column header="Institution Name" sortable>
            <template #body="{ data }">{{ institutionNameById[data.InstitutionId] || data.InstitutionName || '-' }}</template>
          </Column>
          <Column header="MSQ" v-if="visibleColumns.MSQ">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.MSQ" @update:modelValue="v => onChangeBool(data, 'MSQ', v)" />
            </template>
          </Column>
          <Column header="SYSINT" v-if="visibleColumns.SYSINT">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.SYSINT" @update:modelValue="v => onChangeBool(data, 'SYSINT', v)" />
            </template>
          </Column>
          <Column header="NEUROGER" v-if="visibleColumns.NEUROGER">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.NEUROGER" @update:modelValue="v => onChangeBool(data, 'NEUROGER', v)" />
            </template>
          </Column>
          <Column header="AIGU" v-if="visibleColumns.AIGU">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.AIGU" @update:modelValue="v => onChangeBool(data, 'AIGU', v)" />
            </template>
          </Column>
          <Column header="REHAB" v-if="visibleColumns.REHAB">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.REHAB" @update:modelValue="v => onChangeBool(data, 'REHAB', v)" />
            </template>
          </Column>
          <Column header="AMBU" v-if="visibleColumns.AMBU">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.AMBU" @update:modelValue="v => onChangeBool(data, 'AMBU', v)" />
            </template>
          </Column>
          <Column header="FR" v-if="visibleColumns.FR">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.FR" @update:modelValue="v => onChangeBool(data, 'FR', v)" />
            </template>
          </Column>
          <Column header="DE" v-if="visibleColumns.DE">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.DE" @update:modelValue="v => onChangeBool(data, 'DE', v)" />
            </template>
          </Column>
          <Column header="PFP2">
            <template #body="{ data }">
              <InputText :value="(data.PFP2 && data.PFP2[selectedYear]) || ''" @change="e => onChangePFP(data, 'PFP2', e.target.value)" class="p-inputtext-sm" />
            </template>
          </Column>
          <Column header="PFP1A">
            <template #body="{ data }">
              <InputText :value="(data.PFP1A && data.PFP1A[selectedYear]) || ''" @change="e => onChangePFP(data, 'PFP1A', e.target.value)" class="p-inputtext-sm" />
            </template>
          </Column>
          <Column header="PFP1B">
            <template #body="{ data }">
              <InputText :value="(data.PFP1B && data.PFP1B[selectedYear]) || ''" @change="e => onChangePFP(data, 'PFP1B', e.target.value)" class="p-inputtext-sm" />
            </template>
          </Column>
          <Column header="PFP4">
            <template #body="{ data }">
              <InputText :value="(data.PFP4 && data.PFP4[selectedYear]) || ''" @change="e => onChangePFP(data, 'PFP4', e.target.value)" class="p-inputtext-sm" />
            </template>
          </Column>
          <Column header="PFP3">
            <template #body="{ data }">
              <InputText :value="(data.PFP3 && data.PFP3[selectedYear]) || ''" @change="e => onChangePFP(data, 'PFP3', e.target.value)" class="p-inputtext-sm" />
            </template>
          </Column>
          <Column header="Canton" sortable>
            <template #body="{ data }">
              {{ institutionCantonById[data.InstitutionId] || data.Canton || '-' }}
            </template>
          </Column>
          <Column header="Critères">
            <template #body="{ data }">
              <div class="flex gap-2 flex-wrap">
                <Tag v-if="data.MSQ" value="MSQ" />
                <Tag v-if="data.SYSINT" value="SYSINT" />
                <Tag v-if="data.AIGU" value="AIGU" />
                <Tag v-if="data.REHAB" value="REHAB" />
                <Tag v-if="data.AMBU" value="AMBU" />
                <Tag v-if="data.NEUROGER" value="NEUROGER" />
              </div>
            </template>
          </Column>
          <Column header="Langues">
            <template #body="{ data }">
              <div class="flex gap-2 flex-wrap">
                <Tag v-if="data.FR" value="FR" />
                <Tag v-if="data.DE" value="DE" />
                <Tag v-if="data.IT" value="IT" />
                <Tag v-if="data.ENG" value="EN" />
              </div>
            </template>
          </Column>
          <Column header="Praticien Formateur">
            <template #body="{ data }">
              <MultiSelect :modelValue="data.praticiensFormateurs || []" @update:modelValue="v => onChangeArray(data, 'praticiensFormateurs', v)" :options="praticiensOptions" optionLabel="label" optionValue="id" display="chip" class="w-full md:w-14rem" />
            </template>
          </Column>
          <Column header="Remarques">
            <template #body="{ data }">
              <Textarea :value="(data.Remarques && (data.Remarques[selectedYear] || data.Remarques['note'] || '')) || ''" @change="e => onChangeRemarques(data, e.target.value)" rows="2" class="w-full" />
            </template>
          </Column>
          <Column header="Fiche">
            <template #body="{ data }">
              <a v-if="data.fileURL" :href="data.fileURL" target="_blank" class="text-primary">PDF</a>
              <span v-else>-</span>
            </template>
          </Column>
          <Column header="Actions"  alignFrozen="right">
            <template #body="{ data }">
              <Button 
                icon="pi pi-trash" 
                severity="danger" 
                text 
                rounded 
                @click="confirmDelete(data)"
                v-tooltip.top="'Supprimer la place'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog de création de place -->
    <CreatePlaceDialog
      v-model:visible="showCreateDialog"
      :selected-year="selectedYear"
      @created="onPlaceCreated"
    />

    <!-- Dialog de confirmation de suppression -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Confirmer la suppression"
      :style="{ width: '450px' }"
    >
      <div class="flex align-items-center gap-3 mb-3">
        <i class="pi pi-exclamation-triangle text-orange-500" style="font-size: 2rem"></i>
        <div>
          <p class="m-0 font-semibold">Êtes-vous sûr de vouloir supprimer cette place ?</p>
          <p class="m-0 mt-2 text-600" v-if="placeToDelete">
            <strong>{{ placeToDelete.NomPlace }}</strong>
            <span v-if="placeToDelete.InstitutionName"> - {{ placeToDelete.InstitutionName }}</span>
          </p>
        </div>
      </div>
      
      <div class="surface-card p-3 border-round mb-3" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3);">
        <p class="m-0 text-sm">
          <i class="pi pi-info-circle mr-2"></i>
          Cette action est <strong>irréversible</strong>. Toutes les données associées à cette place seront définitivement supprimées.
        </p>
      </div>

      <template #footer>
        <Button 
          label="Annuler" 
          icon="pi pi-times" 
          text 
          @click="showDeleteDialog = false" 
        />
        <Button 
          label="Supprimer" 
          icon="pi pi-trash" 
          severity="danger" 
          @click="deletePlace" 
          :loading="deleting"
        />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import InputSwitch from 'primevue/inputswitch'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import { usePraticiensFormateursStore } from '@/stores/praticiensFormateursStore'
import Dropdown from 'primevue/dropdown'
import { checkSupabaseAuth } from '@/utils/checkAuth'
import CreatePlaceDialog from '@/components/admin/places/CreatePlaceDialog.vue'
import Dialog from 'primevue/dialog'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'

const store = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const praticiensStore = usePraticiensFormateursStore()
const loading = computed(() => store.loading)
const search = ref('')
const years = ref(['2026','2027','2025'])
const selectedYear = ref('2026')
const institutionNameById = computed(() => {
  const m = {}
  for (const inst of institutionsStore.institutions || []) {
    if (inst?.InstitutionId) m[inst.InstitutionId] = inst?.Name || ''
  }
  return m
})

// Récupérer le Canton depuis l'institution
const institutionCantonById = computed(() => {
  const m = {}
  for (const inst of institutionsStore.institutions || []) {
    if (inst?.InstitutionId) m[inst.InstitutionId] = inst?.Canton || ''
  }
  return m
})

const rows = computed(() => {
  const s = (search.value || '').trim().toLowerCase()
  let list = [...(store.places || [])]
  if (s) {
    list = list.filter(p => {
      const institutionName = p.InstitutionName || institutionNameById.value[p.InstitutionId] || ''
      const canton = institutionCantonById.value[p.InstitutionId] || p.Canton || ''
      return (
        (p.NomPlace || '').toLowerCase().includes(s) ||
        institutionName.toLowerCase().includes(s) ||
        canton.toLowerCase().includes(s)
      )
    })
  }
  if (withPdfOnly.value) list = list.filter(p => !!p.fileURL)
  if (showHalf.value) list = list.slice(0, Math.ceil(list.length / 2))
  return list
})

const praticiensOptions = computed(() => {
  return (praticiensStore.praticiensFormateurs || []).map(p => ({
    id: p.id,
    label: `${p.prenom || ''} ${p.nom || ''}`.trim() || p.mail || p.id,
  }))
})

// UI/UX controls
const rowsOptions = ref([
  { label: '15 par page', value: 15 },
  { label: '30 par page', value: 30 },
  { label: '50 par page', value: 50 },
  { label: '100 par page', value: 100 },
])
const rawRowsPerPageOptions = computed(() => rowsOptions.value.map(o => o.value))
const rowsPerPage = ref(15)
const showAll = ref(false)
const showHalf = ref(false)
const withPdfOnly = ref(false)
const compact = ref(false)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const placeToDelete = ref(null)
const deleting = ref(false)
const columnsPanel = ref(null)

// Visibilité des colonnes
const visibleColumns = ref({
  MSQ: false,
  SYSINT: false,
  NEUROGER: false,
  AIGU: false,
  REHAB: false,
  AMBU: false,
  FR: false,
  DE: false
})

// Computed pour les checkboxes "tous"
const showCriteresColumns = computed({
  get: () => visibleColumns.value.MSQ && visibleColumns.value.SYSINT && 
             visibleColumns.value.NEUROGER && visibleColumns.value.AIGU && 
             visibleColumns.value.REHAB && visibleColumns.value.AMBU,
  set: (val) => {
    visibleColumns.value.MSQ = val
    visibleColumns.value.SYSINT = val
    visibleColumns.value.NEUROGER = val
    visibleColumns.value.AIGU = val
    visibleColumns.value.REHAB = val
    visibleColumns.value.AMBU = val
  }
})

const showLanguesColumns = computed({
  get: () => visibleColumns.value.FR && visibleColumns.value.DE,
  set: (val) => {
    visibleColumns.value.FR = val
    visibleColumns.value.DE = val
  }
})

async function onChangeSimple(row, field, value) {
  if (!row?.PlaceId) return
  const ok = window.confirm(`Modifier ${field} ?`)
  if (!ok) return
  await store.updatePlace(row.PlaceId, { [field]: value })
}

async function onChangeBool(row, field, value) {
  if (!row?.PlaceId) return
  console.log('📝 Modification Bool:', { field, value, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: !!value })
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Bool:', error)
    alert('Erreur lors de la sauvegarde')
  }
}

async function onChangePFP(row, field, vYear) {
  if (!row?.PlaceId) return
  const current = row[field] || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(vYear ?? '') }
  console.log('📝 Modification PFP:', { field, yr, current, updates, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: updates })
    // Recharger la place pour s'assurer d'avoir les dernières données
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification PFP:', error)
    alert('Erreur lors de la sauvegarde')
  }
}

async function onChangeRemarques(row, text) {
  if (!row?.PlaceId) return
  const current = row.Remarques || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(text || '') }
  console.log('📝 Modification Remarques:', { yr, current, updates, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { Remarques: updates })
    // Recharger la place pour s'assurer d'avoir les dernières données
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Remarques:', error)
    alert('Erreur lors de la sauvegarde')
  }
}

async function onChangeArray(row, field, arr) {
  if (!row?.PlaceId) return
  const value = Array.isArray(arr) ? arr : []
  console.log('📝 Modification Array:', { field, value, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: value })
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Array:', error)
    alert('Erreur lors de la sauvegarde')
  }
}

function reload() {
  store.fetchPlaces()
}

function onPlaceCreated(place) {
  console.log('✅ Nouvelle place créée:', place)
  // Recharger la liste des places
  reload()
}

function toggleColumnsPanel(event) {
  columnsPanel.value.toggle(event)
}

function toggleAllCriteres() {
  // Géré par le computed
}

function toggleAllLangues() {
  // Géré par le computed
}

function confirmDelete(place) {
  placeToDelete.value = place
  showDeleteDialog.value = true
  console.log('🗑️ Demande de suppression:', place.PlaceId, place.NomPlace)
}

async function deletePlace() {
  if (!placeToDelete.value?.PlaceId) return
  
  deleting.value = true
  
  try {
    console.log('🗑️ Suppression de la place:', placeToDelete.value.PlaceId)
    await store.deletePlace(placeToDelete.value.PlaceId)
    console.log('✅ Place supprimée avec succès')
    
    // Fermer le dialog
    showDeleteDialog.value = false
    placeToDelete.value = null
    
    // Recharger la liste
    reload()
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    alert('Erreur lors de la suppression de la place: ' + error.message)
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  // Vérifier l'authentification Supabase au chargement
  await checkSupabaseAuth()
  
  if (!store.places?.length) store.fetchPlaces()
  if (!institutionsStore.institutions?.length) institutionsStore.fetchInstitutions()
  if (!praticiensStore.praticiensFormateurs?.length) praticiensStore.fetchPraticiensFormateurs()
})

watch(search, () => { /* filtering is computed */ })
watch(selectedYear, () => {
  // Optionnel: recharger si vous souhaitez recalculer côté backend
  reload()
})
</script>

<style scoped>
.search-input {
  min-width: 320px;
}
.fp-dark {
  background: #0f1f33; /* navy */
  border: 1px solid rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-datatable) {
  background: transparent;
  color: #e5e7eb;
}
.fp-dark :deep(.p-datatable-thead > tr > th) {
  background: rgba(255,255,255,0.03);
  color: #cbd5e1;
  border-color: rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-datatable-tbody > tr > td) {
  background: transparent;
  color: #e5e7eb;
  border-color: rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-paginator) {
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-inputtext),
.fp-dark :deep(textarea) {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f8fafc;
}
.fp-dark :deep(.p-inputtext::placeholder),
.fp-dark :deep(textarea::placeholder) { color: #cbd5e1; }
.fp-dark :deep(.p-multiselect) {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f8fafc;
}
.table-compact :deep(.p-datatable-thead > tr > th),
.table-compact :deep(.p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.table-compact :deep(.p-inputtext),
.table-compact :deep(.p-inputswitch),
.table-compact :deep(.p-multiselect),
.table-compact :deep(textarea) {
  font-size: 0.85rem;
}
.table-compact :deep(.p-inputtext),
.table-compact :deep(textarea) {
  padding: 0.25rem 0.5rem;
}
.table-compact :deep(.p-multiselect .p-multiselect-label) {
  padding: 0.25rem 0.5rem;
}
.table-compact :deep(.p-tag) {
  padding: 0.1rem 0.4rem;
}
.surface-card {
  border: 1px solid var(--surface-border);
}
@media (max-width: 768px) {
  .search-input { min-width: 180px; width: 100%; }
}

/* Styles pour le panel de sélection de colonnes */
.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox label {
  cursor: pointer;
  user-select: none;
}
</style>

