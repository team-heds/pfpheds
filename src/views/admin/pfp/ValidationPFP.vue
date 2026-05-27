<template>
  <AdminLayout>
    <div class="validation-pfp-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Validation PFP</h1>
              <p class="text-600 m-0 mt-1">Validation des stages PFP</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter PDF" outlined />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" outlined />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-map-marker text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.totalPlaces }}</h3>
                <p class="text-600 m-0">Places Totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.validated }}</h3>
                <p class="text-600 m-0">Validées</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.failed }}</h3>
                <p class="text-600 m-0">Échecs</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-pause text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.stopped }}</h3>
                <p class="text-600 m-0">Arrêts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-2 flex align-items-center gap-2">
            <InputSwitch v-model="showAllStudents" />
            <span class="text-600">Tous les étudiants</span>
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterType" :options="typesPFP" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Classe" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterStatus" :options="statusList" optionLabel="label" optionValue="value" placeholder="Statut" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Validation PFP -->
      <div class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-end gap-2 mb-3 flex-wrap">
          <div class="flex flex-column gap-1">
            <label class="text-sm font-semibold text-700">Validation en masse</label>
            <Dropdown
              v-model="bulkValidatePfpType"
              :options="typesPFP"
              optionLabel="label"
              optionValue="value"
              placeholder="Choisir un PFP"
              class="w-12rem"
            />
          </div>
          <Button
            icon="pi pi-check"
            label="Valider tout ce PFP"
            severity="success"
            @click="bulkValidateSelectedPfp"
            :disabled="!bulkValidatePfpType"
            :loading="bulkValidating"
          />
          <span class="text-xs text-500">Applique la validation aux lignes actuellement filtrées</span>
        </div>

        <DataTable :value="filteredPlacesList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="25">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Validations</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune validation trouvée</p>
            </div>
          </template>
          <Column field="student_name" header="Étudiant" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="(slotProps.data.student_name || '').charAt(0)" shape="circle" />
                <span>{{ slotProps.data.student_name }}</span>
              </div>
            </template>
          </Column>
          <Column field="student_class" header="Classe" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.student_class" :value="slotProps.data.student_class" severity="info" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="year" header="Année" sortable></Column>
          <Column field="pfp_type" header="PFP" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.pfp_type" :value="slotProps.data.pfp_type" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="place_name" header="Place attribuée" sortable></Column>
          <Column field="institution_name" header="Institution" sortable></Column>
          <Column field="praticien_formateur" header="Praticien formateur" sortable></Column>
          
          <!-- Checkboxes de validation -->
          <Column header="Validation PFP" style="min-width: 280px;">
            <template #body="slotProps">
              <div class="flex flex-column gap-2">
                <div class="flex align-items-center gap-2">
                  <Checkbox 
                    v-model="slotProps.data.pfp_validee" 
                    :binary="true"
                    @change="handleValidationChange(slotProps.data, 'validee')"
                  />
                  <label class="text-sm">PFP Validée</label>
                </div>
                <div class="flex align-items-center gap-2">
                  <Checkbox 
                    v-model="slotProps.data.pfp_echec" 
                    :binary="true"
                    @change="handleValidationChange(slotProps.data, 'echec')"
                  />
                  <label class="text-sm">PFP Échec</label>
                </div>
                <div class="flex align-items-center gap-2">
                  <Checkbox 
                    v-model="slotProps.data.pfp_arret" 
                    :binary="true"
                    @change="handleArretChange(slotProps.data)"
                  />
                  <label class="text-sm">PFP Arrêt</label>
                </div>
              </div>
            </template>
          </Column>

        </DataTable>

        <div class="flex justify-content-end mt-3">
          <Button icon="pi pi-file-excel" label="Exporter Excel" severity="success" outlined @click="exportExcel" />
        </div>
      </div>
    </div>

    <!-- Dialog pour le commentaire d'arrêt -->
    <Dialog 
      v-model:visible="showArretDialog" 
      modal 
      header="Motif de l'arrêt" 
      :style="{ width: '450px' }"
      :closable="false"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600 m-0">Veuillez indiquer le motif de l'arrêt de la PFP :</p>
        <Textarea 
          v-model="arretComment" 
          rows="4" 
          placeholder="Saisissez le motif de l'arrêt..."
          class="w-full"
        />
      </div>
      <template #footer>
        <Button label="Annuler" severity="secondary" outlined @click="cancelArret" />
        <Button label="Confirmer" @click="confirmArret" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Row from 'primevue/row'

