<template>
  <AdminLayout>
    <Toast />
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">
          <i class="pi pi-home mr-1"></i>Formation Pratique
        </router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Correction PFP1 BA24</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-pencil text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Correction PFP1 BA24</h1>
              <p class="text-600 m-0 mt-2">
                Réécriture explicite des places de stage PFP1 dans <code>StudentsPhysio.pfp_valided</code>.
              </p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <InputSwitch v-model="limitToPfp1Places" />
            <span class="text-600 text-sm">Limiter aux places avec offre PFP1</span>
            <Button icon="pi pi-refresh" outlined :loading="loading" @click="loadData" />
          </div>
        </div>
        <ProgressBar v-if="loading" mode="indeterminate" style="height: 4px" class="mt-3" />
      </div>

      <div class="grid mb-3">
        <div class="col-12 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ rows.length }}</div>
            <div class="text-600 text-sm mt-1">Étudiants BA24</div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-green-400">{{ placeOptions.length }}</div>
            <div class="text-600 text-sm mt-1">Places sélectionnables</div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ assignedRowsCount }}</div>
            <div class="text-600 text-sm mt-1">PFP1 déjà renseignées</div>
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2 mb-3">
        <div class="grid">
          <div class="col-12 md:col-5">
            <InputText
              v-model="searchTerm"
              placeholder="Rechercher un étudiant, une place ou une institution"
              class="w-full"
            />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tous les statuts"
              showClear
              class="w-full"
            />
          </div>
          <div class="col-12 md:col-4 flex align-items-center gap-2">
            <Tag :value="`${filteredRows.length} ligne(s)`" severity="info" />
            <Tag value="La sauvegarde remplace uniquement la PFP1" severity="warning" />
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <DataTable
          :value="filteredRows"
          dataKey="row_key"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[20, 50, 100]"
          responsiveLayout="scroll"
          sortField="family_name"
          :sortOrder="1"
        >
          <template #empty>Aucun étudiant BA24 trouvé.</template>

          <Column header="Étudiant" :style="{ minWidth: '220px' }">
            <template #body="{ data }">
              <div class="flex flex-column gap-1">
                <strong class="text-900">{{ data.displayName }}</strong>
                <span class="text-600 text-sm">{{ data.email || 'Email manquant' }}</span>
                <div class="flex gap-1 flex-wrap">
                  <Tag :value="data.classe || 'BA24'" severity="info" class="text-xs" />
                  <Tag :value="data.hasStudentPhysio ? 'StudentsPhysio OK' : 'StudentsPhysio manquant'" :severity="data.hasStudentPhysio ? 'success' : 'warning'" class="text-xs" />
                </div>
              </div>
            </template>
          </Column>

          <Column header="PFP1 actuelle" :style="{ minWidth: '280px' }">
            <template #body="{ data }">
              <div class="flex flex-column gap-1">
                <strong class="text-900">{{ data.currentPlaceLabel || 'Non renseignée' }}</strong>
                <span class="text-600 text-sm">{{ data.currentInstitutionName || 'Institution non résolue' }}</span>
                <div class="flex gap-1 flex-wrap">
                  <Tag :value="data.currentStatusLabel" :severity="data.currentPlaceId ? 'success' : 'warning'" class="text-xs" />
                  <Tag v-for="criterion in data.currentCriteria" :key="criterion" :value="criterion" severity="secondary" class="text-xs" />
                </div>
              </div>
            </template>
          </Column>

          <Column header="Nouvelle place" :style="{ minWidth: '420px' }">
            <template #body="{ data }">
              <Dropdown
                v-model="selectedPlaceIds[data.row_key]"
                :options="placeOptions"
                optionLabel="label"
                optionValue="value"
                filter
                filterPlaceholder="Rechercher une place..."
                placeholder="Sélectionner une place"
                class="w-full"
                :virtualScrollerOptions="{ itemSize: 38 }"
              >
                <template #option="slotProps">
                  <div class="flex flex-column">
                    <span>{{ slotProps.option.label }}</span>
                    <small class="text-500">{{ slotProps.option.meta }}</small>
                  </div>
                </template>
              </Dropdown>
              <div v-if="selectedPlaceMap[data.row_key]" class="mt-2 flex gap-1 flex-wrap">
                <Tag v-for="criterion in selectedPlaceMap[data.row_key].criteria" :key="criterion" :value="criterion" severity="info" class="text-xs" />
                <Tag v-if="selectedPlaceMap[data.row_key].pfp1aCount > 0" :value="`PFP1A: ${selectedPlaceMap[data.row_key].pfp1aCount}`" severity="success" class="text-xs" />
                <Tag v-if="selectedPlaceMap[data.row_key].pfp1bCount > 0" :value="`PFP1B: ${selectedPlaceMap[data.row_key].pfp1bCount}`" severity="success" class="text-xs" />
              </div>
            </template>
          </Column>

          <Column header="Actions" :style="{ width: '170px', textAlign: 'center' }">
            <template #body="{ data }">
              <div class="flex justify-content-center gap-2">
                <Button
                  icon="pi pi-save"
                  label="Sauver"
                  size="small"
                  :disabled="!selectedPlaceIds[data.row_key] || !data.resolvedUserId"
                  :loading="savingUserIds[data.row_key] === true"
                  @click="saveRow(data)"
                />
                <Button
                  icon="pi pi-times"
                  outlined
                  size="small"
                  severity="secondary"
                  @click="resetSelection(data.row_key)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '@/supabase'
