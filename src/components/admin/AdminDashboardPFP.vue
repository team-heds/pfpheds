<template>
  <AdminLayout>
    <div v-if="loading" class="flex flex-column align-items-center justify-content-center" style="min-height: 60vh">
      <ProgressSpinner strokeWidth="3" />
      <p class="mt-3 text-600 text-lg">Chargement du tableau de bord...</p>
    </div>

    <div v-else class="p-4">
      <ErrorState
        v-if="dashboardError"
        class="mb-3"
        title="Certaines données du dashboard n’ont pas pu être chargées"
        :description="dashboardError"
        @retry="initializeDashboard"
      />
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-briefcase text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Dashboard PFP</h1>
              <p class="text-600 m-0 mt-2">Pratique de Formation Professionnelle — Physiothérapie</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <SelectButton
              v-model="periodMode"
              :options="periodOptions"
              optionLabel="label"
              optionValue="value"
              @change="onPeriodChange"
            />
            <Button
              icon="pi pi-download"
              label="CSV"
              outlined
              severity="secondary"
              @click="exportStatsCsv"
              size="small"
            />
            <Button
              icon="pi pi-refresh"
              @click="refreshAll"
              :loading="refreshing"
              outlined
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid mb-4">
        <KpiCard
          v-for="kpi in kpisWithData"
          :key="kpi.id"
          v-bind="kpi"
          @action="handleKpiAction(kpi)"
        />
      </div>

      <!-- Stats détaillées + Statut PFP côte à côte -->
      <div class="grid mb-4">
        <!-- Statistiques détaillées -->
        <div class="col-12 lg:col-8">
          <div class="surface-card p-4 border-round-xl shadow-2 h-full">
            <div class="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-chart-bar text-primary text-xl"></i>
                <h2 class="text-xl font-semibold text-900 m-0">Statistiques détaillées</h2>
              </div>
              <div class="flex align-items-center gap-2">
                <Button icon="pi pi-chevron-left" text rounded size="small" @click="shiftPeriod(-1)" v-tooltip.top="'Période précédente'" />
                <Tag :value="periodRangeLabel" severity="info" rounded class="cursor-pointer" @click="resetToToday" v-tooltip.top="'Revenir à aujourd\'hui'" />
                <Button icon="pi pi-chevron-right" text rounded size="small" @click="shiftPeriod(1)" :disabled="isCurrentPeriod" v-tooltip.top="'Période suivante'" />
              </div>
            </div>
            <!-- Skeleton pendant chargement -->
            <div v-if="statsLoading" class="grid">
              <div class="col-6 sm:col-6 lg:col-3" v-for="n in 8" :key="n">
                <div class="stat-card">
                  <Skeleton width="36px" height="36px" borderRadius="10px" class="mx-auto mb-2" />
                  <Skeleton width="60%" height="1.75rem" class="mx-auto mb-1" />
                  <Skeleton width="80%" height="0.7rem" class="mx-auto" />
                </div>
              </div>
            </div>
            <div v-else class="grid">
              <div class="col-6 sm:col-6 lg:col-3" v-for="s in extraStats" :key="s.key">
                <div class="stat-card" :style="{ '--stat-color': s.color }">
                  <div class="stat-icon-wrapper" :style="{ background: s.color + '18' }">
                    <i :class="s.icon" :style="{ color: s.color }"></i>
                  </div>
                  <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
                  <div class="stat-label">{{ s.label }}</div>
                </div>
              </div>
            </div>

            <!-- Taux de remplissage -->
            <div v-if="!statsLoading" class="mt-3 p-3 surface-ground border-round">
              <div class="flex align-items-center justify-content-between mb-2">
                <span class="text-sm font-semibold text-700">Taux de remplissage des places</span>
                <span class="text-sm font-bold" :style="{ color: fillRateColor }">{{ fillRate }}%</span>
              </div>
              <div class="fill-rate-track">
                <div class="fill-rate-bar" :style="{ width: fillRate + '%', background: fillRateColor }"></div>
              </div>
              <div class="flex justify-content-between mt-1">
                <small class="text-500">{{ assignedPlaces }} attribuées</small>
                <small class="text-500">{{ totalPlaces }} disponibles</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Statut PFP -->
        <div class="col-12 lg:col-4">
          <div class="surface-card p-4 border-round-xl shadow-2 h-full">
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-chart-pie text-primary text-xl"></i>
              <h2 class="text-xl font-semibold text-900 m-0">Statut PFP</h2>
            </div>
            <div class="flex flex-column gap-3">
              <div v-for="item in pfpStatusItems" :key="item.label" class="pfp-status-row">
                <div class="flex align-items-center gap-2 flex-1">
                  <div class="status-dot" :style="{ background: item.color }"></div>
                  <span class="text-800 font-medium text-sm">{{ item.label }}</span>
                </div>
                <div class="flex align-items-center gap-2">
                  <span class="text-900 font-bold">{{ item.value }}</span>
                  <div class="status-bar-track">
                    <div class="status-bar-fill" :style="{ width: item.pct + '%', background: item.color }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Breakdown par PFP type -->
            <Divider class="my-3" />
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-list text-primary"></i>
              <span class="font-semibold text-900 text-sm">Par type de PFP</span>
            </div>
            <div v-if="statsLoading" class="flex flex-column gap-2">
              <Skeleton v-for="n in 4" :key="n" width="100%" height="2rem" />
            </div>
            <div v-else class="flex flex-column gap-2">
              <div v-for="item in pfpTypeBreakdown" :key="item.type" class="pfp-type-row">
                <div class="flex align-items-center gap-2 flex-1">
                  <Tag :value="item.type" :severity="item.severity" rounded />
                  <span class="text-700 text-sm">{{ item.total }} attribution{{ item.total > 1 ? 's' : '' }}</span>
                </div>
                <div class="flex align-items-center gap-1">
                  <span class="text-xs" style="color: #16a34a" v-tooltip.top="'Validées'">{{ item.validated }}</span>
                  <span class="text-400">/</span>
                  <span class="text-xs" style="color: #dc2626" v-tooltip.top="'Échecs'">{{ item.failed }}</span>
                  <span class="text-400">/</span>
                  <span class="text-xs" style="color: #f97316" v-tooltip.top="'Arrêtées'">{{ item.stopped }}</span>
                </div>
              </div>
            </div>

            <!-- Sessions de votation ouvertes -->
            <Divider class="my-3" />
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-bolt text-orange-500"></i>
              <span class="font-semibold text-900 text-sm">Sessions de votation</span>
            </div>
            <div v-if="!openSessions.length" class="text-500 text-sm">Aucune session ouverte</div>
            <div v-else class="flex flex-column gap-2">
              <div v-for="sess in openSessions" :key="sess.id" class="session-badge">
                <Tag :value="sess.pfp_type" :severity="sess.is_priority ? 'warning' : 'info'" rounded />
                <span class="text-sm text-700">{{ sess.target_class }}</span>
                <span v-if="sess.is_priority" class="text-xs text-orange-500 font-bold">PRIO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="grid mb-4" v-if="!statsLoading && pfpTypeBreakdownData.length">
        <div class="col-12 md:col-6">
          <div class="surface-card p-4 border-round-xl shadow-2 h-full">
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-chart-pie text-primary text-xl"></i>
              <h2 class="text-lg font-semibold text-900 m-0">Répartition par type de PFP</h2>
            </div>
            <DoughnutChart
              :data="doughnutChartData"
              :height="260"
              :showLegend="true"
              showCenterText
              :centerValue="String(totalVotes)"
              centerLabel="attributions"
              cutout="65%"
            />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="surface-card p-4 border-round-xl shadow-2 h-full">
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-chart-bar text-primary text-xl"></i>
              <h2 class="text-lg font-semibold text-900 m-0">Statut par type de PFP</h2>
            </div>
            <BarChart
              :data="barChartData"
              :height="260"
              title=""
            />
          </div>
        </div>
      </div>

      <!-- Actions Rapides -->
      <div class="mb-4">
        <div class="flex align-items-center gap-2 mb-3">
          <i class="pi pi-bolt text-primary text-xl"></i>
          <h2 class="text-xl font-semibold text-900 m-0">Actions Rapides</h2>
        </div>
        <div class="quick-actions-grid">
          <div
            v-for="action in quickActions"
            :key="action.route"
            class="quick-action-card"
            :style="{ '--action-color': action.color }"
            @click="navigateTo(action.route)"
          >
            <div class="qa-icon" :style="{ background: action.color + '15', color: action.color }">
              <i :class="action.icon" class="text-2xl"></i>
            </div>
            <div class="qa-content">
              <h3 class="text-base font-bold text-900 m-0">{{ action.title }}</h3>
              <p class="text-600 text-xs m-0 mt-1 line-height-3">{{ action.desc }}</p>
            </div>
            <i class="pi pi-angle-right text-400 qa-arrow"></i>
          </div>
        </div>
      </div>

      <!-- Activités récentes -->
      <div class="mb-4">
        <div class="flex align-items-center gap-2 mb-3">
          <i class="pi pi-history text-primary text-xl"></i>
          <h2 class="text-xl font-semibold text-900 m-0">Activités récentes</h2>
        </div>
        <div class="surface-card border-round-xl shadow-2 overflow-hidden">
          <div v-if="activitiesLoading" class="p-4 flex flex-column gap-3">
            <div v-for="n in 4" :key="n" class="flex align-items-center gap-3">
              <Skeleton shape="circle" width="32px" height="32px" />
              <div class="flex-1">
                <Skeleton width="60%" height="0.9rem" class="mb-1" />
                <Skeleton width="30%" height="0.7rem" />
              </div>
            </div>
          </div>
          <div v-else-if="!activities.length" class="p-4 text-600 text-center">Aucune activité récente</div>
          <div v-else>
            <div
              v-for="(a, i) in activities"
              :key="i"
              class="activity-row"
              :class="{ 'border-top-1 surface-border': i > 0 }"
            >
              <div class="flex align-items-center gap-3 flex-1">
                <div class="activity-icon" :style="{ background: a.bgColor, color: a.iconColor }">
                  <i :class="a.icon" class="text-sm"></i>
                </div>
                <div>
                  <div class="text-900 font-medium text-sm">{{ a.title }}</div>
                  <small class="text-500">{{ a.time }}</small>
                </div>
              </div>
              <Button
                v-if="a.to"
                icon="pi pi-external-link"
                label="Voir"
                text
                size="small"
                @click="navigateTo(a.to)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import KpiCard from './widgets/KpiCard.vue'
