<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Profil Répondant</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Profil Répondant</h1>
              <p class="text-600 m-0 mt-2">
                {{ isActualRepondant ? 'Mes étudiants assignés' : 'Consultation des étudiants par répondant' }}
              </p>
            </div>
          </div>
          
          <div class="flex align-items-center gap-3">
            <!-- Mode consultation pour les admins ou si autorisé -->
            <div v-if="!isActualRepondant || isAdmin" class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Voir en tant que :</label>
              <Dropdown 
                v-model="selectedRepondant" 
                :options="repondantsHESList" 
                optionLabel="label" 
                placeholder="Sélectionner un répondant" 
                class="w-full md:w-15rem"
                filter
                showClear
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Message si non répondant et rien sélectionné -->
      <div v-if="!effectiveRepondantName" class="surface-card p-8 border-round shadow-2 text-center">
        <i class="pi pi-search text-400 text-6xl mb-4"></i>
        <h2 class="text-2xl font-medium text-600">Veuillez sélectionner un répondant pour voir ses étudiants</h2>
      </div>

      <!-- Contenu (Liste simplifiée) -->
      <div v-else>
        <!-- Statistiques par classe (pour le répondant sélectionné) -->
        <div class="surface-card p-4 border-round shadow-2 mb-4">
          <h3 class="text-xl font-bold text-900 m-0 mb-4">Répartition par classe ({{ effectiveRepondantName }})</h3>
          <div class="grid">
            <div v-for="(count, classe) in respondentClassStats" :key="classe" class="col-12 md:col-3">
              <div class="surface-card p-3 border-round text-center">
                <div class="text-2xl font-bold text-primary">{{ count }}</div>
                <div class="text-sm text-600">{{ classe }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="surface-card p-4 border-round shadow-2">
          <DataTable
            :value="filteredAssignedStudents"
            :loading="loading"
            responsiveLayout="scroll"
            :paginator="true"
            :rows="20"
            dataKey="user_id"
            v-model:expandedRows="expandedRows"
          >
            <template #header>
              <div class="flex justify-content-between align-items-center">
                <div class="flex flex-column">
                  <span class="text-xl text-900 font-bold">
                    Étudiants dont {{ effectiveRepondantName }} est le répondant
                  </span>
                  <div class="flex gap-4 mt-2">
                    <span class="text-sm text-600">
                      <strong>{{ filteredAssignedStudents.length }}</strong> étudiants assignés
                    </span>
                    <span class="text-sm text-600">
                      sur <strong>{{ allStudents.length }}</strong> étudiants au total
                    </span>
                  </div>
                  <div class="flex gap-2 mt-2">
                    <span class="p-input-icon-left">
                      <i class="pi pi-filter" />
                      <Dropdown 
                        v-model="selectedClassFilter" 
                        :options="classFilterOptions" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Filtrer par classe" 
                        showClear
                        class="w-full md:w-10rem"
                      />
                    </span>
                    <Button 
                      :label="sortOrder === 'asc' ? 'Tri A-Z' : 'Tri Z-A'" 
                      :icon="sortOrder === 'asc' ? 'pi pi-sort-alpha-down' : 'pi pi-sort-alpha-up'" 
                      outlined 
                      severity="secondary"
                      @click="toggleSortOrder" 
                    />
                  </div>
                </div>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText v-model="globalSearch" placeholder="Rechercher un étudiant..." />
                </span>
              </div>
            </template>
            <template #empty> Aucun étudiant trouvé pour ce répondant. </template>

            <Column expander style="width: 3rem" />

            <Column header="Étudiant" sortable sortField="student_name">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <Avatar :label="(data.student_name || '').charAt(0)" shape="circle" />
                  <div class="flex flex-column">
                    <span class="font-bold">{{ data.student_name }}</span>
                    <span class="text-sm text-600">{{ data.Mail }}</span>
                    <span class="text-xs text-500">{{ data.stageDetails?.length || 0 }} stage(s)</span>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="student_class" header="Classe" class="text-center" sortable style="width: 10rem" />

            <Column header="Action" class="text-center" style="width: 8rem">
              <template #body="{ data }">
                <Button label="Profil" icon="pi pi-user" size="small" outlined @click="goToEtudiantDetails(data.user_id)" />
              </template>
            </Column>

            <template #expansion="{ data }">
              <div class="p-3 surface-ground border-round">
                <div class="text-900 font-semibold mb-2">Stages de {{ data.student_name }}</div>
                <DataTable :value="data.stageDetails || []" responsiveLayout="scroll" size="small">
                  <template #empty>Aucun stage assigné trouvé pour cet étudiant.</template>

                  <Column field="pfp_type" header="PFP" style="width: 7rem" />
                  <Column field="praticien_name" header="PF" />
                  <Column field="praticien_contact" header="Contact PF" />
                  <Column field="institution_name" header="Institution" />
                  <Column field="place_name" header="Place de stage" />
                  <Column field="criteria_text" header="Critères" />
                  <Column field="year" header="Année" style="width: 8rem" />
                </DataTable>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useUserStore } from '@/stores/userStore'
