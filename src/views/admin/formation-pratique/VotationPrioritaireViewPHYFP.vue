<template>
  <AdminLayout>
    <Toast />
    <div class="votation-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Votation Prioritaire</span>
      </div>

      <!-- Header -->
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
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
              <Dropdown v-model="filterClasse" :options="classeOptions" optionLabel="label" optionValue="value" placeholder="Classe" class="w-full md:w-12rem" :disabled="!filterYear" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP</label>
              <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full md:w-8rem" :disabled="!filterClasse || !filterYear" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année</label>
              <Dropdown v-model="filterYear" :options="years" optionLabel="label" optionValue="value" placeholder="Année" class="w-full md:w-9rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadData" :loading="loading" :disabled="!canLoad" v-tooltip="'Rafraîchir'" />
                <Button icon="pi pi-briefcase" label="Export opérationnel" outlined class="p-button-sm" severity="help" @click="exportOperationalSummary" :disabled="!canLoad || !canExportOperational" v-tooltip="'Disponible après attribution'" />
              </div>
            </div>
          </div>
        </div>

        <div class="surface-card p-3 border-round shadow-2 mb-3">
          <div class="flex align-items-center gap-2 flex-wrap">
            <i :class="['pi', hasInsufficientCapacity ? 'pi-exclamation-triangle text-red-500' : 'pi-check-circle text-green-500']"></i>
            <span class="font-semibold text-900">Contrôle de capacité pré-algorithme</span>
            <Tag :value="`À placer: ${studentsToPlaceCount}`" severity="warning" class="text-xs" />
            <Tag v-if="excludedAssignedStudentsCount > 0" :value="`Déjà assignés (exclus): ${excludedAssignedStudentsCount}`" severity="secondary" class="text-xs" />
            <Tag :value="`Capacité: ${validatedPlacesCount}`" :severity="hasInsufficientCapacity ? 'danger' : 'success'" class="text-xs" />
            <Tag v-if="hasInsufficientCapacity" :value="`Manque: ${missingCapacityCount}`" severity="danger" class="text-xs" />
          </div>
          <p :class="['m-0 mt-2 text-xs', hasInsufficientCapacity ? 'text-red-600' : 'text-green-600']">
            {{ hasInsufficientCapacity ? 'Capacité insuffisante : ajoutez des places proposition avant lancement.' : 'Capacité suffisante pour lancer l\'algorithme.' }}
          </p>
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
        <div :class="['session-sticky-banner mb-3', sessionIsOpen ? 'session-sticky-banner--open' : 'session-sticky-banner--closed']">
          <i :class="['pi', sessionIsOpen ? 'pi-lock-open' : 'pi-lock', 'mr-2']"></i>
          <strong>{{ sessionIsOpen ? 'Session OUVERTE' : 'Session FERMÉE' }}</strong>
          <span class="ml-2">{{ filterClasse }} · {{ filterPFP }} · {{ filterYear }}</span>
        </div>

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

        <!-- Checklist votation prioritaire (lésés) -->
        <div class="surface-card p-4 border-round shadow-2 mb-3">
          <div class="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list-check text-primary"></i>
              <h3 class="text-lg font-bold text-900 m-0">Checklist prioritaire (lésés)</h3>
              <Tag :value="`${checklistCompletedCount}/${checklistTotalCount}`" severity="info" class="text-xs" />
            </div>
            <Button icon="pi pi-refresh" label="Réinitialiser" size="small" outlined @click="resetChecklist" />
          </div>

          <div class="checklist-sections">
            <div v-for="section in checklistSections" :key="section.title" class="checklist-card">
              <div class="font-semibold text-900 mb-2">{{ section.title }}</div>
              <label v-for="item in section.items" :key="item.key" class="checklist-item">
                <input
                  type="checkbox"
                  :checked="checklistState[item.key]"
                  @change="toggleChecklistItem(item.key)"
                />
                <span class="text-sm text-700">{{ item.label }}</span>
              </label>
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
            :value="filteredVotesDisplayList"
            :loading="loading"
            responsiveLayout="scroll"
            :paginator="filteredVotesDisplayList.length > 25"
            :rows="25"
            stripedRows
            class="p-datatable-sm"
            sortField="nom"
            :sortOrder="1"
          >
            <template #header>
              <div class="flex justify-content-between align-items-center flex-wrap gap-2">
                <span class="text-lg text-900 font-bold">Votes prioritaires ({{ filteredVotesDisplayList.length }})</span>
                <div class="flex align-items-center gap-2 flex-wrap">
                  <Button :outlined="voteQuickFilter !== 'all'" size="small" :label="`Tous (${quickFilterCounts.all})`" @click="setVoteQuickFilter('all')" />
                  <Button :outlined="voteQuickFilter !== 'non_voted'" size="small" severity="danger" :label="`Non-votants (${quickFilterCounts.nonVoted})`" @click="setVoteQuickFilter('non_voted')" />
                  <Button :outlined="voteQuickFilter !== 'incomplete'" size="small" severity="warning" :label="`Incomplets (${quickFilterCounts.incomplete})`" @click="setVoteQuickFilter('incomplete')" />
                </div>
              </div>
            </template>
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

        <div class="surface-card p-3 border-round shadow-2 mb-3 bg-green-50 border-1 border-green-300">
          <div class="flex align-items-center gap-2 mb-2">
            <i class="pi pi-chart-bar text-green-600"></i>
            <span class="font-semibold text-900">Prévisualisation impact avant lancement</span>
          </div>
          <div class="flex gap-2 flex-wrap mb-2">
            <Tag :value="`Étudiants à placer: ${studentsToPlaceCount}`" severity="info" class="text-xs" />
            <Tag :value="`Capacité: ${validatedPlacesCount}`" :severity="hasInsufficientCapacity ? 'danger' : 'success'" class="text-xs" />
            <Tag :value="`Risque aléatoire estimé: ${estimatedRandomRiskPercent}%`" :severity="estimatedRandomRiskPercent > 0 ? 'warning' : 'success'" class="text-xs" />
            <Tag :value="`Cas sensibles: ${quickFilterCounts.nonVoted + quickFilterCounts.incomplete}`" :severity="(quickFilterCounts.nonVoted + quickFilterCounts.incomplete) > 0 ? 'warning' : 'success'" class="text-xs" />
          </div>
          <div v-if="sensitiveCasesPreview.length > 0" class="text-sm text-700">
            <strong>À surveiller:</strong>
            <span>{{ sensitiveCasesPreview.map(s => `${s.prenom} ${s.nom} (${s.status})`).join(', ') }}</span>
            <span v-if="sensitiveCasesMoreCount > 0"> (+{{ sensitiveCasesMoreCount }} autres)</span>
          </div>
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
            <Button
              icon="pi pi-file-export"
              label="Export opérationnel"
              outlined
              severity="help"
              @click="exportOperationalSummary"
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

        <div class="surface-card p-4 border-round shadow-2 mb-3 mt-3">
          <div class="flex justify-content-between align-items-center mb-3">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list text-primary"></i>
              <h3 class="text-lg font-bold text-900 m-0">Historique des actions admin</h3>
              <Tag :value="adminActionHistory.length" severity="secondary" rounded />
            </div>
            <Button icon="pi pi-trash" label="Vider" text size="small" @click="clearAdminActionHistory" :disabled="adminActionHistory.length === 0" />
          </div>
          <div v-if="adminActionHistory.length === 0" class="text-600 text-sm">
            Aucune action enregistrée pour ce contexte.
          </div>
          <div v-else class="flex flex-column gap-2">
            <div v-for="entry in adminActionHistory.slice(0, 12)" :key="entry.id" class="p-2 border-round border-1 surface-border">
              <div class="flex justify-content-between align-items-center gap-2">
                <span class="font-semibold text-900">{{ entry.action }}</span>
                <span class="text-xs text-500">{{ formatDateTime(entry.at) }}</span>
              </div>
              <div class="text-sm text-700 mt-1">{{ entry.detail }}</div>
            </div>
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
import { resultatVotationService } from '@/service/resultatVotationService'

