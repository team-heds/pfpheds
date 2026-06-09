<template>
  <div class="p-4">
    <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="mb-1">Formation pratique en cours</h5>
        <p class="section-subtitle m-0">Affectations actives publiees pour cet etudiant.</p>
      </div>

      <Button
        v-if="isAdmin"
        label="Ajouter une affectation"
        icon="pi pi-plus"
        class="p-button-primary"
        @click="openAddAssignmentDialog"
      />
    </div>

    <div v-if="assignedPlaces.length">
      <div class="grid">
        <div
          v-for="(place, idx) in assignedPlaces"
          :key="place._key || idx"
          class="stage-card shadow-2 mb-3 flex flex-column gap-3"
        >
          <div class="flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="flex align-items-center gap-2 flex-wrap">
              <Tag
                v-if="place.year"
                :value="String(place.year)"
                severity="secondary"
                class="text-xs"
              />
              <Tag
                v-if="getVotationType(place)"
                :value="getVotationType(place)"
                :severity="getVotationTypeSeverity(place)"
              />
              <Tag
                v-if="place.pfpLevel || place.pfp_type"
                :value="place.pfpLevel || place.pfp_type"
                severity="info"
              />
            </div>

            <div class="flex gap-2 flex-wrap">
              <Button
                label="Voir les details"
                icon="pi pi-arrow-right"
                class="text-sm p-button-outlined p-button-primary details-btn"
                :disabled="!place.InstitutionId"
                @click="navigateToInstitution(place.InstitutionId)"
              />

              <Button
                v-if="isAdmin"
                label="Supprimer"
                icon="pi pi-trash"
                class="text-sm p-button-outlined p-button-danger"
                @click="confirmDeleteAssignment(place)"
              />
            </div>
          </div>

          <div>
            <h6 class="m-0 font-bold stage-title">
              {{
                place.Institution_name ||
                place.Institution ||
                getInstitutionNameById(place.InstitutionId) ||
                'Institution inconnue'
              }}
            </h6>

            <div class="stage-content">
              <div class="info-row">
                <span class="info-label">Domaine</span>
                <span>{{ place.NomPlace || 'Non renseigne' }}</span>
              </div>

              <div class="info-row align-start">
                <span class="info-label">Criteres</span>
                <div class="flex gap-2 flex-wrap">
                  <Tag
                    v-for="criterion in getValidCriterias(place)"
                    :key="criterion"
                    :value="criterion"
                    severity="info"
                    class="text-xs"
                  />
                  <span v-if="getValidCriterias(place).length === 0" class="text-400 text-sm">
                    Aucun
                  </span>
                </div>
              </div>

              <div class="info-row align-start">
                <span class="info-label">Praticien</span>
                <div class="flex flex-column gap-1">
                  <div class="flex align-items-center gap-2 flex-wrap">
                    <b v-if="getPraticienFormateurInfos(place)">{{
                      getPraticienFormateurInfos(place)
                    }}</b>
                    <span v-else class="text-400">Non attribue</span>
                    <Button
                      v-if="isAdmin"
                      icon="pi pi-pencil"
                      class="p-button-text p-button-plain p-button-sm"
                      @click="editPraticienFormateur(place)"
                      v-tooltip="'Modifier le praticien formateur'"
                    />
                  </div>

                  <a
                    v-if="getPraticienFormateurContact(place)"
                    :href="'mailto:' + getPraticienFormateurContact(place)"
                    class="text-primary font-bold stage-link"
                  >
                    {{ getPraticienFormateurContact(place) }}
                  </a>
                </div>
              </div>

              <div v-if="!place.InstitutionId" class="stage-warning">
                <i class="pi pi-exclamation-triangle"></i>
                <span
                  >L'institution liee a cette affectation est incomplete. Le detail peut etre
                  indisponible.</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state text-center p-4">
      <p class="text-secondary mb-0">
        <i class="pi pi-info-circle mr-2"></i>
        Aucune affectation PFP disponible pour cet utilisateur.
      </p>
    </div>
  </div>

  <Dialog
    v-model:visible="showAddAssignmentDialog"
    modal
    header="Ajouter une affectation PFP"
    :style="{ width: '600px' }"
  >
    <div class="flex flex-column gap-3">
      <div class="field">
        <label for="place">Selectionner une place</label>
        <Dropdown
          id="place"
          v-model="newAssignment.assigned_place_id"
          :options="availablePlaces"
          optionLabel="label"
          optionValue="value"
          placeholder="Choisir une place existante"
          class="w-full"
          filter
          @change="onPlaceSelected"
        />
      </div>

      <div class="field">
        <label>PFP actuelles de l'etudiant</label>
        <div class="border-1 border-round p-3 dialog-list">
          <div
            v-for="pfp in allStudentPfps"
            :key="pfp.id_pfp || pfp.ID_PFP || pfp._key"
            class="flex align-items-center justify-content-between p-2 border-bottom-1 cursor-pointer hover:bg-gray-100"
            @click="selectExistingPfp(pfp)"
          >
            <div class="flex-1">
              <div class="font-semibold">{{ pfp.NomPlace || pfp.nom_pfp || 'PFP sans nom' }}</div>
              <div class="text-sm text-secondary">
                {{ pfp.InstitutionName || pfp.institution_name || 'Institution inconnue' }}
              </div>
              <div class="text-xs text-gray-500">Type: {{ pfp.pfp_type || 'Non specifie' }}</div>
            </div>
            <div class="flex gap-2">
              <Button
                icon="pi pi-check"
                class="p-button-text p-button-sm p-button-success"
                v-tooltip="'Selectionner cette PFP'"
                @click.stop="selectExistingPfp(pfp)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="field">
        <label for="pfpType">Type PFP</label>
        <InputText
          id="pfpType"
          v-model="newAssignment.pfp_type"
          placeholder="Type de PFP (PFP1A, PFP1B, etc.)"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="praticien">Praticien formateur</label>
        <Dropdown
          id="praticien"
          v-model="newAssignment.praticien_formateur"
          :options="availablePraticiens"
          optionLabel="label"
          optionValue="value"
          placeholder="Selectionner un praticien formateur"
          class="w-full"
          filter
        />
      </div>
    </div>

    <template #footer>
      <Button label="Annuler" severity="secondary" outlined @click="cancelAddAssignment" />
      <Button label="Ajouter" @click="confirmAddAssignment" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showEditPraticienDialog"
    modal
    header="Modifier le praticien formateur"
    :style="{ width: '500px' }"
  >
    <div class="flex flex-column gap-3">
      <div class="field">
        <label for="praticien">Praticien formateur</label>
        <Dropdown
          id="praticien"
          v-model="editPraticienFormateurData.praticien_formateur"
          :options="availablePraticiens"
          optionLabel="label"
          optionValue="value"
          placeholder="Selectionner un praticien formateur"
          class="w-full"
          filter
        />
      </div>
    </div>

    <template #footer>
      <Button label="Annuler" severity="secondary" outlined @click="cancelEditPraticien" />
      <Button label="Enregistrer" @click="saveEditPraticien" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { supabase } from '@/supabase'
