<template>
  <AdminLayout>
    <div class="cas-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">Secrétariat</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Suivi Cas Particuliers</span>
      </div>

      <!-- Header -->
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-exclamation-triangle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Suivi Cas Particuliers</h1>
              <p class="text-600 m-0 mt-1">Cliquez sur chaque cellule PFP pour ajouter commentaire et couleur</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchTerm" placeholder="Nom ou prénom..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown
                v-model="filterClasse"
                :options="classesList"
                placeholder="Toutes"
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Couleur :</label>
              <Dropdown
                v-model="filterColor"
                :options="colorFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Toutes"
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Affichage :</label>
              <Dropdown
                v-model="filterDisplay"
                :options="displayOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full md:w-12rem"
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchCases" v-tooltip="'Rafraîchir'" :loading="loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Étudiants</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-flag text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.withComments }}</h3>
                <p class="text-600 m-0">Avec suivi</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-exclamation-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.redCount }}</h3>
                <p class="text-600 m-0">Alertes rouges</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.greenCount }}</h3>
                <p class="text-600 m-0">Cas résolus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Légende couleurs -->
      <div class="flex gap-2 align-items-center mb-3 px-1">
        <span class="text-sm text-600 font-semibold">Légende :</span>
        <span class="legend-dot legend-vert"></span><span class="text-xs text-600">Vert</span>
        <span class="legend-dot legend-orange"></span><span class="text-xs text-600">Orange</span>
        <span class="legend-dot legend-rouge"></span><span class="text-xs text-600">Rouge</span>
        <span class="legend-dot legend-noir"></span><span class="text-xs text-600">Noir</span>
        <span class="legend-dot legend-blanc"></span><span class="text-xs text-600">Blanc</span>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredCases"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="50"
          :rowsPerPageOptions="[20, 50, 100]"
          :rowHover="true"
          dataKey="user_id"
          scrollable
          scrollHeight="flex"
          class="cas-table p-datatable-sm"
          :sortField="'etudiant'"
          :sortOrder="1"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Cas Particuliers ({{ filteredCases.length }})</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun cas trouvé</p>
            </div>
          </template>

          <Column field="etudiant" header="Étudiant" :frozen="true" sortable style="min-width: 180px">
            <template #body="{ data }">
              <span class="font-semibold text-900">{{ data.etudiant }}</span>
            </template>
          </Column>
          <Column field="classe" header="Classe" sortable style="min-width: 80px">
            <template #body="{ data }">
              <Tag :value="data.classe" severity="info" class="text-xs" />
            </template>
          </Column>
          <Column header="Info" style="min-width: 130px">
            <template #body="{ data }">
              <div
                @click="openInfoDialog(data)"
                :class="['cell-box', 'cell-info', { 'cell-has-content': data.info_etudiant?.commentaire }]"
                :title="data.info_etudiant?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="data.info_etudiant?.commentaire" class="cell-text">
                  {{ truncate(data.info_etudiant.commentaire, 14) }}
                </div>
                <i v-else class="pi pi-plus text-400 text-xs"></i>
              </div>
            </template>
          </Column>
          <template v-for="group in pfpGroups" :key="group.base">
            <Column :header="group.label" style="min-width: 90px">
              <template #body="{ data }">
                <div
                  @click="openCellDialog(data, group.base)"
                  :style="getCellStyle(data[group.base])"
                  class="cell-box"
                  :title="data[group.base]?.commentaire || 'Cliquez pour éditer'"
                >
                  <div v-if="data[group.base]?.commentaire" class="cell-text">
                    {{ truncate(data[group.base].commentaire, 10) }}
                  </div>
                  <i v-else class="pi pi-minus text-400 text-xs"></i>
                </div>
              </template>
            </Column>
            <Column :header="group.label + '\''" style="min-width: 90px">
              <template #body="{ data }">
                <div v-if="hasEchec(data.user_id, group.echecTypes)"
                  @click="openCellDialog(data, group.prime)"
                  :style="getCellStyle(data[group.prime])"
                  class="cell-box"
                  :title="data[group.prime]?.commentaire || 'Cliquez pour éditer'"
                >
                  <div v-if="data[group.prime]?.commentaire" class="cell-text">
                    {{ truncate(data[group.prime].commentaire, 10) }}
                  </div>
                  <i v-else class="pi pi-minus text-400 text-xs"></i>
                </div>
                <div v-else class="cell-box cell-disabled" title="PFP non échouée">
                  <i class="pi pi-lock text-300 text-xs"></i>
                </div>
              </template>
            </Column>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Dialog pour éditer une cellule PFP -->
    <Dialog v-model:visible="showCellDialog" :header="dialogTitle" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-column gap-3 p-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Couleur :</label>
          <div class="flex gap-2 flex-wrap">
            <Button
              v-for="color in colorOptions"
              :key="color.value"
              :label="color.label"
              :class="{ 'p-button-outlined': editingCell?.couleur !== color.value }"
              :severity="color.severity"
              @click="editingCell.couleur = color.value"
              size="small"
            />
          </div>
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Commentaire :</label>
          <Textarea
            v-model="editingCell.commentaire"
            rows="5"
            class="w-full"
            placeholder="Ajoutez un commentaire..."
          />
        </div>
        <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Annuler" severity="secondary" @click="closeCellDialog" />
          <Button label="Enregistrer" @click="saveCellData" />
        </div>
      </div>
    </Dialog>

    <!-- Dialog pour éditer les infos étudiant -->
    <Dialog v-model:visible="showInfoDialog" :header="infoDialogTitle" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-column gap-3 p-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Commentaire sur l'étudiant :</label>
          <Textarea
            v-model="editingInfo.commentaire"
            rows="6"
            class="w-full"
            placeholder="Ajoutez des informations sur cet étudiant..."
          />
        </div>
        <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Annuler" severity="secondary" @click="closeInfoDialog" />
          <Button label="Enregistrer" @click="saveInfoData" />
        </div>
      </div>
    </Dialog>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const loading = ref(false)
