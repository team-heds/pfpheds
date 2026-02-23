<template>
  <AdminLayout>
    <Toast />
    <div class="votation-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-star-fill text-yellow-500 text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Prioritaire — Suivi</h1>
              <p class="text-600 m-0 mt-1">
                <span v-if="filterClasse">{{ filterClasse }} — {{ filterPFP }} {{ filterYear }}</span>
                <span v-else>Sélectionnez une classe pour voir la votation prioritaire</span>
              </p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe</label>
              <Dropdown v-model="filterClasse" :options="classeOptions" optionLabel="label" optionValue="value" placeholder="Classe" class="w-full md:w-12rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP</label>
              <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full md:w-8rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année</label>
              <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full md:w-7rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadData" :loading="loading" :disabled="!canLoad" v-tooltip="'Rafraîchir'" />
            </div>
          </div>
        </div>
      </div>

      <!-- Pas de sélection -->
      <div v-if="!canLoad" class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-center gap-3">
          <div class="border-circle p-3 bg-yellow-100"><i class="pi pi-info-circle text-2xl text-yellow-600"></i></div>
          <p class="text-600 m-0">Sélectionnez une <strong>classe</strong>, un <strong>PFP</strong> et une <strong>année</strong>.</p>
        </div>
      </div>

      <template v-if="canLoad">
        <!-- Session status -->
        <div class="surface-card p-4 border-round shadow-2 mb-3">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="flex align-items-center gap-3">
              <div :class="['border-circle p-3', sessionIsOpen ? 'bg-green-100' : 'bg-red-100']">
                <i :class="['text-2xl', sessionIsOpen ? 'pi pi-lock-open text-green-500' : 'pi pi-lock text-red-500']"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-900 m-0">Session prioritaire — {{ filterPFP }} {{ filterYear }}</h3>
                <p v-if="sessionIsOpen" class="text-green-600 m-0 mt-1 text-sm font-semibold">
                  <i class="pi pi-check-circle mr-1"></i> Ouverte — {{ priorityUserIds.length }} étudiants prioritaires
                </p>
                <p v-else class="text-red-500 m-0 mt-1 text-sm">
                  <i class="pi pi-times-circle mr-1"></i> Aucune session prioritaire ouverte
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                v-if="sessionIsOpen"
                icon="pi pi-stop"
                label="Fermer la votation"
                severity="danger"
                outlined
                @click="closeSession"
                :loading="sessionLoading"
              />
              <router-link to="/management_votation_prioritaire" class="no-underline">
                <Button icon="pi pi-cog" label="Gérer les prioritaires" severity="info" outlined />
              </router-link>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid mb-3">
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-yellow-100"><i class="pi pi-star-fill text-2xl text-yellow-500"></i></div>
                <div>
                  <h3 class="text-2xl font-bold text-yellow-600 m-0">{{ priorityUserIds.length }}</h3>
                  <p class="text-600 m-0 text-sm">Prioritaires</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-green-100"><i class="pi pi-check-circle text-2xl text-green-500"></i></div>
                <div>
                  <h3 class="text-2xl font-bold text-green-600 m-0">{{ votedCount }}</h3>
                  <p class="text-600 m-0 text-sm">Ont voté</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-orange-100"><i class="pi pi-clock text-2xl text-orange-500"></i></div>
                <div>
                  <h3 class="text-2xl font-bold text-orange-600 m-0">{{ priorityUserIds.length - votedCount }}</h3>
                  <p class="text-600 m-0 text-sm">En attente</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-purple-100"><i class="pi pi-building text-2xl text-purple-500"></i></div>
                <div>
                  <h3 class="text-2xl font-bold text-900 m-0">{{ validatedPlacesCount }}</h3>
                  <p class="text-600 m-0 text-sm">Places dispo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Votes table -->
        <div class="surface-card p-4 border-round shadow-2 mb-3">
          <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 class="text-lg font-bold text-900 m-0">
              <i class="pi pi-list text-primary mr-2"></i>Votes des étudiants prioritaires
            </h3>
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-14rem" />
            </span>
          </div>

          <DataTable
            :value="filteredVotesList"
            :loading="loading"
            responsiveLayout="scroll"
            :paginator="filteredVotesList.length > 25"
            :rows="25"
            stripedRows
            class="p-datatable-sm"
            sortField="nom"
            :sortOrder="1"
          >
            <template #empty>
              <div class="text-center p-4">
                <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                <p class="text-600">Aucun vote prioritaire pour le moment</p>
              </div>
            </template>

            <Column field="nom" header="Nom" sortable style="min-width: 120px">
              <template #body="{ data }">
                <strong class="text-900">{{ data.nom }}</strong>
              </template>
            </Column>
            <Column field="prenom" header="Prénom" sortable style="min-width: 120px"></Column>
            <Column field="classe" header="Classe" sortable style="min-width: 80px">
              <template #body="{ data }">
                <Tag :value="data.classe" severity="info" class="text-xs" />
              </template>
            </Column>
            <Column header="Choix 1" style="min-width: 180px">
              <template #body="{ data }">
                <div v-if="data.choix1" class="text-sm">
                  <div class="font-semibold text-900">{{ data.choix1 }}</div>
                  <small class="text-500">{{ data.choix1Institution }}</small>
                </div>
                <span v-else class="text-400">—</span>
              </template>
            </Column>
            <Column header="Choix 2" style="min-width: 180px">
              <template #body="{ data }">
                <div v-if="data.choix2" class="text-sm">
                  <div class="font-semibold text-900">{{ data.choix2 }}</div>
                  <small class="text-500">{{ data.choix2Institution }}</small>
                </div>
                <span v-else class="text-400">—</span>
              </template>
            </Column>
            <Column header="Choix 3" style="min-width: 180px">
              <template #body="{ data }">
                <div v-if="data.choix3" class="text-sm">
                  <div class="font-semibold text-900">{{ data.choix3 }}</div>
                  <small class="text-500">{{ data.choix3Institution }}</small>
                </div>
                <span v-else class="text-400">—</span>
              </template>
            </Column>
            <Column field="nbChoix" header="Nb" sortable style="min-width: 60px; text-align: center">
              <template #body="{ data }">
                <Tag :value="String(data.nbChoix)" :severity="data.nbChoix >= 5 ? 'success' : data.nbChoix > 0 ? 'warning' : 'danger'" class="text-xs" />
              </template>
            </Column>
            <Column field="status" header="Statut" sortable style="min-width: 100px">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="data.status === 'Complet' ? 'success' : data.status === 'Incomplet' ? 'warning' : 'danger'" class="text-xs" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Algorithm section -->
        <div v-if="votedCount > 0 && !sessionIsOpen" class="surface-card p-4 border-round shadow-2">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-indigo-100"><i class="pi pi-cog text-2xl text-indigo-500"></i></div>
              <div>
                <h3 class="text-lg font-bold text-900 m-0">Attribution des places prioritaires</h3>
                <p class="text-600 m-0 mt-1 text-sm">
                  Lancez l'algorithme pour attribuer les places aux {{ votedCount }} étudiants prioritaires ayant voté.
                </p>
              </div>
            </div>
            <Button
              icon="pi pi-play"
              label="Lancer l'algorithme"
              severity="success"
              @click="runAlgorithm"
              :loading="algorithmLoading"
            />
          </div>

          <!-- Algorithm results -->
          <div v-if="algorithmResults" class="mt-4">
            <div class="p-3 border-round bg-green-50 border-1 border-green-300 mb-3">
              <p class="m-0 font-bold text-green-900">
                <i class="pi pi-check-circle mr-1"></i>
                Algorithme terminé — {{ algorithmResults.stats?.successfulAssignments || 0 }} attributions
              </p>
              <p class="m-0 mt-1 text-sm text-green-700">
                1er choix: {{ algorithmResults.stats?.firstChoiceCount || 0 }} |
                2ème: {{ algorithmResults.stats?.secondChoiceCount || 0 }} |
                3ème: {{ algorithmResults.stats?.thirdChoiceCount || 0 }} |
                Aléatoire: {{ algorithmResults.stats?.randomAssignmentCount || 0 }}
              </p>
            </div>

            <DataTable
              :value="algorithmResults.results || []"
              responsiveLayout="scroll"
              :paginator="(algorithmResults.results || []).length > 15"
              :rows="15"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="user_id" header="Étudiant" style="min-width: 180px">
                <template #body="{ data }">
                  <span class="text-900 font-semibold">{{ getStudentName(data.user_id) }}</span>
                </template>
              </Column>
              <Column field="assigned_place_name" header="Place attribuée" sortable style="min-width: 180px"></Column>
              <Column field="assigned_institution_name" header="Institution" sortable style="min-width: 160px"></Column>
              <Column field="assigned_rank" header="Rang" sortable style="min-width: 80px; text-align: center">
                <template #body="{ data }">
                  <Tag
                    :value="data.assigned_rank === 99 ? 'Aléat.' : `Choix ${data.assigned_rank}`"
                    :severity="data.assigned_rank === 1 ? 'success' : data.assigned_rank === 99 ? 'danger' : 'warning'"
                    class="text-xs"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import votationSessionService from '@/service/votationSessionService'