import {
  buildStageDedupKey,
  extractStudentsPhysioFieldEntries,
  normalizePfpType
} from '@/utils/profileStages'

const institutionsStore = useInstitutionsStore()
const router = useRouter()
const toast = useToast()

const props = defineProps({
  userId: { type: String, required: true }
})

const isAdmin = ref(false)
const showAddAssignmentDialog = ref(false)
const showEditPraticienDialog = ref(false)
const availablePlaces = ref([])
const availablePraticiens = ref([])
const allStudentPfps = ref([])
const supabasePlaces = ref([])
const supabasePraticiens = ref({})
const publishedAssignments = ref([])
const studentPfpList = ref([])
const currentEditingPlace = ref(null)
const refreshInterval = ref(null)

const newAssignment = ref({
  assigned_place_id: '',
  assigned_place_name: '',
  assigned_institution_name: '',
  pfp_type: '',
  year: new Date().getFullYear().toString(),
  praticien_formateur: ''
})

const editPraticienFormateurData = ref({
  placeId: '',
  praticien_formateur: ''
})

const placesById = computed(() => {
  const map = new Map()
  supabasePlaces.value.forEach((place) => {
    const candidates = [place.PlaceId, String(place.PlaceId), Number(place.PlaceId)].filter(
      (value) => value !== null && value !== undefined && value !== ''
    )
    candidates.forEach((candidate) => map.set(candidate, place))
  })
  return map
})

