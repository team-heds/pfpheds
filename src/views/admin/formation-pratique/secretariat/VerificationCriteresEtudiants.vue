<template>
  <AdminLayout>
    <div class="criteres-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">Secrétariat</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Vérification Critères</span>
      </div>

      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Vérification Critères Étudiants</h1>
              <p class="text-600 m-0 mt-1">Vérification des critères de formation pratique par étudiant</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Nom ou prénom..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown v-model="filterClasse" :options="classes" placeholder="Toutes" class="w-full md:w-8rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut :</label>
              <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Tous" class="w-full md:w-12rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchStudents" v-tooltip="'Rafraîchir'" :loading="loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques principales -->
      <div class="grid mb-3">
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
                <h3 class="text-2xl font-bold text-green-600 m-0">{{ stats.allValid }}</h3>
                <p class="text-600 m-0">Complets <span class="text-xs text-400">({{ stats.total ? Math.round(stats.allValid / stats.total * 100) : 0 }}%)</span></p>
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
                <h3 class="text-2xl font-bold text-orange-600 m-0">{{ stats.partial }}</h3>
                <p class="text-600 m-0">Partiels <span class="text-xs text-400">({{ stats.total ? Math.round(stats.partial / stats.total * 100) : 0 }}%)</span></p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-red-600 m-0">{{ stats.none }}</h3>
                <p class="text-600 m-0">Aucun <span class="text-xs text-400">({{ stats.total ? Math.round(stats.none / stats.total * 100) : 0 }}%)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Taux de validation par critère -->
      <div class="surface-card p-3 border-round shadow-2 mb-3">
        <div class="flex align-items-center gap-2 mb-3">
          <i class="pi pi-chart-bar text-primary"></i>
          <span class="font-bold text-900">Taux de validation par critère</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <div v-for="crit in criteriaLabels" :key="'stat_' + crit" class="criteria-stat-card flex-1 min-w-0">
            <div class="flex align-items-center justify-content-between mb-1">
              <span class="font-bold text-sm text-800">{{ crit }}</span>
              <span class="text-xs font-bold" :style="{ color: getCriteriaColor(criteriaStats[crit]?.percent) }">
                {{ criteriaStats[crit]?.percent || 0 }}%
              </span>
            </div>
            <div class="criteria-bar-bg">
              <div class="criteria-bar-fill" :style="{ width: (criteriaStats[crit]?.percent || 0) + '%', background: getCriteriaColor(criteriaStats[crit]?.percent) }"></div>
            </div>
            <div class="text-xs text-500 mt-1">{{ criteriaStats[crit]?.count || 0 }} / {{ stats.total }}</div>
          </div>
        </div>
      </div>

      <!-- Légende -->
      <div class="flex gap-3 align-items-center mb-3 px-1">
        <span class="text-sm text-600 font-semibold">Légende :</span>
        <span class="flex align-items-center gap-1">
          <i class="pi pi-check-circle text-green-500 text-sm"></i>
          <span class="score-pill score-valid" style="font-size:0.65rem;height:18px;min-width:20px;padding:0 5px">2</span>
          <span class="text-xs text-600">Validé (nb stages)</span>
        </span>
        <span class="flex align-items-center gap-1">
          <i class="pi pi-times-circle text-red-400 text-sm"></i>
          <span class="score-pill score-zero" style="font-size:0.65rem;height:18px;min-width:20px;padding:0 5px">0</span>
          <span class="text-xs text-600">Non validé</span>
        </span>
        <span class="flex align-items-center gap-1 ml-2">
          <span class="text-xs text-600">Progression :</span>
          <span class="progress-example">
            <span class="progress-example-fill" style="width: 62%"></span>
          </span>
          <span class="text-xs text-600">5/8</span>
        </span>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredStudents"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="50"
          :rowsPerPageOptions="[20, 50, 100]"
          :rowHover="true"
          dataKey="user_id"
          scrollable
          scrollHeight="flex"
          class="criteres-table p-datatable-sm"
          :sortField="'nom'"
          :sortOrder="1"
          v-model:expandedRows="expandedRows"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Étudiants ({{ filteredStudents.length }})</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun étudiant trouvé</p>
            </div>
          </template>

          <Column :expander="true" style="width: 3rem" />

          <!-- Étudiant (nom + prénom fusionnés avec avatar) -->
          <Column field="nom" header="Étudiant" sortable :frozen="true" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <div class="student-avatar" :class="getAvatarClass(data)">
                  {{ getInitials(data) }}
                </div>
                <div>
                  <router-link :to="`/profile/${data.user_id}`" class="font-semibold text-primary text-sm no-underline hover:underline cursor-pointer">{{ data.nom }} {{ data.prenom }}</router-link>
                  <div class="text-xs text-500">{{ data.classe }}</div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Score columns via v-for -->
          <Column v-for="crit in criteriaLabels" :key="crit" :header="crit" style="min-width: 75px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <div class="score-cell" :class="data.scores[crit] > 0 ? 'score-cell-valid' : 'score-cell-zero'" :title="crit + ': ' + data.scores[crit] + ' stage(s)'">
                  <i :class="data.scores[crit] > 0 ? 'pi pi-check' : 'pi pi-times'" class="score-cell-icon"></i>
                  <span class="score-cell-value">{{ data.scores[crit] }}</span>
                </div>
              </div>
            </template>
          </Column>

          <!-- Stages -->
          <Column field="totalStages" header="Stages" sortable style="min-width: 70px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span class="stages-badge" :class="data.totalStages > 0 ? 'stages-has' : 'stages-none'">
                  {{ data.totalStages }}
                </span>
              </div>
            </template>
          </Column>

          <!-- Progression -->
          <Column header="Progression" style="min-width: 140px">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <div class="progress-bar-bg flex-1">
                  <div class="progress-bar-fill" :style="{ width: getCompletionPercent(data) + '%', background: getCompletionColor(data) }"></div>
                </div>
                <span class="text-xs font-bold" :style="{ color: getCompletionColor(data) }">{{ getValidCount(data) }}/{{ criteriaLabels.length }}</span>
              </div>
            </template>
          </Column>

          <!-- Statut -->
          <Column header="Statut" style="min-width: 90px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <Tag :value="getStudentStatus(data).label" :severity="getStudentStatus(data).severity" class="text-xs" />
              </div>
            </template>
          </Column>

          <!-- Row expansion: détails des stages -->
          <template #expansion="{ data }">
            <div class="p-3">
              <div class="flex align-items-center gap-2 mb-3">
                <i class="pi pi-briefcase text-primary"></i>
                <span class="font-bold text-900">Stages de {{ data.nom }} {{ data.prenom }}</span>
                <Tag :value="`${data.stages?.length || 0} stage(s) validé(s)`" severity="info" class="text-xs" />
                <Tag v-if="data.currentAssignments?.length > 0" :value="`${data.currentAssignments.length} en cours`" severity="warning" class="text-xs" />
              </div>

              <!-- Stages validés -->
              <div v-if="data.stages && data.stages.length > 0" class="mb-3">
                <div class="text-sm font-semibold text-600 mb-2"><i class="pi pi-check-circle text-green-500 mr-1"></i>Stages validés</div>
                <div class="grid">
                  <div v-for="(stage, idx) in data.stages" :key="'stage-' + idx" class="col-12 md:col-6 lg:col-4">
                    <div class="stage-card surface-card border-round border-1 surface-border p-3">
                      <div class="font-semibold text-900 text-sm mb-1">{{ stage.NomPlace || 'Place inconnue' }}</div>
                      <div v-if="stage.Institution" class="text-xs text-600 mb-2">
                        <i class="pi pi-building mr-1"></i>{{ stage.Institution }}
                      </div>
                      <div v-if="stage.pfp_type" class="text-xs text-500 mb-2">
                        <Tag :value="stage.pfp_type" class="text-xs" />
                      </div>
                      <div class="flex flex-wrap gap-1">
                        <Tag v-for="crit in criteriaLabels" :key="'s-' + idx + '-' + crit"
                          :value="crit"
                          :severity="stage[crit] === true ? 'success' : 'danger'"
                          class="text-xs px-1 py-0"
                          style="font-size: 0.6rem"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Assignations en cours -->
              <div v-if="data.currentAssignments && data.currentAssignments.length > 0">
                <div class="text-sm font-semibold text-600 mb-2"><i class="pi pi-clock text-orange-500 mr-1"></i>Assignations en cours</div>
                <div class="grid">
                  <div v-for="(assign, idx) in data.currentAssignments" :key="'assign-' + idx" class="col-12 md:col-6 lg:col-4">
                    <div class="stage-card surface-card border-round border-1 border-orange-300 p-3">
                      <div class="font-semibold text-900 text-sm mb-1">{{ assign.assigned_place_name || 'Place inconnue' }}</div>
                      <div v-if="assign.assigned_institution_name" class="text-xs text-600 mb-1">
                        <i class="pi pi-building mr-1"></i>{{ assign.assigned_institution_name }}
                      </div>
                      <div class="flex gap-2 align-items-center">
                        <Tag :value="assign.pfp_type" class="text-xs" />
                        <Tag :value="assign.year" severity="secondary" class="text-xs" />
                        <Tag v-if="assign.assigned_rank === 99" value="Aléatoire" severity="danger" class="text-xs" />
                        <Tag v-else-if="assign.assigned_rank" :value="'Choix ' + assign.assigned_rank" severity="success" class="text-xs" />
                        <Tag :value="assign.status === 'published' ? 'Publié' : 'Brouillon'" :severity="assign.status === 'published' ? 'success' : 'warning'" class="text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="(!data.stages || data.stages.length === 0) && (!data.currentAssignments || data.currentAssignments.length === 0)" class="text-center p-3 text-500">
                <i class="pi pi-inbox text-2xl mb-2"></i>
                <p class="text-sm">Aucun stage trouvé pour cet étudiant</p>
              </div>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import studentsService from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'

