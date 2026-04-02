<template>
  <AdminLayout>
    <div class="suivi-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary">Secrétariat</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Suivi Institutions</span>
      </div>

      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-building text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Suivi Institutions</h1>
              <p class="text-600 m-0 mt-1">Gestion des conventions, dates et signatures des accords cadres</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Nom ou localité..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Canton :</label>
              <Dropdown
                v-model="filterCanton"
                :options="cantonOptions"
                placeholder="Tous"
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut docs :</label>
              <Dropdown
                v-model="filterStatus"
                :options="statusFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous"
                class="w-full md:w-12rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export CSV" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchInstitutions" v-tooltip="'Rafraîchir'" :loading="loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-building text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Institutions</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.withConvention }}</h3>
                <p class="text-600 m-0">Avec Convention</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-file text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.withAccord }}</h3>
                <p class="text-600 m-0">Avec Accord Cadre</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.missingDocs }}</h3>
                <p class="text-600 m-0">Documents Manquants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          ref="dt"
          :value="filteredInstitutions"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :rowHover="true"
          dataKey="InstitutionId"
          scrollable
          scrollHeight="flex"
          class="suivi-table p-datatable-sm"
          :sortField="'Name'"
          :sortOrder="1"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Institutions ({{ filteredInstitutions.length }})</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune institution trouvée</p>
            </div>
          </template>

          <Column field="Name" header="Institution" sortable style="min-width: 14rem">
            <template #body="{ data }">
              <div class="flex flex-column">
                <span class="font-semibold text-900">{{ data.Name || '-' }}</span>
                <span class="text-sm text-500" v-if="data.Category">{{ data.Category }}</span>
              </div>
            </template>
          </Column>
          <Column field="Locality" header="Localité" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-map-marker text-500 text-sm"></i>
                <span>{{ data.Locality || '-' }}</span>
              </div>
            </template>
          </Column>
          <Column field="Canton" header="Canton" sortable style="min-width: 5rem">
            <template #body="{ data }">
              <Tag v-if="data.Canton" :value="data.Canton" severity="info" class="text-xs" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="ConventionDate" header="Convention" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div v-if="!editingRow || editingRow.InstitutionId !== data.InstitutionId">
                <span v-if="data.ConventionDate" class="flex align-items-center gap-2">
                  <i class="pi pi-calendar text-green-500 text-sm"></i>
                  <span>{{ formatDate(data.ConventionDate) }}</span>
                </span>
                <Tag v-else value="Manquante" severity="warning" class="text-xs" />
              </div>
              <Calendar
                v-else
                v-model="editingRow.ConventionDate"
                dateFormat="dd-mm-yy"
                :showIcon="true"
                :showButtonBar="true"
                placeholder="Sélectionner..."
                class="w-full"
              />
            </template>
          </Column>
          <Column field="AccordCadreDate" header="Accord Cadre" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div v-if="!editingRow || editingRow.InstitutionId !== data.InstitutionId">
                <span v-if="data.AccordCadreDate" class="flex align-items-center gap-2">
                  <i class="pi pi-file text-purple-500 text-sm"></i>
                  <span>{{ formatDate(data.AccordCadreDate) }}</span>
                </span>
                <Tag v-else value="Manquant" severity="warning" class="text-xs" />
              </div>
              <Calendar
                v-else
                v-model="editingRow.AccordCadreDate"
                dateFormat="dd-mm-yy"
                :showIcon="true"
                :showButtonBar="true"
                placeholder="Sélectionner..."
                class="w-full"
              />
            </template>
          </Column>
          <Column header="Statut" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag
                :value="getDocStatus(data).label"
                :severity="getDocStatus(data).severity"
                :icon="getDocStatus(data).icon"
                class="text-xs"
              />
            </template>
          </Column>
          <Column header="Actions" :exportable="false" style="min-width: 7rem">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-if="!editingRow || editingRow.InstitutionId !== data.InstitutionId"
                  icon="pi pi-pencil"
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="startEditing(data)"
                  v-tooltip.top="'Éditer les dates'"
                />
                <template v-else>
                  <Button
                    icon="pi pi-check"
                    class="p-button-rounded p-button-text p-button-success p-button-sm"
                    @click="saveEdit()"
                    v-tooltip.top="'Sauvegarder'"
                  />
                  <Button
                    icon="pi pi-times"
                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    @click="cancelEdit()"
                    v-tooltip.top="'Annuler'"
                  />
                </template>
                <Button
                  v-if="data.MailChef"
                  icon="pi pi-envelope"
                  class="p-button-rounded p-button-text p-button-sm"
                  @click="copyToClipboard(data.MailChef)"
                  v-tooltip.top="data.MailChef"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Toast from 'primevue/toast'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

const dt = ref(null)
const loading = ref(false)
const institutions = ref([])
const editingRow = ref(null)
const originalRow = ref(null)
const searchQuery = ref('')
const filterCanton = ref(null)
const filterStatus = ref(null)
const toast = useToast()