const cases = ref([])
const filterDisplay = ref('with_comments')
const filterClasse = ref(null)
const filterColor = ref(null)
const searchTerm = ref('')
const classesList = ref(['BA24', 'BA25', 'BA26', 'MA27'])

const showCellDialog = ref(false)
const showInfoDialog = ref(false)
const editingCell = ref(null)
const editingInfo = ref(null)
const editingStudent = ref(null)
const editingField = ref(null)
const dialogTitle = ref('')
const infoDialogTitle = ref('')

const pfpFields = ['pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime']

const pfpGroups = [
  { base: 'pfp1', prime: 'pfp1_prime', label: 'PFP1', echecTypes: ['PFP1A', 'PFP1B'] },
  { base: 'pfp2', prime: 'pfp2_prime', label: 'PFP2', echecTypes: ['PFP2'] },
  { base: 'pfp3', prime: 'pfp3_prime', label: 'PFP3', echecTypes: ['PFP3'] },
  { base: 'pfp4', prime: 'pfp4_prime', label: 'PFP4', echecTypes: ['PFP4'] }
]

const fieldLabels = {
  'pfp1': 'PFP1',
  'pfp1_prime': "PFP1'",
  'pfp2': 'PFP2',
  'pfp2_prime': "PFP2'",
  'pfp3': 'PFP3',
  'pfp3_prime': "PFP3'",
  'pfp4': 'PFP4',
  'pfp4_prime': "PFP4'"
}

const echecMap = ref(new Map())

const hasEchec = (userId, echecTypes) => {
  const userEchecs = echecMap.value.get(userId)
  if (!userEchecs) return false
  return echecTypes.some(type => userEchecs.has(type))
}

const displayOptions = [
  { label: 'Tous les étudiants', value: 'all' },
  { label: 'Avec suivi', value: 'with_comments' },
  { label: 'Sans suivi', value: 'no_comments' }
]

const colorFilterOptions = [
  { label: 'Vert', value: 'vert' },
  { label: 'Orange', value: 'orange' },
  { label: 'Rouge', value: 'rouge' },
  { label: 'Noir', value: 'noir' }
]

