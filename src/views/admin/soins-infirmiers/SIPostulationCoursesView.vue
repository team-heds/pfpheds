<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        class="si-page-header"
        title="Cours en postulation (SI)"
        subtitle="Cours et créneaux avec enseignant non attribué"
        icon="pi pi-exclamation-triangle"
      />
    </template>

    <div class="postulation-page si-admin-screen">
      <div class="toolbar-card">
        <div class="left-tools">
          <span class="p-input-icon-left search-field">
            <i class="pi pi-search" />
            <label class="sr-only" for="si-postulation-search">Rechercher un cours, un module ou une classe</label>
            <InputText id="si-postulation-search" v-model="search" placeholder="Rechercher un cours, un module ou une classe" />
          </span>
          <Button
            v-if="search"
            icon="pi pi-times"
            aria-label="Effacer la recherche"
            severity="secondary"
            text
            @click="search = ''"
          />
        </div>
        <div class="right-tools">
          <Tag :value="activeYearName || 'Aucune année active'" :severity="activeYearName ? 'success' : 'danger'" />
          <Tag v-if="isRmOnly" value="Périmètre : mes modules" severity="info" icon="pi pi-lock" />
          <Tag :value="`${filteredRows.length} créneaux postulation`" severity="warning" />
          <Tag v-if="inferredLinkCount" :value="`${inferredLinkCount} lien déduit`" severity="info" />
          <Tag v-if="missingLinkCount" :value="`${missingLinkCount} lien à vérifier`" severity="danger" />
          <Button label="Rafraîchir" icon="pi pi-refresh" severity="secondary" outlined @click="loadData" :loading="loading" />
        </div>
      </div>

      <div class="table-card">
        <div class="results-heading">
          <div>
            <h2>Créneaux disponibles</h2>
            <p class="results-description">
              {{ canVote ? 'Choisissez les cours sur lesquels vous souhaitez intervenir.' : 'Consultez les créneaux et les postulations enregistrées.' }}
            </p>
          </div>
          <span class="results-count" aria-live="polite">
            {{ filteredRows.length }} {{ filteredRows.length === 1 ? 'résultat' : 'résultats' }}
          </span>
        </div>

        <DataTable class="desktop-results" :value="filteredRows" :loading="loading" stripedRows paginator :rows="20" responsiveLayout="scroll">
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>Aucun cours en postulation détecté</p>
            </div>
          </template>

          <Column field="moduleNumber" header="Module" sortable>
            <template #body="{ data }">
              <strong>{{ data.moduleNumber }}</strong>
              <div class="cell-secondary">{{ data.moduleTitle }}</div>
            </template>
          </Column>
          <Column field="courseTitle" header="Cours" sortable>
            <template #body="{ data }">
              <strong>{{ data.courseTitle }}</strong>
              <div v-if="data.activity" class="cell-secondary">{{ data.activity }}</div>
            </template>
          </Column>
          <Column field="classCode" header="Classe / semaine" sortable>
            <template #body="{ data }">
              <strong>{{ data.classCode || '—' }}</strong>
              <div class="cell-secondary">Semaine {{ data.weekNumber || '—' }}</div>
            </template>
          </Column>
          <Column field="dayLabel" header="Créneau" sortable>
            <template #body="{ data }">
              <strong>{{ data.dayLabel || '—' }}</strong>
              <div class="cell-secondary">{{ data.timeRange || 'Horaire à préciser' }}</div>
            </template>
          </Column>
          <Column header="Donnée">
            <template #body="{ data }">
              <Tag
                :value="courseLinkLabel(data.courseLinkSource)"
                :severity="courseLinkSeverity(data.courseLinkSource)"
              />
            </template>
          </Column>
          <Column header="Votes">
            <template #body="{ data }">
              <Tag
                v-if="canManageVotes"
                :value="`${data.voteCount || 0}`"
                severity="info"
              />
              <Tag
                v-else
                :value="data.hasMyVote ? 'Votre vote est enregistré' : 'Pas encore voté'"
                :severity="data.hasMyVote ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="Action" style="width: 230px">
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

        <div class="compact-results" aria-live="polite" :aria-busy="loading">
          <div v-if="loading" class="compact-loading" role="status">
            <i class="pi pi-spin pi-spinner" aria-hidden="true" />
            <span>Chargement des créneaux…</span>
          </div>

          <div v-else-if="!filteredRows.length" class="empty-state">
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            <p>Aucun cours en postulation détecté</p>
          </div>

          <template v-else>
          <article v-for="row in filteredRows" :key="row.id" class="slot-card">
            <header class="slot-card__header">
              <div class="slot-card__identity">
                <span class="slot-card__module">{{ row.moduleNumber }}</span>
                <h3>{{ row.courseTitle }}</h3>
                <p v-if="row.moduleTitle || row.activity">
                  {{ row.activity || row.moduleTitle }}
                </p>
              </div>
              <Tag
                :value="courseLinkLabel(row.courseLinkSource)"
                :severity="courseLinkSeverity(row.courseLinkSource)"
              />
            </header>

            <dl class="slot-card__details">
              <div>
                <dt><i class="pi pi-users" aria-hidden="true" /> Classe</dt>
                <dd>{{ row.classCode || '—' }}</dd>
              </div>
              <div>
                <dt><i class="pi pi-calendar" aria-hidden="true" /> Créneau</dt>
                <dd>{{ row.dayLabel || '—' }}, {{ row.timeRange || 'horaire à préciser' }}</dd>
              </div>
              <div>
                <dt><i class="pi pi-calendar-clock" aria-hidden="true" /> Semaine</dt>
                <dd>{{ row.weekNumber || '—' }}</dd>
              </div>
              <div>
                <dt><i class="pi pi-user" aria-hidden="true" /> Enseignant</dt>
                <dd>{{ row.teacherLabel || 'Non attribué' }}</dd>
              </div>
            </dl>

            <div class="slot-card__vote-status">
              <i :class="canManageVotes ? 'pi pi-users' : (row.hasMyVote ? 'pi pi-check-circle' : 'pi pi-info-circle')" aria-hidden="true" />
              <span v-if="canManageVotes"><strong>{{ row.voteCount || 0 }}</strong> {{ Number(row.voteCount || 0) === 1 ? 'postulation' : 'postulations' }}</span>
              <span v-else>{{ row.hasMyVote ? 'Votre vote est enregistré' : 'Vous n’avez pas encore voté' }}</span>
            </div>

            <footer class="slot-card__actions">
              <Button
                label="Voir dans le planning"
                icon="pi pi-calendar"
                severity="secondary"
                outlined
                @click="viewInPlanning(row)"
              />
              <Button
                v-if="canVote"
                :label="row.hasMyVote ? 'Retirer mon vote' : 'Voter pour ce cours'"
                :icon="row.hasMyVote ? 'pi pi-times' : 'pi pi-thumbs-up'"
                :severity="row.hasMyVote ? 'danger' : 'warning'"
                :outlined="row.hasMyVote"
                :disabled="votingRowId === row.id"
                :loading="votingRowId === row.id"
                @click="row.hasMyVote ? removeVote(row) : submitVote(row)"
              />
            </footer>
          </article>
          </template>
        </div>
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
import { useRoleStore } from '@/stores/role'
import { supabase } from '@/supabase'
import modulesService from '@/service/modulesService'
import { useActiveAcademicYearContext } from '@/composables/useActiveAcademicYearContext'
import {
  buildPostulationRows,
  fetchPlanningSlotsPaginated
} from '@/service/siPostulationService'
import { filterPostulationRowsForRole } from '@/domain/si/moduleOwnership'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const roleStore = useRoleStore()
const toast = useToast()
const {
  activeYearName,
  activeClassCodes,
  loadActiveAcademicYearContext
} = useActiveAcademicYearContext()
const loading = ref(false)
const search = ref('')
const allModules = ref([])
const rows = ref([])
const votingRowId = ref(null)
const canUseSlotVotesTable = ref(true)
const hasShownSlotVoteTableUnavailableToast = ref(false)

