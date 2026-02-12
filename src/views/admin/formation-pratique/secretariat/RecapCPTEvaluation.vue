<template>
  <AdminLayout>
    <div class="recap-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-star text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Récapitulatif CPT / Évaluation</h1>
              <p class="text-600 m-0 mt-1">Cliquez sur les icônes pour modifier l'état CPT et Évaluation de chaque PFP</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchText" placeholder="Nom ou prénom..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown
                v-model="filterClasse"
                :options="classeOptions"
                placeholder="Toutes"
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut :</label>
              <Dropdown
                v-model="filterStatus"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous"
                class="w-full md:w-10rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchData" v-tooltip="'Rafraîchir'" />
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
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.allCptDone }}</h3>
                <p class="text-600 m-0">CPT complets</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-file-check text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.allEvalDone }}</h3>
                <p class="text-600 m-0">Eval complètes</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.incomplete }}</h3>
                <p class="text-600 m-0">Données manquantes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Légende -->
      <div class="flex gap-3 align-items-center mb-3 px-1">
        <span class="text-sm text-600 font-semibold">Légende :</span>
        <span class="flex align-items-center gap-1"><i class="pi pi-circle text-400"></i><span class="text-xs text-600">Non renseigné</span></span>
        <span class="flex align-items-center gap-1"><i class="pi pi-times text-red-500"></i><span class="text-xs text-600">Non conforme</span></span>
        <span class="flex align-items-center gap-1"><i class="pi pi-check text-green-500"></i><span class="text-xs text-600">Validé</span></span>
        <span class="flex align-items-center gap-1"><i class="pi pi-comment text-blue-500"></i><span class="text-xs text-600">Commentaire</span></span>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredEvaluations"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="50"
          :rowsPerPageOptions="[20, 50, 100]"
          :rowHover="true"
          dataKey="user_id"
          scrollable
          scrollHeight="flex"
          class="recap-table p-datatable-sm"
          :sortField="'etudiant'"
          :sortOrder="1"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Étudiants ({{ filteredEvaluations.length }})</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun étudiant trouvé</p>
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

          <Column field="annee" header="Année" sortable style="min-width: 70px">
            <template #body="{ data }">
              <span class="text-sm text-700">{{ data.annee }}</span>
            </template>
          </Column>

          <Column v-for="col in cptColumns" :key="col.field" :header="col.label" style="min-width: 100px">
            <template #body="{ data }">
              <TriStateCell
                :value="data[col.field]"
                :comment="data[col.commentField]"
                @update:value="updateField(data, col.field, $event)"
                @update:comment="updateField(data, col.commentField, $event)"
              />
            </template>
          </Column>

          <Column v-for="col in evalColumns" :key="col.field" :header="col.label" style="min-width: 100px">
            <template #body="{ data }">
              <TriStateCell
                :value="data[col.field]"
                :comment="data[col.commentField]"
                @update:value="updateField(data, col.field, $event)"
                @update:comment="updateField(data, col.commentField, $event)"
              />
            </template>
          </Column>

          <Column field="repondant" header="Répondant" style="min-width: 140px" sortable>
            <template #body="{ data }">
              <span v-if="data.repondant" class="text-primary text-sm font-semibold">{{ data.repondant }}</span>
              <span v-else class="text-400 italic text-sm">Non assigné</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import studentsService from '@/service/studentsService'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import TriStateCell from '@/components/admin/TriStateCell.vue'

const toast = useToast()
const loading = ref(false)
const students = ref([])
const evaluations = ref([])
const filterClasse = ref(null)
const filterStatus = ref(null)
const searchText = ref('')
let savingDebounce = null

const classeOptions = ['BA23', 'BA24', 'BA25', 'BA26']

const statusOptions = [
  { label: 'CPT complets', value: 'cpt_done' },
  { label: 'Eval complètes', value: 'eval_done' },
  { label: 'Tout complet', value: 'all_done' },
  { label: 'Données manquantes', value: 'incomplete' }
]

const cptColumns = [
  { field: 'pfp1_cpt', commentField: 'pfp1_cpt_comment', label: 'PFP1 CPT' },
  { field: 'pfp2_cpt', commentField: 'pfp2_cpt_comment', label: 'PFP2 CPT' },
  { field: 'pfp3_cpt', commentField: 'pfp3_cpt_comment', label: 'PFP3 CPT' },
  { field: 'pfp4_cpt', commentField: 'pfp4_cpt_comment', label: 'PFP4 CPT' }
]

const evalColumns = [
  { field: 'pfp1_eval', commentField: 'pfp1_eval_comment', label: 'PFP1 Eval' },
  { field: 'pfp2_eval', commentField: 'pfp2_eval_comment', label: 'PFP2 Eval' },
  { field: 'pfp3_eval', commentField: 'pfp3_eval_comment', label: 'PFP3 Eval' },
  { field: 'pfp4_eval', commentField: 'pfp4_eval_comment', label: 'PFP4 Eval' }
]

const allPfpFields = [...cptColumns, ...evalColumns]

const isAllCptDone = (row) => cptColumns.every(c => row[c.field] === true)
const isAllEvalDone = (row) => evalColumns.every(c => row[c.field] === true)
const isIncomplete = (row) => allPfpFields.some(c => row[c.field] === null)

const stats = computed(() => {
  const all = evaluations.value
  return {
    total: all.length,
    allCptDone: all.filter(r => isAllCptDone(r)).length,
    allEvalDone: all.filter(r => isAllEvalDone(r)).length,
    incomplete: all.filter(r => isIncomplete(r)).length
  }
})

