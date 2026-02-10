<template>
  <AdminLayout>
    <Toast />
    <div class="assignment-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Résultats d'Attribution PFP</h1>
              <p class="text-600 m-0 mt-1">Visualisation des résultats de l'algorithme d'attributions</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <h3 class="text-lg font-semibold mb-3">Filtres</h3>
        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-medium">PFP</label>
            <Dropdown 
              v-model="selectedPFP" 
              :options="pfpOptions" 
              placeholder="Sélectionner un PFP"
              class="w-full"
              @change="loadResults"
            />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-medium">Année</label>
            <Dropdown 
              v-model="selectedYear" 
              :options="yearOptions" 
              placeholder="Sélectionner une année"
              class="w-full"
              @change="loadResults"
            />
          </div>
        </div>
      </div>

      <!-- Progression -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <span class="text-lg font-semibold">Progression de l'attribution</span>
          <span class="text-lg font-bold text-primary">{{ progressPercent }}%</span>
        </div>
        <ProgressBar :value="progressPercent" :showValue="false" />
        <div class="flex justify-content-between mt-2 text-sm text-600">
          <span>{{ stats.assigned }} étudiants assignés</span>
          <span>{{ stats.pending }} en attente</span>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Étudiants Total</div>
            <div class="text-2xl font-bold text-900">{{ stats.total }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Assignés</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.assigned }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">En attente</div>
            <div class="text-2xl font-bold text-orange-500">{{ stats.pending }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Places disponibles</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.availablePlaces }}</div>
          </div>
        </div>
      </div>

      <!-- Résultats -->
      <div v-if="!selectedPFP || !selectedYear" class="surface-card p-4 border-round shadow-2">
        <div class="text-center p-5">
          <i class="pi pi-info-circle text-5xl text-blue-500 mb-3"></i>
          <p class="text-lg text-600">Veuillez sélectionner un PFP et une année pour afficher les résultats</p>
        </div>
      </div>

      <div v-else-if="loading" class="surface-card p-4 border-round shadow-2">
        <div class="text-center p-5">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p class="text-lg text-600 mt-3">Chargement des résultats...</p>
        </div>
      </div>

      <div v-else-if="results.length === 0" class="surface-card p-4 border-round shadow-2">
        <div class="text-center p-5">
          <i class="pi pi-inbox text-5xl text-400 mb-3"></i>
          <p class="text-lg text-600">Aucun résultat d'attribution pour {{ selectedPFP }} - {{ selectedYear }}</p>
          <p class="text-sm text-500">Lancez d'abord l'algorithme d'attribution dans la page de votation</p>
        </div>
      </div>

      <div v-else>
        <!-- Tableau des résultats -->
        <div class="surface-card p-4 border-round shadow-2">
          <div class="flex align-items-center justify-content-between mb-3">
            <h3 class="text-xl font-bold text-900 m-0">
              <i class="pi pi-list mr-2"></i>
              Résultats d'Attribution - {{ selectedPFP }} {{ selectedYear }}
            </h3>
            <div class="flex gap-2">
              <Button 
                icon="pi pi-check-circle" 
                label="Publier aux étudiants" 
                severity="success" 
                @click="publishAssignments"
                :loading="publishing"
                v-tooltip.top="'Rendre les assignations visibles dans le profil des étudiants'"
              />
              <Button 
                icon="pi pi-times-circle" 
                label="Annuler la publication" 
                severity="warning" 
                @click="unpublishAssignments"
                :loading="publishing"
                v-tooltip.top="'Remettre en brouillon pour permettre les modifications'"
              />
              <Button 
                icon="pi pi-download" 
                label="Exporter CSV" 
                severity="info" 
                outlined 
                @click="exportCSV" 
              />
            </div>
          </div>

          <DataTable 
            :value="results" 
            :paginator="true" 
            :rows="50"
            :rowsPerPageOptions="[25, 50, 100]"
            responsiveLayout="scroll"
            stripedRows
            sortField="student_sort_name"
            :sortOrder="1"
          >
            <template #header>
              <div class="flex justify-content-between align-items-center">
                <span class="text-lg font-semibold">{{ results.length }} étudiants assignés</span>
                <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full md:w-20rem" />
              </div>
            </template>

            <Column field="student_sort_name" header="Étudiant" sortable :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="font-semibold">{{ slotProps.data.student_name || 'N/A' }}</div>
                <div v-if="slotProps.data.student_nom && slotProps.data.student_prenom" class="text-xs text-500">
                  {{ slotProps.data.student_nom }} {{ slotProps.data.student_prenom }}
                </div>
              </template>
            </Column>

            <Column field="assigned_place_name" header="Place Attribuée" sortable :style="{ minWidth: '250px' }">
              <template #body="slotProps">
                <div>
                  <div class="font-semibold">{{ slotProps.data.assigned_place_name }}</div>
                  <small class="text-500">{{ slotProps.data.assigned_institution_name }}</small>
                </div>
              </template>
            </Column>

            <Column field="praticien_formateur_nom" header="Praticien Formateur Assigné" :style="{ minWidth: '280px' }">
              <template #body="slotProps">
                <div class="flex flex-column gap-2">
                  <!-- Dropdown de sélection -->
                  <Dropdown
                    :modelValue="slotProps.data.assigned_praticien_id"
                    @update:modelValue="(value) => assignPraticien(slotProps.data, value)"
                    :options="getPraticienOptions(slotProps.data)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Sélectionner un praticien"
                    class="w-full"
                    :loading="slotProps.data.savingPraticien"
                    :disabled="slotProps.data.praticiens_formateurs_list?.length === 1"
                    :showClear="slotProps.data.praticiens_formateurs_list?.length !== 1"
                  >
                    <template #value="slotProps">
                      <div v-if="slotProps.value">
                        <span class="font-semibold">{{ getPraticienName(slotProps.value) }}</span>
                      </div>
                      <span v-else class="text-500">Sélectionner...</span>
                    </template>
                    <template #option="slotProps">
                      <div>
                        <div class="font-semibold">{{ slotProps.option.label }}</div>
                        <small v-if="slotProps.option.mail" class="text-500">{{ slotProps.option.mail }}</small>
                      </div>
                    </template>
                  </Dropdown>
                  
                  <!-- Info: nombre de praticiens disponibles -->
                  <div v-if="slotProps.data.praticiens_formateurs_list?.length === 1" class="text-xs text-green-600">
                    <i class="pi pi-check-circle mr-1"></i>
                    Praticien unique → auto-assigné
                  </div>
                  <div v-else-if="slotProps.data.praticiens_formateurs_list && slotProps.data.praticiens_formateurs_list.length > 1" class="text-xs text-500">
                    <i class="pi pi-info-circle mr-1"></i>
                    {{ slotProps.data.praticiens_formateurs_list.length }} praticiens configurés - sélection requise
                  </div>
                  <div v-else class="text-xs text-orange-500">
                    <i class="pi pi-exclamation-triangle mr-1"></i>
                    Aucun praticien configuré - sélection parmi tous
                  </div>
                </div>
              </template>
            </Column>

            <Column field="assigned_rank" header="Rang" sortable :style="{ width: '150px', textAlign: 'center' }">
              <template #body="slotProps">
                <Tag 
                  v-if="slotProps.data.assigned_rank === 99"
                  value="🎲 Aléatoire"
                  severity="danger"
                />
                <Tag 
                  v-else
                  :value="`${slotProps.data.assigned_rank}er choix`"
                  :severity="getRankSeverity(slotProps.data.assigned_rank)"
                />
              </template>
            </Column>

            <Column field="assigned_at" header="Date d'attribution" sortable :style="{ width: '180px' }">
              <template #body="slotProps">
                <small class="text-600">{{ formatDate(slotProps.data.assigned_at) }}</small>
              </template>
            </Column>

            <Column field="status" header="Statut" sortable :style="{ minWidth: '140px' }">
              <template #body="slotProps">
                <Tag 
                  :value="slotProps.data.status === 'published' ? 'Publié' : 'Brouillon'" 
                  :severity="slotProps.data.status === 'published' ? 'success' : 'warning'"
                  :icon="slotProps.data.status === 'published' ? 'pi pi-check' : 'pi pi-clock'"
                />
              </template>
            </Column>

            <Column header="Actions" :style="{ width: '200px', textAlign: 'center' }">
              <template #body="slotProps">
                <div class="flex gap-1 justify-content-center">
                  <Button 
                    icon="pi pi-pencil" 
                    label="Éditer"
                    severity="info" 
                    text 
                    rounded
                    :disabled="slotProps.data.status === 'published'"
                    @click="openEditDialog(slotProps.data)"
                    v-tooltip.top="slotProps.data.status === 'published' ? 'Dépublier pour modifier' : 'Modifier la place'"
                  />
                  <Button 
                    v-if="slotProps.data.status !== 'published'"
                    icon="pi pi-check-circle" 
                    label="Publier"
                    severity="success" 
                    text 
                    rounded
                    @click="publishSingleAssignment(slotProps.data)"
                    v-tooltip.top="'Publier à l\'étudiant'"
                  />
                  <Button 
                    v-else
                    icon="pi pi-times-circle" 
                    label="Unpublish"
                    severity="warning" 
                    text 
                    rounded
                    @click="unpublishSingleAssignment(slotProps.data)"
                    v-tooltip.top="'Dépublier (remettre en brouillon)'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Dialog d'édition de place -->
      <Dialog 
        v-model:visible="editDialogVisible" 
        modal 
        header="Modifier la place assignée"
        :style="{ width: '50rem' }"
      >
        <div v-if="editingAssignment">
          <div class="mb-4">
            <h4 class="mb-2">Étudiant</h4>
            <p class="text-lg font-semibold">{{ editingAssignment.student_name }}</p>
          </div>

          <div class="mb-4">
            <h4 class="mb-2">Place actuelle</h4>
            <div class="p-3 surface-100 border-round">
              <p class="font-semibold mb-1">{{ editingAssignment.assigned_place_name }}</p>
              <p class="text-sm text-500">{{ editingAssignment.assigned_institution_name }}</p>
            </div>
          </div>

          <Divider />

          <div class="mb-4">
            <h4 class="mb-2">Nouvelle place</h4>
            <InputText 
              v-model="placeSearchQuery" 
              placeholder="Rechercher une place ou institution..." 
              class="w-full mb-3"
              @input="filterPlaces"
            />
            
            <div class="places-selection-list" style="max-height: 400px; overflow-y: auto;">
              <div v-if="loadingPlaces" class="text-center p-4">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <p class="mt-2">Chargement des places...</p>
              </div>

              <div v-else-if="filteredAvailablePlaces.length === 0" class="text-center p-4 text-500">
                Aucune place trouvée
              </div>

              <div 
                v-else
                v-for="place in filteredAvailablePlaces" 
                :key="place.PlaceId"
                class="place-option p-3 mb-2 border-round cursor-pointer"
                :class="{ 'selected-place': selectedNewPlace?.PlaceId === place.PlaceId }"
                @click="selectNewPlace(place)"
              >
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <div class="font-semibold text-lg">
                      {{ place.NomPlace || place.Nom || place.nom || place.name || 'Place sans nom' }}
                    </div>
                    <div class="text-sm text-500 mt-1">
                      {{ place.Institution_name || place.Name || place.Institution || place.institution || 'Institution inconnue' }}
                    </div>
                    <div class="flex gap-2 mt-2">
                      <Tag v-if="place.PFP1A" value="PFP1A" severity="info" size="small" />
                      <Tag v-if="place.PFP1B" value="PFP1B" severity="info" size="small" />
                      <Tag v-if="place.Pediatrie" value="Pédiatrie" severity="success" size="small" />
                      <Tag v-if="place.Geriatrie" value="Gériatrie" severity="warning" size="small" />
                    </div>
                  </div>
                  <i v-if="selectedNewPlace?.PlaceId === place.PlaceId" class="pi pi-check-circle text-3xl text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Annuler" severity="secondary" @click="closeEditDialog" />
          <Button 
            label="Enregistrer" 
            severity="success" 
            @click="saveNewPlace"
            :disabled="!selectedNewPlace || savingPlace"
            :loading="savingPlace"
          />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import ProgressBar from 'primevue/progressbar'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import { usePlacesStore } from '@/stores/placesStore'

