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
              <h1 class="text-2xl font-bold text-900 m-0">Votation Prioritaire</h1>
              <p class="text-600 m-0 mt-1">
                <span v-if="filterClasse">{{ filterClasse }} — {{ filterPFP }} {{ filterYear }}</span>
                <span v-else>Sélectionnez une classe pour gérer les étudiants prioritaires</span>
              </p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterClasse" :options="classeOptions" optionLabel="label" optionValue="value" placeholder="Classe" class="w-full md:w-12rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full md:w-8rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full md:w-7rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadData" v-tooltip="'Rafraîchir'" :loading="loading" :disabled="!canShowResults" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sélection requise -->
      <div v-if="!canShowResults" class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center gap-3">
          <div class="border-circle p-3 bg-yellow-100">
            <i class="pi pi-info-circle text-2xl text-yellow-600"></i>
          </div>
          <div>
            <h4 class="m-0 text-900 font-bold">Sélection requise</h4>
            <p class="m-0 mt-1 text-600">
              Veuillez sélectionner une <strong>classe</strong>, un <strong>PFP</strong> et une <strong>année</strong> pour gérer les étudiants prioritaires.
            </p>
          </div>
        </div>
      </div>

      <template v-if="canShowResults">
        <!-- Session prioritaire -->
        <div class="surface-card p-4 border-round shadow-2 mb-3">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="flex align-items-center gap-3">
              <div :class="['border-circle p-3', prioritySessionIsOpen ? 'bg-green-100' : 'bg-orange-100']">
                <i :class="['text-2xl', prioritySessionIsOpen ? 'pi pi-lock-open text-green-500' : 'pi pi-lock text-orange-500']"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-900 m-0">
                  Session prioritaire — {{ filterPFP }} {{ filterYear }}
                </h3>
                <p v-if="prioritySessionIsOpen" class="text-600 m-0 mt-1 text-sm">
                  <i class="pi pi-check-circle text-green-500 mr-1"></i>
                  Votation prioritaire <strong>ouverte</strong> — <strong>{{ priorityStudents.length }}</strong> étudiants prioritaires peuvent voter
                </p>
                <p v-else class="text-600 m-0 mt-1 text-sm">
                  <i class="pi pi-info-circle text-orange-500 mr-1"></i>
                  Votation prioritaire <strong>fermée</strong> — Sélectionnez les étudiants prioritaires puis lancez la session
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                v-if="!prioritySessionIsOpen"
                icon="pi pi-play"
                label="Lancer votation prioritaire"
                severity="warning"
                @click="showLaunchDialog = true"
                :disabled="priorityStudents.length === 0"
                :loading="sessionLoading"
              />
              <Button
                v-else
                icon="pi pi-stop"
                label="Fermer la votation"
                severity="danger"
                outlined
                @click="closePriorityVotation"
                :loading="sessionLoading"
              />
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="grid mb-3">
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-blue-100">
                  <i class="pi pi-users text-2xl text-blue-500"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-900 m-0">{{ allClassStudents.length }}</h3>
                  <p class="text-600 m-0 text-sm">Total {{ filterClasse }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-yellow-100">
                  <i class="pi pi-star-fill text-2xl text-yellow-500"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-yellow-600 m-0">{{ priorityStudents.length }}</h3>
                  <p class="text-600 m-0 text-sm">Prioritaires</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-green-100">
                  <i class="pi pi-check-circle text-2xl text-green-500"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-green-600 m-0">{{ priorityVotedCount }}</h3>
                  <p class="text-600 m-0 text-sm">Ont voté</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="surface-card p-3 border-round shadow-2">
              <div class="flex align-items-center gap-3">
                <div class="border-circle p-3 bg-purple-100">
                  <i class="pi pi-building text-2xl text-purple-500"></i>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-900 m-0">{{ validatedPlacesCount }}</h3>
                  <p class="text-600 m-0 text-sm">Places dispo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau des étudiants prioritaires -->
        <div class="surface-card p-4 border-round shadow-2 mb-3">
          <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-star-fill text-yellow-500 text-xl"></i>
              <h3 class="text-lg font-bold text-900 m-0">Étudiants prioritaires ({{ priorityStudents.length }})</h3>
            </div>
            <div class="flex gap-2 align-items-center">
              <Button icon="pi pi-bolt" label="Détection auto" severity="info" outlined size="small" @click="autoDetectPriority" :loading="detecting" />
              <Button icon="pi pi-user-plus" label="Ajouter manuellement" severity="success" outlined size="small" @click="showAddDialog = true" />
            </div>
          </div>

          <DataTable
            :value="priorityStudents"
            :loading="loading"
            responsiveLayout="scroll"
            :paginator="priorityStudents.length > 25"
            :rows="25"
            stripedRows
            class="p-datatable-sm"
            sortField="nom"
            :sortOrder="1"
          >
            <template #empty>
              <div class="text-center p-4">
                <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                <p class="text-600">Aucun étudiant prioritaire sélectionné</p>
                <p class="text-500 text-sm">Utilisez la <strong>détection automatique</strong> ou <strong>ajoutez manuellement</strong> des étudiants.</p>
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
            <Column header="Raison(s)" style="min-width: 250px">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Tag v-for="reason in data.reasons" :key="reason" :value="reason" :severity="getReasonSeverity(reason)" class="text-xs" />
                </div>
              </template>
            </Column>
            <Column header="Vote" style="min-width: 200px">
              <template #body="{ data }">
                <div v-if="data.vote">
                  <div class="font-semibold text-sm text-900">{{ data.vote.placeName }}</div>
                  <small class="text-500">{{ data.vote.institutionName }}</small>
                </div>
                <span v-else class="text-400 text-sm">Pas encore voté</span>
              </template>
            </Column>
            <Column header="Actions" style="min-width: 80px">
              <template #body="{ data }">
                <Button icon="pi pi-times" severity="danger" text rounded size="small" @click="removePriorityStudent(data.userId)" v-tooltip.top="'Retirer'" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Tableau de tous les étudiants de la classe (pour ajout) -->
        <div class="surface-card p-4 border-round shadow-2">
          <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-users text-primary text-xl"></i>
              <h3 class="text-lg font-bold text-900 m-0">Tous les étudiants {{ filterClasse }} ({{ nonPriorityStudents.length }})</h3>
            </div>
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full md:w-14rem" />
            </span>
          </div>

          <DataTable
            :value="filteredNonPriorityStudents"
            :loading="loading"
            responsiveLayout="scroll"
            :paginator="filteredNonPriorityStudents.length > 25"
            :rows="25"
            stripedRows
            class="p-datatable-sm"
            sortField="nom"
            :sortOrder="1"
          >
            <template #empty>
              <div class="text-center p-4">
                <i class="pi pi-check-circle text-4xl text-green-400 mb-3"></i>
                <p class="text-600">Tous les étudiants sont déjà dans la liste prioritaire</p>
              </div>
            </template>

            <Column field="nom" header="Nom" sortable style="min-width: 120px">
              <template #body="{ data }">
                <span class="text-900">{{ data.nom }}</span>
              </template>
            </Column>
            <Column field="prenom" header="Prénom" sortable style="min-width: 120px"></Column>
            <Column field="classe" header="Classe" sortable style="min-width: 80px">
              <template #body="{ data }">
                <Tag :value="data.classe" severity="info" class="text-xs" />
              </template>
            </Column>
            <Column header="Infos" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Tag v-if="data.sae" value="SAE" severity="warning" class="text-xs" />
                  <Tag v-if="data.casParticulier" value="Cas part." severity="danger" class="text-xs" />
                  <Tag v-if="data.previousRandomAssignment" value="Ancien aléatoire" severity="danger" class="text-xs" />
                </div>
              </template>
            </Column>
            <Column header="Actions" style="min-width: 100px">
              <template #body="{ data }">
                <Button icon="pi pi-plus" label="Ajouter" severity="success" text size="small" @click="addPriorityStudent(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </div>

    <!-- Dialog de lancement -->
    <Dialog
      v-model:visible="showLaunchDialog"
      modal
      header="Lancer la votation prioritaire"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="flex align-items-center gap-3 p-3 border-round bg-yellow-50 border-1 border-yellow-300">
          <i class="pi pi-star-fill text-yellow-600 text-2xl"></i>
          <div>
            <p class="m-0 font-bold text-yellow-900">Votation prioritaire {{ filterPFP }} {{ filterYear }}</p>
            <p class="m-0 mt-1 text-sm text-yellow-700">Classe : {{ filterClasse }} — {{ priorityStudents.length }} étudiants prioritaires</p>
          </div>
        </div>
        <p class="text-600 m-0">
          En lançant cette votation, <strong>seuls les {{ priorityStudents.length }} étudiants prioritaires</strong>
          pourront accéder à la page de votation et soumettre leurs choix pour
          <strong>{{ filterPFP }}</strong> — <strong>{{ filterYear }}</strong>.
        </p>
        <div class="flex align-items-center gap-2 p-2 border-round bg-blue-50 border-1 border-blue-300">
          <i class="pi pi-info-circle text-blue-500"></i>
          <span class="text-sm text-blue-700">
            Les étudiants non-prioritaires ne verront pas cette votation.
            La votation générale pourra être lancée après.
          </span>
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" severity="secondary" outlined @click="showLaunchDialog = false" />
        <Button label="Lancer" icon="pi pi-play" severity="warning" @click="openPriorityVotation" :loading="sessionLoading" />
      </template>
    </Dialog>

    <!-- Dialog ajout manuel -->
    <Dialog
      v-model:visible="showAddDialog"
      modal
      header="Ajouter un étudiant prioritaire"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Raison de la priorité</label>
          <InputText v-model="manualReason" placeholder="Ex: Lésé PFP1A, Cas médical, etc." />
        </div>
        <p class="text-500 text-sm m-0">
          Vous pouvez aussi ajouter des étudiants directement depuis le tableau ci-dessous en cliquant sur "Ajouter".
        </p>
      </div>
      <template #footer>
        <Button label="Fermer" severity="secondary" outlined @click="showAddDialog = false" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useUserStore } from '@/stores/userStore'
