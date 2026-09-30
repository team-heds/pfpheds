<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        class="si-page-header"
        title="Contrôle qualité du planning SI"
        subtitle="Détecter, vérifier et corriger les anomalies avec une traçabilité complète"
        icon="pi pi-shield"
      />
    </template>

    <main class="planning-remediation-page si-admin-screen">
      <section class="safety-banner" aria-labelledby="remediation-safety-title">
        <span class="safety-banner__icon" aria-hidden="true"><i class="pi pi-lock"></i></span>
        <div>
          <strong id="remediation-safety-title">Correction contrôlée, une anomalie à la fois</strong>
          <p>Seules les propositions sûres peuvent être appliquées, après vérification et justification. Chaque action est journalisée et annulable.</p>
        </div>
        <Tag value="Historique actif" severity="success" icon="pi pi-history" />
      </section>

      <section v-if="loading" class="section-card loading-state" aria-live="polite">
        <ProgressSpinner style="width: 42px; height: 42px" strokeWidth="5" />
        <div>
          <strong>Analyse du planning en cours</strong>
          <p>Les créneaux de l’année académique active sont contrôlés.</p>
        </div>
      </section>

      <section v-else-if="loadError" class="section-card error-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <strong>Le diagnostic n’a pas pu être chargé</strong>
          <p>{{ loadError }}</p>
        </div>
        <Button label="Réessayer" icon="pi pi-refresh" size="small" @click="loadRemediation(true)" />
      </section>

      <template v-else>
        <section class="summary-strip" aria-label="Résumé du diagnostic">
          <button
            v-for="card in summaryCards"
            :key="card.id"
            type="button"
            class="summary-card"
            :class="{ 'summary-card--active': categoryFilter === card.id }"
            :style="{ '--card-accent': card.color }"
            :aria-pressed="categoryFilter === card.id"
            @click="categoryFilter = categoryFilter === card.id ? 'all' : card.id"
          >
            <span class="summary-card__icon" aria-hidden="true">
              <i :class="card.icon"></i>
            </span>
            <span class="summary-card__copy">
              <span class="summary-card__label">{{ card.label }}</span>
              <strong>{{ card.total }}</strong>
              <small>{{ card.proposals }} proposition{{ card.proposals > 1 ? 's' : '' }} sûre{{ card.proposals > 1 ? 's' : '' }}</small>
            </span>
          </button>
        </section>

        <section class="section-card context-card">
          <div class="context-card__main">
            <span class="context-card__eyebrow">Périmètre contrôlé</span>
            <strong>{{ activeYearName || 'Aucune année académique active' }}</strong>
            <span>{{ report.slotsScanned }} créneaux · {{ report.summary.total }} anomalies</span>
          </div>
          <div class="context-card__metrics">
            <div>
              <strong>{{ report.summary.proposals }}</strong>
              <span>propositions à vérifier</span>
            </div>
            <div>
              <strong>{{ report.summary.decisionsRequired }}</strong>
              <span>décisions humaines</span>
            </div>
          </div>
          <small>Analyse actualisée le {{ formattedGeneratedAt }}</small>
        </section>

        <section class="toolbar-card" aria-label="Filtres du diagnostic">
          <div class="toolbar-row">
            <div class="filter-grid">
              <div class="field-inline search-field">
                <label for="si-remediation-search">Recherche</label>
                <span class="search-control">
                  <i class="pi pi-search"></i>
                  <InputText
                    id="si-remediation-search"
                    v-model="searchQuery"
                    placeholder="Cours, module, classe, créneau…"
                  />
                </span>
              </div>
              <div class="field-inline">
                <label for="si-remediation-category">Anomalie</label>
                <Dropdown
                  inputId="si-remediation-category"
                  v-model="categoryFilter"
                  :options="categoryOptions"
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
              <div class="field-inline">
                <label for="si-remediation-confidence">Niveau de décision</label>
                <Dropdown
                  inputId="si-remediation-confidence"
                  v-model="confidenceFilter"
                  :options="confidenceOptions"
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
              <div class="field-inline">
                <label for="si-remediation-class">Classe</label>
                <Dropdown
                  inputId="si-remediation-class"
                  v-model="classFilter"
                  :options="classOptions"
                  optionLabel="label"
                  optionValue="value"
                  filter
                />
              </div>
            </div>
            <Button
              v-if="hasFilters"
              label="Effacer les filtres"
              icon="pi pi-filter-slash"
              severity="secondary"
              text
              size="small"
              @click="resetFilters"
            />
          </div>
        </section>

        <section class="section-card results-card">
          <div class="section-header">
            <div>
              <h3><i class="pi pi-list-check"></i> Anomalies à traiter</h3>
              <p>{{ filteredFindings.length }} résultat{{ filteredFindings.length > 1 ? 's' : '' }} sur {{ report.summary.total }}</p>
            </div>
            <div class="legend" aria-label="Légende des niveaux de décision">
              <span><i class="legend-dot legend-dot--high"></i> Proposition sûre à vérifier</span>
              <span><i class="legend-dot legend-dot--ambiguous"></i> Plusieurs possibilités</span>
              <span><i class="legend-dot legend-dot--manual"></i> Décision manuelle</span>
            </div>
          </div>

          <div v-if="filteredFindings.length === 0" class="empty-state">
            <i class="pi pi-check-circle"></i>
            <strong>Aucune anomalie pour ces filtres</strong>
            <p>Modifiez les filtres pour consulter le reste du diagnostic.</p>
          </div>

          <DataTable
            v-else
            :value="filteredFindings"
            dataKey="id"
            paginator
            :rows="20"
            :rowsPerPageOptions="[20, 50, 100]"
            stripedRows
            responsiveLayout="scroll"
            class="remediation-table"
          >
            <Column header="Anomalie" style="min-width: 12rem">
              <template #body="{ data }">
                <div class="issue-cell">
                  <span class="issue-icon" :class="`issue-icon--${data.category}`">
                    <i :class="categoryMeta[data.category].icon"></i>
                  </span>
                  <div>
                    <strong>{{ categoryMeta[data.category].label }}</strong>
                    <small>Créneau #{{ data.slotId }}</small>
                  </div>
                </div>
              </template>
            </Column>
            <Column header="Cours et contexte" style="min-width: 18rem">
              <template #body="{ data }">
                <div class="context-cell">
                  <strong>{{ data.courseTitle }}</strong>
                  <span>{{ data.moduleCode }} · {{ data.classCode }}</span>
                  <small>{{ data.source }}</small>
                </div>
              </template>
            </Column>
            <Column header="Valeur actuelle" style="min-width: 14rem">
              <template #body="{ data }">
                <span class="value-pill value-pill--current">{{ data.currentValue }}</span>
              </template>
            </Column>
            <Column header="Proposition" style="min-width: 16rem">
              <template #body="{ data }">
                <div v-if="data.proposedValue" class="proposal-cell">
                  <i class="pi pi-arrow-right"></i>
                  <strong>{{ data.proposedValue.label }}</strong>
                </div>
                <span v-else-if="data.candidates.length > 1" class="muted-copy">
                  {{ data.candidates.length }} possibilités à départager
                </span>
                <span v-else class="muted-copy">À renseigner manuellement</span>
              </template>
            </Column>
            <Column header="Décision" style="min-width: 12rem">
              <template #body="{ data }">
                <Tag
                  :value="confidenceMeta[data.confidence].label"
                  :severity="confidenceMeta[data.confidence].severity"
                  :icon="confidenceMeta[data.confidence].icon"
                />
              </template>
            </Column>
            <Column header="Détail" style="width: 7rem">
              <template #body="{ data }">
                <Button
                  label="Voir"
                  icon="pi pi-eye"
                  size="small"
                  text
                  @click="openFinding(data)"
                />
              </template>
            </Column>
          </DataTable>
        </section>

        <section class="section-card history-card">
          <div class="section-header">
            <div>
              <h3><i class="pi pi-history"></i> Corrections récentes</h3>
              <p>Traçabilité des changements effectués depuis cet écran.</p>
            </div>
            <Button label="Actualiser" icon="pi pi-refresh" text size="small" :loading="historyLoading" @click="loadHistory" />
          </div>
          <div v-if="historyLoading && !history.length" class="history-empty">Chargement de l’historique…</div>
          <div v-else-if="!history.length" class="history-empty">Aucune correction enregistrée.</div>
          <div v-else class="history-list">
            <article v-for="entry in history" :key="entry.id" class="history-item">
              <span class="issue-icon" :class="`issue-icon--${entry.category}`"><i :class="categoryMeta[entry.category]?.icon"></i></span>
              <div class="history-item__main">
                <strong>{{ categoryMeta[entry.category]?.label }} · créneau #{{ entry.slot_id }}</strong>
                <span>{{ entry.reason }}</span>
                <small>{{ formatHistoryDate(entry.created_at) }}</small>
              </div>
              <Tag :value="entry.status === 'applied' ? 'Appliquée' : 'Annulée'" :severity="entry.status === 'applied' ? 'success' : 'secondary'" />
              <Button
                v-if="entry.status === 'applied'"
                label="Annuler"
                icon="pi pi-undo"
                severity="danger"
                outlined
                size="small"
                :loading="revertingId === entry.id"
                @click="requestRevert(entry)"
              />
            </article>
          </div>
        </section>
      </template>

      <Dialog
        :visible="Boolean(selectedFinding)"
        modal
        header="Détail de l’anomalie"
        :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
        @update:visible="value => { if (!value) selectedFinding = null }"
      >
        <div v-if="selectedFinding" class="detail-panel">
          <div class="detail-heading">
            <span class="issue-icon" :class="`issue-icon--${selectedFinding.category}`">
              <i :class="categoryMeta[selectedFinding.category].icon"></i>
            </span>
            <div>
              <strong>{{ categoryMeta[selectedFinding.category].label }}</strong>
              <span>{{ selectedFinding.courseTitle }}</span>
            </div>
          </div>

          <dl class="detail-facts">
            <div><dt>Créneau</dt><dd>#{{ selectedFinding.slotId }}</dd></div>
            <div><dt>Contexte</dt><dd>{{ selectedFinding.source }}</dd></div>
            <div><dt>Module</dt><dd>{{ selectedFinding.moduleCode }}</dd></div>
            <div><dt>Motif</dt><dd>{{ selectedFinding.reason }}</dd></div>
          </dl>

          <div class="comparison-grid">
            <article>
              <span>Avant</span>
              <strong>{{ selectedFinding.currentValue }}</strong>
            </article>
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
            <article :class="{ 'comparison-grid__proposal': selectedFinding.proposedValue }">
              <span>Après vérification</span>
              <strong>{{ selectedFinding.proposedValue?.label || 'Décision nécessaire' }}</strong>
            </article>
          </div>

          <div v-if="selectedFinding.candidates.length > 1" class="candidate-list">
            <strong>Possibilités repérées</strong>
            <ul>
              <li v-for="candidate in selectedFinding.candidates" :key="candidate.label">{{ candidate.label }}</li>
            </ul>
          </div>

          <div v-if="selectedFinding.confidence === 'high'" class="validation-panel">
            <label for="si-remediation-reason">Justification de la correction</label>
            <textarea
              id="si-remediation-reason"
              v-model="remediationReason"
              rows="3"
              maxlength="500"
              placeholder="Expliquez brièvement la vérification effectuée (8 caractères minimum)."
            ></textarea>
            <small>{{ remediationReason.trim().length }}/500 caractères</small>
            <label class="confirmation-check">
              <input v-model="remediationConfirmed" type="checkbox" />
              <span>J’ai vérifié le créneau et la valeur proposée.</span>
            </label>
          </div>
          <div v-else class="read-only-note">
            <i class="pi pi-info-circle"></i>
            <span>Cette anomalie nécessite une décision humaine et ne peut pas être corrigée automatiquement.</span>
          </div>
        </div>
        <template #footer>
          <Button label="Fermer" severity="secondary" outlined @click="selectedFinding = null" />
          <Button
            label="Appliquer la correction"
            icon="pi pi-check"
            :loading="applying"
            :disabled="!canApplySelected"
            @click="applySelected"
          />
        </template>
      </Dialog>

      <Dialog
        :visible="Boolean(pendingRevert)"
        modal
        header="Annuler cette correction ?"
        :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
        @update:visible="value => { if (!value) pendingRevert = null }"
      >
        <p class="revert-copy">La valeur précédente du créneau #{{ pendingRevert?.slot_id }} sera restaurée. L’annulation restera visible dans l’historique.</p>
        <template #footer>
          <Button label="Conserver la correction" severity="secondary" outlined @click="pendingRevert = null" />
          <Button label="Restaurer la valeur précédente" icon="pi pi-undo" severity="danger" :loading="Boolean(revertingId)" @click="confirmRevert" />
        </template>
      </Dialog>
    </main>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import { useActiveAcademicYearContext } from '@/composables/useActiveAcademicYearContext'