const toast = useToast()
const placesStore = usePlacesStore()

const refreshTimeout = ref(null)
const scheduleRefresh = (delay = 400) => {
  if (refreshTimeout.value) {
    clearTimeout(refreshTimeout.value)
  }
  refreshTimeout.value = setTimeout(() => {
    loadResults()
  }, delay)
}

// Filtres
const selectedPFP = ref(null)
const selectedYear = ref(null)
const pfpOptions = ref(['PFP1A', 'PFP1B'])
const yearOptions = ref(['2025', '2026', '2027'])

// Données
const loading = ref(false)
const results = ref([])
const allStudents = ref([])
const allPraticiens = ref([])
const allPlaces = ref([])
const searchQuery = ref('')

// Dialog d'édition
const editDialogVisible = ref(false)
const editingAssignment = ref(null)
const selectedNewPlace = ref(null)
const placeSearchQuery = ref('')
const availablePlaces = ref([])
const loadingPlaces = ref(false)
const savingPlace = ref(false)

// Publication des assignations
const publishing = ref(false)

// Stats
const stats = ref({
  total: 0,
  assigned: 0,
  pending: 0,
  availablePlaces: 0
})

const progressPercent = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.assigned / stats.value.total) * 100)
})

// Filtrer les places disponibles selon la recherche
const filteredAvailablePlaces = computed(() => {
  if (!placeSearchQuery.value.trim()) {
    return availablePlaces.value
  }

  const searchLower = placeSearchQuery.value.toLowerCase()
  return availablePlaces.value.filter(place => {
    // Essayer plusieurs variantes de nom de place
    const placeName = (place.NomPlace || place.Nom || place.nom || place.name || '').toLowerCase()
    const nomMatch = placeName.includes(searchLower)
    
    // Essayer plusieurs variantes de nom d'institution
    const institutionName = (place.Institution_name || place.Name || place.Institution || place.institution || '').toLowerCase()
    const institutionMatch = institutionName.includes(searchLower)
    
    return nomMatch || institutionMatch
  })
})