const currentUserId = computed(() => authStore.user?.id || authStore.user?.uid || null)
const currentUserEmail = computed(() => authStore.user?.email || null)
const canManageVotes = computed(() =>
  roleStore.can('admin') || roleStore.can('AdminSoins') || roleStore.can('RMSoins')
)
// Certains comptes de recette cumulent plusieurs permissions. La capacité de
// gestion prime toujours sur le rôle enseignant afin qu'un administrateur ou
// un RM ne puisse jamais déposer un vote métier par mégarde.
const canVote = computed(() =>
  Boolean(currentUserId.value) &&
  roleStore.perms.includes('EnseignantSoins') &&
  !canManageVotes.value
)
const isRmOnly = computed(() =>
  roleStore.can('RMSoins') &&
  !roleStore.can('admin') &&
  !roleStore.can('AdminSoins') &&
  !roleStore.isSuper
)
const SLOT_VOTES_TABLE = 'planning_slot_votes'

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

function courseLinkLabel(source) {
  if (source === 'direct') return 'Lié'
  if (source === 'module_unique') return 'Lien unique déduit'
  return 'À vérifier'
}

function courseLinkSeverity(source) {
  if (source === 'direct') return 'success'
  if (source === 'module_unique') return 'info'
  return 'danger'
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
  if (!authId || !canVote.value) return null

  // Le propriétaire d'un vote doit toujours être l'identité Supabase courante.
  // La politique RLS refuse ainsi toute tentative de voter pour un autre profil.
  const byId = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authId)
    .maybeSingle()

  return !byId.error && byId.data?.id === authId ? authId : null
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
    String(r.moduleCode || '').toLowerCase().includes(term) ||
    String(r.courseTitle || '').toLowerCase().includes(term) ||
    String(r.courseCatalogName || '').toLowerCase().includes(term) ||
    String(r.activity || '').toLowerCase().includes(term) ||
    String(r.classCode || '').toLowerCase().includes(term) ||
    String(r.teacherLabel || '').toLowerCase().includes(term) ||
    String(r.dayLabel || '').toLowerCase().includes(term)
  )
})
const inferredLinkCount = computed(() => rows.value.filter(row => row.courseLinkSource === 'module_unique').length)
const missingLinkCount = computed(() => rows.value.filter(row => row.courseLinkSource === 'missing').length)