import DoughnutChart from './widgets/charts/DoughnutChart.vue'
import BarChart from './widgets/charts/BarChart.vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ErrorState from '@/components/common/states/ErrorState.vue'
import { useAdminDashboardStats } from '@/composables/useAdminDashboardStats'
import { getKpisForRole } from '@/config/kpiConfigs'
import { useRoleStore } from '@/stores/role'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentDirectoryService'
import { SUPABASE_SELECTS } from '@/service/supabaseContracts'

const router = useRouter()

const roleStore = useRoleStore()
const period = ref('month')
const stats = useAdminDashboardStats({ domains: ['pfp'], period })
const configurations = computed(() => getKpisForRole('pfp', roleStore.perms || [], roleStore.isSuper))
const kpisWithData = stats.mapKpis('pfp', configurations)
const { loading, refreshing } = stats
const loadKpis = stats.load
const refresh = stats.refresh

const periodOptions = [
  { label: 'Jour', value: 'day' },
  { label: 'Mois', value: 'month' },
  { label: 'Année', value: 'year' }
]

const activities = ref([])
const activitiesLoading = ref(true)
const openSessions = ref([])
const periodMode = ref('month')
const selectedDate = ref(new Date())
const statsLoading = ref(false)
const assignedPlaces = ref(0)
const totalPlaces = ref(0)
const dashboardError = ref(null)

