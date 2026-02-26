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

        <!-- Panneau Propositions PFP4 -->
        <div v-if="filterPFP === 'PFP4'" class="surface-card p-4 border-round shadow-2 mb-3 border-1 border-yellow-300" style="background: #FFFBEB;">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-filter-fill text-xl text-yellow-600"></i>
                <h3 class="text-lg font-bold m-0" style="color: #92400E;">Propositions PFP4 — Places par étudiant</h3>
              </div>
              <p class="m-0 mt-1 text-sm" style="color: #A16207;">
                Générer les places proposées selon les critères manquants (aussi pour les prioritaires)
              </p>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-cog" label="Générer" severity="warning" @click="generatePfp4Proposals" :loading="pfp4Loading" />
              <Button v-if="pfp4Proposals.length > 0" icon="pi pi-save" label="Sauvegarder"
                :severity="pfp4Saved ? 'success' : 'info'" :outlined="pfp4Saved"
                @click="savePfp4Proposals" :loading="pfp4Loading" :disabled="pfp4Saved" />
            </div>
          </div>

          <!-- Stats -->
          <div v-if="pfp4Stats" class="flex flex-wrap gap-3 mb-3">
            <div class="p-2 border-round text-center" style="background: rgba(245,158,11,0.1); min-width: 90px;">
              <div class="text-lg font-bold" style="color: #92400E;">{{ pfp4Stats.totalStudents }}</div>
              <div class="text-xs text-600">Étudiants</div>
            </div>
            <div class="p-2 border-round text-center" style="background: rgba(99,102,241,0.1); min-width: 90px;">
              <div class="text-lg font-bold text-indigo-600">{{ pfp4Stats.totalPfp4Places }}</div>
              <div class="text-xs text-600">Places PFP4</div>
            </div>
            <div class="p-2 border-round text-center" style="background: rgba(34,197,94,0.1); min-width: 90px;">
              <div class="text-lg font-bold text-green-600">{{ pfp4Stats.averageProposedPlaces }}</div>
              <div class="text-xs text-600">Moy./étudiant</div>
            </div>
            <div class="flex flex-wrap gap-1 align-items-center">
              <Tag v-for="(count, rule) in pfp4Stats.ruleDistribution" :key="rule"
                :value="`${pfp4RuleLabels[rule] || rule}: ${count}`"
                :severity="pfp4RuleSeverity[rule] || 'secondary'" class="text-xs" />
            </div>
          </div>

          <div v-if="pfp4Saved" class="flex align-items-center gap-2 p-2 border-round bg-green-50 border-1 border-green-300 mb-3">
            <i class="pi pi-check-circle text-green-500"></i>
            <span class="text-sm text-green-700 font-medium">Propositions sauvegardées ! Les étudiants verront uniquement leurs places proposées.</span>
          </div>

          <!-- Tableau compact -->
          <div v-if="pfp4Proposals.length > 0">
            <div class="flex align-items-center gap-3 mb-2">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="pfp4SearchQuery" placeholder="Rechercher..." class="w-12rem p-inputtext-sm" />
              </span>
              <Dropdown v-model="pfp4FilterRule"
                :options="Object.entries(pfp4RuleLabels).map(([k, v]) => ({ label: v, value: k }))"
                optionLabel="label" optionValue="value" placeholder="Filtrer par règle"
                class="w-14rem" :showClear="true" />
              <span class="text-sm text-600">{{ filteredPfp4Proposals.length }} / {{ pfp4Proposals.length }}</span>
            </div>

            <DataTable :value="filteredPfp4Proposals" responsiveLayout="scroll"
              :paginator="true" :rows="15" :rowsPerPageOptions="[10, 15, 25, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              currentPageReportTemplate="{first}–{last} sur {totalRecords}"
              sortField="nom" :sortOrder="1" stripedRows class="p-datatable-sm">

              <Column field="nom" header="Nom" sortable :style="{ width: '130px' }">
                <template #body="slotProps">
                  <strong>{{ slotProps.data.nom.toUpperCase() }}</strong> {{ slotProps.data.prenom }}
                </template>
              </Column>

              <Column header="Critères" :style="{ minWidth: '200px' }">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="c in ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']" :key="c"
                      :value="c" :severity="slotProps.data.scores[c] > 0 ? 'success' : 'danger'"
                      class="text-xs" :style="slotProps.data.scores[c] === 0 ? { opacity: 0.6 } : {}" />
                  </div>
                </template>
              </Column>

              <Column field="appliedRule" header="Règle" sortable :style="{ width: '170px' }">
                <template #body="slotProps">
                  <Tag :value="pfp4RuleLabels[slotProps.data.appliedRule] || slotProps.data.appliedRule"
                    :severity="pfp4RuleSeverity[slotProps.data.appliedRule] || 'secondary'" class="text-xs" />
                </template>
              </Column>

              <Column field="proposedPlacesCount" header="Places" sortable :style="{ width: '80px', textAlign: 'center' }">
                <template #body="slotProps">
                  <Tag :value="`${slotProps.data.proposedPlacesCount}`"
                    :severity="slotProps.data.proposedPlacesCount >= 5 ? 'success' : 'warning'" rounded />
                </template>
              </Column>
            </DataTable>
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
            dataKey="userId"
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
import resultatVotationService from '@/stores/resultatVotationService'

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
const priorityStudentIds = ref([])
const priorityReasons = ref({})
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
// PROPOSITIONS PFP4
// ============================================
const pfp4Proposals = ref([])
const pfp4AllPlaces = ref([])
const pfp4Stats = ref(null)
const pfp4Loading = ref(false)
const pfp4Saved = ref(false)
const pfp4SearchQuery = ref('')
const pfp4FilterRule = ref(null)

