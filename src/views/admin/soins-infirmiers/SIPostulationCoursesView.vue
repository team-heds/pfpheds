<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        title="Cours en postulation (SI)"
        subtitle="Cours/créneaux avec enseignant non attribué (postulation)"
        icon="pi pi-exclamation-triangle"
      />
    </template>

    <div class="postulation-page">
      <div class="toolbar-card">
        <div class="left-tools">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="search" placeholder="Rechercher module, classe, enseignant..." style="width: 320px" />
          </span>
          <Button icon="pi pi-times" severity="secondary" text @click="search = ''" />
        </div>
        <div class="right-tools">
          <Tag :value="`${filteredRows.length} créneaux postulation`" severity="warning" />
          <Button label="Rafraîchir" icon="pi pi-refresh" severity="secondary" outlined @click="loadData" :loading="loading" />
        </div>
      </div>

      <div class="table-card">
        <DataTable :value="filteredRows" :loading="loading" stripedRows paginator :rows="20" responsiveLayout="scroll">
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>Aucun cours en postulation détecté</p>
            </div>
          </template>

          <Column field="moduleNumber" header="Module" sortable />
          <Column field="moduleTitle" header="Titre" sortable />
          <Column field="classCode" header="Classe" sortable />
          <Column field="dayLabel" header="Jour" sortable />
          <Column field="timeRange" header="Horaire" />
          <Column field="teacherLabel" header="Libellé enseignant" />
          <Column field="weekNumber" header="Semaine" sortable />
          <Column header="Votes">
            <template #body="{ data }">
              <Tag :value="`${data.voteCount || 0}`" severity="info" />
            </template>
          </Column>
          <Column header="Action" style="width: 280px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  label="Voir planning"
                  icon="pi pi-calendar"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="viewInPlanning(data)"
                />
                <Button
                  v-if="canVote"
                  :label="data.hasMyVote ? 'Retirer vote' : 'Voter ce cours'"
                  :icon="data.hasMyVote ? 'pi pi-times' : 'pi pi-thumbs-up'"
                  size="small"
                  :severity="data.hasMyVote ? 'danger' : 'warning'"
                  :outlined="data.hasMyVote"
                  :disabled="votingRowId === data.id"
                  :loading="votingRowId === data.id"
                  @click="data.hasMyVote ? removeVote(data) : submitVote(data)"
                />
                <span v-else class="text-500">—</span>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase'
import modulesService from '@/service/modulesService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const loading = ref(false)
const search = ref('')
const allModules = ref([])
const rows = ref([])
const votingRowId = ref(null)
const canUseSlotVotesTable = ref(true)
const hasShownSlotVoteTableUnavailableToast = ref(false)

const currentUserId = computed(() => authStore.user?.id || authStore.user?.uid || null)
const canVote = computed(() => Boolean(currentUserId.value))
const SLOT_COURSE_MAP_STORAGE_KEY = 'si_postulation_slot_course_map_v1'
const SLOT_VOTES_TABLE = 'planning_slot_votes'

const DAY_MAP = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi'
}

function isPostulationLabel(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  return (
    text.includes('postulation') ||
    text.includes('postulat') ||
    text.includes('repourvoir') ||
    text.includes('repourv') ||
    text.includes('reattribuer') ||
    text.includes('reattrib') ||
    text.includes('reattribuer') ||
    text.includes('reattrib')
  )
}

function notifySlotVoteTableUnavailable() {
  if (hasShownSlotVoteTableUnavailableToast.value) return
  hasShownSlotVoteTableUnavailableToast.value = true
  toast.add({
    severity: 'warn',
    summary: 'Vote par créneau indisponible',
    detail: 'La table planning_slot_votes n\'est pas accessible. Contactez un administrateur.',
    life: 4500
  })
}

function extractTeacherLabels(slot) {
  const rawTeachers = slot?.teachers ?? slot?.teachers_list ?? slot?.teacher ?? slot?.teacher_name ?? null

  if (Array.isArray(rawTeachers)) {
    return rawTeachers
      .map(t => (typeof t === 'object' ? t?.name || t?.display_name || t?.email : t))
      .map(v => String(v || '').trim())
      .filter(Boolean)
  }

  if (typeof rawTeachers === 'object' && rawTeachers !== null) {
    const label = rawTeachers?.name || rawTeachers?.display_name || rawTeachers?.email
    return label ? [String(label).trim()] : []
  }

  if (typeof rawTeachers === 'string') {
    const trimmed = rawTeachers.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
            .map(t => (typeof t === 'object' ? t?.name || t?.display_name || t?.email : t))
            .map(v => String(v || '').trim())
            .filter(Boolean)
        }
      } catch (error) {
        console.warn('⚠️ [SIPostulationCoursesView] teachers JSON parse KO:', error)
      }
    }

    return [trimmed]
  }

  return []
}