import votationSessionService from '@/service/votationSessionService'

const toast = useToast()
const userStore = useUserStore()
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

const loading = ref(false)
const detecting = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterPFP = ref(null)
const filterYear = ref(null)

const allClassStudents = ref([])
const priorityStudentIds = ref(new Set())
const priorityReasons = ref(new Map())
const priorityVotes = ref(new Map())
const previousResults = ref([])
const physioData = ref(new Map())

const currentPrioritySession = ref(null)
const sessionLoading = ref(false)
const showLaunchDialog = ref(false)
const showAddDialog = ref(false)
const manualReason = ref('')

const validatedPlacesCount = ref(0)

// ============================================
// CONFIGURATION DYNAMIQUE
// ============================================
const currentAcademicYear = new Date().getMonth() >= 8
  ? new Date().getFullYear()
  : new Date().getFullYear() - 1

const academicYearShort = currentAcademicYear % 100

const buildPfpConfig = () => {
  const ba1 = `BA${academicYearShort}`
  const ba2 = `BA${academicYearShort - 1}`
  const ba3 = `BA${academicYearShort - 2}`
  const pfpYear = `${currentAcademicYear + 1}`

  return {
    [ba1]: { label: `${ba1} (1ère année)`, pfps: ['PFP1A', 'PFP1B'], years: [pfpYear] },
    [ba2]: { label: `${ba2} (2ème année)`, pfps: ['PFP2'], years: [pfpYear] },
    [ba3]: { label: `${ba3} (3ème année)`, pfps: ['PFP3', 'PFP4'], years: [pfpYear] }
  }
}