const colorOptions = [
  { label: 'Blanc', value: 'blanc', severity: 'info' },
  { label: 'Vert', value: 'vert', severity: 'success' },
  { label: 'Orange', value: 'orange', severity: 'warning' },
  { label: 'Rouge', value: 'rouge', severity: 'danger' },
  { label: 'Noir', value: 'noir', severity: 'secondary' }
]

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '…' : text
}

const stats = computed(() => {
  const all = cases.value
  const total = all.length
  const withComments = all.filter(c => hasComments(c)).length
  const redCount = all.filter(c => pfpFields.some(f => c[f]?.couleur === 'rouge')).length
  const greenCount = all.filter(c => pfpFields.some(f => c[f]?.couleur === 'vert')).length
  return { total, withComments, redCount, greenCount }
})

const filteredCases = computed(() => {
  let list = [...cases.value]

  if (searchTerm.value && searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase().trim()
    list = list.filter(c => c.etudiant.toLowerCase().includes(q))
  }

  if (filterClasse.value) {
    list = list.filter(c => c.classe === filterClasse.value)
  }

  if (filterColor.value) {
    list = list.filter(c => pfpFields.some(f => c[f]?.couleur === filterColor.value))
  }

  if (filterDisplay.value === 'with_comments') {
    list = list.filter(c => hasComments(c))
  } else if (filterDisplay.value === 'no_comments') {
    list = list.filter(c => !hasComments(c))
  }

  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  list.sort((a, b) => collator.compare(a.etudiant, b.etudiant))

  return list
})

const hasComments = (student) => {
  return pfpFields.some(field => student[field]?.commentaire)
}

const getCellStyle = (cellData) => {
  if (!cellData || !cellData.couleur || cellData.couleur === 'blanc') {
    return { backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }
  }

  const colors = {
    'vert': { bg: '#28a745', text: '#ffffff' },
    'orange': { bg: '#fd7e14', text: '#ffffff' },
    'rouge': { bg: '#dc3545', text: '#ffffff' },
    'noir': { bg: '#343a40', text: '#ffffff' }
  }

  const c = colors[cellData.couleur]
  return {
    backgroundColor: c.bg,
    color: c.text,
    border: '1px solid ' + c.bg,
    fontWeight: '600'
  }
}

const openCellDialog = (student, field) => {
  editingStudent.value = student
  editingField.value = field

  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }

  editingCell.value = { ...student[field] }
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  showCellDialog.value = true
}

const closeCellDialog = () => {
  showCellDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
}

const openInfoDialog = (student) => {
  editingStudent.value = student

  if (!student.info_etudiant) {
    student.info_etudiant = { commentaire: '' }
  }

  editingInfo.value = { ...student.info_etudiant }
  infoDialogTitle.value = `Informations - ${student.etudiant}`
  showInfoDialog.value = true
}

const closeInfoDialog = () => {
  showInfoDialog.value = false
  editingInfo.value = null
  editingStudent.value = null
}