const pfp4RuleLabels = {
  DE_ONLY: 'Manque DE uniquement',
  DE_AND_SYSINT: 'Manque DE + SYSINT',
  SYSINT_ONLY: 'Manque SYSINT uniquement',
  SYSINT_AND_OTHER: 'Manque SYSINT + autre',
  OTHER_MISSING: 'Autres critères manquants',
  ALL_COMPLETE: 'Tous critères validés'
}

const pfp4RuleSeverity = {
  DE_ONLY: 'warning',
  DE_AND_SYSINT: 'danger',
  SYSINT_ONLY: 'info',
  SYSINT_AND_OTHER: 'warning',
  OTHER_MISSING: 'secondary',
  ALL_COMPLETE: 'success'
}

const filteredPfp4Proposals = computed(() => {
  let filtered = [...pfp4Proposals.value]
  if (pfp4SearchQuery.value && pfp4SearchQuery.value.trim()) {
    const q = pfp4SearchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(p =>
      (p.nom || '').toLowerCase().includes(q) ||
      (p.prenom || '').toLowerCase().includes(q)
    )
  }
  if (pfp4FilterRule.value) {
    filtered = filtered.filter(p => p.appliedRule === pfp4FilterRule.value)
  }
  return filtered
})

const generatePfp4Proposals = async () => {
  if (!filterYear.value || !filterClasse.value) return
  pfp4Loading.value = true
  pfp4Saved.value = false
  try {
    const result = await resultatVotationService.generatePfp4Proposals(filterYear.value, filterClasse.value)
    pfp4Proposals.value = result.proposals || []
    pfp4AllPlaces.value = result.allPfp4Places || []
    pfp4Stats.value = result.stats || null
    toast.add({
      severity: 'success',
      summary: 'Propositions générées',
      detail: `${pfp4Proposals.value.length} étudiants traités, moyenne ${pfp4Stats.value?.averageProposedPlaces || 0} places/étudiant`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur génération propositions PFP4:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    pfp4Loading.value = false
  }
}

const savePfp4Proposals = async () => {
  if (pfp4Proposals.value.length === 0) return
  pfp4Loading.value = true
  try {
    await resultatVotationService.savePfp4Proposals(filterYear.value, filterClasse.value, pfp4Proposals.value)
    pfp4Saved.value = true
    toast.add({
      severity: 'success',
      summary: 'Propositions sauvegardées',
      detail: `${pfp4Proposals.value.length} propositions sauvegardées. Les étudiants verront uniquement leurs places proposées lors du vote PFP4.`,
      life: 8000
    })
  } catch (error) {
    console.error('❌ Erreur sauvegarde propositions PFP4:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    pfp4Loading.value = false
  }
}

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
    .filter(s => priorityStudentIds.value.includes(s.id))
    .map(s => {
      const reasons = priorityReasons.value[s.id] || ['Manuel']
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
    .filter(s => !priorityStudentIds.value.includes(s.id))
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
  priorityStudentIds.value = []
  priorityReasons.value = {}
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
    // Charger la session ouverte OU le brouillon
    const sessionOrDraft = await votationSessionService.getPriorityDraftOrSession(filterPFP.value, filterYear.value)
    
    if (sessionOrDraft) {
      // Si c'est une session ouverte, la stocker
      if (sessionOrDraft.status === 'open') {
        currentPrioritySession.value = sessionOrDraft
      } else {
        currentPrioritySession.value = null
      }
      
      // Restaurer la liste des prioritaires (draft ou open)
      if (sessionOrDraft.priority_user_ids && Array.isArray(sessionOrDraft.priority_user_ids)) {
        priorityStudentIds.value = [...sessionOrDraft.priority_user_ids]
        
        // Restaurer les raisons sauvegardées
        const savedReasons = sessionOrDraft.priority_reasons
        if (savedReasons && typeof savedReasons === 'object') {
          const restoredReasons = {}
          Object.entries(savedReasons).forEach(([userId, reasons]) => {
            restoredReasons[userId] = Array.isArray(reasons) ? reasons : [reasons]
          })
          priorityReasons.value = restoredReasons
        } else {
          // Fallback: marquer comme "Session" si pas de raisons sauvegardées
          const fallbackReasons = {}
          const isDraft = sessionOrDraft.status !== 'open'
          sessionOrDraft.priority_user_ids.forEach(id => {
            if (!priorityReasons.value[id]) {
              fallbackReasons[id] = [isDraft ? 'Sauvegardé' : 'Session active']
            }
          })
          priorityReasons.value = { ...priorityReasons.value, ...fallbackReasons }
        }
      }
      console.log(`✅ ${priorityStudentIds.value.length} prioritaires restaurés (${sessionOrDraft.status})`)
    } else {
      currentPrioritySession.value = null
    }
  } catch (error) {
    console.error('❌ Erreur chargement session prioritaire:', error)
    currentPrioritySession.value = null
  }
}

const savePriorityDraft = async () => {
  if (!filterPFP.value || !filterYear.value || !filterClasse.value) return
  // Ne pas sauvegarder si une session est déjà ouverte
  if (prioritySessionIsOpen.value) return
  
  try {
    const ids = [...priorityStudentIds.value]
    const reasons = { ...priorityReasons.value }
    
    await votationSessionService.savePriorityDraft(
      filterPFP.value,
      filterYear.value,
      filterClasse.value,
      ids,
      reasons
    )
    console.log(`💾 Brouillon prioritaire sauvegardé (${ids.length} étudiants)`)
  } catch (error) {
    console.error('❌ Erreur sauvegarde brouillon:', error)
  }
}

// ============================================
// DÉTECTION AUTOMATIQUE
// ============================================
const autoDetectPriority = async () => {
  detecting.value = true
  const newIds = [...priorityStudentIds.value]
  const newReasons = { ...priorityReasons.value }
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

      if (reasons.length > 0 && !newIds.includes(student.id)) {
        newIds.push(student.id)
        newReasons[student.id] = reasons
        addedCount++
      }
    })

    priorityStudentIds.value = newIds
    priorityReasons.value = newReasons

    // Sauvegarder le brouillon après détection
    await savePriorityDraft()

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
  if (priorityStudentIds.value.includes(student.userId)) return
  priorityStudentIds.value = [...priorityStudentIds.value, student.userId]

  const reason = manualReason.value?.trim() || 'Manuel'
  priorityReasons.value = { ...priorityReasons.value, [student.userId]: [reason] }

  toast.add({
    severity: 'success',
    summary: 'Ajouté',
    detail: `${student.prenom} ${student.nom} ajouté aux prioritaires`,
    life: 3000
  })

  // Sauvegarder en arrière-plan (non-bloquant)
  savePriorityDraft()
}

const removePriorityStudent = (userId) => {
  priorityStudentIds.value = priorityStudentIds.value.filter(id => id !== userId)

  const { [userId]: _, ...rest } = priorityReasons.value
  priorityReasons.value = rest

  toast.add({
    severity: 'info',
    summary: 'Retiré',
    detail: 'Étudiant retiré de la liste prioritaire',
    life: 3000
  })

  // Sauvegarder en arrière-plan (non-bloquant)
  savePriorityDraft()
}

// ============================================
// SESSION PRIORITAIRE
// ============================================
const openPriorityVotation = async () => {
  if (priorityStudents.value.length === 0) return
  sessionLoading.value = true

  try {
    const userId = userStore.user?.id || null
    const priorityIds = [...priorityStudentIds.value]
    const reasons = { ...priorityReasons.value }

    const session = await votationSessionService.openPrioritySession(
      filterPFP.value,
      filterYear.value,
      filterClasse.value,
      userId,
      priorityIds,
      reasons
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