function formatDay(day) {
  return DAY_MAP[String(day || '').toLowerCase()] || day || '—'
}

function formatClassCodeForPlanning(classCode) {
  const raw = String(classCode || '').trim()
  if (!raw) return null
  if (raw.toLowerCase().startsWith('bac')) return raw.toLowerCase()
  if (/^[a-zA-Z]\d{1,2}/.test(raw)) {
    return `bac${raw.substring(1).toLowerCase()}`
  }
  return raw.toLowerCase()
}

function viewInPlanning(row) {
  const query = {
    week: row?.weekNumber || undefined,
    classCode: formatClassCodeForPlanning(row?.classCode) || undefined,
    day: row?.dayKey ? String(row.dayKey).toLowerCase() : undefined,
    start: row?.startTime || undefined,
    moduleCode: row?.moduleCode || undefined,
    courseId: row?.courseId ? String(row.courseId) : undefined,
    slotId: row?.slotId ? String(row.slotId) : undefined
  }

  Object.keys(query).forEach(key => {
    if (query[key] == null || query[key] === '' || query[key] === '—') delete query[key]
  })

  router.push({ path: '/admin/planning/weekly', query })
}

function getFirstCourseIdByModule(moduleId, courses) {
  if (!moduleId) return null
  const found = (courses || []).find(c => String(c.module_id) === String(moduleId))
  return found?.id || null
}

function buildSlotCourseMapKey(data) {
  return [
    String(data?.slotId || data?.id || '').trim(),
    String(data?.moduleCode || data?.module_code || '').trim().toLowerCase(),
    String(data?.classCode || data?.class_code || '').trim().toLowerCase(),
    String(data?.weekNumber || data?.week_number || '').trim(),
    String(data?.dayKey || data?.day_of_week || '').trim().toLowerCase(),
    String(data?.startTime || data?.start_time || '').trim(),
    String(data?.endTime || data?.end_time || '').trim()
  ].join('|')
}