const fetchCurrentUser = async () => {
  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError) throw authError

    if (!user) {
      isAdmin.value = false
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) throw profileError
    isAdmin.value = profileData?.role === 'admin'
  } catch (error) {
    console.error('Erreur lors de la recuperation de l utilisateur:', error)
    isAdmin.value = false
  }
}

const fetchPublishedAssignments = async () => {
  try {
    const { data, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('user_id', props.userId)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (error) throw error
    publishedAssignments.value = data || []
  } catch (error) {
    console.error('Erreur lors de la recuperation des assignations:', error)
    publishedAssignments.value = []
  }
}

const fetchPlacesFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('places').select('*')

    if (error) throw error
    supabasePlaces.value = data || []
  } catch (error) {
    console.error('Erreur lors de la recuperation des places:', error)
    supabasePlaces.value = []
  }
}

const fetchPraticiensFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('praticiens_formateurs').select('*')

    if (error) throw error

    const praticiensMap = {}
    data?.forEach((praticien) => {
      const key = praticien.PraticienId || praticien.id
      if (key !== null && key !== undefined && key !== '') {
        praticiensMap[key] = praticien
        praticiensMap[String(key)] = praticien
        if (Number.isFinite(Number(key))) {
          praticiensMap[Number(key)] = praticien
        }
      }
    })

    supabasePraticiens.value = praticiensMap
  } catch (error) {
    console.error('Erreur lors de la recuperation des praticiens:', error)
    supabasePraticiens.value = {}
  }
}

const assignedPlacesFromPublished = computed(() => {
  if (publishedAssignments.value.length === 0) return []

  return publishedAssignments.value.map((assignment) => {
    const place =
      placesById.value.get(assignment.assigned_place_id) ||
      placesById.value.get(String(assignment.assigned_place_id)) ||
      placesById.value.get(Number(assignment.assigned_place_id))

    if (!place) {
      return {
        IDPlace: assignment.assigned_place_id,
        InstitutionId: null,
        NomPlace: assignment.assigned_place_name || 'Place inconnue',
        Institution: assignment.assigned_institution_name || 'Institution inconnue',
        Institution_name: assignment.assigned_institution_name || 'Institution inconnue',
        pfpLevel: assignment.pfp_type,
        pfp_type: assignment.pfp_type,
        year: assignment.year,
        assigned_rank: assignment.assigned_rank,
        pfp_validee: assignment.pfp_validee,
        pfp_echec: assignment.pfp_echec,
        pfp_arret: assignment.pfp_arret,
        assigned_praticien_id: assignment.assigned_praticien_id,
        _key: assignment.id
      }
    }

    const institutionName =
      assignment.assigned_institution_name ||
      place.InstitutionName ||
      place.Institution_name ||
      place.Institution ||
      getInstitutionNameById(place.InstitutionId) ||
      'Institution inconnue'

    return {
      ...place,
      IDPlace: place.PlaceId,
      InstitutionId: place.InstitutionId,
      NomPlace: assignment.assigned_place_name || place.NomPlace,
      Institution: institutionName,
      Institution_name: institutionName,
      pfpLevel: assignment.pfp_type,
      pfp_type: assignment.pfp_type,
      year: assignment.year,
      assigned_rank: assignment.assigned_rank,
      pfp_validee: assignment.pfp_validee,
      pfp_echec: assignment.pfp_echec,
      pfp_arret: assignment.pfp_arret,
      assigned_praticien_id: assignment.assigned_praticien_id,
      _key: assignment.id
    }
  })
})

const assignedPlaces = computed(() => {
  const publishedAssignmentsForDisplay = assignedPlacesFromPublished.value.filter((place) => {
    const isValidee =
      place.pfp_validee === true || place.pfp_validee === 'true' || place.pfp_validee === 1
    const isEchec = place.pfp_echec === true || place.pfp_echec === 'true' || place.pfp_echec === 1
    const isArret = place.pfp_arret === true || place.pfp_arret === 'true' || place.pfp_arret === 1
    return !isValidee && !isEchec && !isArret
  })

  const uniquePlaces = new Map()
  publishedAssignmentsForDisplay.forEach((place) => {
    const placeId = place.IDPlace || place.assigned_place_id || null
    const pfpType = normalizePfpType(place.pfpLevel || place.pfp_type || null)
    const year = place.year || null
    const key = buildStageDedupKey(placeId, pfpType, year, place._key || 'assignment')

    if (!uniquePlaces.has(key)) {
      uniquePlaces.set(key, place)
    }
  })

  return Array.from(uniquePlaces.values())
})