import {
  applySIPlanningRemediation,
  loadSIPlanningRemediation,
  loadSIPlanningRemediationHistory,
  revertSIPlanningRemediation
} from '@/service/siPlanningRemediationService'

const toast = useToast()

const categoryMeta = Object.freeze({
  course: { label: 'Lien vers le cours', icon: 'pi pi-link', color: '#60a5fa' },
  teacher: { label: 'Enseignant', icon: 'pi pi-user', color: '#fbbf24' },
  room: { label: 'Salle', icon: 'pi pi-building', color: '#34d399' },
  time: { label: 'Horaire', icon: 'pi pi-clock', color: '#fb7185' }
})

const confidenceMeta = Object.freeze({
  high: { label: 'Proposition sûre', severity: 'success', icon: 'pi pi-check-circle' },
  ambiguous: { label: 'À départager', severity: 'warning', icon: 'pi pi-question-circle' },
  manual: { label: 'Décision manuelle', severity: 'secondary', icon: 'pi pi-pencil' }
})

const categoryOptions = [
  { label: 'Toutes les anomalies', value: 'all' },
  ...Object.entries(categoryMeta).map(([value, meta]) => ({ label: meta.label, value }))
]
const confidenceOptions = [
  { label: 'Tous les niveaux', value: 'all' },
  { label: 'Propositions sûres', value: 'high' },
  { label: 'Plusieurs possibilités', value: 'ambiguous' },
  { label: 'Décisions manuelles', value: 'manual' }
]