const filteredEvaluations = computed(() => {
  let list = [...evaluations.value]

  if (searchText.value && searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    list = list.filter(e => e.etudiant.toLowerCase().includes(q))
  }

  if (filterClasse.value) {
    list = list.filter(e => e.classe === filterClasse.value)
  }

  if (filterStatus.value) {
    switch (filterStatus.value) {
      case 'cpt_done':
        list = list.filter(r => isAllCptDone(r))
        break
      case 'eval_done':
        list = list.filter(r => isAllEvalDone(r))
        break
      case 'all_done':
        list = list.filter(r => isAllCptDone(r) && isAllEvalDone(r))
        break
      case 'incomplete':
        list = list.filter(r => isIncomplete(r))
        break
    }
  }

  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  list.sort((a, b) => collator.compare(a.etudiant, b.etudiant))

  return list
})

const stateLabel = (val) => {
  if (val === true) return 'Validé'
  if (val === false) return 'Non conforme'
  return ''
}

const exportCSV = () => {
  const headers = [
    'Étudiant', 'Classe', 'Année',
    ...cptColumns.map(c => c.label), ...cptColumns.map(c => c.label + ' Comment'),
    ...evalColumns.map(c => c.label), ...evalColumns.map(c => c.label + ' Comment'),
    'Répondant'
  ]
  const rows = filteredEvaluations.value.map(r => [
    r.etudiant,
    r.classe,
    r.annee,
    ...cptColumns.map(c => stateLabel(r[c.field])),
    ...cptColumns.map(c => r[c.commentField] || ''),
    ...evalColumns.map(c => stateLabel(r[c.field])),
    ...evalColumns.map(c => r[c.commentField] || ''),
    r.repondant || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recap-cpt-evaluation-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const updateField = (rowData, field, value) => {
  rowData[field] = value

  if (savingDebounce) {
    clearTimeout(savingDebounce)
  }

  savingDebounce = setTimeout(async () => {
    await saveRow(rowData)
  }, 800)
}

const saveRow = async (rowData) => {
  try {
    const payload = {
      user_id: rowData.user_id,
      annee: rowData.annee,
      pfp1_cpt: rowData.pfp1_cpt,
      pfp1_cpt_comment: rowData.pfp1_cpt_comment || '',
      pfp2_cpt: rowData.pfp2_cpt,
      pfp2_cpt_comment: rowData.pfp2_cpt_comment || '',
      pfp3_cpt: rowData.pfp3_cpt,
      pfp3_cpt_comment: rowData.pfp3_cpt_comment || '',
      pfp4_cpt: rowData.pfp4_cpt,
      pfp4_cpt_comment: rowData.pfp4_cpt_comment || '',
      pfp1_eval: rowData.pfp1_eval,
      pfp1_eval_comment: rowData.pfp1_eval_comment || '',
      pfp2_eval: rowData.pfp2_eval,
      pfp2_eval_comment: rowData.pfp2_eval_comment || '',
      pfp3_eval: rowData.pfp3_eval,
      pfp3_eval_comment: rowData.pfp3_eval_comment || '',
      pfp4_eval: rowData.pfp4_eval,
      pfp4_eval_comment: rowData.pfp4_eval_comment || ''
    }

    const { data, error } = await supabase
      .from('recap_cpt_evaluation')
      .upsert(payload, { onConflict: 'user_id,annee' })
      .select()

    if (error) throw error

    if (!rowData.id && data?.[0]) {
      rowData.id = data[0].id
    }
  } catch (e) {
    console.error('Erreur saveRow:', e)
    toast.add({
      severity: 'error',
      summary: 'Erreur de sauvegarde',
      detail: `Impossible de sauvegarder pour ${rowData.etudiant}: ${e.message || ''}`,
      life: 5000
    })
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const [studentsData, { data: physioData }, { data: evalData, error: evalError }] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, repondant_hes'),
      supabase.from('recap_cpt_evaluation').select('*')
    ])

    if (evalError) throw evalError

    const physioMap = new Map((physioData || []).map(p => [p.user_id, p]))
    studentsData.forEach(s => {
      s.repondant_hes = physioMap.get(s.id)?.repondant_hes || null
    })

    students.value = studentsData

    const currentYear = new Date().getFullYear().toString()
    const evalMap = new Map()
    ;(evalData || []).forEach(ev => {
      evalMap.set(`${ev.user_id}_${ev.annee}`, ev)
    })

    evaluations.value = studentsData.map(student => {
      const key = `${student.id}_${currentYear}`
      const existing = evalMap.get(key)

      if (existing) {
        return {
          ...existing,
          etudiant: `${(student.Nom || '').toUpperCase()} ${student.Prenom || ''}`.trim(),
          classe: student.Classe || '-',
          repondant: student.repondant_hes || null
        }
      }

      return {
        id: null,
        user_id: student.id,
        etudiant: `${(student.Nom || '').toUpperCase()} ${student.Prenom || ''}`.trim(),
        classe: student.Classe || '-',
        annee: currentYear,
        pfp1_cpt: null, pfp1_cpt_comment: '',
        pfp2_cpt: null, pfp2_cpt_comment: '',
        pfp3_cpt: null, pfp3_cpt_comment: '',
        pfp4_cpt: null, pfp4_cpt_comment: '',
        pfp1_eval: null, pfp1_eval_comment: '',
        pfp2_eval: null, pfp2_eval_comment: '',
        pfp3_eval: null, pfp3_eval_comment: '',
        pfp4_eval: null, pfp4_eval_comment: '',
        repondant: student.repondant_hes || null
      }
    })
  } catch (e) {
    console.error('Erreur fetchData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 5000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.recap-page {
  min-height: calc(100vh - 100px);
}

.recap-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
}

.recap-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.35rem 0.25rem;
  vertical-align: middle;
}

.recap-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.recap-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}
</style>