import studentsService from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { PROFILE_CRITERIA_KEYS, parseBooleanFlag, normalizePfpType, getYearSortValue, parsePfpEntries, resolvePlaceId } from '@/utils/profileStages'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const repondantsHESList = ref([])
const selectedRepondant = ref(null)
const allStudents = ref([])
const expandedRows = ref({})
const globalSearch = ref('')
const selectedClassFilter = ref(null)
const sortOrder = ref('asc')
const PFP_TYPE_BY_INDEX = ['PFP1', 'PFP2', 'PFP3', 'PFP4']
const PFP_TYPES = ['PFP1', 'PFP2', 'PFP3', 'PFP4']

const getPraticienName = (praticien) => {
  if (!praticien) return '-'
  const firstName = praticien.prenom || praticien.Prenom || praticien.first_name || ''
  const lastName = praticien.nom || praticien.Nom || praticien.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || praticien.name || '-'
}

const getPraticienContact = (praticien) => {
  if (!praticien) return '-'
  return praticien.mail || praticien.Mail || praticien.email || praticien.Email || praticien.telephone || praticien.phone || '-'
}

const getCriteriaText = (source) => {
  if (!source) return '-'
  const activeCriteria = PROFILE_CRITERIA_KEYS.filter((key) => {
    const lowerKey = key.toLowerCase()
    return parseBooleanFlag(source[key]) || parseBooleanFlag(source[lowerKey])
  })
  return activeCriteria.length ? activeCriteria.join(', ') : '-'
}

const getPfpSortValue = (pfpType) => {
  const match = String(pfpType || '').match(/PFP\s*(\d+)/i)
  return match ? Number(match[1]) : 99
}

const parseYearSafe = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : -1
}

const parseDateSafe = (value) => {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : 0
}

const shouldReplacePhysioRow = (currentRow, candidateRow) => {
  if (!currentRow) return true
  const currentYear = parseYearSafe(currentRow.year)
  const candidateYear = parseYearSafe(candidateRow.year)
  if (candidateYear !== currentYear) return candidateYear > currentYear

  const currentUpdatedAt = Math.max(parseDateSafe(currentRow.updated_at), parseDateSafe(currentRow.created_at))
  const candidateUpdatedAt = Math.max(parseDateSafe(candidateRow.updated_at), parseDateSafe(candidateRow.created_at))
  return candidateUpdatedAt > currentUpdatedAt
}

const normalizeRepondantName = (value) => String(value || '').trim().toLowerCase()
const normalizePfp = (value) => normalizePfpType(value)
const normalizePlaceName = (value) => String(value || '').trim().toLowerCase()

const getLegacyPraticienName = (stage) => (
  stage?.praticien_formateur ||
  stage?.praticienName ||
  stage?.nom_praticien ||
  stage?.praticien ||
  stage?.PF ||
  '-'
)

const getLegacyPraticienContact = (stage) => (
  stage?.mail_praticien ||
  stage?.email_praticien ||
  stage?.contact_praticien ||
  stage?.praticien_mail ||
  stage?.praticien_email ||
  stage?.mailPF ||
  '-'
)

// Options pour le filtre par classe
const classFilterOptions = computed(() => {
  const classes = [...new Set(allStudents.value.map(s => s.student_class).filter(Boolean))]
  return classes.map(classe => ({ label: classe, value: classe })).sort((a, b) => a.label.localeCompare(b.label))
})

// Profil du répondant connecté
const currentRepondantProfile = ref(null)
const isActualRepondant = computed(() => !!currentRepondantProfile.value)
const isAdmin = computed(() => userStore.profile?.roles?.includes('admin'))

const effectiveRepondantName = computed(() => {
  if (selectedRepondant.value) return selectedRepondant.value.value
  if (currentRepondantProfile.value) {
    return `${currentRepondantProfile.value.first_name} ${currentRepondantProfile.value.last_name}`
  }
  return null
})

const respondentClassStats = computed(() => {
  const stats = {}
  filteredAssignedStudents.value.forEach(student => {
    const classe = student.student_class || 'Non défini'
    stats[classe] = (stats[classe] || 0) + 1
  })
  return stats
})