const loading = ref(false)
const students = ref([])
const expandedRows = ref({})
const filterClasse = ref(null)
const filterStatus = ref(null)
const classes = ref(['BA23', 'BA24', 'BA25'])
const searchQuery = ref('')

const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

const statusOptions = [
  { label: 'Tous validés', value: 'all_valid' },
  { label: 'Partiellement', value: 'partial' },
  { label: 'Aucun critère', value: 'none' }
]

const getValidCount = (student) => criteriaLabels.filter(c => student.scores[c] > 0).length
const getCompletionPercent = (student) => Math.round((getValidCount(student) / criteriaLabels.length) * 100)

const getCompletionColor = (student) => {
  const pct = getCompletionPercent(student)
  if (pct === 100) return '#22C55E'
  if (pct >= 50) return '#F59E0B'
  if (pct > 0) return '#F97316'
  return '#EF4444'
}

const getStudentStatus = (student) => {
  const count = getValidCount(student)
  if (count === criteriaLabels.length) return { label: 'Complet', severity: 'success' }
  if (count > 0) return { label: `${count}/${criteriaLabels.length}`, severity: 'warning' }
  return { label: 'Aucun', severity: 'danger' }
}

const getInitials = (student) => {
  return ((student.nom?.[0] || '') + (student.prenom?.[0] || '')).toUpperCase()
}