const extraStats = ref([
  { key: 'active_students', label: 'Étudiants actifs', value: 0, color: '#22c55e', icon: 'pi pi-users' },
  { key: 'open_places', label: 'Places ouvertes', value: 0, color: '#3b82f6', icon: 'pi pi-map-marker' },
  { key: 'published_assignments', label: 'Attributions publiées', value: 0, color: '#eab308', icon: 'pi pi-send' },
  { key: 'incomplete_profiles', label: 'Dossiers incomplets', value: 0, color: '#ef4444', icon: 'pi pi-exclamation-triangle' },
  { key: 'validated', label: 'PFP validées', value: 0, color: '#16a34a', icon: 'pi pi-check-circle' },
  { key: 'failed', label: 'PFP en échec', value: 0, color: '#dc2626', icon: 'pi pi-times-circle' },
  { key: 'stopped', label: 'PFP arrêtées', value: 0, color: '#f97316', icon: 'pi pi-ban' },
  { key: 'with_pdf', label: 'Places avec PDF', value: 0, color: '#8b5cf6', icon: 'pi pi-file-pdf' },
])

const quickActions = [
  { title: 'Étudiants', desc: 'Liste et gestion des étudiants', icon: 'pi pi-users', color: '#3b82f6', route: '/admin/formation-pratique/etudiants' },
  { title: 'Places de stage', desc: 'Gérer les places disponibles', icon: 'pi pi-map-marker', color: '#10b981', route: '/admin/formation-pratique/places' },
  { title: 'Institutions', desc: 'Partenaires et sites de stage', icon: 'pi pi-building', color: '#8b5cf6', route: '/admin/formation-pratique/institutions' },
  { title: 'Votation PFP', desc: 'Tirages au sort et attributions', icon: 'pi pi-check-square', color: '#f59e0b', route: '/admin/formation-pratique/votation-pfp' },
  { title: 'Votation prioritaire', desc: 'Sessions pour étudiants prioritaires', icon: 'pi pi-star', color: '#ef4444', route: '/admin/formation-pratique/votation-prioritaire' },
  { title: 'Gestion des offres', desc: 'Offres et propositions par PFP', icon: 'pi pi-list', color: '#06b6d4', route: '/admin/formation-pratique/offre-place' },
  { title: 'Vue d\'ensemble', desc: 'Tableau récapitulatif complet', icon: 'pi pi-th-large', color: '#6366f1', route: '/admin/formation-pratique/secretariat/vue-ensemble' },
  { title: 'Stats par Cohorte', desc: 'PFP1A & PFP1B par canton', icon: 'pi pi-chart-pie', color: '#a855f7', route: '/admin/pfp/cohort-stats' },
  { title: 'Correction PFP1 BA24', desc: 'Réécrire les bonnes places legacy BA24', icon: 'pi pi-pencil', color: '#0ea5e9', route: '/admin/formation-pratique/correction-pfp1-ba24' },
  { title: 'PFP en cours', desc: 'Suivre les stages actifs', icon: 'pi pi-clock', color: '#f97316', route: '/management_pfpencours' },
  { title: 'Gantt PFP', desc: 'Planning temporel des stages', icon: 'pi pi-calendar', color: '#14b8a6', route: '/admin/formation-pratique/gantt-pfp' },
  { title: 'Profils étudiants', desc: 'Critères et besoins par étudiant', icon: 'pi pi-id-card', color: '#ec4899', route: '/admin/formation-pratique/profil-etudiants' },
  { title: 'Validation PFP', desc: 'Valider les PFP terminées', icon: 'pi pi-verified', color: '#22c55e', route: '/admin/formation-pratique/valider-echec-pfp' },
]