const toast = useToast()
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

const loading = ref(false)
const sessionLoading = ref(false)
const algorithmLoading = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterPFP = ref(null)
const currentVotationYear = new Date().getMonth() >= 8
  ? new Date().getFullYear() + 1
  : new Date().getFullYear()
const MIN_VOTATION_YEAR = 2025
const MAX_VOTATION_YEAR = 2030
const defaultYear = Math.min(Math.max(currentVotationYear, MIN_VOTATION_YEAR), MAX_VOTATION_YEAR)
const filterYear = ref(String(defaultYear))

const currentSession = ref(null)
const priorityUserIds = ref([])
const allStudents = ref([])
const votesList = ref([])
const validatedPlacesCount = ref(0)
const algorithmResults = ref(null)
const adminActionHistory = ref([])

// Dynamic config
const buildBaCode = (year) => {
  const yy = ((year % 100) + 100) % 100
  return `BA${String(yy).padStart(2, '0')}`
}

const buildPfpConfigForYear = (votationYear) => {
  const year = Number(votationYear)
  if (!Number.isFinite(year)) return {}

  const academicStartYear = year - 1
  const ba1 = buildBaCode(academicStartYear)
  const ba2 = buildBaCode(academicStartYear - 1)
  const ba3 = buildBaCode(academicStartYear - 2)

  return {
    [ba1]: { label: `${ba1} (1ère année)`, pfps: ['PFP1A', 'PFP1B'] },
    [ba2]: { label: `${ba2} (2ème année)`, pfps: ['PFP2'] },
    [ba3]: { label: `${ba3} (3ème année)`, pfps: ['PFP3', 'PFP4'] }
  }
}