// Charger les résultats depuis la base de données
const loadResults = async () => {
  if (!selectedPFP.value || !selectedYear.value) {
    console.log('[WARN] PFP ou année non sélectionné')
    return
  }

  console.log(`[START] loadResults pour ${selectedPFP.value} ${selectedYear.value}`)
  loading.value = true
  
  try {
    console.log(`[LOADING] Chargement des résultats...`)

    // 1. Charger tous les étudiants
    console.log('[1/4] Chargement des étudiants...')
    const studentsData = await getAllStudents()
    if (!studentsData) {
      throw new Error('Aucun étudiant retourné')
    }
    allStudents.value = studentsData
    console.log(`[OK] ${allStudents.value.length} étudiants chargés`)

    // 2. Charger les résultats d'attribution depuis student_result_vote
    console.log('[2/4] Requête Supabase student_result_vote...')
    const { data, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('pfp_type', selectedPFP.value)
      .eq('year', selectedYear.value)
      .order('assigned_rank', { ascending: true })

    if (error) {
      console.error('[ERROR] Erreur Supabase:', error)
      throw error
    }

    if (!data) {
      console.log('[WARN] Aucune donnée retournée par Supabase')
      results.value = []
      return
    }

    console.log(`[OK] ${data.length} résultats trouvés dans student_result_vote`)

    // 3. Charger les praticiens formateurs et les places
    console.log('[3/6] Chargement des praticiens formateurs...')
    const { data: praticiensData, error: praticiensError } = await supabase
      .from('praticiens_formateurs')
      .select('*')
    
    if (praticiensError) {
      console.warn('[WARN] Erreur chargement praticiens:', praticiensError)
      allPraticiens.value = []
    } else {
      allPraticiens.value = praticiensData || []
      console.log(`[OK] ${allPraticiens.value.length} praticiens chargés`)
    }

    console.log('[4/6] Chargement des places...')
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('*')
    
    if (placesError) {
      console.warn('[WARN] Erreur chargement places:', placesError)
      allPlaces.value = []
    } else {
      allPlaces.value = placesData || []
      console.log(`[OK] ${allPlaces.value.length} places chargées`)
    }

    // 5. Enrichir avec les noms des étudiants et praticiens
    console.log('[5/6] Enrichissement avec les noms et praticiens...')
    results.value = (data || []).map(result => {
      const student = allStudents.value.find(s => 
        s.user_id === result.user_id || s.id === result.user_id
      )
      
      let studentName = 'N/A'
      let nom = ''
      let prenom = ''
      
      if (student) {
        // Extraire nom et prénom
        nom = student.Nom || student.nom || student.family_name || ''
        prenom = student.Prenom || student.prenom || student.forname || ''
        
        // Utiliser display_name si disponible, sinon construire "NOM Prénom"
        if (student.display_name) {
          studentName = student.display_name
        } else {
          // Format: NOM Prénom (nom en majuscules)
          studentName = `${nom.toUpperCase()} ${prenom}`.trim() || 'N/A'
        }
      }

      // Trouver la place pour récupérer TOUS les praticiens formateurs configurés
      const place = allPlaces.value.find(p => p.PlaceId === result.assigned_place_id)
      
      let praticiensFormateurs = []
      
      // Chercher le champ praticiensFormateurs (camelCase avec quotes dans la DB)
      const praticiensIds = place?.praticiensFormateurs || []
      
      // Debug: afficher la structure pour diagnostiquer
      if (result === data[0]) {
        console.log('[PRATICIEN DEBUG] Place:', {
          PlaceId: place?.PlaceId,
          NomPlace: place?.NomPlace,
          praticiensFormateurs: place?.praticiensFormateurs,
          praticiensIds,
          allPraticiensCount: allPraticiens.value.length,
          premierPraticienId: allPraticiens.value[0]?.id
        })
      }
      
      if (place && Array.isArray(praticiensIds) && praticiensIds.length > 0) {
        // Le champ contient un array de TEXT mais les IDs praticiens sont BIGINT
        // Il faut donc comparer en convertissant
        praticiensFormateurs = praticiensIds
          .map(praticienId => {
            // Convertir l'ID en string et en number pour comparer
            const idStr = String(praticienId)
            const idNum = Number(praticienId)
            
            const praticien = allPraticiens.value.find(p => {
              const pId = p.id || p.PraticienId
              return pId == praticienId || // Comparaison souple
                     pId === idStr || 
                     pId === idNum ||
                     String(pId) === idStr ||
                     Number(pId) === idNum
            })
            
            if (result === data[0]) {
              console.log(`[PRATICIEN DEBUG] Recherche ID ${praticienId} (str: ${idStr}, num: ${idNum}):`, praticien ? 'TROUVÉ' : 'NON TROUVÉ')
            }
            
            if (praticien) {
              const pNom = praticien.nom || praticien.Nom || ''
              const pPrenom = praticien.prenom || praticien.Prenom || ''
              const nom = `${pPrenom} ${pNom}`.trim()
              const mail = praticien.mail || praticien.Mail || praticien.email || null
              
              return { nom, mail, id: praticienId }
            }
            return null
          })
          .filter(p => p !== null)
      }
      
      // Créer un affichage textuel pour tous les praticiens
      const praticiensText = praticiensFormateurs.length > 0
        ? praticiensFormateurs.map(p => p.nom).join(', ')
        : null
      
      const praticiensEmails = praticiensFormateurs.length > 0
        ? praticiensFormateurs.map(p => p.mail).filter(m => m).join(', ')
        : null

      // AUTO-ASSIGNATION: Si un seul praticien ET pas encore assigné → assigner automatiquement
      let autoAssignedPraticienId = result.assigned_praticien_id
      let needsAutoAssignment = false
      
      if (!result.assigned_praticien_id && praticiensFormateurs.length === 1) {
        autoAssignedPraticienId = praticiensFormateurs[0].id
        needsAutoAssignment = true
        
        if (result === data[0]) {
          console.log('[AUTO-ASSIGN] 1 seul praticien détecté → auto-assignation:', praticiensFormateurs[0].nom)
        }
      }

      return {
        ...result,
        student_name: studentName,
        student_nom: nom,
        student_prenom: prenom,
        // Champ de tri : nom en minuscules pour tri alphabétique
        student_sort_name: `${nom} ${prenom}`.trim().toLowerCase(),
        // Praticiens formateurs (tous ceux configurés pour la place)
        praticien_formateur_nom: praticiensText,
        praticien_formateur_mail: praticiensEmails,
        praticiens_formateurs_list: praticiensFormateurs, // Liste complète pour affichage détaillé
        praticiens_count: praticiensFormateurs.length,
        // Praticien assigné spécifiquement (depuis la DB ou auto-assigné)
        assigned_praticien_id: autoAssignedPraticienId,
        // Flag pour le loading du dropdown
        savingPraticien: false,
        // Flag pour savoir si on doit sauvegarder l'auto-assignation
        needsAutoAssignment
      }
    })

    // 6. Mettre à jour les statistiques
    console.log('[6/6] Mise à jour des statistiques...')
    const ba25Students = allStudents.value.filter(s => {
      const classe = s.Classe || s.classe || s.class
      return classe === 'BA25'
    })
    
    stats.value = {
      total: ba25Students.length,
      assigned: results.value.length,
      pending: ba25Students.length - results.value.length,
      availablePlaces: 0
    }

    console.log('[SUCCESS] Résultats chargés et enrichis:', {
      total: stats.value.total,
      assigned: stats.value.assigned,
      results: results.value.length
    })
    
    // 7. Auto-assigner les praticiens si nécessaire
    await autoAssignPraticiens()
  } catch (error) {
    console.error('[ERROR] Erreur lors du chargement des résultats:', error)
    console.error('[ERROR] Stack:', error.stack)
    
    // Réinitialiser les résultats en cas d'erreur
    results.value = []
    
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les résultats: ' + error.message,
      life: 5000
    })
  } finally {
    console.log('[END] loadResults - loading = false')
    loading.value = false
  }
}

