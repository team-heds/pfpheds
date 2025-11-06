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
              <InputText v-model="search" placeholder="Rechercher (nom, institution, canton)" class="search-input" />
              <Button icon="pi pi-refresh" outlined @click="reload" />
            </div>
          </div>
        </div>
      </div>

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
          <Column header="MSQ">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.MSQ" @update:modelValue="v => onChangeBool(data, 'MSQ', v)" />
            </template>
          </Column>
          <Column header="SYSINT">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.SYSINT" @update:modelValue="v => onChangeBool(data, 'SYSINT', v)" />
            </template>
          </Column>
          <Column header="NEUROGER">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.NEUROGER" @update:modelValue="v => onChangeBool(data, 'NEUROGER', v)" />
            </template>
          </Column>
          <Column header="AIGU">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.AIGU" @update:modelValue="v => onChangeBool(data, 'AIGU', v)" />
            </template>
          </Column>
          <Column header="REHAB">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.REHAB" @update:modelValue="v => onChangeBool(data, 'REHAB', v)" />
            </template>
          </Column>
          <Column header="AMBU">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.AMBU" @update:modelValue="v => onChangeBool(data, 'AMBU', v)" />
            </template>
          </Column>
          <Column header="FR">
            <template #body="{ data }">
              <InputSwitch :modelValue="!!data.FR" @update:modelValue="v => onChangeBool(data, 'FR', v)" />
            </template>
          </Column>
          <Column header="DE">
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
          <Column field="Canton" header="Canton" sortable></Column>
          <Column header="Spécialités">
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
        </DataTable>
      </div>
    </div>
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

const store = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const praticiensStore = usePraticiensFormateursStore()
const loading = computed(() => store.loading)
const search = ref('')
const years = ref(['2025','2026'])
const selectedYear = ref('2025')
const institutionNameById = computed(() => {
  const m = {}
  for (const inst of institutionsStore.institutions || []) {
    if (inst?.InstitutionId) m[inst.InstitutionId] = inst?.Name || ''
  }
  return m
})
const rows = computed(() => {
  const s = (search.value || '').trim().toLowerCase()
  let list = [...(store.places || [])]
  if (s) {
    list = list.filter(p => (
      (p.NomPlace || '').toLowerCase().includes(s) ||
      (p.InstitutionName || institutionNameById.value[p.InstitutionId] || '').toLowerCase().includes(s) ||
      (p.Canton || '').toLowerCase().includes(s)
    ))
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

async function onChangeSimple(row, field, value) {
  if (!row?.PlaceId) return
  const ok = window.confirm(`Modifier ${field} ?`)
  if (!ok) return
  await store.updatePlace(row.PlaceId, { [field]: value })
}

async function onChangeBool(row, field, value) {
  if (!row?.PlaceId) return
  await store.updatePlace(row.PlaceId, { [field]: !!value })
}

async function onChangePFP(row, field, vYear) {
  if (!row?.PlaceId) return
  const current = row[field] || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(vYear ?? '') }
  await store.updatePlace(row.PlaceId, { [field]: updates })
}

async function onChangeRemarques(row, text) {
  if (!row?.PlaceId) return
  const current = row.Remarques || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(text || '') }
  await store.updatePlace(row.PlaceId, { Remarques: updates })
}

async function onChangeArray(row, field, arr) {
  if (!row?.PlaceId) return
  const value = Array.isArray(arr) ? arr : []
  await store.updatePlace(row.PlaceId, { [field]: value })
}

function reload() {
  store.fetchPlaces()
}

onMounted(() => {
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
</style>