const getAvatarClass = (student) => {
  const count = getValidCount(student)
  if (count === criteriaLabels.length) return 'avatar-complete'
  if (count > 0) return 'avatar-partial'
  return 'avatar-none'
}

const getCriteriaColor = (percent) => {
  if (percent >= 80) return '#22C55E'
  if (percent >= 50) return '#F59E0B'
  if (percent > 0) return '#F97316'
  return '#EF4444'
}

const stats = computed(() => {
  const all = students.value
  const allValid = all.filter(s => criteriaLabels.every(c => s.scores[c] > 0)).length
  const none = all.filter(s => criteriaLabels.every(c => s.scores[c] === 0)).length
  return {
    total: all.length,
    allValid,
    partial: all.length - allValid - none,
    none
  }
})

const criteriaStats = computed(() => {
  const result = {}
  const total = students.value.length
  criteriaLabels.forEach(crit => {
    const count = students.value.filter(s => s.scores[crit] > 0).length
    result[crit] = { count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }
  })
  return result
})

const filteredStudents = computed(() => {
  let filtered = [...students.value]

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(s => s.nom.toLowerCase().includes(q) || s.prenom.toLowerCase().includes(q))
  }

  if (filterClasse.value) {
    filtered = filtered.filter(s => s.classe === filterClasse.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(s => {
      const count = getValidCount(s)
      switch (filterStatus.value) {
        case 'all_valid': return count === criteriaLabels.length
        case 'partial': return count > 0 && count < criteriaLabels.length
        case 'none': return count === 0
        default: return true
      }
    })
  }

  return filtered
})