// Formater la date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtenir la sévérité du badge selon le rang
const getRankSeverity = (rank) => {
  if (rank === 1) return 'success'
  if (rank === 2) return 'info'
  if (rank === 3) return 'warning'
  return 'secondary'
}

// Exporter en CSV
const exportCSV = () => {
  if (results.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune donnée',
      detail: 'Pas de résultats à exporter',
      life: 3000
    })
    return
  }

  const headers = ['Nom', 'Prénom', 'Place Attribuée', 'Institution', 'Praticien Assigné', 'Email Praticien', 'Praticiens Disponibles', 'Rang', 'Date Attribution', 'Statut']
  const rows = results.value.map(r => {
    const assignedPraticienName = r.assigned_praticien_id ? getPraticienName(r.assigned_praticien_id) : 'Non assigné'
    const assignedPraticien = r.assigned_praticien_id ? allPraticiens.value.find(p => p.id == r.assigned_praticien_id) : null
    const assignedPraticienMail = assignedPraticien?.mail || ''
    
    return [
      r.student_nom || 'N/A',
      r.student_prenom || 'N/A',
      r.assigned_place_name,
      r.assigned_institution_name,
      assignedPraticienName,
      assignedPraticienMail,
      r.praticien_formateur_nom || 'Non configuré',
      r.assigned_rank === 99 ? 'Aléatoire' : `${r.assigned_rank}er choix`,
      formatDate(r.assigned_at),
      r.status || 'assigned'
    ]
  })

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `attributions_${selectedPFP.value}_${selectedYear.value}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${results.value.length} résultats exportés`,
    life: 3000
  })
}

