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
                  :label="data.hasMyVote ? 'Vote enregistré' : 'Voter ce cours'"
                  :icon="data.hasMyVote ? 'pi pi-check' : 'pi pi-thumbs-up'"
                  size="small"
                  :severity="data.hasMyVote ? 'success' : 'warning'"
                  :disabled="data.hasMyVote || votingRowId === data.id"
                  :loading="votingRowId === data.id"
                  @click="submitVote(data)"
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

const currentUserId = computed(() => authStore.user?.id || authStore.user?.uid || null)
const canVote = computed(() => Boolean(currentUserId.value))
const LEGACY_VOTE_ROLE = 'intervenant'
const LEGACY_VOTE_HOURS = -1

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

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isRoleEnumError(error) {
  const text = getErrorText(error)
  return text.includes('role') && (text.includes('invalid input value') || text.includes('enum'))
}

function isMissingColumnError(error, columnName) {
  const text = getErrorText(error)
  return text.includes(`'${String(columnName || '').toLowerCase()}'`) && text.includes('column')
}

function isInvalidUuidError(error) {
  const text = getErrorText(error)
  return error?.code === '22P02' || text.includes('invalid input syntax for type uuid')
}

function isDuplicateVoteError(error) {
  return error?.code === '23505' || Number(error?.status || 0) === 409
}

function isVoteRecord(assign) {
  if (!assign) return false
  const role = String(assign.role || '').toLowerCase()
  const hoursNum = assign.hours == null ? null : Number(assign.hours)

  if (role === 'postulation_vote') return true
  if (role === LEGACY_VOTE_ROLE && hoursNum === LEGACY_VOTE_HOURS) return true
  if (!role && (hoursNum === null || hoursNum === 0)) return true

  return false
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

async function resolveCourseIdForVote(row) {
  if (row?.courseId) return row.courseId

  const moduleId = row?.moduleId
  const moduleIdAsString = String(moduleId || '').trim()
  const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(moduleIdAsString)

  if (moduleId && isUuidLike) {
    const byModule = await supabase
      .from('courses')
      .select('id')
      .eq('module_id', moduleId)
      .limit(1)

    if (!byModule.error && byModule.data?.length) {
      return byModule.data[0].id
    }

    if (byModule.error && !isMissingColumnError(byModule.error, 'module_id') && !isInvalidUuidError(byModule.error)) {
      console.warn('⚠️ [SIPostulationCoursesView] Recherche cours par module impossible:', byModule.error)
    }
  }

  const anyCourse = await supabase
    .from('courses')
    .select('id')
    .limit(1)

  if (!anyCourse.error && anyCourse.data?.length) {
    return anyCourse.data[0].id
  }

  const defaultName = row?.moduleTitle ? `Cours principal - ${row.moduleTitle}` : 'Cours principal'
  const defaultCode = `COURS-${String(moduleId || 'x').substring(0, 8)}`

  const candidatePayloads = [
    { module_id: moduleId, name: defaultName, code: defaultCode },
    { module_id: moduleId, name: defaultName },
    { name: defaultName }
  ]

  for (const payload of candidatePayloads) {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
    )

    const attempt = await supabase
      .from('courses')
      .insert(cleanPayload)
      .select('id')
      .single()

    if (!attempt.error && attempt.data?.id) {
      return attempt.data.id
    }

    const missingModuleColumn = isMissingColumnError(attempt.error, 'module_id')
    const missingCodeColumn = isMissingColumnError(attempt.error, 'code')
    const missingNameColumn = isMissingColumnError(attempt.error, 'name')

    if (missingModuleColumn || missingCodeColumn || missingNameColumn) {
      continue
    }
  }

  console.warn('⚠️ [SIPostulationCoursesView] Création cours impossible: schéma courses incompatible ou permissions insuffisantes')
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

    const resolvedCourseId = await resolveCourseIdForVote(row)
    if (!resolvedCourseId) {
      toast.add({ severity: 'warn', summary: 'Cours non lié', detail: 'Impossible de voter: aucun cours relié à ce module.', life: 3000 })
      return
    }

    const resolvedTeacherId = await resolveTeacherIdForVote()
    if (!resolvedTeacherId) {
      toast.add({ severity: 'warn', summary: 'Profil introuvable', detail: 'Impossible de voter: profil enseignant introuvable.', life: 3000 })
      return
    }

    row.courseId = resolvedCourseId

    let { error } = await supabase
      .from('course_teachers')
      .insert({
        course_id: resolvedCourseId,
        teacher_id: resolvedTeacherId,
        hours: 0,
        role: 'postulation_vote'
      })

    if (error && isRoleEnumError(error)) {
      const legacyInsert = await supabase
        .from('course_teachers')
        .insert({
          course_id: resolvedCourseId,
          teacher_id: resolvedTeacherId,
          hours: LEGACY_VOTE_HOURS,
          role: LEGACY_VOTE_ROLE
        })
      error = legacyInsert.error
    }

    if (error) {
      const minimalInsert = await supabase
        .from('course_teachers')
        .insert({
          course_id: resolvedCourseId,
          teacher_id: resolvedTeacherId
        })
      error = minimalInsert.error
      if (!error) voteWasInserted = true
    } else {
      voteWasInserted = true
    }

    if (error && isDuplicateVoteError(error)) {
      voteWasAlreadyPresent = true
      error = null
    }

    if (error) throw error

    toast.add({
      severity: 'success',
      summary: voteWasAlreadyPresent ? 'Vote déjà enregistré' : 'Vote enregistré',
      detail: voteWasAlreadyPresent
        ? `Votre vote existait déjà pour ${row.moduleNumber}.`
        : `Votre postulation est envoyée pour ${row.moduleNumber}.`,
      life: 3000
    })
    row.hasMyVote = true
    if (voteWasInserted) {
      row.voteCount = Number(row.voteCount || 0) + 1
    }
  } catch (error) {
    console.error('Erreur vote postulation:', error)
    if (error?.code === '23503' && getErrorText(error).includes('profiles')) {
      toast.add({ severity: 'error', summary: 'Profil enseignant manquant', detail: 'Votre compte n\'est pas synchronisé dans la table profiles. Contactez un admin.', life: 5000 })
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'enregistrer votre vote.', life: 3500 })
    }
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
      const courseId = slot?.course_id || getFirstCourseIdByModule(module?.id, [])
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
    const uniqueCourseIds = [...new Set(mapped.map(r => r.courseId).filter(Boolean).map(String))]

    if (uniqueCourseIds.length) {
      const votesQuery = await supabase
        .from('course_teachers')
        .select('course_id, teacher_id, role, hours')
        .in('course_id', uniqueCourseIds)

      if (!votesQuery.error && Array.isArray(votesQuery.data)) {
        const voteRows = votesQuery.data.filter(isVoteRecord)
        const countsByCourseId = {}
        const myVotedCourseIds = new Set()

        for (const vote of voteRows) {
          const cid = String(vote.course_id || '')
          if (!cid) continue
          countsByCourseId[cid] = Number(countsByCourseId[cid] || 0) + 1

          if (teacherProfileId && String(vote.teacher_id || '') === String(teacherProfileId)) {
            myVotedCourseIds.add(cid)
          }
        }

        for (const row of mapped) {
          const cid = String(row.courseId || '')
          if (!cid) continue
          row.voteCount = Number(countsByCourseId[cid] || 0)
          row.hasMyVote = myVotedCourseIds.has(cid)
        }
      }
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