const years = computed(() => {
  const size = MAX_VOTATION_YEAR - MIN_VOTATION_YEAR + 1
  return Array.from({ length: size }, (_, i) => {
    const year = String(MIN_VOTATION_YEAR + i)
    const start = String(Number(year) - 1)
    return {
      label: `${start}-${year}`,
      value: year
    }
  })
})

const pfpConfigForYear = computed(() => buildPfpConfigForYear(filterYear.value))

const classeOptions = computed(() => Object.keys(pfpConfigForYear.value).map(k => ({
  label: pfpConfigForYear.value[k].label,
  value: k
})))
const activeConfig = computed(() => filterClasse.value ? pfpConfigForYear.value[filterClasse.value] : null)
const pfpTypes = computed(() => activeConfig.value ? activeConfig.value.pfps.map(p => ({ label: p, value: p })) : [])
const canLoad = computed(() => filterClasse.value && filterPFP.value && filterYear.value)
const sessionIsOpen = computed(() => currentSession.value?.status === 'open')
const votedCount = computed(() => votesList.value.filter(v => v.status !== 'Non voté').length)
const excludedAssignedStudentsCount = computed(() => Math.max(0, priorityUserIds.value.length - votesList.value.length))
const studentsToPlaceCount = computed(() => votedCount.value)
const hasInsufficientCapacity = computed(() => studentsToPlaceCount.value > validatedPlacesCount.value)
const missingCapacityCount = computed(() => Math.max(0, studentsToPlaceCount.value - validatedPlacesCount.value))
const canExportOperational = computed(() => Array.isArray(algorithmResults.value?.results) && algorithmResults.value.results.length > 0)
const estimatedRandomRiskPercent = computed(() => {
  if (studentsToPlaceCount.value === 0) return 0
  return Math.round((missingCapacityCount.value / studentsToPlaceCount.value) * 100)
})

const voteQuickFilter = ref('all')

const adminActionStorageKey = computed(() => {
  const classe = filterClasse.value || 'none'
  const pfp = filterPFP.value || 'none'
  const year = filterYear.value || 'none'
  return `pfp-admin-actions:priority:${classe}:${pfp}:${year}`
})

const checklistSections = [
  {
    title: 'Avant ouverture',
    items: [
      { key: 'targetListChecked', label: 'Liste des étudiants lésés/prioritaires validée' },
      { key: 'capacityChecked', label: 'Capacités proposition vérifiées pour le PFP' },
      { key: 'sessionScopeChecked', label: 'Classe, PFP et année confirmés' }
    ]
  },
  {
    title: 'Avant algorithme',
    items: [
      { key: 'sessionClosed', label: 'Session prioritaire fermée' },
      { key: 'votesChecked', label: 'Votes des prioritaires contrôlés' },
      { key: 'missingCasesChecked', label: 'Cas sans choix identifiés' }
    ]
  },
  {
    title: 'Après algorithme',
    items: [
      { key: 'resultsChecked', label: 'Attributions relues (choix/aléatoire)' },
      { key: 'manualAdjustmentsChecked', label: 'Ajustements manuels éventuels validés' },
      { key: 'handoverChecked', label: 'OK pour ouvrir la votation normale' }
    ]
  }
]