const filteredAssignedStudents = computed(() => {
  if (!effectiveRepondantName.value) return []
  const effectiveName = normalizeRepondantName(effectiveRepondantName.value)
  
  let list = allStudents.value.filter((s) => normalizeRepondantName(s.repondant_hes) === effectiveName)
  
  // Filtre par classe
  if (selectedClassFilter.value) {
    list = list.filter(s => s.student_class === selectedClassFilter.value)
  }
  
  // Recherche globale
  if (globalSearch.value) {
    const search = globalSearch.value.toLowerCase()
    list = list.filter(s => 
      s.student_name.toLowerCase().includes(search) || 
      s.Mail?.toLowerCase().includes(search) ||
      s.student_class?.toLowerCase().includes(search)
    )
  }
  
  // Tri alphabétique
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  return [...list].sort((a, b) => {
    const nameA = a.student_name || ''
    const nameB = b.student_name || ''
    const res = collator.compare(nameA, nameB)
    return sortOrder.value === 'asc' ? res : -res
  })
})

const loadCurrentRepondantProfile = async () => {
  if (!userStore.user?.id) return
  try {
    const { data, error } = await supabase
      .from('RepondantPhysioHES')
      .select('*')
      .eq('user_id', userStore.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    currentRepondantProfile.value = data
  } catch (e) {
    console.error('Erreur loadCurrentRepondantProfile:', e)
  }
}

const loadRepondantsHES = async () => {
  try {
    const { data, error } = await supabase
      .from('RepondantPhysioHES')
      .select('id, first_name, last_name')
      .eq('is_active', true)
      .order('last_name')

    if (error) throw error
    repondantsHESList.value = (data || []).map(r => ({
      id: r.id,
      label: `${r.first_name} ${r.last_name}`,
      value: `${r.first_name} ${r.last_name}`
    }))
  } catch (e) {
    console.error('Erreur loadRepondantsHES:', e)
  }
}

const fetchAllStudentsData = async () => {
  loading.value = true
  try {
    const [
      students,
      { data: physioData },
      { data: assignmentData },
      { data: praticiensData },
      { data: placesData },
      { data: institutionsData }
    ] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, repondant_hes, pfp_valided, pfp2_data, year, updated_at, created_at'),
      supabase
        .from('student_result_vote')
        .select('id, user_id, pfp_type, year, status, assigned_place_id, assigned_place_name, assigned_institution_name, assigned_praticien_id')
        .order('year', { ascending: false }),
      supabase.from('praticiens_formateurs').select('id, prenom, nom, mail, email, telephone, phone'),
      supabase
        .from('places')
        .select('PlaceId, InstitutionId, NomPlace, Institutionname, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE'),
      supabase.from('institutions').select('InstitutionId, Name')
    ])

    const physioByUserId = new Map()
    const repondantByUserId = new Map()
    ;(physioData || []).forEach((sp) => {
      if (!sp?.user_id) return
      const current = physioByUserId.get(sp.user_id)
      if (shouldReplacePhysioRow(current, sp)) {
        physioByUserId.set(sp.user_id, sp)
      }

      const candidateName = String(sp.repondant_hes || '').trim()
      if (!candidateName) return

      const currentForRepondant = repondantByUserId.get(sp.user_id)
      if (shouldReplacePhysioRow(currentForRepondant, sp)) {
        repondantByUserId.set(sp.user_id, sp)
      }
    })

    const institutionById = new Map()
    ;(institutionsData || []).forEach((inst) => {
      if (!inst?.InstitutionId) return
      institutionById.set(inst.InstitutionId, inst.Name || '')
      institutionById.set(String(inst.InstitutionId), inst.Name || '')
    })

    const praticienById = new Map()
    ;(praticiensData || []).forEach((pf) => {
      if (!pf?.id) return
      praticienById.set(pf.id, pf)
      praticienById.set(String(pf.id), pf)
    })

    const placeById = new Map()
    const placeByName = new Map()
    ;(placesData || []).forEach((place) => {
      if (!place) return
      const placeId = place.PlaceId || place.IdPlace || place.id_pfp || place.ID_PFP || null
      const placeName = place.NomPlace || place.Name || place.name || ''
      const enrichedPlace = {
        ...place,
        PlaceId: placeId,
        NomPlace: placeName,
        Institutionname: place.Institutionname || institutionById.get(place.InstitutionId) || ''
      }

      if (placeId) {
        placeById.set(placeId, enrichedPlace)
        placeById.set(String(placeId), enrichedPlace)
      }

      const normalizedName = normalizePlaceName(placeName)
      if (normalizedName && !placeByName.has(normalizedName)) {
        placeByName.set(normalizedName, enrichedPlace)
      }
    })

    const assignmentByUserAndPfp = new Map()
    ;(assignmentData || []).forEach((assignment) => {
      if (!assignment?.user_id) return
      const normalizedType = normalizePfpType(assignment.pfp_type)
      if (!normalizedType) return

      const key = `${assignment.user_id}__${normalizedType}`
      if (!assignmentByUserAndPfp.has(key)) {
        assignmentByUserAndPfp.set(key, assignment)
      }
    })

    const validatedStageByUserAndPfp = new Map()
    ;(physioData || []).forEach((sp) => {
      if (!sp?.user_id) return
      const entries = [
        ...parsePfpEntries(sp.pfp_valided),
        ...parsePfpEntries(sp.pfp2_data)
      ]

      if (entries.length === 0) return

      entries.forEach((entry, index) => {
        const rawType = entry?.pfp_type || entry?.pfpLevel || PFP_TYPE_BY_INDEX[index] || ''
        const normalizedType = normalizePfp(rawType)
        if (!normalizedType) return

        const key = `${sp.user_id}__${normalizedType}`
        if (!validatedStageByUserAndPfp.has(key)) validatedStageByUserAndPfp.set(key, entry)
      })
    })

    allStudents.value = students.map(s => ({
      ...s,
      user_id: s.id,
      student_name: `${(s.Nom || '').toUpperCase()} ${s.Prenom || ''}`.trim(),
      student_class: s.Classe || '-',
      repondant_hes: repondantByUserId.get(s.id)?.repondant_hes || physioByUserId.get(s.id)?.repondant_hes || null,
      stageDetails: PFP_TYPES.map((pfpType) => {
        const key = `${s.id}__${pfpType}`
        const assignment = assignmentByUserAndPfp.get(key)
        const validatedStage = validatedStageByUserAndPfp.get(key)

        let placeId = null
        if (assignment) placeId = assignment.assigned_place_id || null
        else if (validatedStage) placeId = resolvePlaceId(validatedStage)

        let place = placeId ? (placeById.get(placeId) || placeById.get(String(placeId))) : null
        if (!place) {
          const assignmentPlaceName = assignment?.assigned_place_name
          const validatedPlaceName = validatedStage?.NomPlace || validatedStage?.nom_pfp || validatedStage?.Nom_PFP
          const fallbackPlaceName = assignmentPlaceName || validatedPlaceName
          place = placeByName.get(normalizePlaceName(fallbackPlaceName)) || null
        }
        const praticien = assignment?.assigned_praticien_id
          ? (praticienById.get(assignment.assigned_praticien_id) || praticienById.get(String(assignment.assigned_praticien_id)))
          : null

        const criteriaFromPlace = getCriteriaText(place)
        const criteriaFromValidated = validatedStage ? getCriteriaText(validatedStage) : '-'
        const criteriaText = criteriaFromPlace !== '-' ? criteriaFromPlace : criteriaFromValidated

        if (assignment) {
          return {
            _id: assignment.id || `${assignment.user_id}_${assignment.pfp_type}_${assignment.year || 'na'}`,
            pfp_type: pfpType,
            praticien_name: getPraticienName(praticien) !== '-' ? getPraticienName(praticien) : getLegacyPraticienName(validatedStage),
            praticien_contact: getPraticienContact(praticien) !== '-' ? getPraticienContact(praticien) : getLegacyPraticienContact(validatedStage),
            institution_name: assignment.assigned_institution_name || place?.Institutionname || validatedStage?.Institution || validatedStage?.institution_name || '-',
            place_name: assignment.assigned_place_name || place?.NomPlace || validatedStage?.NomPlace || validatedStage?.nom_pfp || validatedStage?.Nom_PFP || '-',
            criteria_text: criteriaText,
            year: assignment.year || validatedStage?.year || '-'
          }
        }

        if (validatedStage) {
          return {
            _id: `${s.id}_${pfpType}_validated`,
            pfp_type: pfpType,
            praticien_name: getLegacyPraticienName(validatedStage),
            praticien_contact: getLegacyPraticienContact(validatedStage),
            institution_name: validatedStage?.Institution || validatedStage?.institution_name || place?.Institutionname || '-',
            place_name: validatedStage?.NomPlace || validatedStage?.nom_pfp || validatedStage?.Nom_PFP || place?.NomPlace || '-',
            criteria_text: criteriaText,
            year: validatedStage?.year || '-'
          }
        }

        return null
      }).filter(Boolean).sort((a, b) => {
        const pfpDiff = getPfpSortValue(a.pfp_type) - getPfpSortValue(b.pfp_type)
        if (pfpDiff !== 0) return pfpDiff

        return getYearSortValue(b.year) - getYearSortValue(a.year)
      })
    }))
  } catch (e) {
    console.error('Erreur fetchAllStudentsData:', e)
  } finally {
    loading.value = false
  }
}

const goToEtudiantDetails = (userId) => {
  router.push({ name: 'Profile', params: { id: userId } })
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

onMounted(async () => {
  await Promise.all([
    loadCurrentRepondantProfile(),
    loadRepondantsHES(),
    fetchAllStudentsData()
  ])
})
</script>