function readStoredSlotCourseMap() {
  try {
    const raw = window?.localStorage?.getItem(SLOT_COURSE_MAP_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isDuplicateVoteError(error) {
  return error?.code === '23505' || Number(error?.status || 0) === 409
}

function isMissingTableError(error, tableName) {
  const text = getErrorText(error)
  const table = String(tableName || '').toLowerCase()
  if (!table) return false

  if (Number(error?.status || 0) === 404) return true

  return (
    (text.includes('could not find the table') && text.includes(table)) ||
    text.includes('not found') ||
    (String(error?.code || '').toUpperCase() === 'PGRST205')
  )
}

async function resolveTeacherIdForVote() {
  const authId = currentUserId.value

  if (authId) {
    const byId = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authId)
      .maybeSingle()

    if (!byId.error && byId.data?.id) return byId.data.id
  }

  if (authId) {
    const fromUserProfiles = await supabase
      .from('user_profiles')
      .select('profile_id')
      .eq('user_id', authId)
      .maybeSingle()

    if (!fromUserProfiles.error && fromUserProfiles.data?.profile_id) {
      return fromUserProfiles.data.profile_id
    }
  }

  return null
}

async function submitVote(row) {
  if (!canVote.value) {
    toast.add({ severity: 'warn', summary: 'Connexion requise', detail: 'Veuillez vous reconnecter pour voter.', life: 3000 })
    return
  }

  try {
    votingRowId.value = row?.id || null
    let voteWasInserted = false
    let voteWasAlreadyPresent = false

    const resolvedTeacherId = await resolveTeacherIdForVote()
    if (!resolvedTeacherId) {
      toast.add({ severity: 'warn', summary: 'Profil introuvable', detail: 'Impossible de voter: profil enseignant introuvable.', life: 3000 })
      return
    }

    if (!row?.slotId) {
      toast.add({ severity: 'warn', summary: 'Créneau introuvable', detail: 'Impossible de voter: identifiant de créneau manquant.', life: 3000 })
      return
    }

    if (!canUseSlotVotesTable.value) {
      notifySlotVoteTableUnavailable()
      return
    }

    const existingSlotVote = await supabase
      .from(SLOT_VOTES_TABLE)
      .select('slot_id, teacher_id')
      .eq('slot_id', row.slotId)
      .eq('teacher_id', resolvedTeacherId)
      .limit(1)

    if (existingSlotVote.error) {
      if (existingSlotVote.status === 404 || isMissingTableError(existingSlotVote.error, SLOT_VOTES_TABLE)) {
        canUseSlotVotesTable.value = false
        notifySlotVoteTableUnavailable()
        return
      }
      console.warn('⚠️ [SIPostulationCoursesView] Vérification vote créneau impossible:', existingSlotVote.error)
      throw existingSlotVote.error
    }

    if (existingSlotVote.data?.length) {
      voteWasAlreadyPresent = true
      row.hasMyVote = true
      toast.add({
        severity: 'success',
        summary: 'Vote déjà enregistré',
        detail: `Votre vote existait déjà pour ce créneau (${row.moduleNumber}).`,
        life: 3000
      })
      return
    }

    const slotVoteInsert = await supabase
      .from(SLOT_VOTES_TABLE)
      .insert({
        slot_id: row.slotId,
        teacher_id: resolvedTeacherId
      })

    if (!slotVoteInsert.error) {
      voteWasInserted = true
    } else if (isDuplicateVoteError(slotVoteInsert.error)) {
      voteWasAlreadyPresent = true
    } else if (slotVoteInsert.status === 404 || isMissingTableError(slotVoteInsert.error, SLOT_VOTES_TABLE)) {
      canUseSlotVotesTable.value = false
      notifySlotVoteTableUnavailable()
      return
    } else {
      throw slotVoteInsert.error
    }

    toast.add({
      severity: 'success',
      summary: voteWasAlreadyPresent ? 'Vote déjà enregistré' : 'Vote enregistré',
      detail: voteWasAlreadyPresent
        ? `Votre vote existait déjà pour ce créneau (${row.moduleNumber}).`
        : `Votre postulation est envoyée pour ce créneau (${row.moduleNumber}).`,
      life: 3000
    })
    row.hasMyVote = true
    if (voteWasInserted) {
      row.voteCount = Number(row.voteCount || 0) + 1
    }
  } catch (error) {
    const message = String(error?.message || '').trim()
    const code = String(error?.code || '').trim()
    const details = String(error?.details || '').trim()
    const hint = String(error?.hint || '').trim()

    if (message || code || details || hint) {
      console.error('Erreur vote postulation:', {
        code: code || undefined,
        message: message || undefined,
        details: details || undefined,
        hint: hint || undefined
      })
    }

    if (error?.code === '23503' && getErrorText(error).includes('profiles')) {
      toast.add({ severity: 'error', summary: 'Profil enseignant manquant', detail: 'Votre compte n\'est pas synchronisé dans la table profiles. Contactez un admin.', life: 5000 })
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'enregistrer votre vote.', life: 3500 })
    }
  } finally {
    votingRowId.value = null
  }
}