const createDefaultChecklistState = () => ({
  targetListChecked: false,
  capacityChecked: false,
  sessionScopeChecked: false,
  sessionClosed: false,
  votesChecked: false,
  missingCasesChecked: false,
  resultsChecked: false,
  manualAdjustmentsChecked: false,
  handoverChecked: false
})

const checklistState = ref(createDefaultChecklistState())

const checklistStorageKey = computed(() => {
  const classe = filterClasse.value || 'none'
  const pfp = filterPFP.value || 'none'
  const year = filterYear.value || 'none'
  return `pfp-votation-priority-checklist:${classe}:${pfp}:${year}`
})

const checklistTotalCount = computed(() => Object.keys(checklistState.value).length)
const checklistCompletedCount = computed(() => Object.values(checklistState.value).filter(Boolean).length)

const toggleChecklistItem = (key) => {
  checklistState.value[key] = !checklistState.value[key]
}

const resetChecklist = () => {
  Object.keys(checklistState.value).forEach((key) => {
    checklistState.value[key] = false
  })
}

const loadChecklistState = () => {
  if (typeof window === 'undefined') return
  const defaults = createDefaultChecklistState()
  try {
    const raw = window.localStorage.getItem(checklistStorageKey.value)
    if (!raw) {
      checklistState.value = defaults
      return
    }
    const parsed = JSON.parse(raw)
    checklistState.value = {
      ...defaults,
      ...(parsed && typeof parsed === 'object' ? parsed : {})
    }
  } catch (error) {
    checklistState.value = defaults
  }
}

const saveChecklistState = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(checklistStorageKey.value, JSON.stringify(checklistState.value))
  } catch (error) {
    // ignore localStorage write errors
  }
}

watch(checklistStorageKey, () => {
  loadChecklistState()
}, { immediate: true })

watch(checklistState, () => {
  saveChecklistState()
}, { deep: true })

const filteredVotesList = computed(() => {
  if (!searchQuery.value?.trim()) return votesList.value
  const q = searchQuery.value.toLowerCase().trim()
  return votesList.value.filter(v => v.nom.toLowerCase().includes(q) || v.prenom.toLowerCase().includes(q))
})

const quickFilterCounts = computed(() => {
  const rows = filteredVotesList.value
  return {
    all: rows.length,
    nonVoted: rows.filter(v => v.status === 'Non voté').length,
    incomplete: rows.filter(v => v.status === 'Incomplet').length
  }
})

const sensitiveCasesAll = computed(() => filteredVotesList.value.filter(v => v.status === 'Non voté' || v.status === 'Incomplet'))
const sensitiveCasesPreview = computed(() => sensitiveCasesAll.value.slice(0, 6))
const sensitiveCasesMoreCount = computed(() => Math.max(0, sensitiveCasesAll.value.length - sensitiveCasesPreview.value.length))

const filteredVotesDisplayList = computed(() => {
  let filtered = filteredVotesList.value

  if (voteQuickFilter.value === 'non_voted') {
    filtered = filtered.filter(v => v.status === 'Non voté')
  } else if (voteQuickFilter.value === 'incomplete') {
    filtered = filtered.filter(v => v.status === 'Incomplet')
  }

  return filtered
})

const setVoteQuickFilter = (mode) => {
  voteQuickFilter.value = mode
}

const loadAssignedSnapshot = async (pfpType, year) => {
  const empty = { userIds: new Set(), placeCounts: new Map() }
  if (!pfpType || !year) return empty

  const { data, error } = await supabase
    .from('student_result_vote')
    .select('user_id, assigned_place_id')
    .eq('pfp_type', pfpType)
    .eq('year', year)
    .not('assigned_place_id', 'is', null)

  if (error) throw error

  const userIds = new Set()
  const placeCounts = new Map()
  ;(data || []).forEach((row) => {
    if (row.user_id) userIds.add(String(row.user_id))
    if (row.assigned_place_id) {
      const placeId = String(row.assigned_place_id)
      placeCounts.set(placeId, (placeCounts.get(placeId) || 0) + 1)
    }
  })

  return { userIds, placeCounts }
}

const loadAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(adminActionStorageKey.value)
    if (!raw) {
      adminActionHistory.value = []
      return
    }
    const parsed = JSON.parse(raw)
    adminActionHistory.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    adminActionHistory.value = []
  }
}

const saveAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(adminActionStorageKey.value, JSON.stringify(adminActionHistory.value))
  } catch (error) {
    // ignore localStorage write errors
  }
}

const addAdminAction = (action, detail) => {
  adminActionHistory.value = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      action,
      detail
    },
    ...adminActionHistory.value
  ].slice(0, 80)
}

const clearAdminActionHistory = () => {
  adminActionHistory.value = []
}

const formatDateTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

watch(filterYear, (newYear) => {
  if (!newYear) {
    filterClasse.value = null
    filterPFP.value = null
    currentSession.value = null
    votesList.value = []
    algorithmResults.value = null
    return
  }

  const cfg = pfpConfigForYear.value
  if (!filterClasse.value || !cfg[filterClasse.value]) {
    filterClasse.value = null
    filterPFP.value = null
  } else if (filterPFP.value && !cfg[filterClasse.value].pfps.includes(filterPFP.value)) {
    filterPFP.value = null
  }

  currentSession.value = null
  votesList.value = []
  algorithmResults.value = null
}, { immediate: true })

watch(filterClasse, (val) => {
  filterPFP.value = null
  currentSession.value = null
  votesList.value = []
  algorithmResults.value = null
  if (val && pfpConfigForYear.value[val]) {
    const c = pfpConfigForYear.value[val]
    if (c.pfps.length === 1) filterPFP.value = c.pfps[0]
  }
})

watch([filterPFP, filterYear], ([pfp, year]) => {
  if (pfp && year && filterClasse.value) loadData()
})

watch(adminActionStorageKey, () => {
  loadAdminActionHistory()
}, { immediate: true })