const saveInfoData = async () => {
  if (!editingStudent.value || !editingInfo.value) {
    closeInfoDialog()
    return
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: 'info_etudiant',
        couleur: 'blanc',
        commentaire: editingInfo.value.commentaire || null,
        visible: true
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) throw result.error

    editingStudent.value.info_etudiant = { ...editingInfo.value }
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Informations mises à jour', life: 2000 })
  } catch (e) {
    console.error('Erreur saveInfoData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }

  closeInfoDialog()
}

const getInfoStyle = (infoData) => {
  if (!infoData || !infoData.commentaire) return {}
  return {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    color: '#1565c0'
  }
}

const saveCellData = async () => {
  if (!editingStudent.value || !editingField.value || !editingCell.value) {
    closeCellDialog()
    return
  }

  const cellData = {
    couleur: editingCell.value.couleur || 'blanc',
    commentaire: editingCell.value.commentaire || ''
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: editingField.value,
        couleur: cellData.couleur,
        commentaire: cellData.commentaire || null,
        visible: editingStudent.value.visible
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) throw result.error

    editingStudent.value[editingField.value] = { ...cellData }
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Cellule mise à jour', life: 2000 })
  } catch (e) {
    console.error('Erreur saveCellData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }

  closeCellDialog()
}

const allColumns = pfpGroups.flatMap(g => [{ field: g.base, label: g.label }, { field: g.prime, label: g.label + "'" }])

const exportCSV = () => {
  const headers = ['Étudiant', 'Classe', 'Info', ...allColumns.map(p => p.label + ' Couleur'), ...allColumns.map(p => p.label + ' Commentaire')]
  const rows = filteredCases.value.map(c => [
    c.etudiant,
    c.classe,
    c.info_etudiant?.commentaire || '',
    ...allColumns.map(p => c[p.field]?.couleur || ''),
    ...allColumns.map(p => c[p.field]?.commentaire || '')
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `suivi-cas-particuliers-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const fetchCases = async () => {
  loading.value = true
  try {
    const [{ data: profiles, error: profilesError }, { data: suivis, error: suivisError }, { data: echecs, error: echecsError }] = await Promise.all([
      supabase.from('user_profiles').select('user_id, family_name, forname, classe').order('family_name'),
      supabase.from('suivi_cas_particuliers').select('*'),
      supabase.from('student_result_vote').select('user_id, pfp_type').eq('pfp_echec', true)
    ])

    if (profilesError) throw profilesError
    if (suivisError) throw suivisError
    if (echecsError) throw echecsError

    const newEchecMap = new Map()
    ;(echecs || []).forEach(e => {
      if (!newEchecMap.has(e.user_id)) {
        newEchecMap.set(e.user_id, new Set())
      }
      newEchecMap.get(e.user_id).add(e.pfp_type)
    })
    echecMap.value = newEchecMap

    const suivisMap = new Map()
    ;(suivis || []).forEach(s => {
      suivisMap.set(`${s.user_id}_${s.pfp_field}`, {
        couleur: s.couleur || 'blanc',
        commentaire: s.commentaire || ''
      })
    })

    const visibilityMap = new Map()
    ;(suivis || []).forEach(s => {
      if (!visibilityMap.has(s.user_id)) {
        visibilityMap.set(s.user_id, s.visible)
      }
    })

    cases.value = (profiles || []).map(p => {
      const studentData = {
        user_id: p.user_id,
        etudiant: `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim(),
        classe: p.classe || '-',
        visible: visibilityMap.get(p.user_id) !== false
      }

      pfpFields.forEach(field => {
        studentData[field] = suivisMap.get(`${p.user_id}_${field}`) || { couleur: 'blanc', commentaire: '' }
      })

      studentData.info_etudiant = suivisMap.get(`${p.user_id}_info_etudiant`) || { commentaire: '' }
      return studentData
    })
  } catch (e) {
    console.error('Erreur fetchCases:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCases()
})
</script>

<style scoped>
.cas-page {
  min-height: 100%;
}

.cas-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
}

.cas-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.35rem 0.25rem;
  vertical-align: middle;
}

.cas-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.cas-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

.cell-box {
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  text-align: center;
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  transition: all 0.2s ease;
}

.cell-box:hover {
  opacity: 0.85;
  transform: scale(1.03);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.cell-disabled {
  background: var(--surface-ground);
  border: 1px dashed var(--surface-border);
  cursor: default;
  opacity: 0.5;
}

.cell-disabled:hover {
  transform: none;
  box-shadow: none;
  opacity: 0.5;
}

.cell-info {
  background: var(--surface-ground);
}

.cell-info.cell-has-content {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: var(--primary-color);
}

.cell-text {
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.2;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: 0.5rem;
}

.legend-vert { background: #28a745; }
.legend-orange { background: #fd7e14; }
.legend-rouge { background: #dc3545; }
.legend-noir { background: #343a40; }
.legend-blanc { background: var(--surface-card); border: 1px solid var(--surface-border); }
</style>