import { resultatVotationService } from '@/stores/resultatVotationService'

const toast = useToast()
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

const loading = ref(false)
const sessionLoading = ref(false)
const algorithmLoading = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterPFP = ref(null)
const filterYear = ref(null)

const currentSession = ref(null)
const priorityUserIds = ref([])
const allStudents = ref([])
const votesList = ref([])
const validatedPlacesCount = ref(0)
const algorithmResults = ref(null)

// Dynamic config
const currentAcademicYear = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1
const academicYearShort = currentAcademicYear % 100

const PFP_CONFIG = {
  [`BA${academicYearShort}`]: { label: `BA${academicYearShort} (1ère année)`, pfps: ['PFP1A', 'PFP1B'], years: [`${currentAcademicYear + 1}`] },
  [`BA${academicYearShort - 1}`]: { label: `BA${academicYearShort - 1} (2ème année)`, pfps: ['PFP2'], years: [`${currentAcademicYear + 1}`] },
  [`BA${academicYearShort - 2}`]: { label: `BA${academicYearShort - 2} (3ème année)`, pfps: ['PFP3', 'PFP4'], years: [`${currentAcademicYear + 1}`] }
}

const classeOptions = Object.keys(PFP_CONFIG).map(k => ({ label: PFP_CONFIG[k].label, value: k }))
const activeConfig = computed(() => filterClasse.value ? PFP_CONFIG[filterClasse.value] : null)
const pfpTypes = computed(() => activeConfig.value ? activeConfig.value.pfps.map(p => ({ label: p, value: p })) : [])
const years = computed(() => activeConfig.value ? activeConfig.value.years : [])
const canLoad = computed(() => filterClasse.value && filterPFP.value && filterYear.value)
const sessionIsOpen = computed(() => currentSession.value?.status === 'open')
const votedCount = computed(() => votesList.value.filter(v => v.status !== 'Non voté').length)