// Ouvrir le dialog d'édition
const openEditDialog = async (assignment) => {
  console.log('[EDIT] Ouverture dialog pour:', assignment)
  editingAssignment.value = assignment
  selectedNewPlace.value = null
  placeSearchQuery.value = ''
  editDialogVisible.value = true

  // Charger toutes les places depuis le store
  loadingPlaces.value = true
  try {
    console.log('[1/2] Chargement des places depuis placesStore...')
    await placesStore.fetchPlaces()
    
    console.log('[DEBUG] Total places chargées:', placesStore.places.length)
    console.log('[DEBUG] Première place:', placesStore.places[0])
    console.log('[DEBUG] PFP sélectionné:', selectedPFP.value)
    
    // Filtrer selon le PFP sélectionné
    const pfpField = selectedPFP.value // 'PFP1A' ou 'PFP1B'
    
    // Afficher toutes les places d'abord sans filtrage
    console.log('[DEBUG] Toutes les places:', placesStore.places.map(p => ({
      PlaceId: p.PlaceId,
      NomPlace: p.NomPlace,
      PFP1A: p.PFP1A,
      PFP1B: p.PFP1B,
      pfpFieldValue: p[pfpField]
    })))
    
    availablePlaces.value = placesStore.places.filter(place => {
      // Vérifier plusieurs variantes
      const hasField = place[pfpField] === true || 
                       place[pfpField] === 1 || 
                       place[pfpField] === '1' ||
                       place[pfpField] === 'true'
      
      console.log(`[DEBUG] Place ${place.NomPlace} - ${pfpField}:`, place[pfpField], '-> inclure?', hasField)
      return hasField
    })
    
    console.log(`[OK] ${availablePlaces.value.length} places ${selectedPFP.value} disponibles`)
    
    if (availablePlaces.value.length === 0) {
      console.warn('[WARN] Aucune place trouvée après filtrage!')
      console.warn('[WARN] Affichage de TOUTES les places sans filtrage')
      availablePlaces.value = placesStore.places
    }
  } catch (error) {
    console.error('[ERROR] Erreur chargement places:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les places',
      life: 3000
    })
  } finally {
    loadingPlaces.value = false
  }
}