const getInstitutionNameById = (idInstitution) =>
  institutionsStore.getInstitutionNameById(idInstitution)

function getValidCriterias(place) {
  const criteriaKeys = ['AMBU', 'DE', 'FR', 'MSQ', 'NEUROGER', 'REHAB', 'SYSINT', 'AIGU']
  return criteriaKeys.filter((key) => {
    const value = place[key]
    return value === true || (typeof value === 'string' && value.toLowerCase() === 'true')
  })
}

function getPraticienFormateurId(place) {
  if (place.assigned_praticien_id) return place.assigned_praticien_id
  if (place.praticienId) return place.praticienId

  const seat = place.seatIndex
  if (!seat) {
    return Array.isArray(place.praticiensFormateurs) && place.praticiensFormateurs.length > 0
      ? place.praticiensFormateurs[0]
      : ''
  }

  const keysToTry = [
    `selectedPraticiensBA23PFP3-${seat}`,
    `selectedPraticienBA23PFP3-${seat}`,
    `selectedPraticiensBA22PFP4-${seat}`,
    `selectedPraticienBA22PFP4-${seat}`
  ]

  for (const key of keysToTry) {
    if (place[key]) return place[key]
  }

  return Array.isArray(place.praticiensFormateurs) && place.praticiensFormateurs.length > 0
    ? place.praticiensFormateurs[0]
    : ''
}

function getPraticienFormateurInfos(place) {
  const id = getPraticienFormateurId(place)
  if (!id) return ''

  const praticien =
    supabasePraticiens.value[id] ||
    supabasePraticiens.value[String(id)] ||
    supabasePraticiens.value[Number(id)]

  if (!praticien) return ''
  const prenom = praticien.prenom || praticien.Prenom || ''
  const nom = praticien.nom || praticien.Nom || ''
  return `${prenom} ${nom}`.trim()
}

function getPraticienFormateurContact(place) {
  if (place?.praticienMail) return place.praticienMail

  const praticienId = getPraticienFormateurId(place)
  const praticien =
    praticienId &&
    (supabasePraticiens.value[praticienId] ||
      supabasePraticiens.value[String(praticienId)] ||
      supabasePraticiens.value[Number(praticienId)])

  return praticien?.mail || praticien?.Mail || ''
}

function getVotationType(place) {
  if (place._key) {
    const assignment = publishedAssignments.value.find((item) => item.id === place._key)
    if (assignment) {
      if (
        assignment.assigned_rank &&
        assignment.assigned_rank >= 1 &&
        assignment.assigned_rank <= 5
      ) {
        return `Choix ${assignment.assigned_rank}`
      }
      return 'Hors choix de votation'
    }
  }

  if (place.seatIndex) {
    const seatNum = parseInt(place.seatIndex)
    if (seatNum >= 1 && seatNum <= 5) {
      return `Choix ${seatNum}`
    }
  }

  return 'Tirage aleatoire'
}

function getVotationTypeSeverity(place) {
  return getVotationType(place).startsWith('Choix') ? 'info' : 'success'
}

const fetchInstitutions = async () => {
  try {
    await institutionsStore.fetchInstitutions()
  } catch (error) {
    console.error('Erreur lors du chargement des institutions:', error)
  }
}

const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: 'InstitutionView', params: { id: instId } })
  }
}