const pfpTypeBreakdownData = ref([])

const pfpStatusItems = computed(() => {
  const validated = extraStats.value.find(s => s.key === 'validated')?.value || 0
  const failed = extraStats.value.find(s => s.key === 'failed')?.value || 0
  const stopped = extraStats.value.find(s => s.key === 'stopped')?.value || 0
  const total = validated + failed + stopped || 1
  return [
    { label: 'Validées', value: validated, color: '#16a34a', pct: Math.round((validated / total) * 100) },
    { label: 'En échec', value: failed, color: '#dc2626', pct: Math.round((failed / total) * 100) },
    { label: 'Arrêtées', value: stopped, color: '#f97316', pct: Math.round((stopped / total) * 100) },
  ]
})

const pfpTypeBreakdown = computed(() => {
  const severityMap = { PFP1: 'info', PFP2: 'success', PFP3: 'warning', PFP4: 'danger' }
  return pfpTypeBreakdownData.value.map(item => ({
    ...item,
    severity: severityMap[item.type] || 'info'
  }))
})

const fillRate = computed(() => {
  if (!totalPlaces.value) return 0
  return Math.round((assignedPlaces.value / totalPlaces.value) * 100)
})

const fillRateColor = computed(() => {
  const r = fillRate.value
  if (r >= 80) return '#16a34a'
  if (r >= 50) return '#eab308'
  return '#ef4444'
})