const {
  activeYearName,
  activeClassCodes,
  loadActiveAcademicYearContext
} = useActiveAcademicYearContext()

const loading = ref(true)
const loadError = ref('')
const report = ref({
  slotsScanned: 0,
  findings: [],
  summary: {
    total: 0,
    proposals: 0,
    decisionsRequired: 0,
    byCategory: Object.fromEntries(Object.keys(categoryMeta).map(key => [key, { total: 0, proposals: 0 }]))
  },
  generatedAt: null,
  readOnly: true
})
const categoryFilter = ref('all')
const confidenceFilter = ref('all')
const classFilter = ref('all')
const searchQuery = ref('')
const selectedFinding = ref(null)
const remediationReason = ref('')
const remediationConfirmed = ref(false)
const applying = ref(false)
const history = ref([])
const historyLoading = ref(false)
const pendingRevert = ref(null)
const revertingId = ref(null)

const summaryCards = computed(() => Object.entries(categoryMeta).map(([id, meta]) => ({
  id,
  ...meta,
  total: report.value.summary.byCategory[id]?.total || 0,
  proposals: report.value.summary.byCategory[id]?.proposals || 0
})))

const classOptions = computed(() => [
  { label: 'Toutes les classes', value: 'all' },
  ...[...new Set(report.value.findings.map(finding => finding.classCode))]
    .sort((left, right) => left.localeCompare(right, 'fr', { numeric: true }))
    .map(value => ({ label: value, value }))
])