const exportCSV = () => {
  const headers = ['Nom', 'Prénom', 'Classe', ...criteriaLabels, 'Total Stages', 'Progression', 'Statut']
  const rows = filteredStudents.value.map(s => [
    s.nom, s.prenom, s.classe,
    ...criteriaLabels.map(c => s.scores[c]),
    s.totalStages,
    `${getValidCount(s)}/${criteriaLabels.length}`,
    getStudentStatus(s).label
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `verification-criteres-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const parsePfpValided = (pfpVal) => {
  if (!pfpVal) return []
  if (Array.isArray(pfpVal)) return pfpVal
  if (typeof pfpVal === 'string') {
    try {
      const parsed = JSON.parse(pfpVal)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) { return [] }
  }
  if (typeof pfpVal === 'object') return Object.values(pfpVal)
  return []
}

const fetchStudents = async () => {
  loading.value = true
  try {
    const [studentsData, physioResult, assignmentsResult, placesResult, institutionsResult] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, pfp_valided'),
      supabase.from('student_result_vote').select('*').order('year', { ascending: false }),
      supabase.from('places').select('*'),
      supabase.from('institutions').select('InstitutionId, Name')
    ])

    if (physioResult.error) console.warn('Erreur StudentsPhysio:', physioResult.error)
    if (assignmentsResult.error) console.warn('Erreur student_result_vote:', assignmentsResult.error)

    const placesMap = new Map()
    const instMap = new Map()
    if (institutionsResult.data) institutionsResult.data.forEach(i => instMap.set(i.InstitutionId, i.Name))
    if (placesResult.data) placesResult.data.forEach(p => placesMap.set(p.PlaceId, {
      name: p.NomPlace, institution: instMap.get(p.InstitutionId) || '',
      MSQ: !!p.MSQ, SYSINT: !!p.SYSINT, NEUROGER: !!p.NEUROGER,
      AIGU: !!p.AIGU, REHAB: !!p.REHAB, AMBU: !!p.AMBU, FR: !!p.FR, DE: !!p.DE
    }))

    // Helper: extract criteria supporting both upper and lower case
    const extractCrit = (obj) => {
      if (!obj) return {}
      const r = {}
      criteriaLabels.forEach(c => { r[c] = !!(obj[c] || obj[c.toLowerCase()]) })
      return r
    }

    // Normaliser PFP1A/PFP1B → PFP1
    const normalizePfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
    const pfpTypeByIndex = ['PFP1', 'PFP2', 'PFP3', 'PFP4']

    const criteriaMap = new Map()
    const stagesMap = new Map()
    if (physioResult.data) {
      physioResult.data.forEach(physio => {
        if (!physio.pfp_valided) return
        const scores = {}
        criteriaLabels.forEach(k => { scores[k] = 0 })
        const pfpArray = parsePfpValided(physio.pfp_valided)
        pfpArray.forEach(place => {
          const crit = extractCrit(place)
          criteriaLabels.forEach(c => { if (crit[c]) scores[c]++ })
        })
        criteriaMap.set(physio.user_id, { scores, totalStages: pfpArray.length })
        const enrichedStages = pfpArray.map((stage, idx) => {
          const placeId = stage.PlaceId || stage.ID_PFP || stage.id_pfp
          const placeInfo = placeId ? placesMap.get(placeId) : null
          const rawType = stage.pfp_type || stage.pfpLevel || pfpTypeByIndex[idx] || null
          return {
            ...stage,
            NomPlace: stage.NomPlace || stage.nom_pfp || placeInfo?.name || null,
            Institution: stage.Institution || stage.institution_name || placeInfo?.institution || null,
            pfp_type: rawType ? normalizePfp(rawType) : null,
            _placeId: placeId || null
          }
        })
        stagesMap.set(physio.user_id, enrichedStages)
      })
    }

    // Also count criteria from validated assignments (pfp_validee=true in student_result_vote)
    const assignmentsMap = new Map()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (!assignmentsMap.has(a.user_id)) assignmentsMap.set(a.user_id, [])
        assignmentsMap.get(a.user_id).push(a)

        // If assignment is validated, count its place criteria (but avoid duplicates with pfp_valided)
        if (a.pfp_validee && a.assigned_place_id) {
          const placeInfo = placesMap.get(a.assigned_place_id)
          if (placeInfo) {
            const existingStages = stagesMap.get(a.user_id) || []
            const alreadyExists = existingStages.some(s =>
              (s._placeId && s._placeId === a.assigned_place_id) ||
              (s.pfp_type && s.pfp_type === a.pfp_type)
            )

            if (!alreadyExists) {
              const existing = criteriaMap.get(a.user_id) || { scores: Object.fromEntries(criteriaLabels.map(k => [k, 0])), totalStages: 0 }
              criteriaLabels.forEach(c => { if (placeInfo[c]) existing.scores[c]++ })
              existing.totalStages++
              criteriaMap.set(a.user_id, existing)

              existingStages.push({
                NomPlace: a.assigned_place_name || placeInfo.name || '',
                Institution: a.assigned_institution_name || placeInfo.institution || '',
                pfp_type: a.pfp_type,
                _placeId: a.assigned_place_id,
                ...extractCrit(placeInfo)
              })
              stagesMap.set(a.user_id, existingStages)
            }
          }
        }
      })
    }

    students.value = studentsData.map(student => {
      const criteria = criteriaMap.get(student.id) || { scores: Object.fromEntries(criteriaLabels.map(k => [k, 0])), totalStages: 0 }
      return {
        nom: student.Nom || '', prenom: student.Prenom || '', classe: student.Classe || '-',
        scores: criteria.scores, totalStages: criteria.totalStages, user_id: student.id,
        stages: stagesMap.get(student.id) || [],
        currentAssignments: (assignmentsMap.get(student.id) || []).filter(a => !a.pfp_validee)
      }
    })

    const collator = new Intl.Collator('fr', { sensitivity: 'base' })
    students.value.sort((a, b) => collator.compare(a.nom, b.nom))

    const uniqueClasses = [...new Set(students.value.map(s => s.classe).filter(c => c !== '-'))].sort()
    if (uniqueClasses.length > 0) classes.value = uniqueClasses
  } catch (e) {
    console.error('Erreur fetchStudents:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchStudents() })
</script>

<style scoped>
.criteres-page {
  min-height: calc(100vh - 100px);
}

/* Student avatar */
.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.avatar-complete {
  background: #DCFCE7;
  color: #166534;
}

.avatar-partial {
  background: #FEF3C7;
  color: #92400E;
}

.avatar-none {
  background: #FEE2E2;
  color: #991B1B;
}

/* Score cells */
.score-cell {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 8px;
  cursor: default;
  transition: transform 0.15s ease;
}

.score-cell:hover {
  transform: scale(1.1);
}

.score-cell-valid {
  background: #DCFCE7;
}

.score-cell-zero {
  background: #FEF2F2;
}

.score-cell-icon {
  font-size: 0.65rem;
}

.score-cell-valid .score-cell-icon {
  color: #22C55E;
}

.score-cell-zero .score-cell-icon {
  color: #EF4444;
}

.score-cell-value {
  font-size: 0.75rem;
  font-weight: 700;
}

.score-cell-valid .score-cell-value {
  color: #166534;
}

.score-cell-zero .score-cell-value {
  color: #DC2626;
}

/* Stages badge */
.stages-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
}

.stages-has {
  background: #DBEAFE;
  color: #1E40AF;
}

.stages-none {
  background: #F1F5F9;
  color: #94A3B8;
}

/* Progress bars */
.progress-bar-bg {
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

/* Criteria stats row */
.criteria-stat-card {
  padding: 8px 10px;
  background: var(--surface-50);
  border-radius: 8px;
}

.criteria-bar-bg {
  height: 5px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.criteria-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* Score pills (for legend) */
.score-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.score-valid {
  background: #DCFCE7;
  color: #166534;
}

.score-zero {
  background: #FEF2F2;
  color: #DC2626;
}

/* Legend progress example */
.progress-example {
  display: inline-block;
  width: 40px;
  height: 5px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-example-fill {
  display: block;
  height: 100%;
  background: #F59E0B;
  border-radius: 3px;
}

/* Stage cards in expansion */
.stage-card {
  transition: box-shadow 0.2s ease;
}

.stage-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Table styling */
.criteres-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
}

.criteres-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.35rem 0.25rem;
  vertical-align: middle;
}

.criteres-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

.criteres-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}
</style>