async function removeVote(row) {
  if (!canVote.value) {
    toast.add({ severity: 'warn', summary: 'Connexion requise', detail: 'Veuillez vous reconnecter pour retirer votre vote.', life: 3000 })
    return
  }

  try {
    votingRowId.value = row?.id || null

    const resolvedTeacherId = await resolveTeacherIdForVote()
    if (!resolvedTeacherId) {
      toast.add({ severity: 'warn', summary: 'Profil introuvable', detail: 'Impossible de retirer le vote: profil enseignant introuvable.', life: 3000 })
      return
    }

    if (!row?.slotId) {
      toast.add({ severity: 'warn', summary: 'Créneau introuvable', detail: 'Impossible de retirer le vote: identifiant de créneau manquant.', life: 3000 })
      return
    }

    if (!canUseSlotVotesTable.value) {
      notifySlotVoteTableUnavailable()
      return
    }

    const slotVoteDelete = await supabase
      .from(SLOT_VOTES_TABLE)
      .delete()
      .eq('slot_id', row.slotId)
      .eq('teacher_id', resolvedTeacherId)
      .select('slot_id, teacher_id')

    if (slotVoteDelete.error) {
      if (slotVoteDelete.status === 404 || isMissingTableError(slotVoteDelete.error, SLOT_VOTES_TABLE)) {
        canUseSlotVotesTable.value = false
        notifySlotVoteTableUnavailable()
        return
      }
      throw slotVoteDelete.error
    }

    const deletedRows = Array.isArray(slotVoteDelete.data) ? slotVoteDelete.data.length : 0
    if (!deletedRows) {
      await loadData()
      toast.add({ severity: 'warn', summary: 'Aucun vote supprimé', detail: 'Le vote n\'a pas été trouvé pour ce créneau.', life: 3500 })
      return
    }

    row.hasMyVote = false
    row.voteCount = Math.max(0, Number(row.voteCount || 0) - 1)
    toast.add({ severity: 'success', summary: 'Vote retiré', detail: `Votre vote a été retiré pour ce créneau (${row.moduleNumber}).`, life: 3000 })
  } catch (error) {
    const message = String(error?.message || '').trim()
    const code = String(error?.code || '').trim()
    const details = String(error?.details || '').trim()
    const hint = String(error?.hint || '').trim()

    if (message || code || details || hint) {
      console.error('Erreur retrait vote postulation:', {
        code: code || undefined,
        message: message || undefined,
        details: details || undefined,
        hint: hint || undefined
      })
    }

    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de retirer votre vote.', life: 3500 })
  } finally {
    votingRowId.value = null
  }
}

const filteredRows = computed(() => {
  if (!search.value) return rows.value
  const term = search.value.toLowerCase()
  return rows.value.filter(r =>
    String(r.moduleNumber || '').toLowerCase().includes(term) ||
    String(r.moduleTitle || '').toLowerCase().includes(term) ||
    String(r.classCode || '').toLowerCase().includes(term) ||
    String(r.teacherLabel || '').toLowerCase().includes(term) ||
    String(r.dayLabel || '').toLowerCase().includes(term)
  )
})