const filteredFindings = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fr')
  return report.value.findings.filter(finding => {
    if (categoryFilter.value !== 'all' && finding.category !== categoryFilter.value) return false
    if (confidenceFilter.value !== 'all' && finding.confidence !== confidenceFilter.value) return false
    if (classFilter.value !== 'all' && finding.classCode !== classFilter.value) return false
    if (!query) return true

    return [
      finding.slotId,
      finding.courseTitle,
      finding.moduleCode,
      finding.classCode,
      finding.source,
      finding.currentValue,
      finding.proposedValue?.label
    ].some(value => String(value || '').toLocaleLowerCase('fr').includes(query))
  })
})

const hasFilters = computed(() =>
  categoryFilter.value !== 'all' ||
  confidenceFilter.value !== 'all' ||
  classFilter.value !== 'all' ||
  Boolean(searchQuery.value.trim())
)

const formattedGeneratedAt = computed(() => {
  if (!report.value.generatedAt) return '—'
  return new Date(report.value.generatedAt).toLocaleString('fr-CH', { hour12: false })
})

const canApplySelected = computed(() =>
  selectedFinding.value?.confidence === 'high' &&
  Boolean(selectedFinding.value?.replacementValue) &&
  remediationReason.value.trim().length >= 8 &&
  remediationReason.value.trim().length <= 500 &&
  remediationConfirmed.value &&
  !applying.value
)