// Fermer le dialog
const closeEditDialog = () => {
  editDialogVisible.value = false
  editingAssignment.value = null
  selectedNewPlace.value = null
  placeSearchQuery.value = ''
}

// Sélectionner une nouvelle place
const selectNewPlace = (place) => {
  selectedNewPlace.value = place
  console.log('[SELECT] Place sélectionnée:', place.NomPlace)
}

// Fonction de filtrage (appelée par @input)
const filterPlaces = () => {
  // Le filtrage est déjà géré par le computed filteredAvailablePlaces
  console.log('[FILTER] Recherche:', placeSearchQuery.value)
}

// Sauvegarder la nouvelle place
const saveNewPlace = async () => {
  if (!selectedNewPlace.value || !editingAssignment.value) return

  savingPlace.value = true
  try {
    console.log('[SAVE] Mise à jour de student_result_vote...')
    console.log('Assignment ID:', editingAssignment.value.id)
    console.log('Nouvelle place:', selectedNewPlace.value.NomPlace)

    // Extraire les noms avec fallbacks
    const placeName = selectedNewPlace.value.NomPlace || 
                      selectedNewPlace.value.Nom || 
                      selectedNewPlace.value.nom || 
                      selectedNewPlace.value.name || 
                      'Place sans nom'
    
    const institutionName = selectedNewPlace.value.Institution_name || 
                           selectedNewPlace.value.Name || 
                           selectedNewPlace.value.Institution || 
                           selectedNewPlace.value.institution || 
                           'Institution inconnue'

    console.log('[SAVE] Nom place:', placeName)
    console.log('[SAVE] Nom institution:', institutionName)

    // Mettre à jour la table student_result_vote
    const { error } = await supabase
      .from('student_result_vote')
      .update({
        assigned_place_id: selectedNewPlace.value.PlaceId,
        assigned_place_name: placeName,
        assigned_institution_name: institutionName,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingAssignment.value.id)

    if (error) {
      console.error('[ERROR] Erreur Supabase:', error)
      throw error
    }

    console.log('[SUCCESS] Place mise à jour avec succès')

    // Mettre à jour localement
    const index = results.value.findIndex(r => r.id === editingAssignment.value.id)
    if (index !== -1) {
      results.value[index].assigned_place_id = selectedNewPlace.value.PlaceId
      results.value[index].assigned_place_name = placeName
      results.value[index].assigned_institution_name = institutionName
    }

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `Place modifiée pour ${editingAssignment.value.student_name}`,
      life: 3000
    })

    closeEditDialog()
  } catch (error) {
    console.error('[ERROR] Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de modifier la place: ' + error.message,
      life: 5000
    })
  } finally {
    savingPlace.value = false
  }

  scheduleRefresh()
}

// Publier une seule assignation
const publishSingleAssignment = async (assignment) => {
  try {
    console.log('[PUBLISH_SINGLE] Publication de l\'assignation:', assignment.student_name)

    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.id)

    if (error) {
      console.error('[ERROR] Erreur publication:', error)
      throw error
    }

    console.log('[SUCCESS] Assignation publiée avec succès')

    // Mettre à jour localement
    const index = results.value.findIndex(r => r.id === assignment.id)
    if (index !== -1) {
      results.value[index].status = 'published'
    }

    toast.add({
      severity: 'success',
      summary: 'Publication réussie',
      detail: `L'assignation de ${assignment.student_name} est maintenant visible`,
      life: 3000
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[ERROR] Erreur lors de la publication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de publier l\'assignation: ' + error.message,
      life: 5000
    })
  }
}

// Dépublier une seule assignation (remettre en brouillon)
const unpublishSingleAssignment = async (assignment) => {
  console.log('[UNPUBLISH_SINGLE] Demande de dépublication pour:', assignment.student_name)
  
  if (!confirm(`Voulez-vous remettre en brouillon l'assignation de ${assignment.student_name}?\n\nL'étudiant ne verra plus cette assignation dans son profil.`)) {
    console.log('[UNPUBLISH_SINGLE] Dépublication annulée par l\'utilisateur')
    return
  }

  try {
    console.log('[UNPUBLISH_SINGLE] Confirmation reçue, dépublication en cours...')

    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.id)

    if (error) {
      console.error('[ERROR] Erreur dépublication:', error)
      throw error
    }

    console.log('[SUCCESS] Assignation dépubliée avec succès')

    // Mettre à jour localement
    const index = results.value.findIndex(r => r.id === assignment.id)
    if (index !== -1) {
      results.value[index].status = 'draft'
    }

    toast.add({
      severity: 'info',
      summary: 'Dépublication réussie',
      detail: `L'assignation de ${assignment.student_name} est repassée en brouillon`,
      life: 3000
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[ERROR] Erreur lors de la dépublication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dépublier l\'assignation: ' + error.message,
      life: 5000
    })
  }
}