async function loadData() {
  loading.value = true
  try {
    const [modsResult, slotsResponse] = await Promise.all([
      modulesService.getAllModules(),
      supabase
        .from('planning_time_slots')
        .select('*')
    ])

    allModules.value = modsResult || []

    if (slotsResponse.error) throw slotsResponse.error

    const slots = slotsResponse.data || []
    const storedSlotCourseMap = readStoredSlotCourseMap()
    let moduleCourses = []
    const knownCourseByModuleCode = new Map()
    const knownCourseByModuleNumber = new Map()

    const coursesByModule = await supabase
      .from('courses')
      .select('id,module_id')

    if (!coursesByModule.error && Array.isArray(coursesByModule.data)) {
      moduleCourses = coursesByModule.data
    }

    for (const slot of slots) {
      if (!slot?.course_id) continue
      const module = allModules.value.find(m => String(m.code || '').toLowerCase() === String(slot.module_code || '').toLowerCase())
      const codeKey = String(slot?.module_code || module?.code || '').trim().toLowerCase()
      const numberKey = String(module?.number || '').trim().toLowerCase()

      if (codeKey && !knownCourseByModuleCode.has(codeKey)) {
        knownCourseByModuleCode.set(codeKey, slot.course_id)
      }
      if (numberKey && !knownCourseByModuleNumber.has(numberKey)) {
        knownCourseByModuleNumber.set(numberKey, slot.course_id)
      }
    }

    const mapped = []
    const seenPostulationSlotKeys = new Set()

    slots.forEach(slot => {
      const teachers = extractTeacherLabels(slot)
      const fallbackTeacherLabel = [slot?.teacher, slot?.teacher_name, slot?.teacher_label]
        .map(v => String(v || '').trim())
        .find(Boolean)
      const slotTexts = [
        ...teachers,
        slot?.teacher,
        slot?.teacher_name,
        slot?.teacher_label,
        slot?.notes,
        slot?.comment,
        slot?.commentaire,
        slot?.status,
        slot?.assignment_status,
        slot?.teacher_status,
        slot?.slot_type,
        slot?.type
      ]
        .map(v => String(v || '').trim())
        .filter(Boolean)

      const matchedText = slotTexts.find(isPostulationLabel)
      if (!matchedText) return

      const module = allModules.value.find(m => String(m.code || '').toLowerCase() === String(slot.module_code || '').toLowerCase())
      const moduleCodeKey = String(slot?.module_code || module?.code || '').trim().toLowerCase()
      const moduleNumberKey = String(module?.number || '').trim().toLowerCase()
      const slotMapKey = buildSlotCourseMapKey(slot)
      const courseId = slot?.course_id ||
        getFirstCourseIdByModule(module?.id, moduleCourses) ||
        knownCourseByModuleCode.get(moduleCodeKey) ||
        knownCourseByModuleNumber.get(moduleNumberKey) ||
        storedSlotCourseMap[slotMapKey] ||
        null
      const dedupeKey = [
        courseId || '',
        slot?.module_code || module?.code || '',
        slot?.class_code || '',
        slot?.week_number || '',
        slot?.day_of_week || '',
        slot?.start_time || '',
        slot?.end_time || ''
      ].join('|')

      if (seenPostulationSlotKeys.has(dedupeKey)) return
      seenPostulationSlotKeys.add(dedupeKey)

      const teacherLabel =
        teachers.find(isPostulationLabel) ||
        fallbackTeacherLabel ||
        matchedText ||
        teachers[0] ||
        'postulation'

      mapped.push({
        id: `${slot.id}_${teacherLabel}`,
        slotId: slot.id,
        courseId,
        moduleId: module?.id || null,
        moduleCode: slot.module_code || module?.code || null,
        moduleNumber: module?.number || slot.module_code || '—',
        moduleTitle: module?.title || 'Module non trouvé',
        classCode: slot.class_code || '—',
        weekNumber: slot.week_number || '—',
        dayKey: slot.day_of_week || null,
        dayLabel: formatDay(slot.day_of_week),
        startTime: slot.start_time || null,
        timeRange: `${slot.start_time || '--:--'} - ${slot.end_time || '--:--'}`,
        teacherLabel,
        voteCount: 0,
        hasMyVote: false
      })
    })

    const teacherProfileId = await resolveTeacherIdForVote()
    const uniqueSlotIds = [...new Set(mapped.map(r => r.slotId).filter(Boolean).map(String))]

    if (uniqueSlotIds.length && canUseSlotVotesTable.value) {
      const slotVotesQuery = await supabase
        .from(SLOT_VOTES_TABLE)
        .select('slot_id, teacher_id')
        .in('slot_id', uniqueSlotIds)

      if (!slotVotesQuery.error && Array.isArray(slotVotesQuery.data)) {
        const countsBySlotId = {}
        const myVotedSlotIds = new Set()

        for (const vote of slotVotesQuery.data) {
          const sid = String(vote.slot_id || '')
          if (!sid) continue
          countsBySlotId[sid] = Number(countsBySlotId[sid] || 0) + 1

          if (teacherProfileId && String(vote.teacher_id || '') === String(teacherProfileId)) {
            myVotedSlotIds.add(sid)
          }
        }

        for (const row of mapped) {
          const sid = String(row.slotId || '')
          if (!sid) continue
          row.voteCount = Number(countsBySlotId[sid] || 0)
          row.hasMyVote = myVotedSlotIds.has(sid)
        }
      } else if (slotVotesQuery.error && (slotVotesQuery.status === 404 || isMissingTableError(slotVotesQuery.error, SLOT_VOTES_TABLE))) {
        canUseSlotVotesTable.value = false
      } else if (slotVotesQuery.error) {
        console.warn('⚠️ [SIPostulationCoursesView] Chargement votes créneau impossible:', slotVotesQuery.error)
      }
    }

    if (!canUseSlotVotesTable.value) {
      notifySlotVoteTableUnavailable()
    }

    rows.value = mapped.sort((a, b) => {
      const byModule = String(a.moduleNumber).localeCompare(String(b.moduleNumber))
      if (byModule !== 0) return byModule
      return Number(a.weekNumber || 0) - Number(b.weekNumber || 0)
    })
  } catch (error) {
    console.error('Erreur chargement cours postulation:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les cours en postulation', life: 3500 })
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.postulation-page {
  padding: 1.5rem;
}

.toolbar-card,
.table-card {
  background: var(--surface-card);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.toolbar-card {
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.left-tools,
.right-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.table-card {
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.4rem;
  margin-bottom: 0.6rem;
}
</style>