function openFinding(finding) {
  selectedFinding.value = finding
  remediationReason.value = ''
  remediationConfirmed.value = false
}

function formatHistoryDate(value) {
  return value ? new Date(value).toLocaleString('fr-CH', { hour12: false }) : '—'
}

async function loadHistory() {
  historyLoading.value = true
  try {
    history.value = await loadSIPlanningRemediationHistory(20)
  } catch (error) {
    console.error('[SI Planning Remediation] Historique indisponible:', error)
    toast.add({ severity: 'warn', summary: 'Historique indisponible', detail: error?.message, life: 5000 })
  } finally {
    historyLoading.value = false
  }
}

async function applySelected() {
  if (!canApplySelected.value) return
  applying.value = true
  try {
    await applySIPlanningRemediation(selectedFinding.value, remediationReason.value.trim())
    toast.add({ severity: 'success', summary: 'Correction appliquée', detail: `Le créneau #${selectedFinding.value.slotId} a été mis à jour.`, life: 4500 })
    selectedFinding.value = null
    await Promise.all([loadRemediation(true), loadHistory()])
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Correction non appliquée', detail: error?.message || 'Une erreur est survenue.', life: 6500 })
  } finally {
    applying.value = false
  }
}

function requestRevert(entry) {
  pendingRevert.value = entry
}

async function confirmRevert() {
  if (!pendingRevert.value || revertingId.value) return
  const entry = pendingRevert.value
  revertingId.value = entry.id
  try {
    await revertSIPlanningRemediation(entry.id)
    toast.add({ severity: 'success', summary: 'Correction annulée', detail: `La valeur précédente du créneau #${entry.slot_id} a été restaurée.`, life: 4500 })
    pendingRevert.value = null
    await Promise.all([loadRemediation(true), loadHistory()])
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Annulation impossible', detail: error?.message || 'Une erreur est survenue.', life: 6500 })
  } finally {
    revertingId.value = null
  }
}

function resetFilters() {
  categoryFilter.value = 'all'
  confidenceFilter.value = 'all'
  classFilter.value = 'all'
  searchQuery.value = ''
}

async function loadRemediation(force = false) {
  loading.value = true
  loadError.value = ''
  selectedFinding.value = null

  try {
    await loadActiveAcademicYearContext({ force })
    if (!activeClassCodes.value.size) {
      throw new Error('Aucune classe n’est rattachée à l’année académique active.')
    }
    report.value = await loadSIPlanningRemediation({
      classCodes: activeClassCodes.value,
      force
    })
  } catch (error) {
    console.error('[SI Planning Remediation] Chargement impossible:', error)
    loadError.value = error?.message || 'Une erreur inattendue est survenue.'
  } finally {
    loading.value = false
  }
}