const pfpTypeColors = { PFP1: '#3b82f6', PFP2: '#10b981', PFP3: '#f59e0b', PFP4: '#ef4444' }

const totalVotes = computed(() => pfpTypeBreakdownData.value.reduce((sum, d) => sum + d.total, 0))

const doughnutChartData = computed(() => {
  return pfpTypeBreakdownData.value.map(d => ({
    label: d.type,
    value: d.total,
    color: pfpTypeColors[d.type] || '#6366f1'
  }))
})

const barChartData = computed(() => {
  const items = []
  for (const d of pfpTypeBreakdownData.value) {
    if (d.validated) items.push({ label: `${d.type} ✓`, value: d.validated, color: '#16a34a' })
    if (d.failed) items.push({ label: `${d.type} ✗`, value: d.failed, color: '#dc2626' })
    if (d.stopped) items.push({ label: `${d.type} ⏹`, value: d.stopped, color: '#f97316' })
  }
  return items
})

const periodRangeLabel = computed(() => {
  const d = selectedDate.value
  if (periodMode.value === 'day') return d.toLocaleDateString('fr-CH')
  if (periodMode.value === 'year') return String(d.getFullYear())
  return d.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
})

const isCurrentPeriod = computed(() => {
  const now = new Date()
  const d = selectedDate.value
  if (periodMode.value === 'day') return d.toDateString() === now.toDateString()
  if (periodMode.value === 'year') return d.getFullYear() === now.getFullYear()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
})

const reloadPeriodStats = async () => {
  statsLoading.value = true
  dashboardError.value = null
  try {
    await loadExtraStats()
  } catch (error) {
    dashboardError.value = error?.message || 'Vérifiez votre connexion puis réessayez.'
  } finally {
    statsLoading.value = false
  }
}

const shiftPeriod = async (delta) => {
  const d = new Date(selectedDate.value)
  if (periodMode.value === 'day') d.setDate(d.getDate() + delta)
  else if (periodMode.value === 'month') d.setMonth(d.getMonth() + delta)
  else d.setFullYear(d.getFullYear() + delta)
  selectedDate.value = d
  await reloadPeriodStats()
}

const resetToToday = async () => {
  selectedDate.value = new Date()
  await reloadPeriodStats()
}

const navigateTo = (path) => router.push(path)

const onPeriodChange = async () => {
  if (periodMode.value === 'day') period.value = 'day'
  else if (periodMode.value === 'year') period.value = 'year'
  else period.value = 'month'
  selectedDate.value = new Date()
  await Promise.all([refresh(), reloadPeriodStats()])
}

const refreshAll = async () => {
  dashboardError.value = null
  try {
    await Promise.all([refresh(), loadExtraStats(), loadOpenSessions(), loadRecentActivities()])
  } catch (error) {
    dashboardError.value = error?.message || 'Vérifiez votre connexion puis réessayez.'
  }
}

const isInSelectedPeriod = (isoDate) => {
  if (!isoDate) return false
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return false
  const ref = selectedDate.value
  if (periodMode.value === 'day') return d.toDateString() === ref.toDateString()
  if (periodMode.value === 'year') return d.getFullYear() === ref.getFullYear()
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}

const loadOpenSessions = async () => {
  try {
    const { data, error } = await supabase
      .from('votation_sessions')
      .select('id,pfp_type,target_class,status,is_priority')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
    if (error) throw error
    openSessions.value = data || []
  } catch (e) {
    console.warn('Erreur chargement sessions ouvertes:', e)
    throw new Error(`Sessions de votation indisponibles: ${e.message}`, { cause: e })
  }
}