import { db, isFirebaseEnabled } from '../../../../firebase'
import { get, ref as dbRef } from 'firebase/database'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

const toast = useToast()

const loading = ref(false)
const rows = ref([])
const places = ref([])
const institutionsMap = ref(new Map())
const selectedPlaceIds = ref({})
const savingUserIds = ref({})
const searchTerm = ref('')
const statusFilter = ref(null)
const limitToPfp1Places = ref(false)

const statusOptions = [
  { label: 'À corriger', value: 'missing' },
  { label: 'Déjà renseignées', value: 'assigned' },
]

function normalizeBool(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function parseJsonLike(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

async function loadLegacyBa24Students() {
  if (!isFirebaseEnabled || !db) return []

  const [studentsSnapshot, usersSnapshot] = await Promise.all([
    get(dbRef(db, 'Students')),
    get(dbRef(db, 'Users')),
  ])

  const studentsData = studentsSnapshot.exists() ? studentsSnapshot.val() : {}
  const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {}
  const result = []

  Object.entries(studentsData || {}).forEach(([key, value]) => {
    if (!value) return

    if (key === 'BA24' && typeof value === 'object') {
      Object.entries(value).forEach(([studentId, studentRow]) => {
        const userRow = usersData?.[studentId] || {}
        result.push({
          user_id: studentId,
          firebase_id: studentId,
          family_name: userRow.Nom || studentRow?.Nom || '',
          forname: userRow.Prenom || studentRow?.Prenom || '',
          email: userRow.Mail || studentRow?.Mail || '',
          classe: studentRow?.Classe || studentRow?.Class || 'BA24',
          permissions: [],
          is_active: true,
          _legacyOnly: true,
        })
      })
      return
    }

    const studentRow = value
    const classe = studentRow?.Classe || studentRow?.Class || ''
    if (!String(classe).toUpperCase().startsWith('BA24')) return

    const userRow = usersData?.[key] || {}
    result.push({
      user_id: studentRow?.user_id || '',
      firebase_id: key,
      family_name: userRow.Nom || studentRow?.Nom || '',
      forname: userRow.Prenom || studentRow?.Prenom || '',
      email: userRow.Mail || studentRow?.Mail || '',
      classe: classe || 'BA24',
      permissions: [],
      is_active: true,
      _legacyOnly: true,
    })
  })

  return result
}

function getCriteriaFromPlace(place) {
  return CRITERIA_KEYS.filter((key) => normalizeBool(place?.[key]))
}

function getOfferCount(place, field) {
  const raw = place?.[field]
  if (raw == null) return 0
  if (typeof raw === 'number') return raw > 0 ? raw : 0
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }
  if (typeof raw === 'object') {
    return Object.values(raw).reduce((sum, value) => {
      const parsed = Number.parseInt(value, 10)
      return sum + (Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
    }, 0)
  }
  return 0
}

function isPfp1Place(place) {
  return getOfferCount(place, 'PFP1A') > 0 || getOfferCount(place, 'PFP1B') > 0
}

function getCurrentPfp1Entry(studentPhysio) {
  const pfpValided = parseJsonLike(studentPhysio?.pfp_valided, [])
  if (!Array.isArray(pfpValided) || pfpValided.length === 0) return null

  const explicitEntry = pfpValided.find((entry) => {
    const type = String(entry?.pfp_type || entry?.pfpLevel || '').toUpperCase()
    return type === 'PFP1' || type === 'PFP1A' || type === 'PFP1B'
  })

  return explicitEntry || pfpValided[0] || null
}

function buildPlaceLabel(place, institutionName) {
  const tags = []
  if (institutionName) tags.push(institutionName)
  if (place?.NomPlace) tags.push(place.NomPlace)
  return tags.join(' - ')
}

const placeOptions = computed(() => {
  return places.value.map((place) => {
    const institution = institutionsMap.value.get(place.InstitutionId)
    const institutionName = institution?.Name || place.InstitutionName || 'Institution inconnue'
    const criteria = getCriteriaFromPlace(place)
    return {
      value: place.PlaceId,
      label: buildPlaceLabel(place, institutionName),
      meta: [institution?.Locality, institution?.Canton].filter(Boolean).join(' - '),
      criteria,
      pfp1aCount: getOfferCount(place, 'PFP1A'),
      pfp1bCount: getOfferCount(place, 'PFP1B'),
    }
  })
})

const placeOptionMap = computed(() => {
  return new Map(placeOptions.value.map((option) => [option.value, option]))
})

const selectedPlaceMap = computed(() => {
  const map = {}
  Object.entries(selectedPlaceIds.value).forEach(([rowKey, placeId]) => {
    map[rowKey] = placeOptionMap.value.get(placeId) || null
  })
  return map
})

const assignedRowsCount = computed(() => rows.value.filter((row) => !!row.currentPlaceId).length)

const filteredRows = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    if (statusFilter.value === 'assigned' && !row.currentPlaceId) return false
    if (statusFilter.value === 'missing' && row.currentPlaceId) return false

    if (!query) return true

    return [
      row.displayName,
      row.email,
      row.currentPlaceLabel,
      row.currentInstitutionName,
    ].some((value) => String(value || '').toLowerCase().includes(query))
  })
})