onMounted(() => Promise.all([loadRemediation(), loadHistory()]))
</script>

<style scoped>
.planning-remediation-page {
  display: grid;
  gap: 1rem;
}

.safety-banner {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border: 1px solid color-mix(in srgb, #34d399 42%, var(--surface-border));
  border-radius: 1rem;
  background: color-mix(in srgb, #34d399 8%, var(--surface-card));
}

.safety-banner__icon {
  display: grid;
  flex: 0 0 2.75rem;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 0.75rem;
  color: #34d399;
  background: color-mix(in srgb, #34d399 14%, var(--surface-card));
}

.safety-banner div {
  flex: 1;
  min-width: 0;
}

.safety-banner strong,
.safety-banner p {
  display: block;
}

.safety-banner p,
.loading-state p,
.error-state p,
.section-header p {
  margin: 0.2rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.45;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.875rem;
}

.summary-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  border: 1px solid var(--si-border);
  border-radius: var(--si-radius);
  color: var(--text-color);
  background: var(--si-surface);
  box-shadow: 0 1px 2px rgba(3, 15, 30, 0.12);
  text-align: left;
  cursor: pointer;
  transition-property: border-color, background-color, transform;
  transition-duration: 140ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

.summary-card:hover,
.summary-card--active {
  border-color: color-mix(in srgb, var(--card-accent, var(--si-accent)) 55%, var(--si-border));
  background: color-mix(in srgb, var(--card-accent, var(--si-accent)) 7%, var(--si-surface));
}

.summary-card:active {
  transform: scale(0.96);
}

.summary-card:focus-visible {
  outline: 2px solid var(--si-accent);
  outline-offset: 3px;
}

.summary-card__icon {
  display: grid;
  flex: 0 0 3rem;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.75rem;
  color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 14%, var(--si-surface));
}

.summary-card__copy {
  display: grid;
  min-width: 0;
  gap: 0.1rem;
}

.summary-card__copy strong {
  font-size: 1.55rem;
  letter-spacing: -0.03em;
}

.summary-card__label {
  font-weight: 700;
}

.summary-card__copy small,
.context-card small,
.context-card span,
.issue-cell small,
.context-cell span,
.context-cell small {
  color: var(--text-color-secondary);
}

.context-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.125rem;
}

.context-card__main {
  display: grid;
  min-width: 13rem;
  gap: 0.15rem;
}

.context-card__eyebrow {
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.context-card__metrics {
  display: flex;
  flex: 1;
  gap: 0.75rem;
}

.context-card__metrics div {
  display: grid;
  min-width: 11rem;
  gap: 0.1rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  background: var(--si-surface-soft);
}

.context-card__metrics strong {
  font-size: 1.25rem;
}

.filter-grid {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(17rem, 1.4fr) repeat(3, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.filter-grid :deep(.p-dropdown),
.filter-grid :deep(.p-inputtext),
.search-field .search-control {
  width: 100%;
}

.search-control {
  position: relative;
  display: block;
}

.search-control > i {
  position: absolute;
  top: 50%;
  left: 0.8rem;
  z-index: 1;
  color: var(--text-color-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-control :deep(.p-inputtext) {
  padding-left: 2.45rem;
}

.results-card {
  padding: 1.125rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.section-header h3 {
  margin: 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.78rem;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}

.legend-dot--high { background: #34d399; }
.legend-dot--ambiguous { background: #fbbf24; }
.legend-dot--manual { background: #94a3b8; }

.issue-cell,
.detail-heading {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.issue-cell > div,
.detail-heading > div,
.context-cell {
  display: grid;
  gap: 0.16rem;
}

.issue-icon {
  display: grid;
  flex: 0 0 2.35rem;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border-radius: 0.625rem;
  color: var(--issue-accent);
  background: color-mix(in srgb, var(--issue-accent) 14%, var(--si-surface));
}

.issue-icon--course { --issue-accent: #60a5fa; }
.issue-icon--teacher { --issue-accent: #fbbf24; }
.issue-icon--room { --issue-accent: #34d399; }
.issue-icon--time { --issue-accent: #fb7185; }

.value-pill {
  display: inline-flex;
  max-width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 0.55rem;
  line-height: 1.35;
}

.value-pill--current {
  color: color-mix(in srgb, #fb7185 78%, var(--text-color));
  background: color-mix(in srgb, #fb7185 10%, var(--si-surface));
}

.proposal-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: color-mix(in srgb, #34d399 72%, var(--text-color));
}

.proposal-cell i {
  margin-top: 0.15rem;
}

.muted-copy {
  color: var(--text-color-secondary);
}

.loading-state,
.error-state {
  display: flex;
  min-height: 9rem;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
}

.error-state > i {
  color: #fb7185;
  font-size: 1.5rem;
}

.error-state div {
  flex: 1;
}

.empty-state {
  display: grid;
  min-height: 14rem;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-state i {
  color: #34d399;
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
}

.detail-panel {
  display: grid;
  gap: 1rem;
}

.detail-heading {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.detail-heading span {
  color: var(--text-color-secondary);
}

.detail-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.detail-facts div {
  padding: 0.75rem;
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--surface-card) 82%, var(--surface-ground));
}

.detail-facts dt {
  margin-bottom: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-weight: 750;
  text-transform: uppercase;
}

.detail-facts dd {
  margin: 0;
  line-height: 1.45;
}

.comparison-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.65rem;
}

.comparison-grid article {
  display: grid;
  min-height: 6rem;
  align-content: center;
  gap: 0.3rem;
  padding: 0.9rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
}

.comparison-grid article span {
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.comparison-grid__proposal {
  border-color: color-mix(in srgb, #34d399 40%, var(--surface-border)) !important;
  background: color-mix(in srgb, #34d399 7%, var(--surface-card));
}

.candidate-list {
  padding: 0.9rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, #fbbf24 8%, var(--surface-card));
}

.candidate-list ul {
  margin: 0.6rem 0 0;
  padding-left: 1.25rem;
}

.read-only-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.validation-panel {
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, #34d399 38%, var(--surface-border));
  border-radius: 0.8rem;
  background: color-mix(in srgb, #34d399 7%, var(--surface-card));
}

.validation-panel > label:first-child {
  font-weight: 750;
}

.validation-panel textarea {
  width: 100%;
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.65rem;
  color: var(--text-color);
  background: var(--surface-ground);
  font: inherit;
  line-height: 1.45;
}

.validation-panel textarea:focus-visible {
  outline: 2px solid var(--si-accent);
  outline-offset: 2px;
}

.validation-panel small,
.history-item small,
.history-empty {
  color: var(--text-color-secondary);
}

.confirmation-check {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
}

.confirmation-check input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.16rem;
  accent-color: var(--si-accent);
}

.history-card {
  display: grid;
  gap: 1rem;
  padding: 1.125rem;
}

.history-list {
  display: grid;
  gap: 0.65rem;
}

.history-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  background: var(--si-surface-soft);
}

.history-item__main {
  display: grid;
  gap: 0.15rem;
}

.history-item__main span {
  line-height: 1.4;
}

.history-empty {
  padding: 1.2rem;
  border-radius: 0.75rem;
  background: var(--si-surface-soft);
  text-align: center;
}

.revert-copy {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .context-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .safety-banner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: flex-start;
  }

  .safety-banner :deep(.p-tag) {
    grid-column: 2;
    justify-self: start;
  }

  .summary-strip,
  .filter-grid,
  .detail-facts {
    grid-template-columns: 1fr;
  }

  .context-card__metrics {
    width: 100%;
    flex-direction: column;
  }

  .context-card__metrics div {
    min-width: 0;
  }

  .section-header {
    gap: 0.75rem;
    flex-direction: column;
  }

  .legend {
    justify-content: flex-start;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .history-item {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .history-item :deep(.p-tag),
  .history-item :deep(.p-button) {
    grid-column: 2;
    justify-self: start;
  }

  .comparison-grid > i {
    justify-self: center;
    transform: rotate(90deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-card {
    transition-duration: 0.01ms;
  }
}
</style>