watch(adminActionHistory, () => {
  saveAdminActionHistory()
}, { deep: true })

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

    const assignedSnapshot = await loadAssignedSnapshot(filterPFP.value, filterYear.value)

    // 3. Places
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()
    const propositionKey = `${filterPFP.value.toLowerCase()}_proposition`
    let count = 0
    placesStore.places.forEach(p => {
      if (p[propositionKey]?.[filterYear.value]) {
        const cap = parseInt(p[propositionKey][filterYear.value])
        if (cap > 0) {
          const alreadyAssigned = assignedSnapshot.placeCounts.get(String(p.PlaceId)) || 0
          const remaining = Math.max(0, cap - alreadyAssigned)
          if (remaining > 0) count += remaining
        }
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
      if (assignedSnapshot.userIds.has(String(userId))) return

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
    console.log(`✅ Prioritaires actifs: ${priorityUserIds.value.length} (éligibles: ${votesList.value.length}, déjà assignés exclus: ${priorityUserIds.value.length - votesList.value.length})`)
  } catch (error) {
    console.error('❌ Erreur chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

const closeSession = async () => {
  const confirmed = window.confirm(`Confirmer la fermeture de la votation ${filterClasse.value} · ${filterPFP.value} ${filterYear.value} ?`)
  if (!confirmed) return

  sessionLoading.value = true
  try {
    await votationSessionService.closePrioritySession(filterPFP.value, filterYear.value)
    currentSession.value = null
    addAdminAction('Fermeture session prioritaire', `${filterClasse.value} · ${filterPFP.value} ${filterYear.value}`)
    toast.add({ severity: 'info', summary: 'Session fermée', detail: 'Votation prioritaire fermée', life: 4000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}

const runAlgorithm = async () => {
  const confirmed = window.confirm(`Confirmer le lancement de l'algorithme pour ${filterClasse.value} · ${filterPFP.value} ${filterYear.value} ?`)
  if (!confirmed) return

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
    const propKey = `${filterPFP.value.toLowerCase()}_proposition`
    const placesData = placesStore.places
      .map(place => {
        let capacity = 0
        if (place[propKey]?.[filterYear.value]) {
          capacity = parseInt(place[propKey][filterYear.value])
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
    addAdminAction('Lancement algorithme prioritaire', `${result.stats?.successfulAssignments || 0} attributions générées`)

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

const exportOperationalSummary = async () => {
  if (!canLoad.value) return
  try {
    if (!algorithmResults.value?.results || algorithmResults.value.results.length === 0) {
      toast.add({ severity: 'warn', summary: 'Attribution requise', detail: 'Lancez d\'abord l\'algorithme pour générer un export opérationnel.', life: 4000 })
      return
    }

    const assignments = algorithmResults.value?.results || []
    const toPlaceRows = votesList.value.filter(v => v.status !== 'Non voté')
    const assignedIds = new Set(assignments.map(a => String(a.user_id)))
    const nonAssignedRows = toPlaceRows.filter(v => !assignedIds.has(String(v.userId)))
    const randomAssignments = assignments.filter(a => Number(a.assigned_rank) === 99)
    const remainingPlaces = Math.max(0, validatedPlacesCount.value - assignments.length)

    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const summaryRows = [
      { indicateur: 'Classe', valeur: filterClasse.value || '-' },
      { indicateur: 'PFP', valeur: filterPFP.value || '-' },
      { indicateur: 'Année', valeur: filterYear.value || '-' },
      { indicateur: 'Étudiants à placer', valeur: toPlaceRows.length },
      { indicateur: 'Assignés', valeur: assignments.length },
      { indicateur: 'Non assignés', valeur: nonAssignedRows.length },
      { indicateur: 'Assignations aléatoires', valeur: randomAssignments.length },
      { indicateur: 'Places restantes', valeur: remainingPlaces }
    ]

    const assignedRows = assignments.map((row) => ({
      etudiant: getStudentName(row.user_id),
      place: row.assigned_place_name || '-',
      institution: row.assigned_institution_name || '-',
      rang: row.assigned_rank === 99 ? 'Aléatoire' : `Choix ${row.assigned_rank}`
    }))

    const nonAssignedExportRows = nonAssignedRows.map((row) => ({
      etudiant: `${row.prenom} ${row.nom}`,
      statut: row.status,
      nb_choix: row.nbChoix
    }))

    const randomRows = randomAssignments.map((row) => ({
      etudiant: getStudentName(row.user_id),
      place: row.assigned_place_name || '-',
      institution: row.assigned_institution_name || '-'
    }))

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Résumé')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assignedRows.length ? assignedRows : [{ etudiant: '-', place: '-', institution: '-', rang: '-' }]), 'Assignés')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nonAssignedExportRows.length ? nonAssignedExportRows : [{ etudiant: '-', statut: '-', nb_choix: '-' }]), 'Non assignés')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(randomRows.length ? randomRows : [{ etudiant: '-', place: '-', institution: '-' }]), 'Aléatoires')

    XLSX.writeFile(wb, `export_operationnel_prioritaire_${filterClasse.value || 'classe'}_${filterPFP.value || 'pfp'}_${filterYear.value || 'annee'}.xlsx`)

    addAdminAction('Export opérationnel prioritaire', `Export XLSX généré (${assignments.length} assignés, ${nonAssignedRows.length} non assignés)`)

    toast.add({ severity: 'success', summary: 'Export opérationnel', detail: 'Export prêt équipe généré', life: 3000 })
  } catch (error) {
    console.error('Erreur export opérationnel prioritaire:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de générer l’export opérationnel', life: 5000 })
  }
}

const getStudentName = (userId) => {
  const s = allStudents.value.find(st => st.id === userId)
  return s ? `${s.Prenom || ''} ${s.Nom || ''}`.trim() : userId
}

onMounted(() => {
  if (!filterYear.value) {
    filterYear.value = String(defaultYear)
  }
})
</script>

<style scoped>
.votation-page {
  min-height: 100%;
  width: 100%;
  max-width: none;
  margin: 0;
  display: block;
  box-sizing: border-box;
}

.votation-page > .breadcrumb-section,
.votation-page > .surface-card,
.votation-page > .grid {
  width: 100%;
}

.session-sticky-banner {
  position: sticky;
  top: 0.5rem;
  z-index: 6;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--surface-border);
  font-size: 0.9rem;
}

.session-sticky-banner--open {
  background: #ecfdf3;
  color: #166534;
}

.session-sticky-banner--closed {
  background: #fff7ed;
  color: #9a3412;
}

.checklist-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.checklist-card {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  cursor: pointer;
}

.checklist-item:last-child {
  margin-bottom: 0;
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