async function loadData() {
  loading.value = true
  try {
    const [
      profilesResult,
      studentsPhysioResult,
      placesResult,
      institutionsResult,
      legacyBa24Students,
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id, family_name, forname, email, classe, role, permissions, is_active')
        .ilike('classe', 'BA24%')
        .or('role.eq.EtudiantPhysio,permissions.cs.["EtudiantPhysio"]')
        .eq('is_active', true)
        .order('family_name')
        .order('forname'),
      supabase
        .from('StudentsPhysio')
        .select('id, user_id, firebase_id, pfp_valided, pfpinfo, updated_at, pfp1a'),
      supabase
        .from('places')
        .select('PlaceId, NomPlace, InstitutionId, InstitutionName, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE, PFP1A, PFP1B'),
      supabase
        .from('institutions')
        .select('InstitutionId, Name, Locality, Canton'),
      loadLegacyBa24Students(),
    ])

    if (profilesResult.error) throw profilesResult.error
    if (studentsPhysioResult.error) throw studentsPhysioResult.error
    if (placesResult.error) throw placesResult.error
    if (institutionsResult.error) throw institutionsResult.error

    const institutionMap = new Map((institutionsResult.data || []).map((institution) => [institution.InstitutionId, institution]))
    institutionsMap.value = institutionMap

    const nextPlaces = (placesResult.data || []).filter((place) => !limitToPfp1Places.value || isPfp1Place(place))
    places.value = nextPlaces

    const physioByUserId = new Map((studentsPhysioResult.data || []).map((row) => [row.user_id, row]))
    const physioByFirebaseId = new Map((studentsPhysioResult.data || []).filter((row) => !!row.firebase_id).map((row) => [row.firebase_id, row]))
    const nextSelected = {}
    const profilesByUserId = new Map()
    const mergedProfiles = []

    ;(profilesResult.data || []).forEach((profile) => {
      profilesByUserId.set(profile.user_id, profile)
      mergedProfiles.push(profile)
    })

    ;(legacyBa24Students || []).forEach((legacyProfile) => {
      const alreadyPresentByUserId = legacyProfile.user_id && profilesByUserId.has(legacyProfile.user_id)
      const alreadyPresentByFirebase = mergedProfiles.some((profile) => profile.firebase_id && profile.firebase_id === legacyProfile.firebase_id)
      if (!alreadyPresentByUserId && !alreadyPresentByFirebase) {
        mergedProfiles.push(legacyProfile)
      }
    })

    rows.value = mergedProfiles.map((profile) => {
      const studentPhysio = physioByUserId.get(profile.user_id) || physioByFirebaseId.get(profile.firebase_id) || null
      const currentEntry = getCurrentPfp1Entry(studentPhysio)
      const currentPlaceId = currentEntry?.PlaceId || currentEntry?.ID_Place || currentEntry?.ID_PFP || currentEntry?.id_pfp || ''
      const currentInstitutionName = currentEntry?.InstitutionName || currentEntry?.institution_name || ''
      const currentPlaceLabel = currentEntry?.NomPlace || currentEntry?.nom_pfp || currentEntry?.Domaine || ''
      const currentCriteria = CRITERIA_KEYS.filter((key) => normalizeBool(currentEntry?.[key]))

      const rowKey = profile.user_id || `firebase:${profile.firebase_id}` || `legacy:${profile.email}` || `legacy:${profile.family_name}:${profile.forname}`

      nextSelected[rowKey] = currentPlaceId || null

      return {
        row_key: rowKey,
        user_id: profile.user_id || '',
        resolvedUserId: profile.user_id || studentPhysio?.user_id || '',
        firebase_id: profile.firebase_id || studentPhysio?.firebase_id || null,
        family_name: profile.family_name || '',
        forname: profile.forname || '',
        displayName: `${profile.family_name || ''} ${profile.forname || ''}`.trim() || profile.email || profile.user_id,
        email: profile.email || '',
        classe: profile.classe || 'BA24',
        currentPlaceId,
        currentPlaceLabel,
        currentInstitutionName,
        currentCriteria,
        currentStatusLabel: currentPlaceId ? 'PFP1 présente' : 'PFP1 absente',
        hasStudentPhysio: !!studentPhysio,
        legacyOnly: !!profile._legacyOnly,
        studentPhysio,
      }
    })

    selectedPlaceIds.value = nextSelected
  } catch (error) {
    console.error('Erreur chargement correction PFP1 BA24:', error)
    toast.add({
      severity: 'error',
      summary: 'Chargement impossible',
      detail: error?.message || 'Erreur lors du chargement des données BA24',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

function buildPfp1Entry(place) {
  const institution = institutionsMap.value.get(place.InstitutionId)
  const institutionName = institution?.Name || place.InstitutionName || ''
  const criteriaFlags = CRITERIA_KEYS.reduce((acc, key) => {
    acc[key] = normalizeBool(place[key])
    return acc
  }, {})

  return {
    PlaceId: place.PlaceId,
    ID_Place: place.PlaceId,
    ID_PFP: place.PlaceId,
    id_pfp: place.PlaceId,
    InstitutionId: place.InstitutionId || null,
    institution_id: place.InstitutionId || null,
    InstitutionName: institutionName,
    institution_name: institutionName,
    NomPlace: place.NomPlace || '',
    nom_pfp: place.NomPlace || '',
    Domaine: place.NomPlace || '',
    selected_places: place.PlaceId,
    nom_complet_pfp: buildPlaceLabel(place, institutionName),
    pfp_type: 'PFP1',
    pfpLevel: 'PFP1',
    status: 'validee',
    validated_at: new Date().toISOString(),
    ...criteriaFlags,
  }
}

function normalizePfpValidedForWrite(existingValue) {
  const parsed = parseJsonLike(existingValue, [])
  return Array.isArray(parsed) ? [...parsed] : []
}

function getFirstNonPfp1StageIndex(pfpValided) {
  if (!Array.isArray(pfpValided) || pfpValided.length === 0) return -1

  return pfpValided.findIndex((entry) => {
    const type = String(entry?.pfp_type || entry?.pfpLevel || '').toUpperCase()
    return type && type !== 'PFP1' && type !== 'PFP1A' && type !== 'PFP1B'
  })
}

async function saveRow(row) {
  const selectedPlaceId = selectedPlaceIds.value[row.row_key]
  const place = places.value.find((item) => item.PlaceId === selectedPlaceId)
  if (!place) {
    toast.add({
      severity: 'warn',
      summary: 'Place manquante',
      detail: 'Sélectionne une place valide avant de sauvegarder.',
      life: 3000,
    })
    return
  }

  if (!row.resolvedUserId) {
    toast.add({
      severity: 'warn',
      summary: 'user_id manquant',
      detail: 'Cette ligne legacy n’a pas encore de user_id Supabase exploitable.',
      life: 3500,
    })
    return
  }

  savingUserIds.value = { ...savingUserIds.value, [row.row_key]: true }

  try {
    const currentStudentPhysio = row.studentPhysio
    const pfpValided = normalizePfpValidedForWrite(currentStudentPhysio?.pfp_valided)
    const nextEntry = buildPfp1Entry(place)
    const firstNonPfp1Index = getFirstNonPfp1StageIndex(pfpValided)
    const remainingEntries = firstNonPfp1Index >= 0
      ? pfpValided.slice(firstNonPfp1Index)
      : []
    const nextPfpValided = [nextEntry, ...remainingEntries]

    const pfpInfo = parseJsonLike(currentStudentPhysio?.pfpinfo, {})
    pfpInfo.pfp1 = {
      ...(pfpInfo.pfp1 || {}),
      selected_stage_id: place.PlaceId,
      selected_stage_name: buildPlaceLabel(place, institutionsMap.value.get(place.InstitutionId)?.Name || place.InstitutionName || ''),
    }

    const pfpValidedPayload = typeof currentStudentPhysio?.pfp_valided === 'string'
      ? JSON.stringify(nextPfpValided)
      : nextPfpValided
    const pfpInfoPayload = typeof currentStudentPhysio?.pfpinfo === 'string'
      ? JSON.stringify(pfpInfo)
      : pfpInfo

    if (currentStudentPhysio?.id) {
      const { error } = await supabase
        .from('StudentsPhysio')
        .update({
          pfp1a: true,
          pfp_valided: pfpValidedPayload,
          pfpinfo: pfpInfoPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStudentPhysio.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('StudentsPhysio')
        .insert({
          user_id: row.resolvedUserId,
          pfp1a: true,
          pfp_valided: pfpValidedPayload,
          pfpinfo: pfpInfoPayload,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    }

    toast.add({
      severity: 'success',
      summary: 'PFP1 enregistrée',
      detail: `${row.displayName} → ${place.NomPlace}`,
      life: 2500,
    })

    await loadData()
  } catch (error) {
    console.error('Erreur sauvegarde PFP1 BA24:', error)
    toast.add({
      severity: 'error',
      summary: 'Sauvegarde impossible',
      detail: error?.message || 'La PFP1 n’a pas pu être enregistrée.',
      life: 4000,
    })
  } finally {
    savingUserIds.value = { ...savingUserIds.value, [row.row_key]: false }
  }
}

function resetSelection(rowKey) {
  const row = rows.value.find((item) => item.row_key === rowKey)
  selectedPlaceIds.value = {
    ...selectedPlaceIds.value,
    [rowKey]: row?.currentPlaceId || null,
  }
}

watch(limitToPfp1Places, () => {
  loadData()
})

loadData()
</script>

<style scoped>
@import '@/assets/styles/fp-dark.css';
</style>