const PFP_CONFIG = buildPfpConfig()

const classeOptions = Object.keys(PFP_CONFIG).map(key => ({
  label: PFP_CONFIG[key].label,
  value: key
}))

const activeConfig = computed(() => {
  if (!filterClasse.value) return null
  return PFP_CONFIG[filterClasse.value] || null
})

const pfpTypes = computed(() => {
  if (!activeConfig.value) return []
  return activeConfig.value.pfps.map(p => ({ label: p, value: p }))
})

const years = computed(() => {
  if (!activeConfig.value) return []
  return activeConfig.value.years
})

const canShowResults = computed(() => {
  return filterClasse.value && filterPFP.value && filterYear.value
})

const prioritySessionIsOpen = computed(() => {
  return currentPrioritySession.value && currentPrioritySession.value.status === 'open'
})

// ============================================
// COMPUTED: LISTES D'ÉTUDIANTS
// ============================================
const priorityStudents = computed(() => {
  return allClassStudents.value
    .filter(s => priorityStudentIds.value.has(s.id))
    .map(s => {
      const reasons = priorityReasons.value.get(s.id) || ['Manuel']
      const vote = priorityVotes.value.get(s.id) || null
      return {
        userId: s.id,
        nom: s.Nom || '',
        prenom: s.Prenom || '',
        classe: s.Classe || '',
        reasons,
        vote,
        sae: s.SAE,
        casParticulier: physioData.value.get(s.id)?.cas_particulier
      }
    })
    .sort((a, b) => a.nom.localeCompare(b.nom))
})