const statusFilterOptions = [
  { label: 'Complet (Conv. + Accord)', value: 'complete' },
  { label: 'Convention manquante', value: 'no-convention' },
  { label: 'Accord cadre manquant', value: 'no-accord' },
  { label: 'Aucun document', value: 'none' }
]

const cantonOptions = computed(() => {
  const cantons = institutions.value
    .map(i => i.Canton)
    .filter(Boolean)
  return [...new Set(cantons)].sort()
})

const stats = computed(() => {
  const all = institutions.value
  const total = all.length
  const withConvention = all.filter(i => i.ConventionDate).length
  const withAccord = all.filter(i => i.AccordCadreDate).length
  const missingDocs = all.filter(i => !i.ConventionDate || !i.AccordCadreDate).length
  return { total, withConvention, withAccord, missingDocs }
})

const filteredInstitutions = computed(() => {
  let list = [...institutions.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(i =>
      i.Name?.toLowerCase().includes(q) ||
      i.Locality?.toLowerCase().includes(q) ||
      i.NomChef?.toLowerCase().includes(q)
    )
  }

  if (filterCanton.value) {
    list = list.filter(i => i.Canton === filterCanton.value)
  }

  if (filterStatus.value) {
    switch (filterStatus.value) {
      case 'complete':
        list = list.filter(i => i.ConventionDate && i.AccordCadreDate)
        break
      case 'no-convention':
        list = list.filter(i => !i.ConventionDate)
        break
      case 'no-accord':
        list = list.filter(i => !i.AccordCadreDate)
        break
      case 'none':
        list = list.filter(i => !i.ConventionDate && !i.AccordCadreDate)
        break
    }
  }

  return list
})

const parseDateLocal = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

const formatDate = (date) => {
  if (!date) return '-'
  if (typeof date === 'string') {
    const d = parseDateLocal(date)
    return d ? d.toLocaleDateString('fr-CH') : '-'
  }
  return new Date(date).toLocaleDateString('fr-CH')
}

const formatDateForDB = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDocStatus = (institution) => {
  const hasConv = !!institution.ConventionDate
  const hasAccord = !!institution.AccordCadreDate
  if (hasConv && hasAccord) return { label: 'Complet', severity: 'success', icon: 'pi pi-check' }
  if (hasConv || hasAccord) return { label: 'Partiel', severity: 'warning', icon: 'pi pi-exclamation-triangle' }
  return { label: 'Aucun', severity: 'danger', icon: 'pi pi-times' }
}

const startEditing = (institution) => {
  editingRow.value = {
    ...institution,
    ConventionDate: parseDateLocal(institution.ConventionDate),
    AccordCadreDate: parseDateLocal(institution.AccordCadreDate)
  }
  originalRow.value = { ...institution }
}

const cancelEdit = () => {
  editingRow.value = null
  originalRow.value = null
}

const saveEdit = async () => {
  if (!editingRow.value) return

  try {
    const { error } = await supabase
      .from('institutions')
      .update({
        ConventionDate: formatDateForDB(editingRow.value.ConventionDate),
        AccordCadreDate: formatDateForDB(editingRow.value.AccordCadreDate),
        UpdatedAt: new Date().toISOString()
      })
      .eq('InstitutionId', editingRow.value.InstitutionId)

    if (error) throw error

    // Update local data with formatted date strings (not Date objects)
    const index = institutions.value.findIndex(i => i.InstitutionId === editingRow.value.InstitutionId)
    if (index !== -1) {
      institutions.value[index] = {
        ...editingRow.value,
        ConventionDate: formatDateForDB(editingRow.value.ConventionDate),
        AccordCadreDate: formatDateForDB(editingRow.value.AccordCadreDate)
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Les dates ont été mises à jour',
      life: 3000
    })

    editingRow.value = null
    originalRow.value = null
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder les modifications',
      life: 3000
    })
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ severity: 'info', summary: 'Copié', detail: `${text} copié dans le presse-papier`, life: 2000 })
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
  }
}

const exportCSV = () => {
  const headers = ['Institution', 'Localité', 'Canton', 'Convention', 'Accord Cadre', 'Statut', 'Responsable', 'Email']
  const rows = filteredInstitutions.value.map(i => [
    i.Name || '',
    i.Locality || '',
    i.Canton || '',
    formatDate(i.ConventionDate),
    formatDate(i.AccordCadreDate),
    getDocStatus(i).label,
    i.NomChef || '',
    i.MailChef || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `suivi-institutions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const fetchInstitutions = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('InstitutionId, Name, Locality, Canton, Category, ConventionDate, AccordCadreDate, IdResponsablePhysio, NomChef, MailChef')
      .order('Name')

    if (error) throw error

    institutions.value = data || []
  } catch (e) {
    console.error('Erreur fetchInstitutions:', e)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les institutions',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInstitutions()
})
</script>

<style scoped>
.suivi-page {
  min-height: calc(100vh - 100px);
}

.suivi-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
}

.suivi-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem;
  vertical-align: middle;
}

.suivi-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.suivi-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}
</style>