const filteredVotesList = computed(() => {
  if (!searchQuery.value?.trim()) return votesList.value
  const q = searchQuery.value.toLowerCase().trim()
  return votesList.value.filter(v => v.nom.toLowerCase().includes(q) || v.prenom.toLowerCase().includes(q))
})

watch(filterClasse, (val) => {
  filterPFP.value = null
  filterYear.value = null
  currentSession.value = null
  votesList.value = []
  algorithmResults.value = null
  if (val && PFP_CONFIG[val]) {
    const c = PFP_CONFIG[val]
    if (c.years.length === 1) filterYear.value = c.years[0]
    if (c.pfps.length === 1) filterPFP.value = c.pfps[0]
  }
})

watch([filterPFP, filterYear], ([pfp, year]) => {
  if (pfp && year && filterClasse.value) loadData()
})

const loadData = async () => {
  if (!canLoad.value) return
  loading.value = true
  algorithmResults.value = null

  try {
    // 1. Session prioritaire
    currentSession.value = await votationSessionService.getActivePrioritySession(filterPFP.value, filterYear.value)
    priorityUserIds.value = currentSession.value?.priority_user_ids || []

    // If no active session, check closed ones for the priority list
    if (!currentSession.value) {
      const { data: closedSessions } = await supabase
        .from('votation_sessions')
        .select('priority_user_ids')
        .eq('pfp_type', filterPFP.value)
        .eq('year', filterYear.value)
        .eq('is_priority', true)
        .order('closed_at', { ascending: false })
        .limit(1)
      if (closedSessions?.length > 0 && closedSessions[0].priority_user_ids) {
        priorityUserIds.value = closedSessions[0].priority_user_ids
      }
    }

    // 2. Students
    const studentsData = await getAllStudents()
    allStudents.value = studentsData

    // 3. Places
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()
    let count = 0
    placesStore.places.forEach(p => {
      if (p[filterPFP.value]?.[filterYear.value]) {
        const cap = parseInt(p[filterPFP.value][filterYear.value])
        if (cap > 0) count += cap
      }
    })
    validatedPlacesCount.value = count

    // 4. Votes
    const { data: votes } = await supabase
      .from('student_votes')
      .select('*')
      .eq('pfp_type', filterPFP.value)
      .eq('year', filterYear.value)

    const votesMap = new Map()
    if (votes) {
      votes.forEach(v => {
        let choices = []
        if (typeof v.choices === 'string') { try { choices = JSON.parse(v.choices) } catch (e) { choices = [] } }
        else if (Array.isArray(v.choices)) choices = v.choices
        votesMap.set(v.user_id, { choices, updatedAt: v.updated_at })
      })
    }

    // 5. Build votes list for priority students only
    const placesMap = new Map()
    placesStore.places.forEach(p => placesMap.set(p.PlaceId, p.NomPlace))

    const list = []
    priorityUserIds.value.forEach(userId => {
      const student = allStudents.value.find(s => s.id === userId)
      if (!student) return

      const voteData = votesMap.get(userId)
      const choices = voteData?.choices || []

      const getPlaceName = (c) => c?.placeName || (c?.placeId ? placesMap.get(c.placeId) : null) || null

      list.push({
        userId,
        nom: student.Nom || '',
        prenom: student.Prenom || '',
        classe: student.Classe || '',
        choix1: getPlaceName(choices[0]),
        choix2: getPlaceName(choices[1]),
        choix3: getPlaceName(choices[2]),
        choix1Institution: choices[0]?.InstitutionName || null,
        choix2Institution: choices[1]?.InstitutionName || null,
        choix3Institution: choices[2]?.InstitutionName || null,
        nbChoix: choices.length,
        status: choices.length >= 5 ? 'Complet' : choices.length > 0 ? 'Incomplet' : 'Non voté',
        rawChoices: choices
      })
    })

    votesList.value = list.sort((a, b) => a.nom.localeCompare(b.nom))
  } catch (error) {
    console.error('❌ Erreur chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

const closeSession = async () => {
  sessionLoading.value = true
  try {
    await votationSessionService.closePrioritySession(filterPFP.value, filterYear.value)
    currentSession.value = null
    toast.add({ severity: 'info', summary: 'Session fermée', detail: 'Votation prioritaire fermée', life: 4000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}

const runAlgorithm = async () => {
  algorithmLoading.value = true
  try {
    const institutionMap = new Map()
    institutionsStore.institutions.forEach(i => institutionMap.set(i.InstitutionId, i))

    // Prepare students data (only priority students who voted)
    const studentsData = votesList.value
      .filter(v => v.nbChoix > 0)
      .map(v => ({
        userId: v.userId,
        choices: v.rawChoices,
        priorityScore: 100 // Priority students get max score
      }))

    // Prepare places data
    const placesData = placesStore.places
      .map(place => {
        let capacity = 0
        if (place[filterPFP.value]?.[filterYear.value]) {
          capacity = parseInt(place[filterPFP.value][filterYear.value])
        }
        if (!capacity || capacity < 1) return null
        const inst = institutionMap.get(place.InstitutionId)
        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionId: place.InstitutionId,
          InstitutionName: inst?.Name || 'Inconnu',
          Capacity: capacity
        }
      })
      .filter(Boolean)

    const result = await resultatVotationService.runAlgorithm(filterPFP.value, filterYear.value, studentsData, placesData)
    algorithmResults.value = result

    toast.add({
      severity: 'success',
      summary: 'Algorithme terminé',
      detail: `${result.stats?.successfulAssignments || 0} attributions réalisées`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur algorithme:', error)
    toast.add({ severity: 'error', summary: 'Erreur algorithme', detail: error.message, life: 5000 })
  } finally {
    algorithmLoading.value = false
  }
}

const getStudentName = (userId) => {
  const s = allStudents.value.find(st => st.id === userId)
  return s ? `${s.Prenom || ''} ${s.Nom || ''}`.trim() : userId
}

onMounted(() => {})
</script>

<style scoped>
.votation-page {
  max-width: 1600px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  font-weight: 700;
  color: var(--text-color);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: var(--surface-card);
  transition: background 0.15s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--highlight-bg) !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
  font-size: 0.9rem;
}
</style>
