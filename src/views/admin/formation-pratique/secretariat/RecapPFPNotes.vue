<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-file text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Récapitulatif PFP Notes</h1>
              <p class="text-600 m-0 mt-2">Toutes les colonnes du fichier Excel PFP - Notes (A-B-C-D-E-F), absences et remarques</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <InputText v-model="filterName" placeholder="Nom" class="w-full md:w-10rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown 
                v-model="filterYear"
                :options="years" 
                placeholder="Année" 
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown 
                v-model="filterClass" 
                :options="classOptions" 
                placeholder="Classe" 
                class="w-full md:w-9rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP (statut) :</label>
              <Dropdown 
                v-model="filterStatusPfp" 
                :options="pfpStatusOptions" 
                optionLabel="label" 
                optionValue="value" 
                class="w-full md:w-8rem"
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut :</label>
              <Dropdown 
                v-model="filterStatus" 
                :options="statusOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Statut" 
                class="w-full md:w-8rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <Button
                label="Enregistrer"
                icon="pi pi-save"
                class="p-button-sm"
                :loading="isSavingAll"
                @click="saveAllNotes"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredNotes"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="20"
          :sortField="'etudiant'"
          :sortOrder="1"
          class="notes-table"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Notes PFP</span>
            </div>
          </template>
          <Column header="" style="width: 3rem;">
            <template #body="{ data }">
              <button class="expand-toggle" type="button" @click="openPfpDialog(data)">
                <i class="pi pi-plus"></i>
              </button>
            </template>
          </Column>
          <Column field="etudiant" header="Étudiant" sortable></Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="year" header="Année" sortable></Column>
          <Column header="PFP1A">
            <template #body="{ data }">
              <div :class="['note-cell', { 'is-disabled': isPfp1aLocked(data) }]">
                <Dropdown v-model="data.pfp1a" :options="gradeOptions" optionLabel="label" optionValue="value" placeholder="Note" class="note-dropdown" :disabled="isPfp1aLocked(data)" @update:modelValue="queueSave(data)" />
                <span class="status-badge status-compact" :class="statusClass(getPfpFinalStatus(data.pfp1a, data.pfp1a_retake))">
                  {{ getPfpFinalStatus(data.pfp1a, data.pfp1a_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="showRetakePfp1a" header="Rattrap. PFP1A">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown
                  v-if="getNoteStatusByValue(data.pfp1a) === 'Échec' && !isPfp1aLocked(data)"
                  v-model="data.pfp1a_retake"
                  :options="gradeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Rattrap."
                  class="note-dropdown"
                  @update:modelValue="queueSave(data)"
                />
                <span v-else class="text-600">-</span>
                <span
                  v-if="getNoteStatusByValue(data.pfp1a) === 'Échec' && !isPfp1aLocked(data)"
                  class="status-badge status-compact"
                  :class="statusClass(getNoteStatusByValue(data.pfp1a_retake))"
                >
                  {{ getNoteStatusByValue(data.pfp1a_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="PFP1B">
            <template #body="{ data }">
              <div :class="['note-cell', { 'is-disabled': isPfp1bLocked(data) }]">
                <Dropdown v-model="data.pfp1b" :options="gradeOptions" optionLabel="label" optionValue="value" placeholder="Note" class="note-dropdown" :disabled="isPfp1bLocked(data)" @update:modelValue="queueSave(data)" />
                <span class="status-badge status-compact" :class="statusClass(getPfpFinalStatus(data.pfp1b, data.pfp1b_retake))">
                  {{ getPfpFinalStatus(data.pfp1b, data.pfp1b_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="showRetakePfp1b" header="Rattrap. PFP1B">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown
                  v-if="getNoteStatusByValue(data.pfp1b) === 'Échec' && !isPfp1bLocked(data)"
                  v-model="data.pfp1b_retake"
                  :options="gradeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Rattrap."
                  class="note-dropdown"
                  @update:modelValue="queueSave(data)"
                />
                <span v-else class="text-600">-</span>
                <span
                  v-if="getNoteStatusByValue(data.pfp1b) === 'Échec' && !isPfp1bLocked(data)"
                  class="status-badge status-compact"
                  :class="statusClass(getNoteStatusByValue(data.pfp1b_retake))"
                >
                  {{ getNoteStatusByValue(data.pfp1b_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="PFP2">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown v-model="data.pfp2" :options="gradeOptions" optionLabel="label" optionValue="value" placeholder="Note" class="note-dropdown" @update:modelValue="queueSave(data)" />
                <span class="status-badge status-compact" :class="statusClass(getPfpFinalStatus(data.pfp2, data.pfp2_retake))">
                  {{ getPfpFinalStatus(data.pfp2, data.pfp2_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="showRetakePfp2" header="Rattrap. PFP2">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown
                  v-if="getNoteStatusByValue(data.pfp2) === 'Échec'"
                  v-model="data.pfp2_retake"
                  :options="gradeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Rattrap."
                  class="note-dropdown"
                  @update:modelValue="queueSave(data)"
                />
                <span v-else class="text-600">-</span>
                <span
                  v-if="getNoteStatusByValue(data.pfp2) === 'Échec'"
                  class="status-badge status-compact"
                  :class="statusClass(getNoteStatusByValue(data.pfp2_retake))"
                >
                  {{ getNoteStatusByValue(data.pfp2_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="PFP3">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown v-model="data.pfp3" :options="gradeOptions" optionLabel="label" optionValue="value" placeholder="Note" class="note-dropdown" @update:modelValue="queueSave(data)" />
                <span class="status-badge status-compact" :class="statusClass(getPfpFinalStatus(data.pfp3, data.pfp3_retake))">
                  {{ getPfpFinalStatus(data.pfp3, data.pfp3_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="showRetakePfp3" header="Rattrap. PFP3">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown
                  v-if="getNoteStatusByValue(data.pfp3) === 'Échec'"
                  v-model="data.pfp3_retake"
                  :options="gradeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Rattrap."
                  class="note-dropdown"
                  @update:modelValue="queueSave(data)"
                />
                <span v-else class="text-600">-</span>
                <span
                  v-if="getNoteStatusByValue(data.pfp3) === 'Échec'"
                  class="status-badge status-compact"
                  :class="statusClass(getNoteStatusByValue(data.pfp3_retake))"
                >
                  {{ getNoteStatusByValue(data.pfp3_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="PFP4">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown v-model="data.pfp4" :options="gradeOptions" optionLabel="label" optionValue="value" placeholder="Note" class="note-dropdown" @update:modelValue="queueSave(data)" />
                <span class="status-badge status-compact" :class="statusClass(getPfpFinalStatus(data.pfp4, data.pfp4_retake))">
                  {{ getPfpFinalStatus(data.pfp4, data.pfp4_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="showRetakePfp4" header="Rattrap. PFP4">
            <template #body="{ data }">
              <div class="note-cell">
                <Dropdown
                  v-if="getNoteStatusByValue(data.pfp4) === 'Échec'"
                  v-model="data.pfp4_retake"
                  :options="gradeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Rattrap."
                  class="note-dropdown"
                  @update:modelValue="queueSave(data)"
                />
                <span v-else class="text-600">-</span>
                <span
                  v-if="getNoteStatusByValue(data.pfp4) === 'Échec'"
                  class="status-badge status-compact"
                  :class="statusClass(getNoteStatusByValue(data.pfp4_retake))"
                >
                  {{ getNoteStatusByValue(data.pfp4_retake) }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="Statut">
            <template #body="{ data }">
              <span class="status-badge" :class="statusClass(getOverallStatus(data))">
                {{ getOverallStatus(data) }}
              </span>
            </template>
          </Column>
          <Column v-if="showAbsencesIndicator" header="Abs.">
            <template #body="{ data }">
              <span
                v-if="hasAnyAbsence(data)"
                class="indicator indicator-absence"
                title="Absences présentes"
              ></span>
              <span v-else class="indicator-placeholder">—</span>
            </template>
          </Column>
          <Column v-if="showRemarksIndicator" header="Rem.">
            <template #body="{ data }">
              <span
                v-if="hasAnyRemark(data)"
                class="indicator indicator-remark"
                title="Remarques présentes"
              ></span>
              <span v-else class="indicator-placeholder">—</span>
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="showPfpDialog" modal header="Absences & remarques" :style="{ width: '720px' }">
          <div v-if="selectedStudent" class="pfp-dialog">
            <div class="pfp-dialog-header">
              <div class="pfp-dialog-title">{{ selectedStudent.etudiant }}</div>
              <div class="pfp-dialog-meta">
                <span>{{ selectedStudent.classe }}</span>
                <span>·</span>
                <span>{{ selectedStudent.year }}</span>
              </div>
            </div>
            <div class="pfp-dialog-grid">
              <div v-for="pfp in pfpMeta" :key="pfp.key" :class="['pfp-dialog-row', { 'is-disabled': isPfpLocked(pfp.key, selectedStudent) }]">
                <div class="pfp-label">{{ pfp.label }}</div>
                <InputNumber
                  v-model="selectedStudent[pfpAbsenceKey(pfp.key)]"
                  :min="0"
                  :step="0.5"
                  :disabled="isPfpLocked(pfp.key, selectedStudent)"
                  placeholder="Jours"
                  class="pfp-absence"
                  @update:modelValue="queueSave(selectedStudent)"
                />
                <Textarea
                  v-model="selectedStudent[pfpRemarkKey(pfp.key)]"
                  :disabled="isPfpLocked(pfp.key, selectedStudent)"
                  placeholder="Remarques"
                  autoResize
                  class="pfp-remark"
                  @update:modelValue="queueSave(selectedStudent)"
                />
              </div>
            </div>
          </div>
          <template #footer>
            <Button label="Fermer" class="p-button-text" @click="showPfpDialog = false" />
          </template>
        </Dialog>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'

const loading = ref(false)
const notes = ref([])
const filterName = ref('')
const filterYear = ref(null)
const filterClass = ref(null)
const filterStatus = ref(null)
const filterStatusPfp = ref('pfp1a')
const showPfpDialog = ref(false)
const selectedStudent = ref(null)
const isHydrating = ref(false)
const saveTimers = new Map()
const lastSaveToastAt = ref(0)
const toast = useToast()
const isSavingAll = ref(false)
const gradeOptions = ref([
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' }
])

const pfpStatusOptions = ref([
  { label: 'PFP1A', value: 'pfp1a' },
  { label: 'PFP1B', value: 'pfp1b' },
  { label: 'PFP2', value: 'pfp2' },
  { label: 'PFP3', value: 'pfp3' },
  { label: 'PFP4', value: 'pfp4' }
])

const statusOptions = ref([
  { label: 'Réussi', value: 'Réussi' },
  { label: 'Échec', value: 'Échec' },
  { label: 'Non noté', value: 'Non noté' }
])

const years = ref(['2025', '2026'])
const activeYear = computed(() => filterYear.value || years.value[0])

const classOptions = computed(() => {
  const values = notes.value
    .map(note => note.classe)
    .filter(Boolean)
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)))
})

const parseBachelorYear = (value) => {
  const match = String(value ?? '').toUpperCase().match(/BA\s*(\d{2})/)
  if (!match) return null
  const year = Number(match[1])
  return Number.isFinite(year) ? year : null
}

const getBachelorYearFromPermissions = (permissions) => {
  if (!Array.isArray(permissions)) return null
  for (const perm of permissions) {
    const year = parseBachelorYear(perm)
    if (year !== null) return year
  }
  return null
}

const getBachelorYearForProfile = (profile) => (
  parseBachelorYear(profile?.classe)
  ?? parseBachelorYear(profile?.pfp_cohort)
  ?? getBachelorYearFromPermissions(profile?.permissions)
)

const isEligibleBachelorProfile = (profile) => {
  const year = getBachelorYearForProfile(profile)
  return year !== null && year >= 23
}

const getDisplayClass = (profile) => {
  if (profile?.classe) return profile.classe
  if (profile?.pfp_cohort) return profile.pfp_cohort
  const year = getBachelorYearFromPermissions(profile?.permissions)
  return year ? `BA${String(year).padStart(2, '0')}` : '-'
}

const pfpMeta = [
  { key: 'pfp1a', label: 'PFP1A' },
  { key: 'pfp1b', label: 'PFP1B' },
  { key: 'pfp2', label: 'PFP2' },
  { key: 'pfp3', label: 'PFP3' },
  { key: 'pfp4', label: 'PFP4' }
]

const pfpAbsenceKey = (key) => `${key}_absences`
const pfpRemarkKey = (key) => `${key}_remarques`

const filteredNotes = computed(() => {
  let list = notes.value
  
  if (filterYear.value) {
    list = list.filter(n => n.year === filterYear.value)
  }

  if (filterClass.value) {
    list = list.filter(n => n.classe === filterClass.value)
  }

  if (filterName.value) {
    const query = filterName.value.trim().toLowerCase()
    list = list.filter(n => String(n.etudiant ?? '').toLowerCase().includes(query))
  }

  if (filterStatus.value) {
    list = list.filter(n => getNoteStatus(n) === filterStatus.value)
  }
  
  return list
})

const showRetakePfp1a = computed(() => filteredNotes.value.some(note => getNoteStatusByValue(note.pfp1a) === 'Échec'))
const showRetakePfp1b = computed(() => filteredNotes.value.some(note => getNoteStatusByValue(note.pfp1b) === 'Échec'))
const showRetakePfp2 = computed(() => filteredNotes.value.some(note => getNoteStatusByValue(note.pfp2) === 'Échec'))
const showRetakePfp3 = computed(() => filteredNotes.value.some(note => getNoteStatusByValue(note.pfp3) === 'Échec'))
const showRetakePfp4 = computed(() => filteredNotes.value.some(note => getNoteStatusByValue(note.pfp4) === 'Échec'))
const showAbsencesIndicator = computed(() => filteredNotes.value.some(note => hasAnyAbsence(note)))
const showRemarksIndicator = computed(() => filteredNotes.value.some(note => hasAnyRemark(note)))

const hasGrade = (value) => {
  if (typeof value === 'boolean') return false
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized !== '' && normalized !== '-' && normalized !== 'false' && normalized !== 'true'
}

const isPfp1aLocked = (note) => hasGrade(note?.pfp1b) && !hasGrade(note?.pfp1a)
const isPfp1bLocked = (note) => hasGrade(note?.pfp1a) && !hasGrade(note?.pfp1b)
const isPfpLocked = (key, note) => {
  if (key === 'pfp1a') return isPfp1aLocked(note)
  if (key === 'pfp1b') return isPfp1bLocked(note)
  return false
}

const hasAnyAbsence = (note) => {
  const baseAbsence = Number(note?.absences) > 0
  const perPfpAbsence = pfpMeta.some(pfp => Number(note?.[pfpAbsenceKey(pfp.key)]) > 0)
  return baseAbsence || perPfpAbsence
}

const hasAnyRemark = (note) => {
  const baseRemark = String(note?.remarques ?? '').trim() !== ''
  const perPfpRemark = pfpMeta.some(pfp => String(note?.[pfpRemarkKey(pfp.key)] ?? '').trim() !== '')
  return baseRemark || perPfpRemark
}

const openPfpDialog = (row) => {
  selectedStudent.value = row
  showPfpDialog.value = true
}

const notifySaved = () => {
  const now = Date.now()
  if (now - lastSaveToastAt.value < 4000) return
  lastSaveToastAt.value = now
  toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Modifications enregistrées', life: 1500 })
}

const buildPayload = (note) => ({
  user_id: note.user_id,
  year: note.year || activeYear.value,
  pfp1a: note.pfp1a ?? null,
  pfp1b: note.pfp1b ?? null,
  pfp2: note.pfp2 ?? null,
  pfp3: note.pfp3 ?? null,
  pfp4: note.pfp4 ?? null,
  pfp1a_retake: note.pfp1a_retake ?? null,
  pfp1b_retake: note.pfp1b_retake ?? null,
  pfp2_retake: note.pfp2_retake ?? null,
  pfp3_retake: note.pfp3_retake ?? null,
  pfp4_retake: note.pfp4_retake ?? null,
  pfp1a_absences: note.pfp1a_absences ?? null,
  pfp1b_absences: note.pfp1b_absences ?? null,
  pfp2_absences: note.pfp2_absences ?? null,
  pfp3_absences: note.pfp3_absences ?? null,
  pfp4_absences: note.pfp4_absences ?? null,
  pfp1a_remarques: (note.pfp1a_remarques || '').trim() || null,
  pfp1b_remarques: (note.pfp1b_remarques || '').trim() || null,
  pfp2_remarques: (note.pfp2_remarques || '').trim() || null,
  pfp3_remarques: (note.pfp3_remarques || '').trim() || null,
  pfp4_remarques: (note.pfp4_remarques || '').trim() || null,
  absences: note.absences ?? 0,
  remarques: (note.remarques || '').trim() || null,
  updated_at: new Date().toISOString()
})

const queueSave = (note) => {
  if (!note?.user_id || isHydrating.value) return
  const key = note.user_id
  if (saveTimers.has(key)) {
    clearTimeout(saveTimers.get(key))
  }
  const timeoutId = setTimeout(() => {
    saveTimers.delete(key)
    saveNote(note)
  }, 600)
  saveTimers.set(key, timeoutId)
}

const saveNote = async (note) => {
  try {
    const payload = buildPayload(note)

    const { error } = await supabase
      .from('StudentsPhysio')
      .upsert(payload, { onConflict: 'user_id,year' })

    if (error) throw error
    notifySaved()
  } catch (e) {
    console.error('Erreur sauvegarde note:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Sauvegarde impossible', life: 3000 })
  }
}

const saveAllNotes = async () => {
  if (isSavingAll.value) return
  isSavingAll.value = true
  try {
    const payloads = notes.value
      .filter(note => note?.user_id)
      .map(buildPayload)
    const { error } = await supabase
      .from('StudentsPhysio')
      .upsert(payloads, { onConflict: 'user_id,year' })
    if (error) throw error
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Toutes les lignes sont enregistrées', life: 2000 })
  } catch (e) {
    console.error('Erreur sauvegarde globale:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Sauvegarde globale impossible', life: 3000 })
  } finally {
    isSavingAll.value = false
  }
}

const getNoteStatusByValue = (rawValue) => {
  const normalized = String(rawValue ?? '').trim().toUpperCase()
  if (!normalized || normalized === '-') return 'Non noté'
  if (normalized === 'F') return 'Échec'
  if (['A', 'B', 'C', 'D', 'E'].includes(normalized)) return 'Réussi'
  return 'Non noté'
}

const getPfpFinalStatus = (noteValue, retakeValue) => {
  const initialStatus = getNoteStatusByValue(noteValue)
  if (initialStatus === 'Réussi') return 'Réussi'
  if (initialStatus === 'Non noté') return 'Non noté'
  const retakeStatus = getNoteStatusByValue(retakeValue)
  if (retakeStatus === 'Réussi') return 'Réussi'
  return 'Échec'
}

const getPfp1GroupStatus = (note) => {
  const statusA = getPfpFinalStatus(note?.pfp1a, note?.pfp1a_retake)
  const statusB = getPfpFinalStatus(note?.pfp1b, note?.pfp1b_retake)
  const hasA = statusA !== 'Non noté'
  const hasB = statusB !== 'Non noté'
  if (hasA && !hasB) return statusA
  if (!hasA && hasB) return statusB
  if (!hasA && !hasB) return 'Non noté'
  if (statusA === 'Réussi' || statusB === 'Réussi') return 'Réussi'
  return 'Échec'
}

const getNoteStatus = (note) => {
  const retakeKey = `${filterStatusPfp.value}_retake`
  return getPfpFinalStatus(note?.[filterStatusPfp.value], note?.[retakeKey])
}

const getOverallStatus = (note) => {
  const statuses = [
    getPfp1GroupStatus(note),
    getPfpFinalStatus(note?.pfp2, note?.pfp2_retake),
    getPfpFinalStatus(note?.pfp3, note?.pfp3_retake),
    getPfpFinalStatus(note?.pfp4, note?.pfp4_retake)
  ]
  if (statuses.includes('Échec')) return 'Échec'
  if (statuses.includes('Non noté')) return 'Non noté'
  return 'Réussi'
}

const statusClass = (status) => {
  if (status === 'Réussi') return 'status-success'
  if (status === 'Échec') return 'status-fail'
  return 'status-pending'
}

const fetchNotes = async () => {
  loading.value = true
  isHydrating.value = true
  try {
    const year = activeYear.value
    const [{ data: profiles, error: profileError }, { data: physio, error: physioError }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id, family_name, forname, classe, permissions, pfp_cohort')
        .or('role.eq.EtudiantPhysio,permissions.cs.["EtudiantPhysio"]')
        .order('family_name'),
      supabase
        .from('StudentsPhysio')
        .select('*')
        .eq('year', year)
    ])

    if (profileError) throw profileError
    if (physioError) throw physioError

    const physioMap = new Map((physio || []).map(row => [row.user_id, row]))

    const filteredProfiles = (profiles || []).filter(p => isEligibleBachelorProfile(p))

    notes.value = filteredProfiles.map(p => {
      const entry = physioMap.get(p.user_id)
      return {
      user_id: p.user_id,
      etudiant: `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim(),
      classe: getDisplayClass(p),
      year,
      pfp1a: entry?.pfp1a ?? null,
      pfp1b: entry?.pfp1b ?? null,
      pfp2: entry?.pfp2 ?? null,
      pfp3: entry?.pfp3 ?? null,
      pfp4: entry?.pfp4 ?? null,
      pfp1a_retake: entry?.pfp1a_retake ?? null,
      pfp1b_retake: entry?.pfp1b_retake ?? null,
      pfp2_retake: entry?.pfp2_retake ?? null,
      pfp3_retake: entry?.pfp3_retake ?? null,
      pfp4_retake: entry?.pfp4_retake ?? null,
      pfp1a_absences: entry?.pfp1a_absences ?? null,
      pfp1b_absences: entry?.pfp1b_absences ?? null,
      pfp2_absences: entry?.pfp2_absences ?? null,
      pfp3_absences: entry?.pfp3_absences ?? null,
      pfp4_absences: entry?.pfp4_absences ?? null,
      pfp1a_remarques: entry?.pfp1a_remarques ?? '',
      pfp1b_remarques: entry?.pfp1b_remarques ?? '',
      pfp2_remarques: entry?.pfp2_remarques ?? '',
      pfp3_remarques: entry?.pfp3_remarques ?? '',
      pfp4_remarques: entry?.pfp4_remarques ?? '',
      absences: entry?.absences ?? 0,
      remarques: entry?.remarques ?? ''
      }
    })
  } catch (e) {
    console.error('Erreur fetchNotes:', e)
  } finally {
    loading.value = false
    isHydrating.value = false
  }
}

onMounted(() => {
  fetchNotes()
})

watch(filterYear, () => {
  fetchNotes()
})
</script>

<style scoped>
.notes-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-card);
  padding: 0.6rem 0.75rem;
  white-space: nowrap;
}

.notes-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
}

.notes-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.notes-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-ground);
}

.note-dropdown {
  min-width: 4.5rem;
}

.note-dropdown :deep(.p-dropdown) {
  width: 100%;
}

.note-dropdown :deep(.p-dropdown-label) {
  text-align: center;
  font-weight: 600;
}

.note-dropdown :deep(.p-dropdown-trigger) {
  width: 2rem;
}

.note-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.note-cell.is-disabled {
  opacity: 0.45;
}

.expand-toggle {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid var(--surface-border, #e2e8f0);
  background: var(--surface-card);
  color: var(--text-color-secondary, #64748b);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-toggle:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}


.pfp-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pfp-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pfp-dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
}

.pfp-dialog-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary, #64748b);
  font-size: 0.85rem;
}

.pfp-dialog-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pfp-dialog-row {
  display: grid;
  grid-template-columns: 120px 140px 1fr;
  gap: 0.75rem;
  align-items: start;
}

.pfp-dialog-row.is-disabled {
  opacity: 0.45;
}

.pfp-label {
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.pfp-absence :deep(.p-inputnumber-input) {
  width: 100%;
}

.pfp-remark :deep(textarea) {
  width: 100%;
}

.indicator {
  display: inline-flex;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

.indicator-absence {
  background: #f97316;
}

.indicator-remark {
  background: #0ea5e9;
}

.indicator-placeholder {
  color: var(--text-color-secondary, #94a3b8);
}

.notes-table :deep(.p-datatable-thead > tr > th:nth-child(n+4)) {
  text-align: center;
}

.notes-table :deep(.p-datatable-tbody > tr > td:nth-child(n+4)) {
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-compact {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
}

.status-success {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.status-fail {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.status-pending {
  background: rgba(148, 163, 184, 0.2);
  color: #475569;
}
</style>