// Dépublier toutes les assignations
const unpublishAssignments = async () => {
  if (!selectedPFP.value || !selectedYear.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner un PFP et une année',
      life: 3000
    })
    return
  }

  if (results.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune assignation',
      detail: 'Il n\'y a aucune assignation à dépublier',
      life: 3000
    })
    return
  }

  const publishedCount = results.value.filter(r => r.status === 'published').length
  
  if (publishedCount === 0) {
    toast.add({
      severity: 'info',
      summary: 'Déjà en brouillon',
      detail: 'Toutes les assignations sont déjà en brouillon',
      life: 3000
    })
    return
  }

  // Demander confirmation
  if (!confirm(`Voulez-vous annuler la publication de ${publishedCount} assignations pour ${selectedPFP.value} ${selectedYear.value}?\n\nCes assignations ne seront plus visibles dans le profil des étudiants et pourront être modifiées.`)) {
    return
  }

  publishing.value = true
  try {
    console.log('[UNPUBLISH_ALL] Dépublication des assignations...')
    console.log(`PFP: ${selectedPFP.value}, Année: ${selectedYear.value}`)
    console.log(`Nombre d'assignations à dépublier: ${publishedCount}`)

    // Mettre à jour le statut des assignations publiées
    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('pfp_type', selectedPFP.value)
      .eq('year', selectedYear.value)
      .eq('status', 'published')

    if (error) {
      console.error('[ERROR] Erreur dépublication:', error)
      throw error
    }

    console.log('[SUCCESS] Assignations dépubliées avec succès')

    // Mettre à jour localement
    results.value = results.value.map(r => ({
      ...r,
      status: 'draft'
    }))

    toast.add({
      severity: 'info',
      summary: 'Dépublication réussie',
      detail: `${publishedCount} assignations sont repassées en brouillon et peuvent être modifiées`,
      life: 5000
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[ERROR] Erreur lors de la dépublication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dépublier les assignations: ' + error.message,
      life: 5000
    })
  } finally {
    publishing.value = false
  }
}

// Publier toutes les assignations
const publishAssignments = async () => {
  if (!selectedPFP.value || !selectedYear.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner un PFP et une année',
      life: 3000
    })
    return
  }

  if (results.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune assignation',
      detail: 'Il n\'y a aucune assignation à publier',
      life: 3000
    })
    return
  }

  // Compter les assignations déjà publiées
  const unpublishedCount = results.value.filter(r => r.status !== 'published').length
  
  if (unpublishedCount === 0) {
    toast.add({
      severity: 'info',
      summary: 'Déjà publié',
      detail: 'Toutes les assignations sont déjà publiées',
      life: 3000
    })
    return
  }

  // Demander confirmation
  if (!confirm(`Voulez-vous publier ${unpublishedCount} assignations non publiées pour ${selectedPFP.value} ${selectedYear.value}?\n\nCes assignations seront visibles dans le profil des étudiants.`)) {
    return
  }

  publishing.value = true
  try {
    console.log('[PUBLISH_ALL] Publication des assignations non publiées...')
    console.log(`PFP: ${selectedPFP.value}, Année: ${selectedYear.value}`)
    console.log(`Nombre d'assignations à publier: ${unpublishedCount}`)

    // Mettre à jour le statut des assignations non publiées
    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('pfp_type', selectedPFP.value)
      .eq('year', selectedYear.value)
      .eq('status', 'draft')

    if (error) {
      console.error('[ERROR] Erreur publication:', error)
      throw error
    }

    console.log('[SUCCESS] Assignations publiées avec succès')

    // Mettre à jour localement
    results.value = results.value.map(r => ({
      ...r,
      status: 'published'
    }))

    toast.add({
      severity: 'success',
      summary: 'Publication réussie',
      detail: `${unpublishedCount} assignations sont maintenant visibles par les étudiants`,
      life: 5000
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[ERROR] Erreur lors de la publication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de publier les assignations: ' + error.message,
      life: 5000
    })
  } finally {
    publishing.value = false
  }
}

// ============================================
// GESTION DES PRATICIENS FORMATEURS
// ============================================