const loadExtraStats = async () => {
  try {
    const [studentDirectory, placesRes, votesRes] = await Promise.all([
      getAllStudents(),
      supabase
        .from('places')
        .select(SUPABASE_SELECTS.dashboardPlaces),
      supabase
        .from('student_result_vote')
        .select(SUPABASE_SELECTS.dashboardVotes)
    ])

    if (placesRes.error) throw placesRes.error
    if (votesRes.error) throw votesRes.error

    const profiles = studentDirectory.filter((p) => isInSelectedPeriod(p.updated_at || p.created_at))
    const places = (placesRes.data || []).filter((p) => isInSelectedPeriod(p.UpdatedAt || p.CreatedAt))
    const votesInPeriod = (votesRes.data || []).filter((v) => isInSelectedPeriod(v.updated_at || v.created_at))
    const allVotes = votesRes.data || []

    const activeStudents = profiles.filter((p) => p.is_active !== false).length
    const incompleteProfiles = profiles.filter((p) => !p.family_name || !p.forname || !p.email || !p.Classe).length
    const openPlaces = places.filter((p) => p.InstitutionId && p.NomPlace).length
    const withPdf = places.filter((p) => p.fileurl).length
    const publishedAssignments = votesInPeriod.filter((v) => v.status === 'published').length

    // Statuts PFP = données globales (pas filtrées par période)
    const validated = allVotes.filter((v) => v.pfp_validee === true).length
    const failed = allVotes.filter((v) => v.pfp_echec === true).length
    const stopped = allVotes.filter((v) => v.pfp_arret === true).length

    // Taux de remplissage (global)
    const allPlaces = (placesRes.data || []).filter((p) => p.InstitutionId && p.NomPlace)
    totalPlaces.value = allPlaces.length
    assignedPlaces.value = allVotes.filter((v) => v.assigned_place_id).length

    // Breakdown par PFP type (global, normalise PFP1A/PFP1B → PFP1)
    const normalizePfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
    const byType = {}
    for (const v of allVotes) {
      const t = normalizePfp(v.pfp_type)
      if (!t) continue
      if (!byType[t]) byType[t] = { total: 0, validated: 0, failed: 0, stopped: 0 }
      byType[t].total++
      if (v.pfp_validee) byType[t].validated++
      if (v.pfp_echec) byType[t].failed++
      if (v.pfp_arret) byType[t].stopped++
    }
    pfpTypeBreakdownData.value = ['PFP1', 'PFP2', 'PFP3', 'PFP4']
      .filter(t => byType[t])
      .map(t => ({ type: t, ...byType[t] }))

    extraStats.value = [
      { key: 'active_students', label: 'Étudiants actifs', value: activeStudents, color: '#22c55e', icon: 'pi pi-users' },
      { key: 'open_places', label: 'Places ouvertes', value: openPlaces, color: '#3b82f6', icon: 'pi pi-map-marker' },
      { key: 'published_assignments', label: 'Attributions publiées', value: publishedAssignments, color: '#eab308', icon: 'pi pi-send' },
      { key: 'incomplete_profiles', label: 'Dossiers incomplets', value: incompleteProfiles, color: '#ef4444', icon: 'pi pi-exclamation-triangle' },
      { key: 'validated', label: 'PFP validées', value: validated, color: '#16a34a', icon: 'pi pi-check-circle' },
      { key: 'failed', label: 'PFP en échec', value: failed, color: '#dc2626', icon: 'pi pi-times-circle' },
      { key: 'stopped', label: 'PFP arrêtées', value: stopped, color: '#f97316', icon: 'pi pi-ban' },
      { key: 'with_pdf', label: 'Places avec PDF', value: withPdf, color: '#8b5cf6', icon: 'pi pi-file-pdf' },
    ]
  } catch (error) {
    console.warn('Erreur chargement stats détaillées PFP:', error)
    throw new Error(`Statistiques PFP indisponibles: ${error.message}`, { cause: error })
  }
}

const exportStatsCsv = () => {
  const header = ['Statistique', 'Valeur', 'Période']
  const rows = extraStats.value.map((s) => [s.label, String(s.value), periodRangeLabel.value])
  const lines = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';'))
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard_pfp_${periodMode.value}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleKpiAction = (kpi) => {
  const routes = {
    students_count: '/admin/formation-pratique/etudiants',
    institutions_count: '/admin/formation-pratique/institutions',
    places_count: '/admin/formation-pratique/places',
    pfp_ongoing: '/management_pfpencours'
  }
  if (routes[kpi.id]) router.push(routes[kpi.id])
}

const formatTimeAgo = (isoDate) => {
  if (!isoDate) return ''
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return new Date(isoDate).toLocaleDateString('fr-CH')
}