const nonPriorityStudents = computed(() => {
  return allClassStudents.value
    .filter(s => !priorityStudentIds.value.has(s.id))
    .map(s => {
      const physio = physioData.value.get(s.id)
      const prevResult = previousResults.value.find(r => r.user_id === s.id)
      return {
        userId: s.id,
        nom: s.Nom || '',
        prenom: s.Prenom || '',
        classe: s.Classe || '',
        sae: s.SAE,
        casParticulier: physio?.cas_particulier === true || physio?.cas_particulier === 'true',
        previousRandomAssignment: prevResult?.assigned_rank === 99
      }
    })
    .sort((a, b) => a.nom.localeCompare(b.nom))
})

const filteredNonPriorityStudents = computed(() => {
  if (!searchQuery.value?.trim()) return nonPriorityStudents.value
  const q = searchQuery.value.toLowerCase().trim()
  return nonPriorityStudents.value.filter(s =>
    s.nom.toLowerCase().includes(q) || s.prenom.toLowerCase().includes(q)
  )
})

const priorityVotedCount = computed(() => {
  return priorityStudents.value.filter(s => s.vote).length
})

// ============================================
// WATCHERS
// ============================================
watch(filterClasse, (newVal) => {
  filterPFP.value = null
  filterYear.value = null
  priorityStudentIds.value = new Set()
  priorityReasons.value = new Map()
  priorityVotes.value = new Map()
  previousResults.value = []
  allClassStudents.value = []
  currentPrioritySession.value = null

  if (newVal && PFP_CONFIG[newVal]) {
    const config = PFP_CONFIG[newVal]
    if (config.years.length === 1) filterYear.value = config.years[0]
    if (config.pfps.length === 1) filterPFP.value = config.pfps[0]
  }
})