// Auto-assigner les praticiens lorsqu'il n'y en a qu'un seul
const autoAssignPraticiens = async () => {
  // Trouver toutes les assignations qui nécessitent une auto-assignation
  const toAutoAssign = results.value.filter(r => r.needsAutoAssignment)
  
  if (toAutoAssign.length === 0) {
    console.log('[AUTO-ASSIGN] Aucune auto-assignation nécessaire')
    return
  }
  
  console.log(`[AUTO-ASSIGN] ${toAutoAssign.length} praticien(s) à auto-assigner`)
  
  try {
    // Sauvegarder en batch
    const updates = toAutoAssign.map(assignment => ({
      id: assignment.id,
      assigned_praticien_id: assignment.assigned_praticien_id,
      updated_at: new Date().toISOString()
    }))
    
    // Mettre à jour dans Supabase (un par un pour éviter les erreurs de transaction)
    let successCount = 0
    for (const update of updates) {
      const { error } = await supabase
        .from('student_result_vote')
        .update({ 
          assigned_praticien_id: update.assigned_praticien_id,
          updated_at: update.updated_at
        })
        .eq('id', update.id)
      
      if (error) {
        console.warn(`[AUTO-ASSIGN] Erreur pour ${update.id}:`, error)
      } else {
        successCount++
      }
    }
    
    console.log(`[AUTO-ASSIGN] ✅ ${successCount}/${toAutoAssign.length} praticien(s) auto-assigné(s)`)
    
    // Notification discrète
    if (successCount > 0) {
      toast.add({
        severity: 'info',
        summary: 'Auto-assignation',
        detail: `${successCount} praticien(s) unique(s) assigné(s) automatiquement`,
        life: 3000
      })
    }
    
    // Retirer les flags needsAutoAssignment
    results.value.forEach(r => {
      if (r.needsAutoAssignment) {
        r.needsAutoAssignment = false
      }
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[AUTO-ASSIGN] Erreur lors de l\'auto-assignation:', error)
  }
}

// Obtenir les options de praticiens pour le dropdown
const getPraticienOptions = (assignment) => {
  // Si la place a des praticiens configurés, les proposer en priorité
  if (assignment.praticiens_formateurs_list && assignment.praticiens_formateurs_list.length > 0) {
    return assignment.praticiens_formateurs_list.map(p => ({
      value: p.id,
      label: p.nom,
      mail: p.mail
    }))
  }
  
  // Sinon, proposer TOUS les praticiens disponibles
  return allPraticiens.value.map(p => ({
    value: p.id,
    label: `${p.prenom || ''} ${p.nom || ''}`.trim() || p.mail || `Praticien ${p.id}`,
    mail: p.mail
  }))
}

// Obtenir le nom d'un praticien par son ID
const getPraticienName = (praticienId) => {
  const praticien = allPraticiens.value.find(p => {
    const pId = p.id || p.PraticienId
    return pId == praticienId || 
           String(pId) === String(praticienId) || 
           Number(pId) === Number(praticienId)
  })
  
  if (praticien) {
    return `${praticien.prenom || ''} ${praticien.nom || ''}`.trim() || praticien.mail || `Praticien ${praticienId}`
  }
  
  return `Praticien ${praticienId}`
}

// Assigner un praticien formateur à une assignation
const assignPraticien = async (assignment, praticienId) => {
  console.log('[ASSIGN_PRATICIEN] Assignation praticien:', {
    assignment: assignment.student_name,
    praticienId,
    praticienName: praticienId ? getPraticienName(praticienId) : 'Aucun'
  })
  
  // Marquer comme en cours de sauvegarde
  assignment.savingPraticien = true
  
  try {
    // Mettre à jour dans Supabase
    const { error } = await supabase
      .from('student_result_vote')
      .update({ 
        assigned_praticien_id: praticienId,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
    
    if (error) {
      console.error('[ERROR] Erreur assignation praticien:', error)
      throw error
    }
    
    console.log('[SUCCESS] Praticien assigné avec succès')
    
    // Mettre à jour localement
    const index = results.value.findIndex(r => r.id === assignment.id)
    if (index !== -1) {
      results.value[index].assigned_praticien_id = praticienId
    }
    
    // Notification
    toast.add({
      severity: 'success',
      summary: 'Praticien assigné',
      detail: praticienId 
        ? `${getPraticienName(praticienId)} a été assigné à ${assignment.student_name}`
        : `Praticien retiré pour ${assignment.student_name}`,
      life: 3000
    })

    scheduleRefresh()
  } catch (error) {
    console.error('[ERROR] Erreur lors de l\'assignation du praticien:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'assigner le praticien: ' + error.message,
      life: 5000
    })
  } finally {
    assignment.savingPraticien = false
  }
}

// Watcher pour recharger automatiquement quand les filtres changent
watch([selectedPFP, selectedYear], () => {
  if (selectedPFP.value && selectedYear.value) {
    loadResults()
  }
})
</script>

<style scoped>
.assignment-page {
  min-height: calc(100vh - 100px);
}

.assignment-list {
  max-height: 500px;
  overflow-y: auto;
}

.student-card, .place-card {
  border: 1px solid var(--surface-border);
  transition: all 0.2s;
}

.student-card:hover, .place-card:hover {
  border-color: var(--primary-color);
}

/* Styles pour le dialog d'édition */
.places-selection-list {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0.5rem;
}

.place-option {
  border: 2px solid var(--surface-border);
  transition: all 0.2s;
  background: var(--surface-card);
}

.place-option:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.place-option.selected-place {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.place-option.selected-place:hover {
  background: var(--primary-100);
}
</style>