const loadRecentActivities = async () => {
  activitiesLoading.value = true
  try {
    const [sessionsRes, placesRes, studentDirectory] = await Promise.all([
      supabase
        .from('votation_sessions')
        .select(SUPABASE_SELECTS.dashboardSessions)
        .order('opened_at', { ascending: false })
        .limit(5),
      supabase
        .from('places')
        .select(SUPABASE_SELECTS.dashboardRecentPlaces)
        .order('CreatedAt', { ascending: false })
        .limit(5),
      getAllStudents()
    ])

    const items = []

    if (sessionsRes.error) throw sessionsRes.error
    if (placesRes.error) throw placesRes.error

    for (const s of (sessionsRes.data || [])) {
      const label = s.is_priority ? 'Session prioritaire' : 'Session votation'
      const verb = s.status === 'open' ? 'ouverte' : 'fermée'
      items.push({
        icon: s.is_priority ? 'pi pi-star' : 'pi pi-check-square',
        title: `${label} ${s.pfp_type} (${s.target_class}) ${verb}`,
        time: formatTimeAgo(s.status === 'open' ? s.opened_at : s.closed_at),
        date: new Date(s.status === 'open' ? s.opened_at : (s.closed_at || s.opened_at)),
        to: '/admin/formation-pratique/votation-pfp',
        bgColor: s.is_priority ? '#fef3c7' : '#ede9fe',
        iconColor: s.is_priority ? '#f59e0b' : '#8b5cf6'
      })
    }

    for (const p of (placesRes.data || [])) {
      items.push({
        icon: 'pi pi-map-marker',
        title: `Place créée : ${p.NomPlace || 'Sans nom'}`,
        time: formatTimeAgo(p.CreatedAt),
        date: new Date(p.CreatedAt),
        to: '/admin/formation-pratique/places',
        bgColor: '#d1fae5',
        iconColor: '#10b981'
      })
    }

    const recentStudents = [...studentDirectory]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
    for (const u of recentStudents) {
      const name = [u.forname, u.family_name].filter(Boolean).join(' ') || 'Étudiant'
      items.push({
        icon: 'pi pi-user-plus',
        title: `Nouveau profil : ${name}`,
        time: formatTimeAgo(u.created_at),
        date: new Date(u.created_at),
        to: '/admin/formation-pratique/etudiants',
        bgColor: '#dbeafe',
        iconColor: '#3b82f6'
      })
    }

    items.sort((a, b) => b.date - a.date)
    activities.value = items.slice(0, 8)
  } catch (e) {
    console.warn('Erreur chargement activités récentes:', e)
    throw new Error(`Activités récentes indisponibles: ${e.message}`, { cause: e })
  } finally {
    activitiesLoading.value = false
  }
}

const initializeDashboard = async () => {
  dashboardError.value = null
  try {
    await Promise.all([loadKpis(), loadExtraStats(), loadOpenSessions(), loadRecentActivities()])
  } catch (error) {
    dashboardError.value = error?.message || 'Vérifiez votre connexion puis réessayez.'
  }
}

onMounted(initializeDashboard)
</script>

<style scoped>
/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* Stat Cards */
.stat-card {
  background: var(--surface-ground);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
.stat-card:hover {
  border-color: var(--stat-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  font-size: 1rem;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  margin-top: 0.35rem;
  font-weight: 500;
}

/* PFP Status */
.pfp-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-bar-track {
  width: 80px;
  height: 6px;
  background: var(--surface-200);
  border-radius: 3px;
  overflow: hidden;
}
.status-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}
.session-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
}

/* Fill Rate */
.fill-rate-track {
  width: 100%;
  height: 8px;
  background: var(--surface-200);
  border-radius: 4px;
  overflow: hidden;
}
.fill-rate-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* PFP Type Breakdown */
.pfp-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.pfp-type-row:hover {
  background: var(--surface-ground);
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.quick-action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  cursor: pointer;
  transition: all 0.25s ease;
}
.quick-action-card:hover {
  border-color: var(--action-color);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateX(4px);
}
.quick-action-card:hover .qa-arrow {
  color: var(--action-color) !important;
  transform: translateX(4px);
}
.qa-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.quick-action-card:hover .qa-icon {
  transform: scale(1.1);
}
.qa-content {
  flex: 1;
  min-width: 0;
}
.qa-arrow {
  flex-shrink: 0;
  transition: all 0.25s ease;
}

/* Activities */
.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  transition: background 0.2s;
}
.activity-row:hover {
  background: var(--surface-hover);
}
.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