watch([filterPFP, filterYear], async ([pfp, year]) => {
  if (pfp && year && filterClasse.value) {
    await loadData()
  }
})

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
const loadData = async () => {
  if (!filterClasse.value || !filterPFP.value || !filterYear.value) return
  loading.value = true

  try {
    // 1. Charger les étudiants de la classe
    const allStudentsData = await getAllStudents()
    allClassStudents.value = allStudentsData.filter(s => {
      const classe = s.Classe || s.classe || ''
      return classe === filterClasse.value
    })

    // 2. Charger les données StudentsPhysio (SAE, cas_particulier)
    const { data: physioResult } = await supabase
      .from('StudentsPhysio')
      .select('user_id, sae, cas_particulier')
    if (physioResult) {
      const map = new Map()
      physioResult.forEach(p => map.set(p.user_id, p))
      physioData.value = map
    }

    // 3. Charger les résultats précédents (pour détecter les assigned_rank=99)
    const { data: prevResults } = await supabase
      .from('student_result_vote')
      .select('user_id, assigned_rank, pfp_type, year')
    previousResults.value = prevResults || []

    // 4. Charger les votes prioritaires existants
    const { data: votes } = await supabase
      .from('student_votes')
      .select('*')
      .eq('pfp_type', filterPFP.value)
      .eq('year', filterYear.value)
    if (votes) {
      const voteMap = new Map()
      votes.forEach(v => {
        let choices = []
        if (typeof v.choices === 'string') {
          try { choices = JSON.parse(v.choices) } catch (e) { choices = [] }
        } else if (Array.isArray(v.choices)) {
          choices = v.choices
        }
        if (choices.length > 0) {
          voteMap.set(v.user_id, {
            placeName: choices[0]?.placeName || 'Inconnu',
            institutionName: choices[0]?.InstitutionName || '',
            nbChoix: choices.length
          })
        }
      })
      priorityVotes.value = voteMap
    }

    // 5. Charger les places validées
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()
    let count = 0
    placesStore.places.forEach(place => {
      if (place[filterPFP.value] && place[filterPFP.value][filterYear.value]) {
        const cap = parseInt(place[filterPFP.value][filterYear.value])
        if (cap > 0) count += cap
      }
    })
    validatedPlacesCount.value = count

    // 6. Charger la session prioritaire active
    await loadPrioritySession()

    console.log(`✅ ${allClassStudents.value.length} étudiants ${filterClasse.value} chargés`)
  } catch (error) {
    console.error('❌ Erreur chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

const loadPrioritySession = async () => {
  try {
    currentPrioritySession.value = await votationSessionService.getActivePrioritySession(filterPFP.value, filterYear.value)
    // Si une session existe, restaurer la liste des prioritaires
    if (currentPrioritySession.value?.priority_user_ids) {
      const ids = currentPrioritySession.value.priority_user_ids
      if (Array.isArray(ids)) {
        priorityStudentIds.value = new Set(ids)
        ids.forEach(id => {
          if (!priorityReasons.value.has(id)) {
            priorityReasons.value.set(id, ['Session active'])
          }
        })
      }
    }
  } catch (error) {
    console.error('❌ Erreur chargement session prioritaire:', error)
    currentPrioritySession.value = null
  }
}

// ============================================
// DÉTECTION AUTOMATIQUE
// ============================================
const autoDetectPriority = async () => {
  detecting.value = true
  const newIds = new Set(priorityStudentIds.value)
  const newReasons = new Map(priorityReasons.value)
  let addedCount = 0

  try {
    allClassStudents.value.forEach(student => {
      const reasons = []
      const physio = physioData.value.get(student.id)

      // 1. Cas particulier
      if (physio?.cas_particulier === true || physio?.cas_particulier === 'true') {
        reasons.push('Cas particulier')
      }

      // 2. SAE
      if (student.SAE || physio?.sae === true || physio?.sae === 'true') {
        reasons.push('SAE')
      }

      // 3. Attribution aléatoire dans une votation précédente
      const prevRandom = previousResults.value.find(r =>
        r.user_id === student.id && r.assigned_rank === 99
      )
      if (prevRandom) {
        reasons.push(`Aléatoire ${prevRandom.pfp_type}`)
      }

      if (reasons.length > 0 && !newIds.has(student.id)) {
        newIds.add(student.id)
        newReasons.set(student.id, reasons)
        addedCount++
      }
    })

    priorityStudentIds.value = newIds
    priorityReasons.value = newReasons

    toast.add({
      severity: addedCount > 0 ? 'success' : 'info',
      summary: 'Détection automatique',
      detail: addedCount > 0
        ? `${addedCount} étudiant(s) prioritaire(s) détecté(s)`
        : 'Aucun nouvel étudiant prioritaire détecté',
      life: 4000
    })
  } catch (error) {
    console.error('❌ Erreur détection:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    detecting.value = false
  }
}

// ============================================
// AJOUT / SUPPRESSION MANUELLE
// ============================================
const addPriorityStudent = (student) => {
  const newIds = new Set(priorityStudentIds.value)
  newIds.add(student.userId)
  priorityStudentIds.value = newIds

  const newReasons = new Map(priorityReasons.value)
  const reason = manualReason.value?.trim() || 'Manuel'
  newReasons.set(student.userId, [reason])
  priorityReasons.value = newReasons

  toast.add({
    severity: 'success',
    summary: 'Ajouté',
    detail: `${student.prenom} ${student.nom} ajouté aux prioritaires`,
    life: 3000
  })
}

const removePriorityStudent = (userId) => {
  const newIds = new Set(priorityStudentIds.value)
  newIds.delete(userId)
  priorityStudentIds.value = newIds

  const newReasons = new Map(priorityReasons.value)
  newReasons.delete(userId)
  priorityReasons.value = newReasons

  toast.add({
    severity: 'info',
    summary: 'Retiré',
    detail: 'Étudiant retiré de la liste prioritaire',
    life: 3000
  })
}

// ============================================
// SESSION PRIORITAIRE
// ============================================
const openPriorityVotation = async () => {
  if (priorityStudents.value.length === 0) return
  sessionLoading.value = true

  try {
    const userId = userStore.user?.id || null
    const priorityIds = Array.from(priorityStudentIds.value)

    const session = await votationSessionService.openPrioritySession(
      filterPFP.value,
      filterYear.value,
      filterClasse.value,
      userId,
      priorityIds
    )

    currentPrioritySession.value = session
    showLaunchDialog.value = false

    toast.add({
      severity: 'success',
      summary: 'Votation prioritaire ouverte',
      detail: `${priorityIds.length} étudiants peuvent maintenant voter pour ${filterPFP.value} ${filterYear.value}`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur ouverture session prioritaire:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}

const closePriorityVotation = async () => {
  sessionLoading.value = true
  try {
    await votationSessionService.closePrioritySession(filterPFP.value, filterYear.value)
    currentPrioritySession.value = null

    toast.add({
      severity: 'info',
      summary: 'Votation prioritaire fermée',
      detail: `La votation prioritaire ${filterPFP.value} ${filterYear.value} est maintenant fermée`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur fermeture session:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}

// ============================================
// HELPERS
// ============================================
const getReasonSeverity = (reason) => {
  if (reason.includes('Aléatoire')) return 'danger'
  if (reason.includes('Cas')) return 'warning'
  if (reason.includes('SAE')) return 'warning'
  if (reason.includes('Manuel')) return 'info'
  return 'secondary'
}

onMounted(() => {
  // Data loads via watchers
})
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