const fetchStudentPfpList = async () => {
  try {
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp2_data')
      .eq('user_id', props.userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    studentPfpList.value = data?.length
      ? extractStudentsPhysioFieldEntries(data, ['pfp_valided', 'pfp2_data'])
      : []
  } catch (error) {
    studentPfpList.value = []
  }
}

watch(
  () => studentPfpList.value,
  () => {},
  { deep: true }
)

onMounted(async () => {
  await fetchInstitutions()
  await fetchCurrentUser()
  await Promise.all([
    fetchPublishedAssignments(),
    fetchPlacesFromSupabase(),
    fetchPraticiensFromSupabase(),
    fetchStudentPfpList(),
    fetchAvailablePlaces()
  ])

  refreshInterval.value = setInterval(async () => {
    await Promise.all([fetchPublishedAssignments(), fetchStudentPfpList()])
  }, 15000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const openAddAssignmentDialog = async () => {
  await Promise.all([fetchAvailablePlaces(), fetchAvailablePraticiens(), fetchAllStudentPfps()])
  showAddAssignmentDialog.value = true
}

const fetchAvailablePraticiens = async () => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id, nom, prenom, institution')
      .order('nom')

    if (error) throw error

    availablePraticiens.value = (data || []).map((praticien) => ({
      value: praticien.id,
      label: `${praticien.prenom} ${praticien.nom}${praticien.institution ? ` - ${praticien.institution}` : ''}`
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des praticiens:', error)
    availablePraticiens.value = []
  }
}

const fetchAvailablePlaces = async () => {
  try {
    const { data, error } = await supabase.from('places').select('*').order('NomPlace')

    if (error) throw error

    availablePlaces.value = (data || []).map((place) => ({
      value: place.PlaceId,
      label: `${place.NomPlace}${place.InstitutionName || place.Institution ? ` - ${place.InstitutionName || place.Institution}` : ''}`
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des places:', error)
    availablePlaces.value = []
  }
}

const onPlaceSelected = async (event) => {
  const selectedValue = event?.value ?? event
  const numericPlaceId = typeof selectedValue === 'string' ? parseInt(selectedValue) : selectedValue

  try {
    const { data: placeData, error } = await supabase
      .from('places')
      .select(
        'PlaceId, NomPlace, InstitutionName, Institution, InstitutionId, assigned_praticien_id'
      )
      .eq('PlaceId', numericPlaceId)
      .single()

    if (error) throw error

    newAssignment.value.assigned_place_id = placeData.PlaceId
    newAssignment.value.assigned_place_name = placeData.NomPlace
    newAssignment.value.assigned_institution_name =
      placeData.InstitutionName ||
      placeData.Institution ||
      getInstitutionNameById(placeData.InstitutionId) ||
      'Institution inconnue'
    newAssignment.value.praticien_formateur = placeData.assigned_praticien_id || ''
  } catch (error) {
    console.error('Erreur lors de la recuperation de la place:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les details de la place.',
      life: 4000
    })
  }
}

const cancelAddAssignment = () => {
  showAddAssignmentDialog.value = false
  newAssignment.value = {
    assigned_place_id: '',
    assigned_place_name: '',
    assigned_institution_name: '',
    pfp_type: '',
    year: new Date().getFullYear().toString(),
    praticien_formateur: ''
  }
}

const confirmAddAssignment = async () => {
  try {
    if (!newAssignment.value.assigned_place_id) {
      toast.add({
        severity: 'warn',
        summary: 'Affectation incomplete',
        detail: 'Selectionne une place avant de valider.',
        life: 3000
      })
      return
    }

    const { error } = await supabase.from('student_result_vote').insert({
      user_id: props.userId,
      assigned_place_id: newAssignment.value.assigned_place_id,
      assigned_place_name: newAssignment.value.assigned_place_name,
      assigned_institution_name: newAssignment.value.assigned_institution_name,
      pfp_type: newAssignment.value.pfp_type,
      year: newAssignment.value.year,
      assigned_praticien_id: newAssignment.value.praticien_formateur,
      status: 'published',
      pfp_validee: false,
      pfp_echec: false,
      pfp_arret: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    if (error) throw error

    cancelAddAssignment()
    toast.add({
      severity: 'success',
      summary: 'Affectation ajoutee',
      detail: 'La place a ete publiee pour cet etudiant.',
      life: 3000
    })
    await fetchPublishedAssignments()
  } catch (error) {
    console.error('Erreur lors de l ajout de l affectation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d ajouter l affectation.',
      life: 4000
    })
  }
}

const editPraticienFormateur = async (place) => {
  await fetchAvailablePraticiens()
  currentEditingPlace.value = place
  editPraticienFormateurData.value = {
    placeId: place.IDPlace || place.assigned_place_id,
    praticien_formateur: place.assigned_praticien_id || ''
  }
  showEditPraticienDialog.value = true
}

const saveEditPraticien = async () => {
  try {
    if (!editPraticienFormateurData.value.praticien_formateur) {
      toast.add({
        severity: 'warn',
        summary: 'Praticien manquant',
        detail: 'Selectionne un praticien formateur.',
        life: 3000
      })
      return
    }

    const { error } = await supabase
      .from('student_result_vote')
      .update({
        assigned_praticien_id: editPraticienFormateurData.value.praticien_formateur
      })
      .eq('id', currentEditingPlace.value._key)

    if (error) throw error

    showEditPraticienDialog.value = false
    currentEditingPlace.value = null
    toast.add({
      severity: 'success',
      summary: 'Praticien mis a jour',
      detail: 'La modification a ete enregistree.',
      life: 3000
    })
    await fetchPublishedAssignments()
  } catch (error) {
    console.error('Erreur lors de la mise a jour du praticien:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de mettre a jour le praticien.',
      life: 4000
    })
  }
}

const cancelEditPraticien = () => {
  showEditPraticienDialog.value = false
  currentEditingPlace.value = null
  editPraticienFormateurData.value = {
    placeId: '',
    praticien_formateur: ''
  }
}

const fetchAllStudentPfps = async () => {
  try {
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp2_data')
      .eq('user_id', props.userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    allStudentPfps.value = data?.length
      ? extractStudentsPhysioFieldEntries(data, ['pfp_valided', 'pfp2_data'])
      : []
  } catch (error) {
    console.error('Erreur lors du chargement des PFP:', error)
    allStudentPfps.value = []
  }
}

const selectExistingPfp = (pfp) => {
  newAssignment.value.assigned_place_id = pfp.id_pfp || pfp.ID_PFP || pfp.PlaceId || pfp._key
  newAssignment.value.assigned_place_name = pfp.NomPlace || pfp.nom_pfp || ''
  newAssignment.value.assigned_institution_name =
    pfp.InstitutionName || pfp.institution_name || pfp.Institution || ''
  newAssignment.value.pfp_type = pfp.pfp_type || ''
  newAssignment.value.praticien_formateur = pfp.assigned_praticien_id || ''
}

const confirmDeleteAssignment = async (place) => {
  const placeName = place.NomPlace || 'cette place'
  const institutionName = place.Institution_name || place.Institution || 'cette institution'
  const confirmation = window.confirm(
    `Etes-vous sur de vouloir supprimer l'affectation "${placeName}" a "${institutionName}" pour cet etudiant ?\n\nCette action est irreversible.`
  )

  if (!confirmation) return

  try {
    if (!place._key) {
      toast.add({
        severity: 'warn',
        summary: 'Action indisponible',
        detail: 'Suppression non disponible pour cette affectation.',
        life: 4000
      })
      return
    }

    const { error } = await supabase.from('student_result_vote').delete().eq('id', place._key)

    if (error) throw error

    toast.add({
      severity: 'success',
      summary: 'Affectation supprimee',
      detail: 'La place a ete retiree du profil.',
      life: 3000
    })
    await fetchPublishedAssignments()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer l affectation.',
      life: 4000
    })
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.section-subtitle {
  color: var(--text-color-secondary, #6b7280);
  font-size: 0.95rem;
}

.stage-card {
  background-color: var(--surface-card);
  padding: 1.5rem 1.75rem;
  border-radius: 12px;
  border-left: 5px solid #3b82f6;
  min-height: 180px;
  transition: box-shadow 0.2s ease;
}

.stage-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stage-title {
  color: var(--text-color, #111827);
}

.stage-content {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info-row.align-start {
  align-items: flex-start;
}

.info-label {
  min-width: 90px;
  color: var(--text-color-secondary, #6b7280);
  font-weight: 600;
}

.stage-link {
  text-decoration: underline;
}

.stage-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #b45309;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  padding: 0.65rem 0.75rem;
  font-size: 0.9rem;
}

.empty-state {
  background: var(--surface-card);
  border: 1px dashed var(--surface-border, #cbd5e1);
  border-radius: 0.8rem;
}

.dialog-list {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
}

.details-btn {
  min-width: 200px;
  width: 200px;
  height: 32px;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 991px) {
  .grid {
    gap: 1.2rem !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0 1.2rem;
    justify-content: center;
  }

  .stage-card {
    padding: 1.5rem 1.2rem !important;
    margin: 1.2rem 0 !important;
    min-width: 0;
    border-radius: 12px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-label {
    min-width: 0;
  }
}

@media (max-width: 600px) {
  .grid,
  .stage-card {
    padding-left: 0.4rem !important;
    padding-right: 0.4rem !important;
  }
}
</style>