const loading = ref(false)
const searchQuery = ref('')
const filterType = ref(null)
const filterYear = ref(null)
const filterClasse = ref(null)
const filterStatus = ref(null)
const placesList = ref([])
const allStudents = ref([])
const showAllStudents = ref(false)
const bulkValidatePfpType = ref(null)
const bulkValidating = ref(false)

// Dialog pour l'arrêt
const showArretDialog = ref(false)
const arretComment = ref('')
const currentRow = ref(null)

const years = ref(['2025', '2026'])
const classes = ref(['BA23', 'BA24', 'BA25'])
const typesPFP = ref([
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const rows = (filteredPlacesList.value || []).map((r) => ({
    etudiant: r.student_name || '',
    classe: r.student_class || '',
    annee: r.year || '',
    pfp: r.pfp_type || '',
    place: r.place_name || '',
    institution: r.institution_name || '',
    praticien_formateur: r.praticien_formateur || '',
    pfp_validee: r.pfp_validee ? 'Oui' : 'Non',
    pfp_echec: r.pfp_echec ? 'Oui' : 'Non',
    pfp_arret: r.pfp_arret ? 'Oui' : 'Non',
    commentaire_arret: r.commentaire_arret || ''
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'validations')

  const nameParts = ['validations']
  if (filterYear.value) nameParts.push(filterYear.value)
  if (filterType.value) nameParts.push(filterType.value)
  if (filterClasse.value) nameParts.push(filterClasse.value)
  const filename = `${nameParts.join('_')}.xlsx`

  XLSX.writeFile(wb, filename)
}

watch(showAllStudents, (val) => {
  if (val) {
    filterStatus.value = null
  } else {
    filterStatus.value = 'published'
  }
})

const statusList = ref([
  { label: 'Publié', value: 'published' },
  { label: 'Non attribué', value: 'unassigned' },
  { label: 'Tous', value: null }
])

const stats = ref({
  totalPlaces: 0,
  validated: 0,
  failed: 0,
  stopped: 0
})

const { scheduleRefresh } = useAutoRefresh(() => loadPublishedAssignments())

const getVotationTypeLabel = (assignment) => {
  if (!assignment) return 'Tirage aléatoire'
  if (assignment.assigned_rank && assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) {
    return `Choix ${assignment.assigned_rank}`
  }
  return 'Tirage aléatoire'
}

const getStudentName = (s) => {
  const studentNom = s?.Nom || s?.nom || s?.family_name || ''
  const studentPrenom = s?.Prenom || s?.prenom || s?.forname || ''
  return s?.display_name || `${studentNom.toUpperCase()} ${studentPrenom}`.trim() || 'N/A'
}

const getStudentClass = (s) => {
  return s?.Classe || s?.classe || s?.class || null
}

const getPraticienFullName = (p) => {
  if (!p) return ''
  const prenom = p.prenom || p.Prenom || ''
  const nom = p.nom || p.Nom || ''
  return `${prenom} ${nom}`.trim()
}

// Gestion des checkboxes
const handleValidationChange = async (row, type) => {
  // Si on coche une checkbox, décocher les autres
  if (type === 'validee' && row.pfp_validee) {
    row.pfp_echec = false
    row.pfp_arret = false
    row.commentaire_arret = ''
    await saveValidation(row)
  } else if (type === 'echec' && row.pfp_echec) {
    row.pfp_validee = false
    row.pfp_arret = false
    row.commentaire_arret = ''
    await saveValidation(row)
  } else if (type === 'validee' && !row.pfp_validee) {
    // Décoché - sauvegarder l'état et supprimer de pfp_valided
    await saveValidation(row)
    await removeFromStudentsPhysio(row)
  } else if (type === 'echec' && !row.pfp_echec) {
    // Décoché - sauvegarder l'état
    await saveValidation(row)
    await removeFromStudentsPhysio(row)
  }
  updateStats()
  scheduleRefresh()
}

// Sauvegarder la validation dans student_result_vote
const saveValidation = async (row) => {
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({
        pfp_validee: row.pfp_validee,
        pfp_echec: row.pfp_echec,
        pfp_arret: row.pfp_arret,
        commentaire_arret: row.commentaire_arret,
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id)

    if (error) throw error

    // Synchroniser avec StudentsPhysio si validé, échec ou arrêt
    if (row.pfp_validee || row.pfp_echec || row.pfp_arret) {
      await syncWithStudentsPhysio(row)
    }
  } catch (error) {
    console.error('Erreur sauvegarde validation:', error)
  }
}

const bulkValidateSelectedPfp = async () => {
  if (!bulkValidatePfpType.value || bulkValidating.value) return

  const targetRows = filteredPlacesList.value.filter(row =>
    row?.id &&
    row?.assigned_place_id &&
    row?.pfp_type === bulkValidatePfpType.value
  )

  if (targetRows.length === 0) {
    window.alert(`Aucune ligne à valider pour ${bulkValidatePfpType.value} avec les filtres actuels.`)
    return
  }

  const confirmed = window.confirm(
    `Valider ${targetRows.length} ligne(s) pour ${bulkValidatePfpType.value} ?`
  )
  if (!confirmed) return

  bulkValidating.value = true
  try {
    for (const row of targetRows) {
      row.pfp_validee = true
      row.pfp_echec = false
      row.pfp_arret = false
      row.commentaire_arret = ''
      await saveValidation(row)
    }

    updateStats()
    scheduleRefresh()
  } catch (error) {
    console.error('Erreur validation en masse:', error)
  } finally {
    bulkValidating.value = false
  }
}

// Synchroniser avec StudentsPhysio.pfp_valided
const syncWithStudentsPhysio = async (row) => {
  try {
    const { data: studentData, error: studentError } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp_2')
      .eq('user_id', row.user_id)
      .maybeSingle()

    if (studentError) throw studentError

    let pfpValided = []
    if (studentData?.pfp_valided) {
      try {
        pfpValided = typeof studentData.pfp_valided === 'string' 
          ? JSON.parse(studentData.pfp_valided) 
          : studentData.pfp_valided
      } catch (e) {
        pfpValided = []
      }
    }

    const { data: placeData } = await supabase
      .from('places')
      .select('AMBU, DE, FR, MSQ, NEUROGER, REHAB, SYSINT, AIGU, IT, ENG, NomPlace, InstitutionName, InstitutionId')
      .eq('PlaceId', row.assigned_place_id)
      .single()

    // Déterminer le status
    const status = row.pfp_validee ? 'validee' : (row.pfp_echec ? 'echec' : (row.pfp_arret ? 'arret' : 'normal'))

    // Filtrer les critères selon le status
    let criteriaToInclude = {}
    if (status === 'echec') {
      // Pour échec, ne transmettre que DE ou FR
      criteriaToInclude = {
        DE: placeData?.DE || false,
        FR: placeData?.FR || false
      }
    } else if (status === 'arret') {
      // Pour arrêt, ne transmettre aucun critère
      criteriaToInclude = {}
    } else {
      // Pour validee, transmettre tous les critères
      criteriaToInclude = {
        AMBU: placeData?.AMBU || false,
        DE: placeData?.DE || false,
        FR: placeData?.FR || false,
        MSQ: placeData?.MSQ || false,
        NEUROGER: placeData?.NEUROGER || false,
        REHAB: placeData?.REHAB || false,
        SYSINT: placeData?.SYSINT || false,
        AIGU: placeData?.AIGU || false,
        IT: placeData?.IT || false,
        ENG: placeData?.ENG || false
      }
    }

    const validationEntry = {
      PlaceId: row.assigned_place_id,
      ID_PFP: row.assigned_place_id,
      id_pfp: row.assigned_place_id,
      NomPlace: placeData?.NomPlace || row.place_name || row.assigned_place_name || '',
      nom_pfp: placeData?.NomPlace || row.place_name || row.assigned_place_name || '',
      Domaine: row.assigned_place_name || placeData?.NomPlace || '',
      InstitutionName: placeData?.InstitutionName || row.institution_name || row.assigned_institution_name || '',
      institution_name: placeData?.InstitutionName || row.institution_name || row.assigned_institution_name || '',
      InstitutionId: placeData?.InstitutionId || null,
      pfp_type: row.pfp_type,
      pfpLevel: row.pfp_type,
      year: row.year,
      praticien_formateur: row.praticien_formateur,
      status: status,
      commentaire_arret: row.commentaire_arret || '',
      ...criteriaToInclude,
      validated_at: new Date().toISOString()
    }

    // Match by pfp_type first, then by PlaceId/ID_PFP
    const existingIndex = pfpValided.findIndex(p => 
      (p.pfp_type === row.pfp_type || p.pfpLevel === row.pfp_type) ||
      (p.PlaceId === row.assigned_place_id || p.ID_PFP === row.assigned_place_id || p.id_pfp === row.assigned_place_id)
    )
    if (existingIndex >= 0) {
      pfpValided[existingIndex] = validationEntry
    } else {
      pfpValided.push(validationEntry)
    }

    // Update existing row, or insert if it doesn't exist
    const { error: updateError, count } = await supabase
      .from('StudentsPhysio')
      .update({
        pfp_valided: JSON.stringify(pfpValided),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', row.user_id)

    if (updateError) throw updateError

    // If no row was updated (row doesn't exist), insert a new one
    if (count === 0 && !studentData) {
      const { error: insertError } = await supabase
        .from('StudentsPhysio')
        .insert({
          user_id: row.user_id,
          pfp_valided: JSON.stringify(pfpValided),
          updated_at: new Date().toISOString()
        })
      if (insertError) throw insertError
    }

    console.log(`✅ pfp_valided synced for ${row.user_id} (${row.pfp_type}): status=${status}`)

  } catch (error) {
    console.error('Erreur synchronisation StudentsPhysio:', error)
  }
}

// Supprimer la validation de StudentsPhysio.pfp_valided
const removeFromStudentsPhysio = async (row) => {
  try {
    const { data: studentData, error: studentError } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided')
      .eq('user_id', row.user_id)
      .maybeSingle()

    if (studentError) throw studentError

    let pfpValided = []
    if (studentData?.pfp_valided) {
      try {
        pfpValided = typeof studentData.pfp_valided === 'string'
          ? JSON.parse(studentData.pfp_valided)
          : studentData.pfp_valided
      } catch (e) {
        pfpValided = []
      }
    }

    // Filtrer pour supprimer l'entrée correspondante (match by pfp_type or PlaceId/ID_PFP)
    const filteredPfpValided = pfpValided.filter(p => {
      const matchesPfpType = (p.pfp_type === row.pfp_type || p.pfpLevel === row.pfp_type)
      const matchesPlace = (p.PlaceId === row.assigned_place_id || p.ID_PFP === row.assigned_place_id || p.id_pfp === row.assigned_place_id)
      return !(matchesPfpType || matchesPlace)
    })

    const { error: updateError } = await supabase
      .from('StudentsPhysio')
      .update({
        pfp_valided: JSON.stringify(filteredPfpValided),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', row.user_id)

    if (updateError) throw updateError

  } catch (error) {
    console.error('Erreur suppression StudentsPhysio:', error)
  }
}

const handleArretChange = async (row) => {
  if (row.pfp_arret) {
    // Ouvrir le dialog pour le commentaire
    currentRow.value = row
    showArretDialog.value = true
  } else {
    // Décoché, effacer le commentaire et sauvegarder
    row.commentaire_arret = ''
    await saveValidation(row)
    await removeFromStudentsPhysio(row)
    updateStats()
    scheduleRefresh()
  }
}

const cancelArret = async () => {
  if (currentRow.value) {
    currentRow.value.pfp_arret = false
    currentRow.value.commentaire_arret = ''
    // Sauvegarder l'état décoché
    await saveValidation(currentRow.value)
    await removeFromStudentsPhysio(currentRow.value)
  }
  showArretDialog.value = false
  arretComment.value = ''
  currentRow.value = null
  updateStats()
  scheduleRefresh()
}

const confirmArret = async () => {
  if (currentRow.value) {
    currentRow.value.pfp_arret = true
    currentRow.value.commentaire_arret = arretComment.value
    // Décocher les autres checkboxes
    currentRow.value.pfp_validee = false
    currentRow.value.pfp_echec = false
    
    // Sauvegarder dans la base de données
    await saveValidation(currentRow.value)
  }
  showArretDialog.value = false
  arretComment.value = ''
  currentRow.value = null
  updateStats()
  scheduleRefresh()
}

const updateStats = () => {
  const rows = placesList.value || []
  stats.value = {
    totalPlaces: rows.length,
    validated: rows.filter(r => r.pfp_validee).length,
    failed: rows.filter(r => r.pfp_echec).length,
    stopped: rows.filter(r => r.pfp_arret).length
  }
}

const baseRows = computed(() => {
  const assignedOnly = (placesList.value || []).filter(r => r?.assigned_place_id)

  if (!showAllStudents.value) {
    return assignedOnly
  }

  const out = []
  const assignedByUser = new Map()
  ;(placesList.value || []).forEach(r => {
    if (!r?.user_id) return
    const list = assignedByUser.get(r.user_id) || []
    list.push(r)
    assignedByUser.set(r.user_id, list)
  })

  ;(allStudents.value || []).forEach(s => {
    const userId = s?.user_id || s?.id
    const candidates = (assignedByUser.get(userId) || []).filter(r => {
      if (filterYear.value && r.year !== filterYear.value) return false
      if (filterType.value && r.pfp_type !== filterType.value) return false
      return true
    })

    const assignment = candidates[0] || null
    out.push({
      user_id: userId,
      student_name: getStudentName(s),
      student_class: getStudentClass(s),
      year: assignment?.year || filterYear.value || null,
      pfp_type: assignment?.pfp_type || filterType.value || null,
      votation_type: assignment ? getVotationTypeLabel(assignment) : '-',
      assigned_place_id: assignment?.assigned_place_id || null,
      place_name: assignment?.place_name || '—',
      institution_name: assignment?.institution_name || '—',
      praticien_formateur: assignment?.praticien_formateur || '—',
      status: assignment?.status || 'unassigned',
      place: assignment?.place || null,
      _is_unassigned: !assignment,
      pfp_validee: assignment?.pfp_validee || false,
      pfp_echec: assignment?.pfp_echec || false,
      pfp_arret: assignment?.pfp_arret || false,
      commentaire_arret: assignment?.commentaire_arret || ''
    })
  })

  return out
})

const filteredPlacesList = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  let filtered = (baseRows.value || []).filter((row) => {
    if (filterYear.value && row.year !== filterYear.value) return false
    if (filterType.value && row.pfp_type !== filterType.value) return false
    if (filterClasse.value && row.student_class !== filterClasse.value) return false
    if (filterStatus.value && row.status !== filterStatus.value) return false
    if (!q) return true
    return (
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.place_name || '').toLowerCase().includes(q) ||
      (row.institution_name || '').toLowerCase().includes(q)
    )
  })
  
  // Trier par ordre alphabétique du nom de famille puis prénom
  return filtered.sort((a, b) => {
    // Extraire le nom de famille et prénom en gérant le format avec initiale
    const splitName = (fullName) => {
      if (!fullName) return { lastName: '', firstName: '' }
      
      // Gérer le format "S Samira" (initiale + espace + nom)
      const trimmed = fullName.trim()
      const parts = trimmed.split(' ')
      
      // Si le premier élément est une seule lettre, l'ignorer pour le tri
      if (parts.length > 1 && parts[0].length === 1) {
        const restName = parts.slice(1).join(' ')
        const restParts = restName.split(' ')
        if (restParts.length === 1) {
          return { lastName: restParts[0], firstName: '' }
        }
        return {
          lastName: restParts[restParts.length - 1] || '',
          firstName: restParts.slice(0, -1).join(' ') || ''
        }
      }
      
      // Format normal "Prénom Nom"
      if (parts.length === 1) {
        return { lastName: parts[0], firstName: '' }
      }
      return {
        lastName: parts[parts.length - 1] || '',
        firstName: parts.slice(0, -1).join(' ') || ''
      }
    }
    
    const nameA = splitName(a.student_name)
    const nameB = splitName(b.student_name)
    
    // D'abord comparer le nom de famille
    const lastNameCompare = nameA.lastName.localeCompare(nameB.lastName, 'fr')
    if (lastNameCompare !== 0) return lastNameCompare
    
    // Si même nom de famille, comparer le prénom
    return nameA.firstName.localeCompare(nameB.firstName, 'fr')
  })
})

const loadPublishedAssignments = async () => {
  loading.value = true
  try {
    const { data: assignments, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('status', 'published')

    if (error) throw error

    const students = await getAllStudents()
    allStudents.value = students || []
    const studentsById = new Map((students || []).map(s => [s.user_id || s.id, s]))

    const placeIds = Array.from(
      new Set((assignments || []).map(a => a.assigned_place_id).filter(Boolean))
    )

    const placesById = new Map()
    const institutionsById = new Map()
    const praticiensById = new Map()
    if (placeIds.length > 0) {
      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('PlaceId,NomPlace,InstitutionName,InstitutionId,praticiensFormateurs,PFP1A,PFP1B,PFP2,PFP3,PFP4')
        .in('PlaceId', placeIds)

      if (placesError) throw placesError
      ;(places || []).forEach(p => placesById.set(p.PlaceId, p))

      const institutionIds = Array.from(
        new Set((places || []).map(p => p?.InstitutionId).filter(Boolean))
      )

      if (institutionIds.length > 0) {
        const { data: insts, error: instsError } = await supabase
          .from('institutions')
          .select('InstitutionId,Name')
          .in('InstitutionId', institutionIds)

        if (instsError) throw instsError
        ;(insts || []).forEach(i => {
          if (i?.InstitutionId) institutionsById.set(i.InstitutionId, i?.Name || '')
        })
      }
    }

    const { data: praticiens, error: praticiensError } = await supabase
      .from('praticiens_formateurs')
      .select('*')

    if (praticiensError) throw praticiensError
    ;(praticiens || []).forEach(p => {
      const id = p?.id ?? p?.PraticienId
      if (id === undefined || id === null) return
      praticiensById.set(String(id), getPraticienFullName(p))
      praticiensById.set(Number(id), getPraticienFullName(p))
    })

    placesList.value = (assignments || []).map(a => {
      const s = studentsById.get(a.user_id) || null
      const studentName = getStudentName(s)
      const studentClass = getStudentClass(s)

      const place = placesById.get(a.assigned_place_id) || null
      const placeName = place?.NomPlace || 'N/A'
      const institutionName =
        place?.InstitutionName ||
        place?.Institution_name ||
        place?.institution_name ||
        (place?.InstitutionId ? (institutionsById.get(place.InstitutionId) || null) : null)

      const assignedPraticienId = a?.assigned_praticien_id
      const praticienNameFromAssignment = assignedPraticienId
        ? (praticiensById.get(assignedPraticienId) || praticiensById.get(String(assignedPraticienId)) || null)
        : null

      const praticiensList = Array.isArray(place?.praticiensFormateurs) ? place.praticiensFormateurs : []
      const praticienNameFromPlace = praticiensList.length
        ? praticiensList
            .map((pid) => praticiensById.get(pid) || praticiensById.get(String(pid)) || String(pid))
            .filter(Boolean)
            .join(', ')
        : null

      const praticienFormateur = praticienNameFromAssignment || praticienNameFromPlace || null

      return {
        ...a,
        student_name: studentName,
        student_class: studentClass,
        votation_type: getVotationTypeLabel(a),
        place_name: placeName,
        institution_name: institutionName,
        praticien_formateur: praticienFormateur,
        place,
        pfp_validee: a.pfp_validee || false,
        pfp_echec: a.pfp_echec || false,
        pfp_arret: a.pfp_arret || false,
        commentaire_arret: a.commentaire_arret || ''
      }
    })

    updateStats()
  } catch (e) {
    console.error('Erreur loadPublishedAssignments:', e)
    placesList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  filterStatus.value = 'published'
  await loadPublishedAssignments()
})
</script>

<style scoped>
.validation-pfp-page {
  min-height: calc(100vh - 100px);
}
</style>