async function loadData() {
  loading.value = true
  try {
    await loadActiveAcademicYearContext()

    const [modsResult, coursesResponse, slots] = await Promise.all([
      modulesService.getAllModules(),
      supabase
        .from('courses')
        .select('id,name,module_id'),
      fetchPlanningSlotsPaginated({ classCodes: activeClassCodes.value })
    ])

    allModules.value = modsResult || []
    if (coursesResponse.error) throw coursesResponse.error

    const mapped = filterPostulationRowsForRole({
      rows: buildPostulationRows({
        slots,
        modules: allModules.value,
        courses: coursesResponse.data || []
      }),
      modules: allModules.value,
      userEmail: currentUserEmail.value,
      isRmOnly: isRmOnly.value
    })

    const teacherProfileId = canVote.value ? await resolveTeacherIdForVote() : null
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
          row.voteCount = canManageVotes.value ? Number(countsBySlotId[sid] || 0) : 0
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

    rows.value = mapped
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

.left-tools {
  flex: 1 1 22rem;
}

.right-tools {
  justify-content: flex-end;
}

.search-field {
  width: min(100%, 32rem);
}

.search-field :deep(.p-inputtext) {
  width: 100%;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.table-card {
  padding: 1rem;
  min-width: 0;
}

.results-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
}

.results-heading h2 {
  margin: 0;
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  letter-spacing: -0.02em;
}

.results-description {
  max-width: 48rem;
  margin: 0.35rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.45;
}

.results-count {
  flex: 0 0 auto;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.desktop-results :deep(.p-datatable-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 1;
}

.compact-results {
  display: none;
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

.cell-secondary {
  margin-top: 0.2rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.3;
}

@media (max-width: 1100px) {
  .desktop-results {
    display: none;
  }

  .compact-results {
    display: grid;
    gap: 0;
    border: 1px solid var(--surface-border);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .compact-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 9rem;
    color: var(--text-color-secondary);
  }

  .slot-card {
    min-width: 0;
    padding: 1rem;
    background: var(--surface-card);
  }

  .slot-card + .slot-card {
    border-top: 1px solid var(--surface-border);
  }

  .slot-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .slot-card__identity {
    min-width: 0;
  }

  .slot-card__module {
    color: #ffcc00;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  .slot-card h3 {
    margin: 0.25rem 0 0;
    font-size: 1rem;
    line-height: 1.35;
  }

  .slot-card__identity p {
    margin: 0.25rem 0 0;
    color: var(--text-color-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .slot-card__details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem 1rem;
    margin: 1rem 0;
    padding: 1rem 0;
    border-block: 1px solid var(--surface-border);
  }

  .slot-card__details div {
    min-width: 0;
  }

  .slot-card__details dt {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.25rem;
    color: var(--text-color-secondary);
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  .slot-card__details dt i {
    color: #ffcc00;
  }

  .slot-card__details dd {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .slot-card__vote-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.85rem;
  }

  .slot-card__vote-status i {
    color: #ffcc00;
  }

  .slot-card__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1rem;
  }

  .slot-card__actions :deep(.p-button) {
    min-height: 44px;
  }
}

@media (max-width: 768px) {
  .postulation-page {
    padding: .25rem 0 1rem;
  }

  .toolbar-card,
  .table-card {
    padding: 1rem;
  }

  .left-tools,
  .right-tools,
  .left-tools > .p-input-icon-left {
    width: 100%;
  }

  .left-tools :deep(.p-inputtext),
  .right-tools :deep(.p-button) {
    width: 100%;
    min-height: 44px;
  }

  .table-card {
    overflow: hidden;
  }

  .action-buttons {
    min-width: 12rem;
  }

  .action-buttons :deep(.p-button) {
    min-height: 44px;
  }

  .results-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .slot-card__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .slot-card__actions :deep(.p-button) {
    justify-content: center;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .slot-card__header {
    flex-direction: column;
  }

  .slot-card__details {
    grid-template-columns: 1fr;
  }
}
</style>
